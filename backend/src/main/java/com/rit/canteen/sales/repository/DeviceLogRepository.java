package com.rit.canteen.sales.repository;

import com.rit.canteen.sales.model.DeviceLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeviceLogRepository extends JpaRepository<DeviceLog, Long> {
    List<DeviceLog> findAllByOrderByCreatedAtDesc();
    List<DeviceLog> findByDeviceIdOrderByCreatedAtDesc(String deviceId);
}
