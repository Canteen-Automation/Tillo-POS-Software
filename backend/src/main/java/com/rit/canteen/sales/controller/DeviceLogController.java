package com.rit.canteen.sales.controller;

import com.rit.canteen.sales.model.DeviceLog;
import com.rit.canteen.sales.service.DeviceLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/device-logs")
public class DeviceLogController {

    @Autowired
    private DeviceLogService deviceLogService;

    /**
     * POST /api/device-logs
     * Accepts JSON: { "device_id": "...", "message": "..." }
     * Called by ESP32 Bill-Bot devices to log events.
     */
    @PostMapping
    public ResponseEntity<Void> createLog(@RequestBody Map<String, String> body) {
        String deviceId = body.get("device_id");
        String message = body.get("message");

        if (deviceId == null || message == null) {
            return ResponseEntity.badRequest().build();
        }

        deviceLogService.saveLog(deviceId, message);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * GET /api/device-logs
     * Returns all device logs (newest first) for admin dashboard.
     */
    @GetMapping
    public List<DeviceLog> getAllLogs() {
        return deviceLogService.getAllLogs();
    }

    /**
     * GET /api/device-logs/{deviceId}
     * Returns logs for a specific device.
     */
    @GetMapping("/{deviceId}")
    public List<DeviceLog> getLogsByDevice(@PathVariable String deviceId) {
        return deviceLogService.getLogsByDeviceId(deviceId);
    }
}
