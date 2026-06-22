import { apiFetch } from '../api';
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, RefreshCw, Edit2, Package, Image as ImageIcon, 
  Clock, Check, Trash2, Rocket, ArrowRight, AlertCircle
} from 'lucide-react';

interface ProductSession {
  id?: number;
  dayOfWeek: string;
  active: boolean;
  startTime: string;
  endTime: string;
}

interface Product {
  id?: number;
  productId: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  price: number;
  offerPrice: number;
  discountPercent: number;
  discountAmount: number;
  counter: string;
  tag: string;
  parcelCharges: number;
  barcode: string;
  attributesOptional: boolean;
  veg: boolean;
  hasAllergy: boolean;
  parcelNotAllowed: boolean;
  sessionOptional: boolean;
  sessions: ProductSession[];
  imageData: string;
  active: boolean;
  stock: number;
  stalls?: { id: number; name: string }[];
}

interface Stall {
  id: number;
  name: string;
}

interface BaseItem {
  id: number;
  name: string;
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const getDefaultSessions = (): ProductSession[] => 
  DAYS.map(day => ({ dayOfWeek: day, active: true, startTime: '00:00', endTime: '23:59' }));

const NewArrivals: React.FC = () => {
  const [drafts, setDrafts] = useState<Product[]>([]);
  const [baseItems, setBaseItems] = useState<BaseItem[]>([]);
  const [allStalls, setAllStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [formData, setFormData] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDrafts();
    fetchMetadata();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/products/drafts');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [stallsRes, itemsRes] = await Promise.all([
        apiFetch('/api/stalls'),
        apiFetch('/api/base-items?size=100')
      ]);
      setAllStalls(await stallsRes.json());
      const itemsData = await itemsRes.json();
      setBaseItems(itemsData.content || itemsData);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      ...product,
      sessions: product.sessions && product.sessions.length > 0 ? product.sessions : getDefaultSessions()
    });
    setShowModal(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.id) return;

    setIsSaving(true);
    try {
      const response = await apiFetch(`/api/products/${formData.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowModal(false);
        setFormData(null);
        fetchDrafts();
      }
    } catch (error) {
      console.error('Error publishing product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this draft product?')) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageData: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSession = (index: number, updates: Partial<ProductSession>) => {
    if (!formData) return;
    const newSessions = [...formData.sessions];
    newSessions[index] = { ...newSessions[index], ...updates };
    setFormData({ ...formData, sessions: newSessions });
  };

  return (
    <div className="p-8 font-inter bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-10 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#001828] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#001828]/20">
                <Rocket className="text-white w-7 h-7" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-[#1e293b] tracking-tight">New Arrivals</h1>
                <p className="text-sm font-medium text-[#64748b]">Configure and publish incoming procurement stock to your live store</p>
            </div>
        </div>
        <button onClick={fetchDrafts} className="p-3 text-[#64748b] hover:bg-white hover:text-[#001828] rounded-2xl transition-all border border-transparent hover:border-[#e2e8f0] shadow-sm">
          <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4">
                <RefreshCw className="animate-spin text-[#001828]" size={40} />
                <p className="text-[#64748b] font-bold uppercase tracking-widest text-xs">Fetching Drafts...</p>
             </div>
        ) : drafts.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-[#e2e8f0] p-24 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="text-gray-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#1e293b] mb-2">Clean Slate</h3>
                <p className="text-[#64748b] max-w-sm mx-auto">All incoming stock has been processed. New drafts will appear here once you mark vendor orders as received.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drafts.map((draft) => (
                    <div key={draft.id} className="group bg-white rounded-[2rem] border border-[#e2e8f0] shadow-sm hover:shadow-2xl hover:shadow-[#001828]/10 transition-all duration-500 overflow-hidden flex flex-col">
                        <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {draft.imageData ? (
                                <img src={draft.imageData} alt={draft.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-[#94a3b8]">
                                    <ImageIcon size={40} strokeWidth={1} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-[#001828]/90 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider">Draft Arrival</span>
                            </div>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-[#1e293b] mb-1">{draft.name}</h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                                <Package size={14} />
                                <span>{draft.stock} Units Arrived</span>
                            </div>
                            
                            <div className="mt-auto pt-6 border-t border-[#f1f5f9] flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Procurement Rate</span>
                                    <span className="text-base font-black text-[#001828]">₹{draft.basePrice || 0}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleDelete(draft.id!)}
                                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleEdit(draft)}
                                        className="px-5 py-2.5 bg-[#001828] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#342475] transition-all shadow-lg shadow-[#001828]/20"
                                    >
                                        Edit & Publish <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Draft Configuration Modal */}
      {showModal && formData && (
        <div className="fixed inset-0 bg-[#001828]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in duration-300">
            <div className="px-10 py-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#001828] text-white rounded-xl">
                      <Edit2 size={24} />
                  </div>
                  <div>
                      <h2 className="text-xl font-black text-[#1e293b]">Finalize Product</h2>
                      <p className="text-xs font-medium text-[#64748b]">Configure your latest arrival for the live menu</p>
                  </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-[#64748b]"><X size={24} /></button>
            </div>
            
            <form onSubmit={handlePublish} className="p-10 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Product Name</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 bg-white border-2 border-gray-50 focus:border-[#001828]/20 rounded-2xl text-sm font-bold outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Category</label>
                    <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-5 py-4 bg-white border-2 border-gray-50 focus:border-[#001828]/20 rounded-2xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer">
                      <option value="">Select Category</option>
                      {baseItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Live Selling Price (R)</label>
                    <input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 bg-[#001828]/5 border-2 border-transparent focus:border-[#001828]/20 rounded-2xl text-lg font-black text-[#001828] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Stall Association</label>
                    <select 
                      required
                      value={formData.counter} 
                      onChange={(e) => {
                        const stallName = e.target.value;
                        const selectedStall = allStalls.find(s => s.name === stallName);
                        setFormData({ 
                          ...formData, 
                          counter: stallName,
                          stalls: selectedStall ? [{ id: selectedStall.id, name: selectedStall.name }] : []
                        });
                      }} 
                      className="w-full px-5 py-4 bg-white border-2 border-gray-50 focus:border-[#001828]/20 rounded-2xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Choose Stall</option>
                      {allStalls.map(stall => (
                        <option key={stall.id} value={stall.name}>{stall.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Arrived Stock</label>
                            <input type="number" readOnly value={formData.stock} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Unit Rate</label>
                            <input type="number" readOnly value={formData.basePrice} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Barcode</label>
                        <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-5 py-4 bg-white border-2 border-gray-50 focus:border-[#001828]/20 rounded-2xl text-sm font-bold outline-none" placeholder="Scan or type..." />
                    </div>
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                        <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-[11px] font-black text-amber-600 uppercase tracking-wider mb-1">Configuration Required</p>
                            <p className="text-[12px] text-amber-700 leading-snug">Associate this item with a stall and session before publishing to the ordering site.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-[#64748b] mb-2 tracking-widest ml-1">Product Media</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#e2e8f0] rounded-3xl p-6 flex flex-col items-center justify-center text-[#94a3b8] hover:border-[#001828]/30 hover:bg-gray-50 transition-all cursor-pointer h-64 overflow-hidden shadow-inner bg-gray-50"
                    >
                      {formData.imageData ? (
                        <img src={formData.imageData} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
                              <ImageIcon size={32} className="text-[#cbd5e1]" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Upload Product Image</p>
                          <p className="text-[10px] text-[#cbd5e1] mt-1">PNG, JPG, HEIC up to 2MB</p>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4 p-8 bg-[#001828]/5 rounded-[2rem] border border-[#001828]/10">
                  <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-black text-[#001828] uppercase tracking-wider">Availability Settings</h3>
                          <button type="button" onClick={() => setFormData({ ...formData, sessionOptional: !formData.sessionOptional })} className={`w-12 h-6.5 rounded-full relative transition-all ${formData.sessionOptional ? 'bg-[#001828]' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-4.5 h-4.5 bg-white rounded-full transition-transform ${formData.sessionOptional ? 'translate-x-5.5' : ''}`} /></button>
                      </div>
                      <p className="text-xs text-[#64748b] mb-4">Control which times of day this product is visible to customers.</p>
                      {formData.sessionOptional && (
                        <button type="button" onClick={() => setShowSessionModal(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-[#001828]/20 text-[#001828] text-xs font-black rounded-xl hover:bg-white shadow-sm transition-all"><Clock size={16} /> Advanced Session Configuration</button>
                      )}
                  </div>
                  <div className="w-[1px] bg-[#001828]/10 mx-6"></div>
                  <div className="flex-1 flex flex-col justify-center">
                    <button type="submit" disabled={isSaving} className="w-full py-5 bg-[#001828] text-white font-black rounded-2xl shadow-2xl shadow-[#001828]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                        {isSaving ? <RefreshCw className="animate-spin" /> : <><Rocket size={22} /> Publish to Live Store</>}
                    </button>
                  </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal (Reused from Products.tsx) */}
      {showSessionModal && formData && (
        <div className="fixed inset-0 bg-[#001828]/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12">
              <h2 className="text-2xl font-black text-[#1e293b] text-center mb-10 tracking-tight">Weekly Availability Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto px-4 custom-scrollbar">
                {formData.sessions.map((session, index) => (
                  <div key={session.dayOfWeek} className={`p-6 rounded-3xl border-2 transition-all ${session.active ? 'border-[#001828]/20 bg-[#001828]/5' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-lg font-black text-[#001828]">{session.dayOfWeek}</span>
                      <div 
                        onClick={() => updateSession(index, { active: !session.active })}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer transition-all ${session.active ? 'bg-[#001828]' : 'border-2 border-gray-200 bg-white'}`}
                      >
                        {session.active && <Check size={16} className="text-white" strokeWidth={4} />}
                      </div>
                    </div>
                    
                    <div className={`grid grid-cols-2 gap-4 ${!session.active ? 'opacity-20 pointer-events-none' : ''}`}>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Start</label>
                        <input 
                          type="time" 
                          value={session.startTime} 
                          onChange={(e) => updateSession(index, { startTime: e.target.value })}
                          className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] outline-none shadow-sm" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">End</label>
                        <input 
                          type="time" 
                          value={session.endTime} 
                          onChange={(e) => updateSession(index, { endTime: e.target.value })}
                          className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm font-bold text-[#1e293b] outline-none shadow-sm" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-4 mt-12">
                <button onClick={() => setShowSessionModal(false)} className="px-12 py-4 bg-[#001828] text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all">Confirm Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      ` }} />
    </div>
  );
};

export default NewArrivals;
