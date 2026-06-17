package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.DeviceLog;
import com.rit.canteen.sales.repository.DeviceLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DeviceLogService {

    @Autowired
    private DeviceLogRepository deviceLogRepository;

    @Transactional
    public DeviceLog saveLog(String deviceId, String message) {
        DeviceLog log = new DeviceLog(deviceId, message);
        return deviceLogRepository.save(log);
    }

    public List<DeviceLog> getAllLogs() {
        return deviceLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<DeviceLog> getLogsByDeviceId(String deviceId) {
        return deviceLogRepository.findByDeviceIdOrderByCreatedAtDesc(deviceId);
    }
}
