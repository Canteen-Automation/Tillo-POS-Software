import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User as UserIcon, Lock, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ritLogo from '../assets/RIT_Logo.png';
import './LoginScreen.css';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { checkUserExists, login, register } = useAuth();

  const [step, setStep] = useState<'mobile' | 'pin' | 'register'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await checkUserExists(mobileNumber);
    setIsLoading(false);

    if (result.success) {
      if (result.userExists) {
        setStep('pin');
      } else {
        setStep('register');
      }
    } else {
      setError(result.message);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await login(mobileNumber, pin);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else if (result.isSuspended) {
      setIsSuspended(true);
    } else {
      setError(result.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      setError('Please enter a valid name');
      return;
    }
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await register(mobileNumber, name, pin);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="container login-page">
      <div className="mesh-gradient-bg"></div>

      <div className="login-content">
        <div className="login-card animate-slideUp">
          <div className="login-header-logo">
            <img src={ritLogo} alt="RIT Logo" className="rit-logo" />
          </div>

          <div className="login-header">
            {step !== 'mobile' && (
              <button
                className="step-back-btn"
                onClick={() => setStep('mobile')}
                disabled={isLoading}
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="login-title">
              {step === 'mobile' ? 'Welcome!' : step === 'pin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="login-subtitle">
              {step === 'mobile'
                ? 'Enter your mobile number to get started'
                : step === 'pin'
                  ? `Enter PIN for ${mobileNumber}`
                  : 'Enter your details to register'}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {step === 'mobile' && (
            <form className="login-form" onSubmit={handleMobileSubmit}>
              <div className="form-group">
                <label>Mobile Number</label>
                <div className="input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button className="login-button" type="submit" disabled={isLoading || mobileNumber.length !== 10}>
                {isLoading ? <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div> : 'Continue'}
              </button>
            </form>
          )}

          {step === 'pin' && (
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Security PIN</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>
              <button className="login-button" type="submit" disabled={isLoading || pin.length !== 6}>
                {isLoading ? <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div> : 'Verify & Login'}
              </button>
              <button
                className="back-to-mobile"
                type="button"
                onClick={() => setStep('mobile')}
                disabled={isLoading}
              >
                Use different mobile number
              </button>
            </form>
          )}

          {step === 'register' && (
            <form className="login-form" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <UserIcon size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="What should we call you?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Create PIN</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    placeholder="Choose a 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button className="login-button" type="submit" disabled={isLoading || name.length < 2 || pin.length !== 6}>
                {isLoading ? <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div> : 'Complete Registration'}
              </button>
              <button
                className="back-to-mobile"
                type="button"
                onClick={() => setStep('mobile')}
                disabled={isLoading}
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        <div className="login-footer-info">
          <p>© 2026 Rajalakshmi Institute of Technology</p>
          <p>Tillo Canteen Management System</p>
        </div>
      </div>

      {isSuspended && (
        <div className="suspension-overlay">
          <div className="suspension-modal animate-zoomIn">
            <div className="suspension-icon">
              <Lock size={40} />
            </div>
            <h2>Account Suspended</h2>
            <p>Your access to the Tillo Canteen system has been restricted by an administrator.</p>
            <div className="suspension-details">
              <span>Please contact the Admin or Manager to resolve this issue.</span>
            </div>
            <button className="suspension-close-btn" onClick={() => setIsSuspended(false)}>
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
