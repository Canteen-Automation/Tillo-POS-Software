package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.Terminal;
import com.rit.canteen.sales.repository.TerminalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TerminalService {

    @Autowired
    private TerminalRepository terminalRepository;

    public List<Terminal> getAllTerminals() {
        return terminalRepository.findAll();
    }

    public Terminal createTerminal(Terminal terminal) {
        // Generate a secure API Key
        terminal.setApiKey("POS-" + UUID.randomUUID().toString().replace("-", "").toUpperCase());
        return terminalRepository.save(terminal);
    }

    public boolean verifyPin(Long id, String pin) {
        if (id == null) return false;
        Optional<Terminal> terminalOpt = terminalRepository.findById(id);
        return terminalOpt.map(terminal -> 
            terminal.getPin().trim().equals(pin.trim())
        ).orElse(false);
    }

    public Optional<Terminal> getTerminalById(Long id) {
        if (id == null) return Optional.empty();
        return terminalRepository.findById(id);
    }

    public void deleteTerminal(Long id) {
        if (id != null) {
            terminalRepository.deleteById(id);
        }
    }

    public boolean toggleBlockStatus(Long id) {
        if (id == null) return false;
        return terminalRepository.findById(id).map(terminal -> {
            terminal.setBlocked(!terminal.isBlocked());
            terminalRepository.save(terminal);
            return terminal.isBlocked();
        }).orElse(false);
    }

    public Terminal updateTerminal(Long id, Terminal details) {
        if (id == null) return null;
        return terminalRepository.findById(id).map(existing -> {
            existing.setName(details.getName());
            existing.setLocation(details.getLocation());
            if (details.getPin() != null && !details.getPin().trim().isEmpty()) {
                existing.setPin(details.getPin().trim());
            }
            return terminalRepository.save(existing);
        }).orElse(null);
    }
}
