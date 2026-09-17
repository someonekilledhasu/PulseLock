#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP32Servo.h>

// =====================================================
// 1. PULSELOCK BACKEND CONFIGURATION
// =====================================================
// Replace with your laptop's Wi-Fi IP running "npm run dev"
const char* SERVER_BASE_URL = "http://192.168.1.7:3000";
const char* DEVICE_ID       = "ESP32_01";

// Wi-Fi Credentials
const char* WIFI_SSID       = "qwe";
const char* WIFI_PASSWORD   = "12345678";

// India UTC +5:30
const long GMT_OFFSET       = 19800;
const int DAYLIGHT_OFFSET   = 0;

// =====================================================
// 2. PIN DEFINITIONS (Matching your exact hardware)
// =====================================================
#define BUTTON1 16   // Acknowledge reminder & Dispense medication
#define BUTTON2 17   // View previous medicine in schedule
#define BUTTON3 18   // View next medicine in schedule

#define SERVO_PIN  27 // Dispenser Servo
#define BUZZER_PIN 26 // Audio Alert Buzzer

// =====================================================
// 3. OLED DISPLAY (SSD1306 128x64 on Wire 21, 22)
// =====================================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

// =====================================================
// 4. SERVO & DISPENSER STATE
// =====================================================
Servo dispenserServo;
int servoPosition = 0;

// =====================================================
// 5. MEDICINE & SCHEDULE STATE
// =====================================================
String currentMedName      = "Metformin 500mg";
String currentCompartment  = "C01";
bool serverWindowOpen      = false;
time_t nextScheduledEpoch  = 0;

const int TOTAL_MEDICINES  = 4;
int nextMedicine           = 0;
const unsigned long MEDICINE_INTERVAL = 120000; // 2 min demo fallback

bool timeSynchronized      = false;
time_t firstMedicineTime   = 0;
bool reminderActive        = false;
int dispensedMedicine      = -1;

// Button debounce & viewing
bool lastButton1           = HIGH;
bool lastButton2           = HIGH;
bool lastButton3           = HIGH;
unsigned long lastButtonTime = 0;
const unsigned long debounceTime = 250;

bool viewingMedicine       = false;
int viewedMedicine         = 0;
unsigned long viewStartTime = 0;

// Backend sync timer (poll every 4 seconds)
unsigned long lastSyncTime  = 0;
const unsigned long syncInterval = 4000;

// =====================================================
// FUNCTION PROTOTYPES
// =====================================================
void checkButtons();
void checkMedicineSchedule();
void dispenseMedicine(const char* triggerSource);
void updateOLED();
void syncWithPulseLockServer();
void sendAccessEventToBackend(const char* compartment);
String getMedicineName(int medicine);

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // 1. Initialize Buttons with Pullup
  pinMode(BUTTON1, INPUT_PULLUP);
  pinMode(BUTTON2, INPUT_PULLUP);
  pinMode(BUTTON3, INPUT_PULLUP);

  // 2. Initialize Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // 3. Initialize OLED (Pins 21, 22)
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("OLED ERROR!");
    while (true);
  }

  display.setRotation(2); // Retain your OLED orientation
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(16, 12);
  display.println("PULSELOCK NODE");
  display.setCursor(18, 32);
  display.println("CONNECTING...");
  display.display();

  // 4. Initialize Servo
  dispenserServo.attach(SERVO_PIN);
  dispenserServo.write(0);
  servoPosition = 0;

  // 5. Connect to Wi-Fi
  Serial.println();
  Serial.println("==========================================");
  Serial.println("PulseLock Biometric Dispenser Starting...");
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Wi-Fi Connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());

    // 6. NTP Time Synchronization (India IST UTC +5:30)
    configTime(GMT_OFFSET, DAYLIGHT_OFFSET, "time.google.com", "pool.ntp.org", "time.cloudflare.com");
    Serial.println("Synchronizing NTP Time...");

    struct tm timeInfo;
    for (int i = 0; i < 20; i++) {
      if (getLocalTime(&timeInfo, 1000) && timeInfo.tm_year >= 120) {
        timeSynchronized = true;
        break;
      }
      Serial.print(".");
    }
    Serial.println();

    if (timeSynchronized) {
      Serial.printf("Time Sync Success: %02d:%02d:%02d\n", timeInfo.tm_hour, timeInfo.tm_min, timeInfo.tm_sec);
      firstMedicineTime = time(nullptr) + 120;
    }
  } else {
    Serial.println("Wi-Fi Offline. Running in Standalone Mode.");
  }

  // Initial backend sync
  syncWithPulseLockServer();

  display.clearDisplay();
  display.display();
}

// =====================================================
// MAIN LOOP
// =====================================================
void loop() {
  checkButtons();
  checkMedicineSchedule();

  // Periodic REST poll to PulseLock server
  if (millis() - lastSyncTime >= syncInterval) {
    syncWithPulseLockServer();
    lastSyncTime = millis();
  }

  updateOLED();
  delay(60);
}

// =====================================================
// BACKEND SYNC (GET /api/device?deviceId=ESP32_01)
// =====================================================
void syncWithPulseLockServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/device?deviceId=" + String(DEVICE_ID);
  http.begin(url);
  http.setTimeout(2500);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1536);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      if (doc.containsKey("activeDose") && !doc["activeDose"].isNull()) {
        JsonObject dose = doc["activeDose"];
        const char* name = dose["medicationName"];
        const char* str  = dose["strength"];
        const char* comp = dose["compartment"];
        bool isOpen      = dose["isWindowOpen"] | false;

        currentMedName     = String(name) + " " + String(str);
        currentCompartment = String(comp);
        serverWindowOpen   = isOpen;

        // If dose window just opened, trigger audio alert
        if (serverWindowOpen && !reminderActive) {
          reminderActive = true;
          digitalWrite(BUZZER_PIN, HIGH);
          Serial.println("PulseLock Alert: Scheduled dose window open!");
        }
      }
    }
  }
  http.end();
}

// =====================================================
// POST EVENT TO BACKEND (/api/device)
// =====================================================
void sendAccessEventToBackend(const char* compartment) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/device";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);

  DynamicJsonDocument doc(512);
  doc["deviceId"]    = DEVICE_ID;
  doc["eventType"]   = "access_granted";
  doc["compartment"] = compartment;
  doc["patientId"]   = "P001";
  doc["status"]      = "accessed";

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    Serial.printf("Access event synced to PulseLock (HTTP %d)\n", httpCode);
  } else {
    Serial.printf("Sync failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// =====================================================
// BUTTON HANDLING
// =====================================================
void checkButtons() {
  if (millis() - lastButtonTime < debounceTime) return;

  bool button1 = digitalRead(BUTTON1);
  bool button2 = digitalRead(BUTTON2);
  bool button3 = digitalRead(BUTTON3);

  // BUTTON 1: Acknowledge & Dispense Dose
  if (lastButton1 == HIGH && button1 == LOW) {
    Serial.println("BUTTON 1 PRESSED: Physical access requested");
    // USP: If next medicine time has not arrived, DENY and RELOCK
    if (!serverWindowOpen && !reminderActive) {
      denyAccessEarly();
    } else {
      dispenseMedicine("BUTTON 1 (Physical)");
    }
    lastButtonTime = millis();
  }

  // BUTTON 2: Scroll to Previous Medicine
  if (lastButton2 == HIGH && button2 == LOW) {
    viewedMedicine--;
    if (viewedMedicine < 0) viewedMedicine = TOTAL_MEDICINES - 1;
    viewingMedicine = true;
    viewStartTime = millis();
    Serial.printf("BUTTON 2: Viewing Medicine %d\n", viewedMedicine + 1);
    lastButtonTime = millis();
  }

  // BUTTON 3: Scroll to Next Medicine
  if (lastButton3 == HIGH && button3 == LOW) {
    viewedMedicine++;
    if (viewedMedicine >= TOTAL_MEDICINES) viewedMedicine = 0;
    viewingMedicine = true;
    viewStartTime = millis();
    Serial.printf("BUTTON 3: Viewing Medicine %d\n", viewedMedicine + 1);
    lastButtonTime = millis();
  }

  lastButton1 = button1;
  lastButton2 = button2;
  lastButton3 = button3;

  if (viewingMedicine && millis() - viewStartTime >= 3000) {
    viewingMedicine = false;
  }
}

// =====================================================
// ACCESS DENIED (Strict Time Lockout / Overdose Prevention)
// =====================================================
void denyAccessEarly() {
  Serial.println("ACCESS DENIED: Physical Dispenser Locked. Dose time not reached.");

  // 1. Double beep rejection warning
  digitalWrite(BUZZER_PIN, HIGH);
  delay(80);
  digitalWrite(BUZZER_PIN, LOW);
  delay(60);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(80);
  digitalWrite(BUZZER_PIN, LOW);

  // 2. OLED Access Denied Notice
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(16, 8);
  display.println("ACCESS DENIED!");
  display.setCursor(14, 26);
  display.println("DISPENSER LOCKED");
  display.setCursor(8, 44);
  display.println("LOCKED UNTIL DUE!");
  display.display();

  // 3. Log access_denied event to backend
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(SERVER_BASE_URL) + "/api/device";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2500);
    DynamicJsonDocument doc(384);
    doc["deviceId"]    = DEVICE_ID;
    doc["eventType"]   = "access_denied";
    doc["compartment"] = currentCompartment.c_str();
    doc["status"]      = "denied";
    String body;
    serializeJson(doc, body);
    http.POST(body);
    http.end();
  }

  delay(1400);
}

// =====================================================
// CHECK TIMED SCHEDULE
// =====================================================
void checkMedicineSchedule() {
  if (!timeSynchronized) return;
  if (nextMedicine >= TOTAL_MEDICINES) return;

  time_t currentTime = time(nullptr);
  time_t medicineTime = firstMedicineTime + (nextMedicine * MEDICINE_INTERVAL / 1000);

  if (currentTime >= medicineTime && !reminderActive) {
    reminderActive = true;
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("Scheduled dose time reached!");
  }
}

// =====================================================
// DISPENSE MEDICATION
// =====================================================
void dispenseMedicine(const char* triggerSource) {
  dispensedMedicine = nextMedicine;
  reminderActive = false;
  serverWindowOpen = false; // IMMEDIATELY RELOCK UNTIL NEXT DOSE!

  // 1. Silence Buzzer
  digitalWrite(BUZZER_PIN, LOW);

  // 2. Rotate Servo to Dispense (+23 degrees)
  servoPosition += 23;
  if (servoPosition > 180) servoPosition = 180;
  dispenserServo.write(servoPosition);

  Serial.println();
  Serial.println("==========================================");
  Serial.printf("DISPENSED: %s via %s\n", currentMedName.c_str(), triggerSource);
  Serial.printf("Servo Position: %d degrees\n", servoPosition);
  Serial.println("==========================================");

  // 3. Temporary OLED Confirmation
  display.clearDisplay();
  display.setCursor(12, 10);
  display.println("DOSE ACCESSED!");
  display.setCursor(14, 28);
  display.println(currentMedName);
  display.setCursor(12, 46);
  display.println("SYNCING TO APP...");
  display.display();

  // 4. Send event to PulseLock Backend
  sendAccessEventToBackend(currentCompartment.c_str());

  delay(1200);

  nextMedicine++;
}

// =====================================================
// OLED DISPLAY RENDERER
// =====================================================
void updateOLED() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  // Header Title
  display.setCursor(16, 0);
  display.println("PULSELOCK DISPENSER");

  // Current Time (IST)
  display.setCursor(0, 14);
  if (timeSynchronized) {
    struct tm timeInfo;
    time_t currentTime = time(nullptr);
    localtime_r(&currentTime, &timeInfo);
    char timeStr[16];
    strftime(timeStr, sizeof(timeStr), "%I:%M:%S %p", &timeInfo);
    display.print("TIME: ");
    display.println(timeStr);
  } else {
    display.println("TIME: SYNCING...");
  }

  // Temporary Button Schedule View
  if (viewingMedicine) {
    display.setCursor(0, 30);
    display.println("SCHEDULE BROWSE:");
    display.setCursor(0, 44);
    display.print(getMedicineName(viewedMedicine));
    display.display();
    return;
  }

  // Active Dose Alert / Reminder
  if (reminderActive || serverWindowOpen) {
    display.setCursor(0, 30);
    display.print(currentMedName);
    display.println(" DUE!");

    display.setCursor(0, 46);
    display.println("PRESS BUTTON 1 TO TAKE");
    display.display();
    return;
  }

  // Normal Status & Next Medicine Countdown
  if (nextMedicine < TOTAL_MEDICINES) {
    display.setCursor(0, 30);
    display.println("NEXT MEDICATION:");
    display.setCursor(0, 42);
    display.println(currentMedName);

    display.setCursor(0, 54);
    if (timeSynchronized) {
      time_t currentTime = time(nullptr);
      time_t medicineTime = firstMedicineTime + (nextMedicine * MEDICINE_INTERVAL / 1000);
      long remaining = medicineTime - currentTime;
      if (remaining < 0) remaining = 0;

      int minutes = remaining / 60;
      int seconds = remaining % 60;

      display.print("DISPENSE IN: ");
      if (minutes < 10) display.print("0");
      display.print(minutes);
      display.print(":");
      if (seconds < 10) display.print("0");
      display.print(seconds);
    } else {
      display.print("DISPENSE IN: --:--");
    }
  } else {
    display.setCursor(0, 34);
    display.println("ALL MEDICINES TAKEN");
  }

  display.display();
}

// =====================================================
// MEDICINE NAME HELPER
// =====================================================
String getMedicineName(int medicine) {
  switch (medicine) {
    case 0: return "1. Metformin 500mg";
    case 1: return "2. Vitamin D3 1000IU";
    case 2: return "3. Paracetamol 650mg";
    case 3: return "4. Pan 40 (Before food)";
  }
  return "Medication";
}
