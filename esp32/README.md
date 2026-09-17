# PulseLock ESP32 Hardware Integration Guide

This guide explains how to compile and upload `esp32/pulselock.ino` to your physical ESP32 device using the Arduino IDE.

---

## 1. Required Hardware Components

- **ESP32 Dev Module** (30-pin or 38-pin)
- **Optical Fingerprint Sensor** (AS608, R307, or FPM10A)
- **Micro Servo Motors** (2x SG90 or MG90S) for Compartment 1 and 2
- **Status LEDs** (1x Green for Access, 1x Red for Locked/Denied) + 220Ω resistors
- **Optional Piezo Buzzer** (Active 5V)
- **Optional 0.96" I2C OLED Display** (SSD1306 128x64)
- Breadboard & Jumper wires

---

## 2. Wiring Pinout Diagram

| Component | Component Pin | ESP32 GPIO Pin |
|---|---|---|
| **Fingerprint Sensor** | VCC | 3.3V or 5V |
| | GND | GND |
| | TX | **GPIO 16** (RX2) |
| | RX | **GPIO 17** (TX2) |
| **Compartment 1 Servo (C01)** | Signal (Orange/Yellow) | **GPIO 18** |
| | VCC (Red) | 5V (VIN) |
| | GND (Brown/Black) | GND |
| **Compartment 2 Servo (C02)** | Signal (Orange/Yellow) | **GPIO 19** |
| | VCC (Red) | 5V (VIN) |
| | GND (Brown/Black) | GND |
| **Green LED** | Anode (+) | **GPIO 2** |
| **Red LED** | Anode (+) | **GPIO 4** |
| **Buzzer** | Positive (+) | **GPIO 5** |
| **OLED (Optional)** | SDA / SCL | **GPIO 21 (SDA) / GPIO 22 (SCL)** |

---

## 3. Arduino IDE Setup

1. In Arduino IDE, go to **Tools** → **Board** → **ESP32 Arduino** → Select **ESP32 Dev Module**.
2. Open **Tools** → **Manage Libraries...** and install the following:
   - `Adafruit Fingerprint Sensor Library` (by Adafruit)
   - `ESP32Servo` (by Kevin Harrington)
   - `ArduinoJson` (v6 or v7 by Benoit Blanchon)
   - `Adafruit SSD1306` (by Adafruit)
   - `Adafruit GFX Library` (by Adafruit)

3. In `esp32/pulselock.ino`:
   - Change `WIFI_SSID` and `WIFI_PASSWORD` to your Wi-Fi network.
   - Set `BACKEND_URL` to your machine's local IP address or Vercel URL:
     ```cpp
     const char* BACKEND_URL = "http://192.168.1.100:3000"; 
     // Or your Vercel deployment:
     // const char* BACKEND_URL = "https://your-pulselock.vercel.app";
     ```

4. Plug in your ESP32 via USB and click **Upload**.

---

## 4. Testing End-to-End Flow

1. Power on the ESP32. Serial Monitor will display `WiFi Connected! IP: 192.168.x.x`.
2. The ESP32 polls `GET /api/device?deviceId=ESP32_01`.
3. When a dose window arrives or is marked available in PulseLock:
   - OLED displays `DOSE AVAILABLE: [Medicine] - PLACE FINGER`.
   - Green LED turns on.
4. Touch the fingerprint sensor:
   - Authorized finger triggers Compartment servo unlock.
   - ESP32 sends `POST /api/device` with `status: accessed`.
   - The PulseLock Web Dashboard instantly flips the badge to `✓ Accessed` in real time!
