# PulseLock — Connected Medication Adherence & Biometric Access System

<div align="center">

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![ESP32 Hardware](https://img.shields.io/badge/Hardware-ESP32%20%2B%20OLED%20%2B%20Servo-E7352C?style=for-the-badge&logo=espressif)](https://www.espressif.com/en/products/socs/esp32)
[![Arduino](https://img.shields.io/badge/Firmware-Arduino%20C%2B%2B-00979D?style=for-the-badge&logo=arduino)](https://www.arduino.cc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A physical access control layer around chronic prescriptions.**  
*Connecting clinical natural language processing to locked, time-gated biometric pill compartments.*

[Live Web App](#-quick-start-guide) • [The Core USP](#-the-core-usp-strict-physical-time-window-lockout) • [Hardware Wiring](#-hardware-engineering--pinout) • [Firmware Guide](#-esp32-firmware-guide) • [REST API](#-rest-api-reference) • [Judge Pitch](#-90-second-hackathon-pitch-script)

</div>

---

## 📌 Executive Summary & The Problem

Worldwide, **over 50% of patients with chronic illnesses fail to take their medications as prescribed** (WHO). The consequences include avoidable disease complications, preventable hospital admissions, and over $300 billion in annual healthcare costs.

### Why Software-Only Apps Fail
- **Ignorable Notifications:** Push reminders on phones are effortlessly swiped away, snoozed, or forgotten.
- **Accidental Double-Dosing (Overdose):** Elderly and chronic patients regularly forget whether they have already taken their morning or evening dose, leading to toxic accidental repeat ingestion.
- **Unverified Adherence:** Checking a box on an app does not prove the medicine was actually dispensed or ingested.

### The PulseLock Solution
PulseLock transforms passive medication tracking into an **active, locked physical gatekeeper**:
1. **Intelligent Ingestion:** Doctor or patient enters a prescription via natural voice or text in plain vernacular language.
2. **Clinical NLP Parsing:** Gemini AI / Clinical heuristic parser extracts dosages, frequencies, food timings, and duration, generating a multi-day schedule.
3. **Physical Compartment Gating:** An ESP32 microcontroller with a precision servo and OLED screen locks the pill chamber.
4. **Strict Time Lockout:** The compartment unlocks **only** when the specific scheduled window arrives.
5. **Immediate Relock:** Once dispensed, the compartment locks down instantly. Any early access attempt is physically rejected and logged into an immutable audit trail.

---

## 🌟 The Core USP: Strict Physical Time-Window Lockout

> ### *"Ek medicine le li, dusri uske time pe hi khulegi."*
> *(Once one dose is taken, the next one strictly unlocks only when its designated time window arrives).*

A pillbox that remains unlockable all day is simply an expensive organizer. **PulseLock is an access control system.**

```
+-----------------------------------------------------------------------------------------+
|                                    TIME TIMELINE                                        |
|                                                                                         |
|   08:00 AM (Dose 1: Metformin)                08:00 PM (Dose 2: Metformin)              |
|   [ WINDOW OPENS ]                            [ WINDOW OPENS ]                          |
|         |                                           |                                   |
|         v                                           v                                   |
|   Patient Authenticates                       Patient Authenticates                     |
|   Servo Steps +23°                            Servo Steps +23°                          |
|   Pill Dispensed!                             Pill Dispensed!                           |
|         |                                           |                                   |
|         v                                           v                                   |
|   IMMEDIATELY RELOCKED                        IMMEDIATELY RELOCKED                      |
|         |                                                                               |
|         +==================== STRICT LOCKOUT PERIOD =====================+              |
|         | Patient presses button at 11:30 AM / 03:00 PM:                 |              |
|         | -> Servo holds locked position (refuses to move)               |              |
|         | -> Piezo buzzer sounds double-beep rejection alarm             |              |
|         | -> OLED flashes: "ACCESS DENIED! DISPENSER LOCKED"             |              |
|         | -> Cloud / DB Audit Log records: "Early Access Attempt Blocked"|              |
|         +================================================================+              |
+-----------------------------------------------------------------------------------------+
```

---

## 📐 System Architecture

```mermaid
graph TD
    User([Patient / Caregiver / Doctor]) -->|Voice or Text Prescription| WebApp[PulseLock Next.js 15 Web Platform]
    
    subgraph Cloud & Edge Intelligence
        WebApp -->|Natural Language Prompt| AIParser[Clinical AI & NLP Parser<br/>Gemini 1.5 Flash + Rule Engine]
        AIParser -->|Structured Prescription JSON| WebApp
        WebApp -->|Clinical Safety Review Card| Confirmation[Patient Approves Schedule]
        Confirmation -->|Generate Timeline| DB[(Persistence Engine<br/>Local JSON DB / Supabase PostgreSQL)]
    end

    subgraph Physical Dispenser Node
        ESP32[ESP32 Microcontroller Node<br/>DevKit v1] -->|WiFi HTTP GET /api/device| WebApp
        WebApp -->|Active Window & Lock State| ESP32
        
        ESP32 -->|Dose Window Arrives| HardwareAlert[Piezo Due Tone + OLED Medication Alert]
        
        User -->|Presses Button 1 / Biometric Scan| ESP32
        ESP32 -->|Physical Verification| Check{Is Time Window Open?}
        
        Check -->|YES (Due)| Dispense[Step Servo +23° & Dispense Dose]
        Dispense -->|Instant Relock| LockState[Set serverWindowOpen = false & Lock Servo]
        Dispense -->|WiFi HTTP POST /api/device| WebApp
        
        Check -->|NO (Early)| Reject[Refuse Servo + Double-Beep Warning + OLED Denied Alert]
        Reject -->|WiFi HTTP POST /api/device| WebApp
    end

    subgraph Caregiver & Clinical Dashboard
        WebApp -->|Live Telemetry Poll / SSE| Dashboard[Patient & Caregiver Adherence Dashboard]
        WebApp -->|Compliance Audit Trail| Stream[Live Access & Tamper Event Stream]
    end
```

---

## 🔌 Hardware Engineering & Pinout

The PulseLock physical dispenser uses an **ESP32 DevKit v1 (30/38 pin)** connected to an SSD1306 OLED display, 3 tactile buttons, a micro servo dispensing actuator, and an audio buzzer.

### ESP32 Pin Mapping Table

| Component | Component Pin | ESP32 GPIO | Mode | Description |
|---|---|---|---|---|
| **BUTTON 1 (Dispense / Acknowledge)** | Signal Leg | **`GPIO 16`** | `INPUT_PULLUP` | Authorizes dose dispense if window is active; triggers early lockout warning if locked. |
| | Ground Leg | `GND` | — | Direct breadboard ground rail. |
| **BUTTON 2 (Previous Medicine)** | Signal Leg | **`GPIO 17`** | `INPUT_PULLUP` | Navigates backward through today's medication schedule on the OLED display. |
| | Ground Leg | `GND` | — | Direct breadboard ground rail. |
| **BUTTON 3 (Next Medicine)** | Signal Leg | **`GPIO 18`** | `INPUT_PULLUP` | Navigates forward through today's medication schedule on the OLED display. |
| | Ground Leg | `GND` | — | Direct breadboard ground rail. |
| **Dispenser Servo Motor** | PWM Signal (Orange) | **`GPIO 27`** | `OUTPUT` | Steps +23° per valid dispense event (0° to 180° circular/carousel mechanism). |
| | VCC (Red) | **`VIN / 5V`** | Power | Connect to 5V rail (do not power servo from 3.3V pin). |
| | GND (Brown/Black) | `GND` | Power | Shared ground rail with ESP32. |
| **Piezo Buzzer** | Positive (+) | **`GPIO 26`** | `OUTPUT` | Due reminder melody & double-beep denial warning. |
| | Negative (-) | `GND` | Power | Shared ground rail. |
| **SSD1306 0.96" I2C OLED** | SDA (Data) | **`GPIO 21`** | `I2C SDA` | Screen data communications line. |
| | SCL (Clock) | **`GPIO 22`** | `I2C SCL` | Screen clock line. |
| | VCC | **`3.3V`** | Power | 3.3V logic level supply. |
| | GND | `GND` | Power | Shared ground rail. |

### Breadboard Schematic Diagram

```
                              ESP32 DevKit v1
                          +---------------------+
                          |                     |
      GND Rail -----------| [GND]         [3V3] |----------- OLED VCC (3.3V)
                          | [GPIO23]       [EN] |
     OLED SCL ------------| [GPIO22]   [GPIO36] |
     OLED SDA ------------| [GPIO21]   [GPIO39] |
                          | [GPIO1]    [GPIO34] |
                          | [GPIO3]    [GPIO35] |
                          | [GPIO19]   [GPIO32] |
     BUTTON 3 (Next) -----| [GPIO18]   [GPIO33] |
     BUTTON 2 (Prev) -----| [GPIO17]   [GPIO25] |
     BUTTON 1 (Dispense)--| [GPIO16]   [GPIO26] |----------- BUZZER (+)
                          | [GPIO4]    [GPIO27] |----------- SERVO PWM Signal
                          | [GPIO0]    [GPIO14] |
                          | [GPIO2]    [GPIO12] |
                          | [GPIO15]   [GPIO13] |
                          | [GPIO8]     [GPIO9] |
                          | [GPIO7]    [GPIO10] |
                          | [GPIO6]    [GPIO11] |
      5V Power Rail ------| [VIN/5V]      [GND] |----------- GND Rail
                          +---------------------+

   [BUTTON 1] ---- GPIO 16 & GND (Dispense Dose / Test Early Access)
   [BUTTON 2] ---- GPIO 17 & GND (View Previous Dose on OLED)
   [BUTTON 3] ---- GPIO 18 & GND (View Next Dose on OLED)
   [SERVO]    ---- Signal: GPIO 27 | VCC: VIN (5V) | GND: GND
   [BUZZER]   ---- Positive: GPIO 26 | Negative: GND
   [OLED]     ---- SDA: GPIO 21 | SCL: GPIO 22 | VCC: 3V3 | GND: GND
```

> **Power Supply Rule:** Micro servos draw up to 500mA during motor actuation. Always connect the servo's red VCC wire to the **`VIN` (5V)** pin or an external 5V adapter. Never power the servo from the ESP32's 3.3V regulator pin, as this will cause brownout resets.

---

## 🛠️ ESP32 Firmware Guide

The firmware file is located at [`esp32/pulselock.ino`](esp32/pulselock.ino).

### Step 1: Install Arduino IDE & Libraries
1. Download and install **Arduino IDE 2.x**.
2. Open **File** → **Preferences**, and enter this Boards Manager URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Tools** → **Board** → **Boards Manager...**, search for `esp32` by **Espressif Systems**, and install it.
4. Open **Tools** → **Manage Libraries...** and install:
   - `ArduinoJson` (v6.21.x or v7.x by Benoit Blanchon)
   - `ESP32Servo` (by Kevin Harrington)
   - `Adafruit SSD1306` (by Adafruit)
   - `Adafruit GFX Library` (by Adafruit)

### Step 2: Configure Firmware Variables
In [`esp32/pulselock.ino`](esp32/pulselock.ino), edit lines 14–23:
```cpp
// Point to your computer's local IP running "npm run dev"
const char* SERVER_BASE_URL = "http://192.168.1.7:3000";
const char* DEVICE_ID       = "ESP32_01";

// Your 2.4GHz Wi-Fi credentials (or mobile hotspot)
const char* WIFI_SSID       = "qwe";
const char* WIFI_PASSWORD   = "12345678";

// India Standard Time (UTC +5:30)
const long GMT_OFFSET       = 19800;
const int DAYLIGHT_OFFSET   = 0;
```

### Step 3: Flash the Microcontroller
1. Connect the ESP32 to your PC using a micro-USB / USB-C data cable.
2. Select **Tools** → **Board** → **ESP32 Arduino** → **ESP32 Dev Module**.
3. Select your active COM port under **Tools** → **Port**.
4. Click **Upload** (`→`). If the IDE displays `Connecting......._____.....`, press and hold the **BOOT** button on your ESP32 board for 2 seconds until uploading begins.
5. Open **Serial Monitor** at **115200 baud** to see Wi-Fi status and real-time polling logs.

---

## 💻 Software Stack & Architecture

### 1. Frontend & Design System
- **Framework:** Next.js 15.5 (App Router) + React 19 + TypeScript.
- **Scandinavian Health Tech UI (Lassie.ai inspired):**
  - **Canvas Background:** `#f8f6f2` (warm stone linen).
  - **Cards & Surfaces:** `#ffffff` with `#e7e3da` subtle borders and generous padding.
  - **Typography:** `DM Sans` for headings/body + `JetBrains Mono` for tabular real-time countdown clocks.
  - **Aesthetic Health Accents:** Forest sage (`#226733`), golden ochre (`#b45309`), clinical coral (`#dc2626`), deep obsidian ink (`#191614`).
  - **Zero Vibecoding:** No harsh saturated neons, rainbow borders, or generic dashboard templates. Every screen is calm, deliberate, and accessible.

### 2. Clinical Voice & Speech Parser ([`lib/aiParser.ts`](lib/aiParser.ts))
- **Interactive Speech Recognition:** Web Speech API integration with an animated HTML5 Canvas audio waveform visualizer.
- **Dual-Engine NLP:**
  1. **Primary LLM:** Google Gemini 1.5 Flash structured clinical prompt with a 3.5s timeout watchdog.
  2. **Heuristic Clinical Fallback:** Comprehensive rule-based parser loaded with 50+ chronic, antibiotic, and Indian medications (*Dolo, Crocin, Calpol, Paracetamol, Metformin, Pan 40, Azithromycin, Cetirizine, Montair, Shelcal, Vitamin D3, Telmisartan, Amlodipine, Atorvastatin*, etc.) and vernacular Indian time phrases (*"subah sham"*, *"ek goli subah khane ke baad"*, *"twice daily for 5 days"*).

### 3. Medical Audio Synthesizer ([`lib/audioChime.ts`](lib/audioChime.ts))
- Pure Web Audio API procedural audio synthesis (zero external audio file dependencies):
  - **Access Granted Chime:** Dual-bell harmonic chime (`D5 -> A5` at 587Hz / 880Hz) with exponential gain decay.
  - **Window Ready Fanfare:** Ascending three-tone arpeggio (`E5 -> G#5 -> B5`) when a dose window opens.
  - **Access Denied Warning:** Dissonant low-frequency double-beep (`260Hz -> 220Hz`) signaling lockout enforcement.

### 4. Dual-Mode Persistence Layer ([`lib/db.ts`](lib/db.ts))
- **Zero-Dependency Disk Storage:** Automatically reads and writes state to [`data/pulselock_db.json`](data/pulselock_db.json). Complete state persists across restarts without requiring any external database setup.
- **PostgreSQL / Supabase Schema:** Full SQL table definitions with Row-Level Security included in [`supabase/schema.sql`](supabase/schema.sql).

---

## 📡 REST API Reference

The backend exposes bidirectional REST endpoints consumed by both the web client and the ESP32 hardware.

### 1. Device Heartbeat & Window Query
```http
GET /api/device?deviceId=ESP32_01
```
Polled by the ESP32 every 4 seconds to check whether the current time window is open.

**Response Example:**
```json
{
  "status": "online",
  "deviceId": "ESP32_01",
  "serverTime": "2026-09-17T17:34:45.254Z",
  "activeDose": {
    "id": "dose_101",
    "medicationName": "Metformin",
    "strength": "500 mg",
    "doseAmount": "1 tablet",
    "compartment": "C01",
    "status": "available",
    "isWindowOpen": true,
    "scheduledTime": "2026-09-17T17:35:00.000Z",
    "authorizedPatientId": "P001"
  },
  "lockState": "READY_FOR_BIOMETRIC"
}
```

---

### 2. Device Access & Dispense Event
```http
POST /api/device
Content-Type: application/json
```
Called when a dispense attempt occurs (physically via Button 1 or via web simulation).

**Request Body:**
```json
{
  "deviceId": "ESP32_01",
  "compartment": "C01",
  "eventType": "access_granted",
  "patientId": "P001",
  "status": "accessed"
}
```

**Response (Window is Open — Authorized Dispense):**
```json
{
  "success": true,
  "accessGranted": true,
  "lockState": "LOCKED",
  "message": "Access granted for Metformin. Pill dispensed and dispenser immediately relocked."
}
```

**Response (Window is Locked — Early Access Rejected):**
```json
{
  "success": false,
  "accessGranted": false,
  "lockState": "LOCKED",
  "message": "Access Denied: Next dose (Metformin) is strictly locked until 08:00 pm to prevent overdose."
}
```

---

### 3. Natural Language Clinical Prescription Parser
```http
POST /api/parse-prescription
Content-Type: application/json

{
  "text": "take dolo 650 twice daily after food for 5 days"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "medicine": "Dolo",
    "strength": "650 mg",
    "dose": "1 tablet",
    "frequency": "2x daily",
    "times": ["08:00", "20:00"],
    "food": "after food",
    "duration_days": 5,
    "confidence": 96
  }
}
```

---

### 4. Interactive Pitch & Demo Trigger
```http
POST /api/demo
Content-Type: application/json

{ "action": "activate_window" }
```
- `activate_window`: Instantly shifts the next scheduled dose to **NOW** so judges and evaluators can experience the live unlock flow without waiting for the scheduled hour.
- `reset`: Restores the baseline clinical schedule and audit logs.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v18.17+ or v20+
- **npm:** v9+
- **Arduino IDE:** v2.x (if using physical hardware)
- **Wi-Fi:** 2.4GHz network or mobile phone hotspot

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/someonekilledhasu/PulseLock.git
cd PulseLock
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Run the Next.js Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

- **Default Patient PIN:** `1234` (or click *"Preset Demo Patient PIN"*).
- **Local Network Access:** Find your local IP (`ipconfig` on Windows or `ifconfig` on macOS/Linux). The app is live on your LAN at `http://<YOUR_LOCAL_IP>:3000`.

---

### Step 4: Run with Physical ESP32 Hardware
1. Connect your ESP32 to your PC via USB.
2. Open [`esp32/pulselock.ino`](esp32/pulselock.ino) in Arduino IDE.
3. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_BASE_URL` to your laptop's IP (e.g., `http://192.168.1.7:3000`).
4. Select **ESP32 Dev Module** and the correct COM port, then click **Upload**.
5. Power on the hardware:
   - OLED displays connection status and initial schedule.
   - Press **Button 1** while locked: Observe the double-beep rejection tone, OLED access denied warning, and immediate entry in the web dashboard audit trail.
   - Click **"Arm Next Dose Window (Demo Mode)"** on the web dashboard (or press Button 1 when due): Observe the OLED switch to `MEDICINE DUE!`, buzzer alert, servo rotate +23°, and immediate relock!

---

### Step 5: Test Without Hardware (Built-in Simulator)
You do not need physical hardware to test or demonstrate PulseLock!
1. The bottom of the web dashboard features the **Hardware Simulation & Test Bar**.
2. Click **"Test Early Access Block (Simulate Hardware Reject)"**:
   - The audio synthesizer plays the authentic low-frequency rejection double-beep.
   - An alert toast warns that early access is prohibited.
   - The Audit Event Log immediately records the blocked attempt.
3. Click **"Arm Next Dose Window (Demo Mode)"**:
   - The next scheduled dose status changes to `available` (`DOSE WINDOW OPEN NOW`).
   - The Web Audio synthesizer plays the window ready chime.
4. Click **"Send Biometric Pulse (Simulate Hardware Scan)"**:
   - Authorized chime plays.
   - Dose is recorded as taken.
   - Adherence metrics jump.
   - The dispenser immediately relocks.

---

## 🎙️ 90-Second Hackathon Pitch Script

*Use this exact script for hackathon presentations, judging rounds, and investor demos:*

| Time | Action | Pitch Narration |
|---|---|---|
| **0:00 – 0:15** | Point to web dashboard & physical box | *"Over 50% of chronic disease patients fail to take medications correctly. Software-only reminder apps fail because push notifications are easy to ignore, and they do nothing to prevent accidental double-dosing. PulseLock solves this by introducing a physical access control layer."* |
| **0:15 – 0:40** | **Press Button 1 on ESP32 (while locked)** | *"Our core philosophy: **'Ek medicine le li, dusri uske time pe hi khulegi'**. Look what happens if a patient tries to access their medicine early: I press the button... The servo refuses to rotate, the buzzer sounds a rejection alarm, the OLED flashes 'ACCESS DENIED', and the attempt is logged in real time on the caregiver dashboard. Accidental overdose is physically impossible."* |
| **0:40 – 1:05** | **Click Microphone on Add Prescription** | *"Adding prescriptions is effortless. A patient or doctor speaks in plain language: 'Take Dolo 650 twice daily after food for 5 days'. Our clinical NLP engine parses the dosage, frequency, and food rules, and schedules the doses across the hardware compartments."* |
| **1:05 – 1:30** | **Click 'Arm Window' & Press Button 1** | *"Now, when the scheduled time arrives, the device alerts the patient. The patient authenticates, the compartment steps forward +23°, dispenses exactly one dose, and immediately relocks. Adherence reaches 96%+ with verifiable peace of mind for families."* |

---

## 📁 Project Directory Structure

```
PulseLock/
├── app/
│   ├── api/
│   │   ├── analytics/route.ts        # Adherence calculation & audit event stream
│   │   ├── auth/route.ts             # 4-digit PIN authentication & registration
│   │   ├── demo/route.ts             # Demo dose window arming & state reset
│   │   ├── device/route.ts           # Bidirectional ESP32 REST interface
│   │   ├── export/route.ts           # CSV adherence report generator
│   │   ├── parse-prescription/       # Voice & text clinical NLP parser
│   │   ├── prescriptions/route.ts    # Multi-day schedule generator
│   │   └── schedule/route.ts         # Timeline queries & daily/weekly views
│   ├── globals.css                   # Scandinavian warm stone design tokens & utilities
│   ├── layout.tsx                    # Root HTML layout & font declarations
│   └── page.tsx                      # App shell, state provider & navigation router
├── components/
│   ├── HardwareTestBar.tsx           # Floating hardware telemetry & testing bar
│   ├── Navbar.tsx                    # Minimal navigation header & profile sheet
│   └── screens/
│       ├── AddPrescriptionScreen.tsx # Voice/Text entry with real Canvas audio visualizer
│       ├── AnalyticsScreen.tsx       # Adherence score, weekly rhythm, audit stream
│       ├── ConfirmationScreen.tsx    # Clinical safety review card & confirmation
│       ├── DashboardScreen.tsx       # Next dose hero, countdown clock, compartment state
│       ├── LoginScreen.tsx           # PIN pad login & patient registration modal
│       └── ScheduleScreen.tsx        # Day timeline & 7-day week calendar matrix
├── data/
│   └── pulselock_db.json             # Persistent local disk database file
├── esp32/
│   ├── pulselock.ino                 # Complete ESP32 Arduino C++ firmware
│   └── README.md                     # Hardware wiring & assembly documentation
├── lib/
│   ├── aiParser.ts                   # Gemini 1.5 Flash + Heuristic Clinical NLP
│   ├── audioChime.ts                 # Web Audio API procedural sound synthesizer
│   ├── db.ts                         # Persistent database engine (JSON + Supabase)
│   ├── scheduler.ts                  # Multi-day schedule generator & window evaluator
│   ├── supabase.ts                   # Optional Supabase cloud client
│   └── types.ts                      # Strict TypeScript interfaces & domain models
├── supabase/
│   └── schema.sql                    # PostgreSQL table definitions & RLS policies
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── README.md                         # Master documentation & guide
```

---

## ❓ Troubleshooting FAQ

### 1. ESP32 fails to connect to Wi-Fi (`WiFi Failed`)
- Ensure your Wi-Fi is broadcasting on **2.4 GHz**. ESP32 microcontrollers do not support 5 GHz Wi-Fi networks.
- If using a mobile hotspot, ensure AP Band is set to `2.4 GHz Band` and security is set to `WPA2-Personal`.

### 2. ESP32 Serial Monitor shows `HTTP error: -1` or `Connection Refused`
- Verify that your PC and ESP32 are connected to the exact same Wi-Fi network.
- Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to confirm your PC's IP address matches `SERVER_BASE_URL` in `pulselock.ino`.
- Windows Defender Firewall may block incoming requests on port 3000. Open Windows Defender Firewall → Allow an app through firewall → Allow `Node.js JavaScript Runtime` on Private networks.

### 3. OLED screen stays completely dark
- Verify wiring: SDA to `GPIO 21`, SCL to `GPIO 22`, VCC to `3.3V`, GND to `GND`.
- Test I2C address: In `pulselock.ino`, change `#define OLED_ADDR 0x3C` to `#define OLED_ADDR 0x3D`.

### 4. Servo twitches or causes the ESP32 to restart
- The servo motor draws peak currents up to 500mA. If powered from the 3.3V pin, it causes voltage drops that trigger ESP32 brownout detector resets.
- Always connect the servo VCC to the **`VIN` (5V)** pin or an external 5V power source with common ground.

### 5. Web Audio Chimes don't play in the browser
- Modern browsers (Chrome, Safari, Edge) block audio until the user interacts with the page. Click anywhere on the screen or click the test buttons to unlock the Web Audio context.

### 6. Arduino IDE upload error: `A fatal error occurred: Failed to connect to ESP32`
- Press and hold the **BOOT** button on your ESP32 board the moment `Connecting.......` appears in the Arduino IDE console. Release it once `Writing at 0x00010000... (xx %)` appears.

---

## 🛡️ Safety & Regulatory Disclaimers

PulseLock is a connected adherence prototype developed for demonstration and hackathon evaluation. While designed with medical access-control principles:
- It does not replace professional medical advice, clinical diagnoses, or emergency care.
- Dosing schedules should always be reviewed and confirmed by a certified healthcare professional.
- For life-critical medications, fail-safe manual override mechanisms should be incorporated into production physical enclosures.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

<div align="center">
Built with ❤️ for patients who deserve better medication adherence.
</div>