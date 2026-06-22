import { apiFetch } from '../api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, MapPin, Lock } from 'lucide-react';
import Numpad from './Numpad.tsx';

interface AddTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddTerminalModal: React.FC<AddTerminalModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); // 1: Details, 2: PIN
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location, pin }),
      });
      if (response.ok) {
        onSuccess();
        reset();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create terminal:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setName('');
    setLocation('');
    setPin('');
    setStep(1);
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
          <h3 className="text-xl font-bold text-[#001828]">Register New Terminal</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Monitor size={16} className="text-[#001828]" /> Terminal Name
                  </label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Counter 1"
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#001828]/20 focus:border-[#001828] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin size={16} className="text-[#001828]" /> Location
                  </label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Main Entrance"
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#001828]/20 focus:border-[#001828] outline-none transition-all"
                  />
                </div>

                <button
                  disabled={!name || !location}
                  onClick={() => setStep(2)}
                  className="w-full h-14 bg-[#001828] text-white rounded-2xl font-bold shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Set Security PIN
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <div className="inline-flex p-3 bg-purple-50 text-[#001828] rounded-2xl mb-3">
                    <Lock size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Create Security PIN</h4>
                  <p className="text-sm text-gray-500">This PIN is required to access the API Key</p>
                </div>

                <Numpad value={pin} onChange={setPin} maxLength={4} />

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 h-14 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={pin.length < 4 || loading}
                    onClick={handleSubmit}
                    className="flex-[2] h-14 bg-[#001828] text-white rounded-2xl font-bold shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {loading ? 'Registering...' : 'Register Terminal'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AddTerminalModal;
