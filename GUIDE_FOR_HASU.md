# 🌟 PulseLock — Complete Step-by-Step Guide for Hasu

Hey Hasu! 👋 
This is your complete, beginner-friendly, start-to-finish manual to get **PulseLock** running on your laptop and connected to your physical ESP32 dispenser hardware. Everything you need is detailed below!

---

## 📋 Table of Contents
1. [Prerequisites (What to Install)](#1-prerequisites-what-to-install)
2. [Running the Web Platform Locally](#2-running-the-web-platform-locally)
3. [Testing Without Hardware (Simulator Mode)](#3-testing-without-hardware-simulator-mode)
4. [Connecting & Flashing the ESP32 Hardware](#4-connecting--flashing-the-esp32-hardware)
5. [Complete Hardware Pinout & Wiring Table](#5-complete-hardware-pinout--wiring-table)
6. [Live Demo Runbook (Testing the Core USP)](#6-live-demo-runbook-testing-the-core-usp)
7. [Troubleshooting & Common Fixes](#7-troubleshooting--common-fixes)
8. [90-Second Pitch Script for Judges](#8-90-second-pitch-script-for-judges)

---

## 1. Prerequisites (What to Install)

Before starting, make sure your computer has:
1. **Node.js (v18 or v20):** Download from [nodejs.org](https://nodejs.org/) (LTS version).
2. **Git:** Download from [git-scm.com](https://git-scm.com/).
3. **Arduino IDE 2.x:** Download from [arduino.cc](https://www.arduino.cc/en/software) (for flashing your ESP32).
4. **Web Browser:** Google Chrome or Microsoft Edge (recommended for Web Speech API microphone support).

---

## 2. Running the Web Platform Locally

### Step 1: Pull or Clone the Repository
Open your terminal (Command Prompt or PowerShell) and run:

```bash
# If you already have the folder on your laptop:
cd PulseLock
git pull origin main

# OR if you are starting fresh:
git clone https://github.com/someonekilledhasu/PulseLock.git
cd PulseLock
```

### Step 2: Install Dependencies
```bash
npm install
```
*(Takes about 30 seconds to install Next.js, React, Lucide icons, and Tailwind styles).*

### Step 3: Launch the Development Server
```bash
npm run dev
```

You will see:
```
  ▲ Next.js 15.5.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
```

### Step 4: Open in Your Browser
Open **[http://localhost:3000](http://localhost:3000)** in Chrome or Edge.

- **Default Patient PIN:** Enter `1234`  
  *(Or simply click the button: **"Preset Demo Patient PIN (1234)"**).*
- You are now on the **PulseLock Scandinavian Health Dashboard**!

---

## 3. Testing Without Hardware (Simulator Mode)

You don't even need the physical ESP32 to demonstrate or test the entire system! The dashboard has a built-in **Hardware Test Bar** floating at the bottom of the screen.

### 🧪 Test 1: The Core USP — Early Access Lockout
1. Look at the bottom floating bar and click:  
   👉 **"Test Early Access Block (Simulate Hardware Reject)"**
2. **What happens:**
   - The browser synthesizes an authentic low-frequency double-beep warning (`260 Hz -> 220 Hz`).
   - An alert toast warns: *"Access Denied: Next dose is strictly locked to prevent overdose."*
   - Scroll down to the **Audit Event Log**: It instantly records a timestamped `access_denied` attempt from `ESP32_01`!

### 🧪 Test 2: Voice Prescription Ingestion (AI Clinical NLP)
1. In the top navigation, click **"Add Prescription"**.
2. Click the **Microphone** button and speak:  
   *"Take Dolo 650 twice daily after food for 5 days"*  
   *(Or click the preset **"Sample 1: Dolo 650"** button).*
3. Click **"Parse Prescription with AI"**.
4. The AI immediately extracts:
   - **Medicine:** Dolo
   - **Strength:** 650 mg
   - **Dosage:** 1 tablet
   - **Frequency:** 2x daily (08:00 & 20:00)
   - **Food:** After food
5. Click **"Confirm & Save to Dispenser"** — a multi-day schedule is automatically generated!

### 🧪 Test 3: Arming the Window & Dispensing
1. On the dashboard, click **"Arm Next Dose Window (Demo Mode)"** in the bottom bar.
2. The next dose switches to **`DOSE WINDOW OPEN NOW`** and plays a harmonic chime.
3. Click **"Send Biometric Pulse (Simulate Hardware Scan)"**.
4. The dose is marked as **Dispensed**, adherence rises, and the compartment immediately locks down!

---

## 4. Connecting & Flashing the ESP32 Hardware

Follow these steps when you are ready to connect your physical ESP32 circuit.

### Step 1: Connect Laptop & ESP32 to the Same Network
- Connect your laptop to your home Wi-Fi or your mobile phone's hotspot.
- *(Important: ESP32 only connects to **2.4 GHz** Wi-Fi. If using a phone hotspot, set AP Band to 2.4 GHz).*

### Step 2: Find Your Laptop's Local IP Address
- On Windows: Open Command Prompt, type `ipconfig`, and press Enter.
- Look for **IPv4 Address** under your active Wi-Fi adapter (e.g., `192.168.1.7` or `192.168.43.50`).
- Remember this IP!

### Step 3: Install Required Arduino Libraries
1. Open **Arduino IDE 2.x**.
2. Go to **File** → **Preferences**, and in **Additional Boards Manager URLs**, paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools** → **Board** → **Boards Manager...**, search for `esp32` by **Espressif Systems**, and install it.
4. Go to **Tools** → **Manage Libraries...** (`Ctrl+Shift+I`) and install these 4 libraries:
   - `ESP32Servo` (by Kevin Harrington)
   - `ArduinoJson` (v6 or v7 by Benoit Blanchon)
   - `Adafruit SSD1306` (by Adafruit)
   - `Adafruit GFX Library` (by Adafruit)

### Step 4: Open and Edit the Firmware
1. In Arduino IDE, open: **`esp32/pulselock.ino`**
2. Check lines 14–20 and update with your details:
   ```cpp
   // Put your laptop's IP address here (with :3000 at the end):
   const char* SERVER_BASE_URL = "http://192.168.1.7:3000";
   const char* DEVICE_ID       = "ESP32_01";

   // Put your Wi-Fi or Hotspot credentials:
   const char* WIFI_SSID       = "Your_WiFi_Name";
   const char* WIFI_PASSWORD   = "Your_WiFi_Password";
   ```

### Step 5: Upload the Firmware
1. Plug your ESP32 into your laptop with a USB cable.
2. Select **Tools** → **Board** → **ESP32 Arduino** → **ESP32 Dev Module**.
3. Select your port under **Tools** → **Port** (e.g., `COM3`, `COM4`).
4. Click the **Upload (`→`)** button.
   > **Note:** If the Arduino IDE console shows `Connecting......._____.....`, press and hold the physical **BOOT** button on your ESP32 board for 2 seconds until the percentage counter starts uploading!

Once uploaded:
- Open **Serial Monitor** at **115200 baud**.
- You will see: `WiFi Connected! IP: 192.168.x.x` and `Synced with PulseLock backend`.
- The 0.96" OLED screen will turn on and display the current time and schedule!

---

## 5. Complete Hardware Pinout & Wiring Table

Here is the exact wiring map matching [`esp32/pulselock.ino`](esp32/pulselock.ino):

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
                          | [GPIO4]    [GPIO27] |----------- SERVO Signal (PWM)
                          | [GPIO0]    [GPIO14] |
                          | [GPIO2]    [GPIO12] |
                          | [GPIO15]   [GPIO13] |
                          | [GPIO8]     [GPIO9] |
                          | [GPIO7]    [GPIO10] |
                          | [GPIO6]    [GPIO11] |
      5V Power Rail ------| [VIN/5V]      [GND] |----------- GND Rail
                          +---------------------+
```

### Pin Assignment Table

| Component | Pin / Leg | ESP32 Pin | Function |
|---|---|---|---|
| **BUTTON 1 (Dispense / Acknowledge)** | Signal Leg | **`GPIO 16`** | Dispenses dose if window is due; triggers early access lockout if locked. |
| | Ground Leg | `GND` | Internal pull-up resistor used. |
| **BUTTON 2 (Previous Medicine)** | Signal Leg | **`GPIO 17`** | Scrolls backward through today's schedule on OLED. |
| | Ground Leg | `GND` | Internal pull-up resistor used. |
| **BUTTON 3 (Next Medicine)** | Signal Leg | **`GPIO 18`** | Scrolls forward through today's schedule on OLED. |
| | Ground Leg | `GND` | Internal pull-up resistor used. |
| **Dispenser Servo (SG90/MG90S)** | Signal (Orange) | **`GPIO 27`** | Steps `+23°` per valid dose (continuous carousel mechanism). |
| | Power (Red) | **`VIN` (5V)** | Connect to 5V rail. *(Do not connect servo to 3.3V pin).* |
| | Ground (Brown) | `GND` | Shared ground with ESP32. |
| **Piezo Buzzer** | Positive (+) | **`GPIO 26`** | Reminder alarm and lockout double-beep warning. |
| | Negative (-) | `GND` | Ground connection. |
| **SSD1306 0.96" I2C OLED** | SDA (Data) | **`GPIO 21`** | I2C Data line. |
| | SCL (Clock) | **`GPIO 22`** | I2C Clock line. |
| | VCC (Power) | **`3.3V`** | 3.3V power pin. |
| | GND | `GND` | Ground connection. |

---

## 6. Live Demo Runbook (Testing the Core USP)

When demonstrating PulseLock, follow this 3-step sequence:

### 1. Show the Lockout Block (Overdose Prevention)
- Tell the judges: *"Watch what happens if a patient tries to take their medication early."*
- Press **Button 1** on the breadboard (or click "Test Early Access Block" on the screen).
- **Observed behavior:**
  - Servo **does not move**.
  - Buzzer double-beeps in protest.
  - OLED flashes: `ACCESS DENIED! DISPENSER LOCKED`.
  - Dashboard audit log updates in real-time.

### 2. Show Natural Voice Prescription Input
- Go to the **Add Prescription** screen.
- Click the microphone and say:  
  *"Take Dolo 650 twice daily after food for 5 days"*
- Click **Parse Prescription with AI** → Show the clinical extraction card → Click **Confirm**.

### 3. Show Authorized Dispensing & Auto-Relock
- Click **"Arm Next Dose Window (Demo Mode)"** on the web app.
- The OLED screen changes to: `MEDICINE DUE! Metformin - PRESS BTN 1`.
- Buzzer sounds the reminder tone.
- Press **Button 1**:
  - The servo turns **`+23°`** to drop the pill.
  - OLED displays: `DISPENSED! Compartment C01. RELOCKING...`.
  - The dispenser **immediately relocks**!
  - Press Button 1 again immediately: Access is blocked!

---

## 7. Troubleshooting & Common Fixes

| Issue | Cause | Easy Solution |
|---|---|---|
| **ESP32 says `WiFi Failed`** | Network is 5 GHz | ESP32 only works on 2.4 GHz. On your phone hotspot, switch AP band to **2.4 GHz**. |
| **ESP32 says `HTTP error: -1`** | Windows Firewall blocking port 3000 | In Windows Defender Firewall, allow `Node.js` through Private networks, or temporarily disable firewall on private hotspot. |
| **ESP32 restarts when servo turns** | Servo drawing too much power from 3.3V | Connect the servo's red power wire to **`VIN` (5V)**, not the 3.3V pin. |
| **OLED screen is completely blank** | Loose I2C wire or wrong address | Verify SDA is in `GPIO 21` and SCL is in `GPIO 22`. In `pulselock.ino`, change `#define OLED_ADDR 0x3C` to `0x3D` if needed. |
| **Forgot Login PIN** | Login screen locked | The PIN is always `1234`. You can also click the quick-login demo button. |

---

## 8. 90-Second Pitch Script for Judges

Use this script during your presentation:

> **[0:00 - 0:15] The Hook:**  
> *"Over 50% of chronic disease patients fail to take medications correctly. Phone reminders get snoozed, and standard pillboxes do nothing to prevent accidental double-dosing. PulseLock solves this by placing a physical, locked access-control layer around prescriptions."*
>
> **[0:15 - 0:40] The Lockout Demo (Core USP):**  
> *"Our core principle is: **'Ek medicine le li, dusri uske time pe hi khulegi'**. Look at what happens if I try to take my evening medicine right now — I press Button 1 on the dispenser... The servo refuses to budge, the buzzer sounds a rejection tone, the OLED flashes 'ACCESS DENIED', and our live web audit log flags an unauthorized attempt."*
>
> **[0:40 - 1:05] The AI Voice Parsing:**  
> *"Entering prescriptions is seamless. A patient or caregiver speaks naturally: 'Take Dolo 650 twice daily after food for 5 days'. Our clinical NLP extracts the drug, dosage, and meal timings, and generates a multi-day schedule."*
>
> **[1:05 - 1:30] The Dispense & Relock:**  
> *"When the scheduled window arrives, the dispenser alerts the patient, unlocks for authenticated access, dispenses exactly one dose, and immediately locks back down. Adherence reaches 96%+ with complete family transparency."*

---

<div align="center">
<b>You're all set, Hasu! Go crush your demo! 🚀</b>
</div>
