package com.rit.canteen.sales.service;

import com.rit.canteen.sales.model.*;
import com.rit.canteen.sales.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Check if a user exists by mobile number.
     * Returns a LoginResponse indicating whether the user exists.
     */
    public LoginResponse checkUserExists(String mobileNumber) {
        boolean exists = userRepository.existsByMobileNumber(mobileNumber);
        if (exists) {
            return new LoginResponse(true, "User found. Please enter your PIN.", true);
        } else {
            return new LoginResponse(true, "User not found. Please enter your name and create a PIN.", false);
        }
    }

    /**
     * Register a new user with name, mobile number and a 6-digit PIN.
     * Encrypts the PIN using BCrypt and marks the user as logged in.
     */
    public LoginResponse registerUser(String mobileNumber, String name, String pin) {
        if (userRepository.existsByMobileNumber(mobileNumber)) {
            return new LoginResponse(false, "User already exists. Please login instead.");
        }

        if (name == null || name.isBlank()) {
            return new LoginResponse(false, "Name is required for registration.");
        }

        if (pin == null || pin.length() != 6 || !pin.matches("^[0-9]{6}$")) {
            return new LoginResponse(false, "PIN must be exactly 6 digits.");
        }

        User user = new User();
        user.setMobileNumber(mobileNumber);
        user.setName(name);
        user.setPinHash(passwordEncoder.encode(pin));
        user.setLoggedIn(true);
        user.setLastLoginAt(LocalDateTime.now());

        userRepository.save(user);

        LoginResponse.UserDto userDto = new LoginResponse.UserDto(
                user.getId(), user.getMobileNumber(), user.getName(), user.isLoggedIn(), user.isSuspended(), user.getRitzTokenBalance()
        );

        return new LoginResponse(true, "Registration successful. You are now logged in.", userDto);
    }

    /**
     * Verify the PIN for an existing user and log them in.
     */
    public LoginResponse verifyPinAndLogin(String mobileNumber, String pin) {
        Optional<User> userOpt = userRepository.findByMobileNumber(mobileNumber);

        if (userOpt.isEmpty()) {
            return new LoginResponse(false, "User not found. Please register first.");
        }

        User user = userOpt.get();

        if (user.isSuspended()) {
            LoginResponse.UserDto userDto = new LoginResponse.UserDto(
                user.getId(), user.getMobileNumber(), user.getName(), user.isLoggedIn(), user.isSuspended(), user.getRitzTokenBalance()
            );
            return new LoginResponse(false, "Your account has been suspended. Please contact the administrator.", userDto);
        }

        if (!passwordEncoder.matches(pin, user.getPinHash())) {
            return new LoginResponse(false, "Incorrect PIN. Please try again.");
        }

        user.setLoggedIn(true);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        LoginResponse.UserDto userDto = new LoginResponse.UserDto(
                user.getId(), user.getMobileNumber(), user.getName(), user.isLoggedIn(), user.isSuspended(), user.getRitzTokenBalance()
        );

        return new LoginResponse(true, "Login successful.", userDto);
    }

    /**
     * Logout a user by updating their logged-in status.
     */
    public LoginResponse logout(String mobileNumber) {
        Optional<User> userOpt = userRepository.findByMobileNumber(mobileNumber);

        if (userOpt.isEmpty()) {
            return new LoginResponse(false, "User not found.");
        }

        User user = userOpt.get();
        user.setLoggedIn(false);
        userRepository.save(user);

        return new LoginResponse(true, "Logged out successfully.");
    }

    /**
     * Change a user's PIN after verifying the current one.
     */
    public LoginResponse changePin(String mobileNumber, String currentPin, String newPin) {
        Optional<User> userOpt = userRepository.findByMobileNumber(mobileNumber);

        if (userOpt.isEmpty()) {
            return new LoginResponse(false, "User not found.");
        }

        User user = userOpt.get();

        // Verify current PIN
        if (!passwordEncoder.matches(currentPin, user.getPinHash())) {
            return new LoginResponse(false, "Incorrect current PIN. Check and try again.");
        }

        // Validate new PIN format
        if (newPin == null || newPin.length() != 6 || !newPin.matches("^[0-9]{6}$")) {
            return new LoginResponse(false, "New PIN must be exactly 6 digits.");
        }

        // Check if new PIN is the same as current
        if (currentPin.equals(newPin)) {
            return new LoginResponse(false, "New PIN cannot be the same as the current one.");
        }

        // Update PIN
        user.setPinHash(passwordEncoder.encode(newPin));
        userRepository.save(user);

        return new LoginResponse(true, "Security PIN updated successfully.");
    }

    /**
     * Get user details by mobile number.
     */
    public LoginResponse.UserDto getUserByMobile(String mobileNumber) {
        Optional<User> userOpt = userRepository.findByMobileNumber(mobileNumber);
        if (userOpt.isEmpty()) {
            return null;
        }
        User user = userOpt.get();
        return new LoginResponse.UserDto(user.getId(), user.getMobileNumber(), user.getName(), user.isLoggedIn(), user.isSuspended(), user.getRitzTokenBalance());
    }

    /**
     * Get all registered users for administration dashboard (Paginated with Search).
     */
    public Page<LoginResponse.UserDto> getAllUsers(String search, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.isEmpty()) {
            users = userRepository.findByNameOrMobileContainingIgnoreCase(search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        
        return users.map(user -> new LoginResponse.UserDto(
                user.getId(), 
                user.getMobileNumber(), 
                user.getName(), 
                user.isLoggedIn(),
                user.isSuspended(),
                user.getRitzTokenBalance()
        ));
    }

    /**
     * Update user details as an administrator or user.
     */
    public LoginResponse.UserDto updateUser(Long userId, String name, String mobileNumber, String newPin) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return null;
        }

        User user = userOpt.get();
        
        // Handle mobile number update with conflict check
        if (mobileNumber != null && !mobileNumber.equals(user.getMobileNumber())) {
            // Validate format
            if (!mobileNumber.matches("^[0-9]{10}$")) {
                return null; // Invalid format
            }
            
            // Check for conflict
            if (userRepository.existsByMobileNumber(mobileNumber)) {
                return null; // Conflict: mobile number already taken
            }
            user.setMobileNumber(mobileNumber);
        }
        
        if (name != null) user.setName(name);
        
        // Only update PIN if it is provided and valid
        if (newPin != null && !newPin.isBlank()) {
            if (newPin.length() == 6 && newPin.matches("^[0-9]{6}$")) {
                user.setPinHash(passwordEncoder.encode(newPin));
            }
        }

        userRepository.save(user);
        return new LoginResponse.UserDto(user.getId(), user.getMobileNumber(), user.getName(), user.isLoggedIn(), user.isSuspended(), user.getRitzTokenBalance());
    }

    /**
     * Toggle the suspension status of a user.
     */
    public LoginResponse.UserDto toggleSuspension(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return null;
        }

        User user = userOpt.get();
        user.setSuspended(!user.isSuspended());
        
        // If suspended, forcefully log them out
        if (user.isSuspended()) {
            user.setLoggedIn(false);
        }
        
        userRepository.save(user);
        return new LoginResponse.UserDto(user.getId(), user.getMobileNumber(), user.getName(), user.isLoggedIn(), user.isSuspended(), user.getRitzTokenBalance());
    }

    /**
     * Suspend a user by their mobile number.
     */
    public void suspendUserByMobile(String mobileNumber) {
        if (mobileNumber == null) return;
        userRepository.findByMobileNumber(mobileNumber).ifPresent(user -> {
            if (!user.isSuspended()) {
                user.setSuspended(true);
                user.setLoggedIn(false);
                userRepository.save(user);
            }
        });
    }

    /**
     * Delete a user from the system.
     */
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}

