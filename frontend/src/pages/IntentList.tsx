import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import {
  Eye,
  ChevronRight,
  Plus,
  Search,
  ArrowLeft,
  ChevronsRight,
  ChevronLeft,
  RefreshCw,
  X,
  Loader2,
  CheckCircle,
  Trash2,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';

interface IntentListProps {
  title: string;
}

const IntentList: React.FC<IntentListProps> = ({ title }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // New Order Form State
  const initialOrderState = {
    purchaseId: `PO_${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    vendorId: '',
    status: title === 'RECEIVES' ? 'RECEIVED' : 'OPEN',
    discount: 0,
    referenceId: '',
    instruction: '',
    items: [{ productName: '', quantity: 1, rate: 0, total: 0 }]
  };

  const [newOrder, setNewOrder] = useState(initialOrderState);

  useEffect(() => {
    fetchData();
    fetchVendors();
  }, [title]);

  const fetchVendors = async () => {
    try {
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/purchases/vendors`);
      if (response.ok) {
        const result = await response.json();
        setVendors(result);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/purchases/orders`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching intent list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { productName: '', quantity: 1, rate: 0, total: 0 }]
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newOrder.items];
    const item = { ...updatedItems[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      item.total = Number(item.quantity) * Number(item.rate);
    }
    updatedItems[index] = item;
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const calculateTotal = () => {
    return newOrder.items.reduce((sum, item) => sum + item.total, 0) - newOrder.discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...newOrder,
        vendor: { id: parseInt(newOrder.vendorId) },
        amount: calculateTotal(),
        date: new Date(newOrder.date).toISOString()
      };

      const response = await apiFetch(`http://${window.location.hostname}:8080/api/purchases/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewOrder(initialOrderState);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-inter">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-3xl border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center gap-6">
          <button className="p-2.5 bg-gray-50 rounded-xl text-[#003317] hover:bg-[#003317] hover:text-white transition-all shadow-sm">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-black text-[#003317] uppercase tracking-wider">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {title === 'RECEIVES' && (
            <button className="bg-[#003317] text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-[#003317]/20 hover:bg-[#1e4e8c] transition-all">
              Summary
            </button>
          )}
          <div className="relative">
            <select className="bg-gray-50 border border-[#e2e8f0] rounded-2xl px-5 py-2.5 text-xs font-bold text-[#64748b] outline-none appearance-none min-w-[150px] cursor-pointer focus:bg-white focus:ring-2 focus:ring-[#003317]/10">
              <option>Status</option>
              <option>Approved</option>
              <option>Pending</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2.5 bg-[#003317] text-white rounded-xl shadow-lg shadow-[#003317]/20 hover:scale-105 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-[#e2e8f0] shadow-xl shadow-indigo-500/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Purchase ID</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Date</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Status</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Amount (₹)</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Store name</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Request status</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] relative">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <RefreshCw className="animate-spin text-[#003317] mx-auto mb-2" size={32} />
                    <p className="text-sm font-bold text-[#64748b]">Fetching orders...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-[#94a3b8]">
                    <ShoppingBag className="mx-auto mb-4 opacity-10" size={64} />
                    <p className="text-sm font-bold uppercase tracking-widest">No orders found</p>
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#1e293b]">{row.purchaseId || row.id}</span>
                        <ChevronsRight size={12} className="text-[#cbd5e1] group-hover:text-[#003317] transition-colors" />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-semibold text-[#64748b]">
                      {row.date ? new Date(row.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${row.status === 'CLOSE' || row.status === 'CLOSED' ? 'text-[#ef4444] bg-[#fee2e2]' : 'text-blue-600 bg-blue-50'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs font-black text-[#1e293b]">₹{row.amount?.toLocaleString()}</td>
                    <td className="px-8 py-6 text-xs font-bold text-[#64748b]">{row.storeName || 'Main Store'}</td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-[#10b981] bg-[#dcfce7] px-2.5 py-1 rounded-md uppercase tracking-wider">APPROVED</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button className="p-2 text-[#94a3b8] hover:bg-[#003317] hover:text-white rounded-lg transition-all">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-[#94a3b8] hover:bg-gray-100 rounded-lg transition-all">
                          <ChevronsRight size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-gray-50/50 px-8 py-4 border-t border-[#f1f5f9] flex items-center justify-end gap-8">
          <div className="flex items-center gap-3 text-xs font-bold text-[#64748b]">
            <span>Rows per page:</span>
            <select className="bg-transparent border-0 font-black text-[#1e293b] outline-none cursor-pointer">
              <option>10</option>
              <option>20</option>
            </select>
          </div>
          <div className="text-xs font-bold text-[#64748b]">
            1-5 of 5
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 text-[#cbd5e1] cursor-not-allowed"><ChevronLeft size={18} /></button>
            <button className="p-1 text-[#cbd5e1] cursor-not-allowed"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Modern Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#003317]/30 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-white/20"
          >
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-[#f1f5f9] flex justify-between items-center bg-gray-50/30">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-[#003317] to-[#1e4e8c] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#003317]/20">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">Create {title === 'RECEIVES' ? 'Receive' : 'Purchase'} Order</h2>
                  <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">New Intent Entry • Draft Status</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setNewOrder(initialOrderState); }}
                className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all border border-transparent hover:border-[#f1f5f9] group"
              >
                <X size={20} className="text-[#64748b] group-hover:text-[#ef4444]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Order ID</label>
                  <input type="text" value={newOrder.purchaseId} readOnly className="w-full px-5 py-3.5 bg-gray-50 border border-[#e2e8f0] rounded-2xl text-sm font-black text-[#003317] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Date</label>
                  <input type="date" value={newOrder.date} onChange={e => setNewOrder({ ...newOrder, date: e.target.value })} className="w-full px-5 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-sm font-bold text-[#1e293b] outline-none focus:ring-4 focus:ring-[#003317]/5 focus:border-[#003317] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Select Vendor</label>
                  <select
                    required
                    value={newOrder.vendorId}
                    onChange={e => setNewOrder({ ...newOrder, vendorId: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-sm font-bold text-[#1e293b] outline-none focus:ring-4 focus:ring-[#003317]/5 focus:border-[#003317] transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Choose Supplier</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Status</label>
                  <div className="px-5 py-3.5 bg-[#dcfce7] border border-[#10b981]/20 rounded-2xl text-[11px] font-black text-[#10b981] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    {newOrder.status}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-[#1e293b] uppercase tracking-[0.2em]">Order Line Items</h3>
                  <button type="button" onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-[#003317]/5 text-[#003317] rounded-xl text-[11px] font-black hover:bg-[#003317] hover:text-white transition-all">
                    <Plus size={14} /> Add Product
                  </button>
                </div>

                <div className="border border-[#e2e8f0] rounded-[2rem] overflow-hidden bg-gray-50/30">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-[#e2e8f0]">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Product / Material Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest w-32 text-center">Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest w-40">Rate (₹)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest w-40">Subtotal</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {newOrder.items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-white transition-colors">
                          <td className="px-6 py-4">
                            <input type="text" placeholder="Start typing product name..." value={item.productName} onChange={e => handleItemChange(idx, 'productName', e.target.value)} className="w-full bg-transparent text-sm font-bold text-[#1e293b] outline-none placeholder:text-[#cbd5e1]" />
                          </td>
                          <td className="px-6 py-4">
                            <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value))} className="w-full bg-transparent text-sm font-black text-[#1e293b] outline-none text-center" />
                          </td>
                          <td className="px-6 py-4">
                            <input type="number" step="0.01" value={item.rate} onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value))} className="w-full bg-transparent text-sm font-bold text-[#1e293b] outline-none" />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-[#003317]">₹{item.total.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <button type="button" onClick={() => setNewOrder({ ...newOrder, items: newOrder.items.filter((_, i) => i !== idx) })} className="p-2 text-[#cbd5e1] hover:text-[#ef4444] transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Section: Notes & Totals */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-4">
                <div className="md:col-span-7 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Reference ID / PO Number</label>
                    <input type="text" value={newOrder.referenceId} onChange={e => setNewOrder({ ...newOrder, referenceId: e.target.value })} className="w-full px-5 py-4 bg-white border border-[#e2e8f0] rounded-2xl text-sm font-bold outline-none focus:border-[#003317] transition-all" placeholder="Enter external reference number if any..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Special Instructions</label>
                    <textarea rows={3} value={newOrder.instruction} onChange={e => setNewOrder({ ...newOrder, instruction: e.target.value })} className="w-full px-5 py-4 bg-white border border-[#e2e8f0] rounded-2xl text-sm font-bold outline-none focus:border-[#003317] transition-all resize-none" placeholder="Add any specific delivery or quality requirements..." />
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col justify-end">
                  <div className="bg-[#1e293b] rounded-[2.5rem] p-8 text-white space-y-5 shadow-2xl shadow-[#1e293b]/20">
                    <div className="flex justify-between items-center text-xs opacity-60 font-bold uppercase tracking-wider">
                      <span>Order Subtotal</span>
                      <span>₹{newOrder.items.reduce((s, i) => s + i.total, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-60 font-bold uppercase tracking-wider">Adjustment / Discount</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#ef4444] font-black">-</span>
                        <input type="number" value={newOrder.discount} onChange={e => setNewOrder({ ...newOrder, discount: parseFloat(e.target.value) || 0 })} className="w-24 text-right bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-black text-white outline-none focus:bg-white/20 transition-all" />
                      </div>
                    </div>
                    <div className="h-[1px] bg-white/10 my-2"></div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] opacity-40 font-black uppercase tracking-[0.2em] mb-1">Grand Payable</p>
                        <p className="text-3xl font-black tracking-tighter">₹{calculateTotal().toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] opacity-40 font-black uppercase tracking-[0.2em] mb-1">Total Items</p>
                        <p className="text-xl font-black">{newOrder.items.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setNewOrder(initialOrderState); }}
                  className="px-10 py-5 border-2 border-[#f1f5f9] text-[#64748b] font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
                >
                  Discard Draft
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-10 py-5 bg-gradient-to-r from-[#003317] to-[#1e4e8c] text-white font-black rounded-2xl shadow-2xl shadow-[#003317]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[11px]"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <CheckCircle size={18} />
                      Finalize & Confirm Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IntentList;
