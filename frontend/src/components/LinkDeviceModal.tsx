import { apiFetch } from '../api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import Numpad from './Numpad.tsx';

interface LinkDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  terminalId: number | null;
  terminalName: string;
}

const LinkDeviceModal: React.FC<LinkDeviceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  terminalId, 
  terminalName 
}) => {
  const [otp, setOtp] = useState('');
  const [success, setSuccess] = useState(false);
  const [linkedDeviceId, setLinkedDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLink = async (freshOtp?: string) => {
    if (!terminalId) return;
    const otpToSubmit = freshOtp || otp;
    if (!otpToSubmit || otpToSubmit.length < 6) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/terminals/${terminalId}/link-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpToSubmit }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setLinkedDeviceId(data.deviceId || null);
        onSuccess();
      } else {
        setError(data.message || 'Failed to link device');
        setOtp('');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setSuccess(false);
    setLinkedDeviceId(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#001828]">Link Physical Device</h3>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="otp-entry"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6 text-center"
              >
                <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-2">
                  <Wifi size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{terminalName}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the 6-digit OTP shown on the device screen
                  </p>
                </div>

                {/* Step-by-step instructions */}
                <div className="p-4 bg-gray-50 rounded-2xl text-left space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#001828] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
                    <p className="text-xs text-gray-600 leading-relaxed">Power on the ESP32 device and connect it to Wi-Fi</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#001828] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
                    <p className="text-xs text-gray-600 leading-relaxed">A 6-digit OTP will appear on the device display</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#001828] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
                    <p className="text-xs text-gray-600 leading-relaxed">Enter that OTP below to link the device</p>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}

                <Numpad value={otp} onChange={(v) => {
                  setOtp(v);
                  if (v.length === 6) {
                    setTimeout(() => handleLink(v), 100);
                  }
                }} maxLength={6} />

                <button
                  disabled={otp.length < 6 || loading}
                  onClick={() => handleLink()}
                  className="w-full h-14 bg-[#001828] text-white rounded-2xl font-bold shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? 'Linking Device...' : 'Link Device'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 text-center"
              >
                <div className="inline-flex p-4 bg-green-50 text-green-600 rounded-full mb-2">
                  <CheckCircle2 size={40} />
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Device Linked Successfully!</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    The physical device is now paired with <span className="font-semibold">{terminalName}</span>
                  </p>
                </div>

                {linkedDeviceId && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Smartphone size={16} />
                      <span className="font-mono font-medium">{linkedDeviceId}</span>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-green-50/50 rounded-2xl flex gap-3 text-left">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-green-700 leading-relaxed font-medium">
                    The device will automatically receive its API key and restart. It's now ready to scan QR codes and print bills.
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full h-14 bg-[#001828] text-white rounded-2xl font-bold shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LinkDeviceModal;
