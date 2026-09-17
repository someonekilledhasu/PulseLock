# PulseLock ESP32 Hardware Integration & Firmware Guide

This directory contains the production-grade Arduino firmware ([`pulselock.ino`](pulselock.ino)) for the **PulseLock Physical Dispenser Node**. It interfaces directly with the Next.js 15 full-stack backend via bidirectional REST endpoints.

---

## 1. Hardware Bill of Materials (BOM)

| Component | Specification | Quantity | Notes |
|---|---|---|---|
| **Microcontroller** | ESP32 DevKit v1 (30-pin or 38-pin) | 1 | 2.4GHz Wi-Fi + Bluetooth |
| **OLED Display** | 0.96" SSD1306 I2C (128x64 monochrome) | 1 | Default I2C Address `0x3C` |
| **Dispenser Actuator** | SG90 / MG90S Micro Servo Motor (5V) | 1 | Continuous step (+23° per dose) |
| **Audio Indicator** | Active/Passive 5V Piezo Buzzer | 1 | Tone alarms & rejection beeps |
| **Tactile Buttons** | 6x6mm Momentary Pushbuttons | 3 | Pullup with internal/external resistors |
| **Power Supply** | 5V 2A USB power adapter / Power bank | 1 | Powers ESP32 and Servo rail |
| **Prototyping** | Breadboard & Jumper Wires (M-M / M-F) | 1 set | |

---

## 2. Complete Wiring & Pinout Mapping

```
                         ESP32 DevKit v1
                     +---------------------+
                     |                     |
                     |  [3V3]       [GND]  | -------- Shared Ground (Breadboard GND)
                     |  [EN]        [GPIO23|
                     |  [GPIO36]    [GPIO22| -------- OLED SCL (I2C Clock)
                     |  [GPIO39]    [GPIO1] |
                     |  [GPIO34]    [GPIO3] |
                     |  [GPIO35]    [GPIO21| -------- OLED SDA (I2C Data)
                     |  [GPIO32]    [GPIO19|
                     |  [GPIO33]    [GPIO18| -------- BUTTON 3 (Next Schedule View)
                     |  [GPIO25]    [GPIO5] |
BUZZER Signal -------|  [GPIO26]    [TX0]   |
SERVO PWM (Signal) --|  [GPIO27]    [RX0]   |
                     |  [GPIO14]    [GPIO4] |
                     |  [GPIO12]    [GPIO0] |
                     |  [GPIO13]    [GPIO2] |
                     |  [GPIO9]     [GPIO15|
BUTTON 1 (Dispense) -|  [GPIO16]    [GPIO8] |
BUTTON 2 (Prev Sched)|  [GPIO17]    [GPIO7] |
Shared 5V Rail ------|  [VIN/5V]    [GPIO6] |
                     +---------------------+
```

### Detailed Pin Connection Table

| Component | Pin Label | ESP32 GPIO Pin | Wire Color (Typical) | Function & Description |
|---|---|---|---|---|
| **BUTTON 1** | Leg 1 | `GPIO 16` | Yellow | **Dispense / Acknowledge:** Requests medication release. If window is open, dispenses dose; if locked, triggers lockout alert. |
| | Leg 2 | `GND` | Black | Ground connection (uses internal `INPUT_PULLUP`). |
| **BUTTON 2** | Leg 1 | `GPIO 17` | Blue | **Previous Schedule View:** Cycles backward through the day's scheduled doses on the OLED screen. |
| | Leg 2 | `GND` | Black | Ground connection (uses internal `INPUT_PULLUP`). |
| **BUTTON 3** | Leg 1 | `GPIO 18` | White | **Next Schedule View:** Cycles forward through the day's scheduled doses on the OLED screen. |
| | Leg 2 | `GND` | Black | Ground connection (uses internal `INPUT_PULLUP`). |
| **Dispenser Servo** | Signal (PWM) | `GPIO 27` | Orange / White | Steps +23° per valid dispense event (0° to 180° circular/carousel). |
| | VCC (Power) | `VIN / 5V` | Red | Connect to 5V power rail. (Avoid powering servo directly from 3.3V pin). |
| | GND | `GND` | Brown / Black | Shared ground with ESP32. |
| **Piezo Buzzer** | Positive (+) | `GPIO 26` | Red | Emits alarm on due dose; emits rapid double-beep on early access reject. |
| | Negative (-) | `GND` | Black | Ground connection. |
| **SSD1306 OLED** | SDA | `GPIO 21` | Green | I2C Data line. |
| | SCL | `GPIO 22` | Yellow | I2C Clock line. |
| | VCC | `3V3` or `5V` | Red | 3.3V recommended for OLED logic stability. |
| | GND | `GND` | Black | Ground connection. |

---

## 3. Arduino IDE Setup & Required Libraries

### Step 1: Install ESP32 Board Support
1. In Arduino IDE, navigate to **File** → **Preferences**.
2. In **Additional Boards Manager URLs**, paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools** → **Board** → **Boards Manager...**, search for `esp32` by **Espressif Systems**, and click **Install**.
4. Select board: **Tools** → **Board** → **ESP32 Arduino** → **ESP32 Dev Module**.

### Step 2: Install Required Libraries
Open **Tools** → **Manage Libraries...** and install the following exact libraries:
- `ArduinoJson` (v6.21.x or v7.x by Benoit Blanchon)
- `ESP32Servo` (by Kevin Harrington)
- `Adafruit SSD1306` (by Adafruit)
- `Adafruit GFX Library` (by Adafruit)

---

## 4. Firmware Configuration

Open [`esp32/pulselock.ino`](pulselock.ino) and verify lines 14–23:

```cpp
// 1. PULSELOCK BACKEND CONFIGURATION
// Replace with your laptop's local IP running "npm run dev"
const char* SERVER_BASE_URL = "http://192.168.1.7:3000";
const char* DEVICE_ID       = "ESP32_01";

// Wi-Fi Credentials (match your mobile hotspot or Wi-Fi router)
const char* WIFI_SSID       = "qwe";
const char* WIFI_PASSWORD   = "12345678";

// India Standard Time (UTC +5:30 -> 19800 seconds)
const long GMT_OFFSET       = 19800;
const int DAYLIGHT_OFFSET   = 0;
```

> **Tip to find your Laptop IP:**
> - On Windows: Open Command Prompt or PowerShell, run `ipconfig`, look for **IPv4 Address** under your Wi-Fi adapter (e.g. `192.168.1.7`).
> - Make sure both your laptop and ESP32 are connected to the same Wi-Fi network (or your mobile hotspot).

---

## 5. Compiling & Flashing

1. Connect your ESP32 to your PC via a micro-USB or USB-C data cable.
2. Under **Tools** → **Port**, select the active COM port (e.g., `COM3`, `COM5`).
3. Set **Upload Speed:** `921600` (or `115200` if upload fails).
4. Click the **Upload** button (`→`).
   *(Note: If the IDE gets stuck at `Connecting......._____.....`, press and hold the **BOOT** button on the ESP32 until the upload progress percentage starts).*

---

## 6. How the Firmware Operates (Step-by-Step)

1. **Boot & Wi-Fi Sync:**
   - Initializes OLED screen (with `display.setRotation(2)` for standard enclosure orientation).
   - Connects to Wi-Fi SSID.
   - Syncs internal real-time clock via NTP (`pool.ntp.org`) with IST time offset.
2. **Periodic REST Polling:**
   - Every 4 seconds, executes `GET /api/device?deviceId=ESP32_01`.
   - Parses the JSON response to check:
     - `activeDose.medicationName`
     - `activeDose.compartment`
     - `activeDose.isWindowOpen` (true/false)
     - `lockState` (`LOCKED` vs `READY_FOR_BIOMETRIC`)
3. **Dose Window Due (Time Arrived):**
   - If `isWindowOpen == true`:
     - OLED displays: `MEDICINE DUE! [Name] [Dose] PRESS BTN 1 TO DISPENSE`.
     - Buzzer sounds an attention-getting alert.
4. **Button 1 Pressed — Access Verification:**
   - **Case A: Window is Open (Authorized Dispense):**
     - Servo steps `+23°` to release medication.
     - Buzzer immediately stops.
     - OLED flashes: `DISPENSED! Compartment C01. RELOCKING...`.
     - `serverWindowOpen` is immediately set to `false`.
     - Sends `POST /api/device` with `eventType: "access_granted"` and `status: "accessed"`.
     - The web dashboard instantly updates adherence and records the dose as taken.
   - **Case B: Window is Closed (Early Access Lockout):**
     - Servo **refuses to move** (holds lock position).
     - Buzzer emits a warning double-beep.
     - OLED flashes: `ACCESS DENIED! DISPENSER LOCKED. LOCKED UNTIL DUE!`.
     - Sends `POST /api/device` with `eventType: "access_denied"` and `status: "access_denied"`.
     - Web dashboard logs the unauthorized early access attempt into the tamper/audit stream.
5. **Button 2 & 3 Pressed — Schedule Browsing:**
   - Allows patient to preview other prescribed medications and their scheduled times on the OLED without unlocking compartments.

---

## 7. Troubleshooting

| Symptom | Probable Cause | Fix |
|---|---|---|
| OLED stays black | Incorrect I2C Address or bad SDA/SCL wiring | Verify SDA is on `GPIO 21` and SCL is on `GPIO 22`. Try changing `OLED_ADDR` from `0x3C` to `0x3D`. |
| Serial Monitor shows `WiFi Failed` | SSID or Password mismatch, or 5GHz network | ESP32 only supports 2.4GHz Wi-Fi. Ensure your hotspot or router is 2.4GHz. |
| HTTP GET returns `-1` or `Connection Refused` | Windows Firewall blocking port 3000 or wrong IP | In Windows Defender Firewall, allow Node.js through Private networks. Verify IP in `SERVER_BASE_URL`. |
| Servo twitches or ESP32 brownout reboots | Servo drawing excessive current from 3.3V | Connect servo power to `VIN` (5V) or an external 5V power supply with common ground. |
| Buttons trigger multiple times | Contact switch bounce | Firmware includes software debouncing (`DEBOUNCE_DELAY 250ms`). Ensure stable connections. |
