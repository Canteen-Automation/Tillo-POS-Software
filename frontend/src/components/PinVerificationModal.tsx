import { apiFetch } from '../api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import Numpad from './Numpad.tsx';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalId: number | null;
  terminalName: string;
}

const PinVerificationModal: React.FC<PinVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  terminalId, 
  terminalName 
}) => {
  const [pin, setPin] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async (freshPin?: string) => {
    if (!terminalId) return;
    const pinToVerify = freshPin || pin;
    if (!pinToVerify || pinToVerify.length < 4) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/terminals/${terminalId}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToVerify }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setApiKey(data.apiKey);
      } else {
        setError(data.message || 'Verification failed');
        setPin('');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setPin('');
    setApiKey(null);
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
          <h3 className="text-xl font-bold text-[#001828]">Security Authentication</h3>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!apiKey ? (
              <motion.div
                key="verification"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6 text-center"
              >
                <div className="inline-flex p-4 bg-orange-50 text-orange-600 rounded-2xl mb-2">
                  <Lock size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{terminalName}</h4>
                  <p className="text-sm text-gray-500 mt-1">Enter your 4-digit security PIN to view the API Key</p>
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

                <Numpad value={pin} onChange={(v) => {
                  setPin(v);
                  if (v.length === 4) {
                    // Slight delay for visual feedback of the last dot
                    setTimeout(() => handleVerify(v), 100);
                  }
                }} maxLength={4} />

                <button
                  disabled={pin.length < 4 || loading}
                  onClick={() => handleVerify()}
                  className="w-full h-14 bg-[#001828] text-white rounded-2xl font-bold shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? 'Verifying...' : 'Verify PIN'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 text-center"
              >
                <div className="inline-flex p-4 bg-green-50 text-green-600 rounded-full mb-2">
                  <CheckCircle2 size={40} />
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Authentication Successful</h4>
                  <p className="text-sm text-gray-500 mt-1">Below is the API key for physical device integration</p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-[#001828] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative p-5 bg-gray-50 border border-gray-200 rounded-2xl break-all font-mono text-sm text-[#001828] flex items-center justify-between gap-4">
                    <span className="text-left">{apiKey}</span>
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm shrink-0"
                    >
                      {copied ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} className="text-[#001828]" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl flex gap-3 text-left">
                  <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
                    This API key allows the terminal to communicate with the central server. Keep it secure and never share it publicly.
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full h-14 bg-[#001828] text-white rounded-2xl font-bold shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                   Close Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PinVerificationModal;
