import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Plus, 
  MapPin, 
  ShieldCheck, 
  Trash2, 
  Search,
  ExternalLink,
  Info,
  Key,
  Wifi,
  WifiOff,
  LinkIcon,
  Unlink,
  Smartphone
} from 'lucide-react';
import AddTerminalModal from '../components/AddTerminalModal.tsx';
import PinVerificationModal from '../components/PinVerificationModal.tsx';
import LinkDeviceModal from '../components/LinkDeviceModal.tsx';

interface Terminal {
  id: number;
  name: string;
  location: string;
  apiKey: string;
  paired: boolean;
  deviceId: string | null;
  pairedAt: string | null;
}

const Terminals = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/terminals');
      if (response.ok) {
        const data = await response.json();
        setTerminals(data);
      }
    } catch (error) {
      console.error('Failed to fetch terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this terminal?')) {
      try {
        const response = await apiFetch(`/api/terminals/${id}`, { method: 'DELETE' });
        if (response.ok) fetchTerminals();
      } catch (error) {
        console.error('Failed to delete terminal:', error);
      }
    }
  };

  const handleUnpair = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Unpair this device? It will need to be re-paired on next boot.')) {
      try {
        const response = await apiFetch(`/api/terminals/${id}/unpair`, { method: 'POST' });
        if (response.ok) fetchTerminals();
      } catch (error) {
        console.error('Failed to unpair device:', error);
      }
    }
  };

  const pairedCount = terminals.filter(t => t.paired).length;

  const filteredTerminals = terminals.filter(t => {
    const query = (searchQuery || '').toLowerCase();
    return (t.name || '').toLowerCase().includes(query) ||
           (t.location || '').toLowerCase().includes(query);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-inter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b]">Physical Terminals</h1>
          <p className="text-[#64748b] mt-1 font-medium">Manage counter devices and device authentication keys</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#001828] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-[#001828]/20 hover:bg-[#2d1d66] transition-all"
        >
          <Plus size={20} />
          Add Terminal
        </motion.button>
      </div>

      {/* Stats/Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#001828] to-[#3d2b7a] p-6 rounded-3xl text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Monitor size={24} />
            </div>
            <div>
              <p className="text-white/60 text-sm font-medium">Registered Devices</p>
              <p className="text-2xl font-bold">{terminals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${pairedCount > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
            <Wifi size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Paired Devices</p>
            <p className="text-xl font-bold text-gray-900">
              {pairedCount} <span className="text-sm font-medium text-gray-400">/ {terminals.length}</span>
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl flex items-center gap-4 border border-blue-100">
          <Info size={24} className="text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700 font-medium leading-relaxed">
            Power on a device and enter its 6-digit OTP here to pair it with a terminal.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center group focus-within:ring-2 focus-within:ring-[#001828]/10 transition-all">
        <div className="p-3">
          <Search size={20} className="text-gray-400 group-focus-within:text-[#001828] transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search by terminal name or location..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 bg-transparent outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Grid of Terminals */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredTerminals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTerminals.map((terminal) => (
            <motion.div
              layout
              key={terminal.id}
              whileHover={{ y: -5 }}
              onClick={() => {
                setSelectedTerminal(terminal);
                setIsPinModalOpen(true);
              }}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#001828]/5 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Card Background Pattern */}
              <div className="absolute -right-8 -top-8 text-[#001828]/5 rotate-12 transition-transform group-hover:rotate-0 duration-500">
                <Monitor size={140} />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-4 rounded-2xl border transition-colors duration-300 ${
                    terminal.paired 
                      ? 'bg-green-50 text-green-600 border-green-200 group-hover:bg-green-600 group-hover:text-white' 
                      : 'bg-gray-50 text-[#001828] border-gray-200 group-hover:bg-[#001828] group-hover:text-white'
                  }`}>
                    <Monitor size={28} />
                  </div>
                  <div className="flex items-center gap-1">
                    {terminal.paired && (
                      <button
                        onClick={(e) => handleUnpair(terminal.id, e)}
                        title="Unpair device"
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                      >
                        <Unlink size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(terminal.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-gray-900 group-hover:text-[#001828] transition-colors">{terminal.name}</h4>
                  <div className="flex items-center gap-1.5 text-gray-500 mt-1 font-medium text-sm">
                    <MapPin size={14} />
                    <span>{terminal.location}</span>
                  </div>
                </div>

                {/* Device ID for paired terminals */}
                {terminal.paired && terminal.deviceId && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                    <Smartphone size={12} />
                    <span>{terminal.deviceId}</span>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    {terminal.paired ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[12px] font-bold text-green-600 uppercase tracking-wider">Paired</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Unpaired</span>
                      </>
                    )}
                  </div>
                  
                  {terminal.paired ? (
                    <div className="flex items-center gap-2 text-[#001828] font-bold text-sm">
                      <Key size={16} />
                      <span>View API Key</span>
                      <ExternalLink size={14} />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTerminal(terminal);
                        setIsLinkModalOpen(true);
                      }}
                      className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100"
                    >
                      <LinkIcon size={14} />
                      <span>Link Device</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <div className="p-6 bg-white rounded-full shadow-sm mb-4">
            <Monitor size={48} className="text-gray-300" />
          </div>
          <p className="text-lg font-bold text-gray-900">No terminals found</p>
          <p className="text-gray-500 max-w-xs text-center mt-1">Start by adding your first counter device terminal to manage device authentication.</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="mt-6 text-[#001828] font-bold hover:underline underline-offset-4"
          >
            Add your first terminal
          </button>
        </div>
      )}

      {/* Modals */}
      <AddTerminalModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTerminals}
      />

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setSelectedTerminal(null);
        }}
        terminalId={selectedTerminal?.id || null}
        terminalName={selectedTerminal?.name || ''}
      />

      <LinkDeviceModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setSelectedTerminal(null);
        }}
        onSuccess={fetchTerminals}
        terminalId={selectedTerminal?.id || null}
        terminalName={selectedTerminal?.name || ''}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
      ` }} />
    </div>
  );
};

export default Terminals;
