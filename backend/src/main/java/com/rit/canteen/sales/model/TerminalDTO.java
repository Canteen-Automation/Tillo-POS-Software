package com.rit.canteen.sales.model;

import java.time.LocalDateTime;

public class TerminalDTO {
    private Long id;
    private String name;
    private String location;
    private String apiKey;
    private String pin;
    private boolean paired;
    private boolean blocked;
    private String deviceId;
    private LocalDateTime pairedAt;

    public TerminalDTO() {}

    public TerminalDTO(Long id, String name, String location, String apiKey, String pin,
                       boolean paired, boolean blocked, String deviceId, LocalDateTime pairedAt) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.apiKey = apiKey;
        this.pin = pin;
        this.paired = paired;
        this.blocked = blocked;
        this.deviceId = deviceId;
        this.pairedAt = pairedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public boolean isPaired() { return paired; }
    public void setPaired(boolean paired) { this.paired = paired; }

    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public LocalDateTime getPairedAt() { return pairedAt; }
    public void setPairedAt(LocalDateTime pairedAt) { this.pairedAt = pairedAt; }
}
