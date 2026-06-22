# Terminal Integration & ESP32 Firmware API Specification

This document provides the API specifications of the Spring Boot backend for integrating terminal hardware (ESP32 controllers that scan QR codes and print bills).

---

## 1. Authentication

### For Paired Devices
Once a device is paired, all terminal-specific APIs use **API Key authentication**.
- **Header Key**: `X-API-KEY`
- **Value**: `POS-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (Auto-generated when a terminal is created).

### For Unpaired Devices (During Pairing)
The pairing endpoint requires no authentication — the device has no credentials yet.

---

## 2. Device Onboarding (OTP-Based Pairing)

### Flow Overview

1. **Admin** creates a terminal in the dashboard (name, location, PIN)
2. **ESP32** boots with no stored API key → enters pairing mode
3. **ESP32** generates a 6-digit OTP and displays it on screen
4. **ESP32** POSTs the OTP + its chipId to `POST /api/terminals/pair`
5. **Admin** enters the OTP in the dashboard against the specific terminal
6. **Backend** matches the OTP, binds the device to the terminal
7. **ESP32** polls `POST /api/terminals/pair` again → receives `"PAIRED"` + API key
8. **ESP32** saves the API key to NVS flash and restarts
9. All subsequent communication uses `X-API-KEY` header — no further pairing needed

### A. Register Device OTP (ESP32 → Backend)

Used by the ESP32 to register its OTP and poll for pairing completion.

* **URL**: `/api/terminals/pair`
* **Method**: `POST`
* **Auth**: None (public endpoint)
* **Headers**:
  * `Content-Type`: `application/json`
* **Request Body**:
```json
{
  "otp": "482916",
  "deviceId": "Esp 32 - AABBCCDDEEFF"
}
```

#### Response — Waiting (Admin hasn't linked yet):
```json
{
  "status": "WAITING"
}
```

#### Response — Paired (Admin completed linking):
```json
{
  "status": "PAIRED",
  "apiKey": "POS-EF9832B743CA90B2381F0A1B2C3D4E5F",
  "terminalId": 1
}
```

* **Response Codes**:
  * `200 OK`: Always — check `status` field for state.
  * `400 BAD_REQUEST`: Missing `otp` or `deviceId`.

---

### B. Link Device (Admin Dashboard → Backend)

Used by the admin to match a device's OTP to a terminal.

* **URL**: `/api/terminals/{id}/link-device`
* **Method**: `POST`
* **Auth**: JWT (admin role)
* **Headers**:
  * `Content-Type`: `application/json`
  * `Authorization`: `Bearer <jwt>`
* **Path Parameters**:
  * `id` (Long): The terminal ID to link the device to.
* **Request Body**:
```json
{
  "otp": "482916"
}
```

#### Response (`200 OK`):
```json
{
  "message": "Device linked successfully",
  "terminalId": 1,
  "name": "Counter 1 Printer",
  "deviceId": "Esp 32 - AABBCCDDEEFF"
}
```

* **Response Codes**:
  * `200 OK`: Device linked successfully.
  * `400 BAD_REQUEST`: Invalid or expired OTP.

---

### C. Unpair Device (Admin Dashboard → Backend)

Used by the admin to disconnect a device from a terminal.

* **URL**: `/api/terminals/{id}/unpair`
* **Method**: `POST`
* **Auth**: JWT (admin role)

#### Response (`200 OK`):
```json
{
  "message": "Device unpaired successfully"
}
```

---

## 3. Operational Endpoints

### D. Get Order Details

Used by the ESP32 to fetch the order details after scanning a QR code.

* **URL**: `/api/terminals/orders/{orderNumber}`
* **Method**: `GET`
* **Headers**:
  * `X-API-KEY`: `<YOUR_TERMINAL_API_KEY>`
* **Path Parameters**:
  * `orderNumber` (String): The order ID scanned from the QR code (e.g., `ORD-87A3B2D9`).

#### Response Codes:
* `200 OK`: Order found and is eligible for processing.
* `401 UNAUTHORIZED`: Invalid or missing `X-API-KEY`.
* `404 NOT_FOUND`: Order number does not exist.
* `400 BAD_REQUEST`: Order has already been fulfilled (`status` is `COMPLETED`).
* `410 GONE`: Order has expired/archived.

#### Response Body (`200 OK` JSON Schema):
```json
{
  "id": 12,
  "orderNumber": "ORD-68EF73C9",
  "displayOrderId": "045",
  "userId": 5,
  "totalAmount": 250.00,
  "status": "PAID",
  "paymentMethod": "RITZ_TOKEN",
  "createdAt": "2026-06-17T13:30:00",
  "orderType": "STORE_ORDER",
  "archived": false,
  "hasFeedback": false,
  "items": [
    {
      "id": 24,
      "productId": 3,
      "productName": "Masala Dosa",
      "price": 60.00,
      "quantity": 2,
      "stallId": 1,
      "stallName": "RIT Canteen"
    },
    {
      "id": 25,
      "productId": 7,
      "productName": "Cold Coffee",
      "price": 40.00,
      "quantity": 1,
      "stallId": 2,
      "stallName": "Juice Bar"
    }
  ]
}
```

---

### E. Mark Order as Delivered

Used by the ESP32 to mark an order as delivered/completed in the database once the bill has successfully printed.

* **URL**: `/api/terminals/orders/{orderNumber}/delivered`
* **Method**: `POST`
* **Headers**:
  * `X-API-KEY`: `<YOUR_TERMINAL_API_KEY>`
* **Path Parameters**:
  * `orderNumber` (String): The order ID (e.g., `ORD-87A3B2D9`).

#### Response Codes:
* `200 OK`: Order marked as delivered successfully, or was already marked as delivered.
* `401 UNAUTHORIZED`: Invalid or missing `X-API-KEY`.
* `404 NOT_FOUND`: Order number does not exist.
* `410 GONE`: Order has expired/archived.

#### Response Body (`200 OK` JSON Schema):
```json
{
  "success": true,
  "message": "Order marked as delivered successfully."
}
```

---

### F. Validate API Key

Used by the ESP32 to verify its API key is still valid (optional health check).

* **URL**: `/api/terminals/validate`
* **Method**: `GET`
* **Headers**:
  * `X-API-KEY`: `<YOUR_TERMINAL_API_KEY>`

#### Response (`200 OK`):
```json
{
  "status": "VALID",
  "terminalId": 1,
  "name": "Counter 1 Printer",
  "location": "Main Hall"
}
```

---

### G. Device Logging

Used by the ESP32 to submit runtime system logs to the backend.

* **URL**: `/api/device-logs`
* **Method**: `POST`
* **Headers**:
  * `Content-Type`: `application/json`
* **Request Body**:
```json
{
  "device_id": "Esp 32 - AABBCCDDEEFF",
  "message": "Firmware Version: 1.2.6"
}
```
* **Response Codes**:
  * `201 CREATED`: Log successfully recorded.
  * `400 BAD_REQUEST`: Missing `device_id` or `message`.

---

### H. Verify Terminal PIN (Admin Tool)

Used during admin operations to reveal the terminal's API Key.

* **URL**: `/api/terminals/{id}/verify-pin`
* **Method**: `POST`
* **Headers**:
  * `Content-Type`: `application/json`
* **Path Parameters**:
  * `id` (Long): The database ID of the terminal registration.
* **Request Body**:
```json
{
  "pin": "1234"
}
```
* **Response Body (`200 OK`):**
```json
{
  "id": 1,
  "name": "Counter 1 Printer",
  "location": "Main Hall",
  "pin": "1234",
  "apiKey": "POS-EF9832B743CA90B2381F",
  "deviceId": "Esp 32 - AABBCCDDEEFF",
  "paired": true,
  "pairedAt": "2026-06-17T14:00:00"
}
```

---

## 4. ESP32 Firmware Integration Guide

### Pairing Flow (`database.cpp`)

The ESP32 now uses OTP-based pairing instead of JWT token polling:

```cpp
void setupPairing()
{
    // 1. Generate 6-digit OTP
    currentOtp = generateUniqueOTP(oldOtp);
    displayStatus("OTP: " + currentOtp + "\nEnter on Admin Panel", 300);

    // 2. POST OTP + deviceId to /api/terminals/pair
    JsonDocument requestDoc;
    requestDoc["otp"] = currentOtp;
    requestDoc["deviceId"] = getDeviceId();

    // 3. Poll every 3 seconds — check if status == "PAIRED"
    // 4. On success, extract apiKey and save to NVS
    apiKey = doc["apiKey"].as<String>();
    saveApiKey(apiKey);
    ESP.restart();
}
```

### Data Fetching (`database.cpp`)

All requests use `X-API-KEY` instead of `Authorization: Bearer`:

```cpp
String getData(String orderNumber)
{
    httpClient.addHeader("X-API-KEY", apiKey);  // Not Bearer token
    // ... GET /api/terminals/orders/{orderNumber}
}
```

### Order JSON Parsing (`bill_bot_system.cpp`)

The new backend returns order details at the **root level** (no `"data"` wrapper):

| Old Path | New Path |
|---|---|
| `doc["data"]["orderId"]` | `doc["displayOrderId"]` or `doc["orderNumber"]` |
| `doc["data"]["status"]` | `doc["status"]` (`"PAID"` = ready, `"COMPLETED"` = already done) |
| `doc["data"]["dateTz"]` | `doc["createdAt"]` |
| `doc["data"]["order"]` (items) | `doc["items"]` |
| `item["productInfo"]["name"]` | `item["productName"]` |
| `item["counterId"]` | `item["stallId"]` / `item["stallName"]` |
| `item["price"]` (in paise) | `item["price"]` (in rupees, no /100 needed) |

### Device Logging (`database.cpp`)

Logs now go to the Spring Boot backend directly (no Supabase):

```cpp
void sendLog(String message)
{
    httpClient.begin(logUrl);  // /api/device-logs
    httpClient.addHeader("Content-Type", "application/json");
    // No supabaseApiKey header needed
    httpClient.POST(body);
}
```

### QR Code Format

The QR code payload is now the **order number directly**:
- Old: `prefix$PAYMENT_ID$suffix` → parsed with `$` delimiters
- New: `ORD-87A3B2D9` → passed directly to `getData()`
