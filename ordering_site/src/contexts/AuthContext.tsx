import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkUserExists: (mobileNumber: string) => Promise<{ success: boolean; userExists: boolean; message: string }>;
  login: (mobileNumber: string, pin: string) => Promise<{ success: boolean; message: string; isSuspended?: boolean }>;
  register: (mobileNumber: string, name: string, pin: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  changePin: (currentPin: string, newPin: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (name: string, mobileNumber: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = `http://${window.location.hostname}:8080/api/auth`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const checkUserExists = async (mobileNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/check`, { cache: 'no-store',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, userExists: false, message: 'Network error. Please try again.' };
    }
  };

  const login = async (mobileNumber: string, pin: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, { cache: 'no-store',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, pin }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Login failed', isSuspended: data.suspended || data.isSuspended };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const register = async (mobileNumber: string, name: string, pin: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, { cache: 'no-store',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, name, pin }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    if (user) {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE_URL}/logout`, { cache: 'no-store',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ mobileNumber: user.mobileNumber }),
      });
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const changePin = async (currentPin: string, newPin: string) => {
    if (!user) return { success: false, message: 'Not logged in' };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/change-pin`, { cache: 'no-store',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ mobileNumber: user.mobileNumber, currentPin, newPin }),
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const updateProfile = async (name: string, mobileNumber: string) => {
    if (!user) return { success: false, message: 'Not logged in' };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, { cache: 'no-store',
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name, mobileNumber }),
      });
      
      if (response.ok) {
        const updatedUserDto = await response.json();
        const updatedUser: User = {
          id: updatedUserDto.id,
          name: updatedUserDto.name,
          mobileNumber: updatedUserDto.mobileNumber,
          isLoggedIn: updatedUserDto.loggedIn,
          isSuspended: updatedUserDto.suspended,
          ritzTokenBalance: updatedUserDto.ritzTokenBalance
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, message: 'Profile updated successfully' };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Failed to update profile' };
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/${user.mobileNumber}`, { 
        cache: 'no-store',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        const updatedUser: User = {
          id: data.id,
          name: data.name,
          mobileNumber: data.mobileNumber,
          isLoggedIn: data.isLoggedIn || data.loggedIn || true,
          isSuspended: data.isSuspended || data.suspended,
          ritzTokenBalance: data.ritzTokenBalance
        };
        
        // Update state and localStorage
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else if (response.status === 404 || response.status === 401 || response.status === 403) {
        logout();
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Background status and balance sync
  useEffect(() => {
    if (!user) return;

    const syncUserStatus = async () => {
      await refreshUser();
    };

    const intervalId = setInterval(syncUserStatus, 30000); // Sync every 30 seconds
    return () => clearInterval(intervalId);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, checkUserExists, login, register, logout, changePin, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
