import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Eye, Plus, X, Loader2, CheckCircle, Trash2, Edit2 } from 'lucide-react';

interface PurchaseOrderItem {
  productName: string;
  quantity: number;
  rate: number;
  total: number;
}

interface PurchaseOrder {
  id: number;
  purchaseId: string;
  date: string;
  vendor: { id: number; name: string };
  amount: number;
  paidTotal: number;
  status: 'OPEN' | 'TRANSIT' | 'CANCELLED' | 'BILLED' | 'RECEIVED' | 'PARTIALLY PAID' | 'CLOSE';
  referenceId: string;
  items: PurchaseOrderItem[];
}

const Purchases: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<{id: number, name: string}[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [activeHistoryOrder, setActiveHistoryOrder] = useState<PurchaseOrder | null>(null);
  
  // New Order Form State
  const initialOrderState = {
    purchaseId: `PO_${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    vendorId: '',
    status: 'OPEN',
    discount: 0,
    referenceId: '',
    instruction: '',
    items: [{ productName: '', quantity: 1, rate: 0, total: 0 }]
  };

  const [newOrder, setNewOrder] = useState(initialOrderState);

  useEffect(() => {
    fetchOrders();
    fetchVendors();
    fetchProducts();
    
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.product-search-container')) {
        setActiveSearchIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/purchases/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await apiFetch('/api/purchases/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiFetch('/api/products?size=1000');
      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data.content || data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { productName: '', quantity: 1, rate: 0, total: 0 }]
    });
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setNewOrder(prev => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index], [field]: value };
      if (field === 'quantity' || field === 'rate' || field === 'productName') {
        item.total = Number(item.quantity) * Number(item.rate);
      }
      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const handleProductSelect = (index: number, product: any) => {
    setNewOrder(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        productName: product.name,
        rate: product.basePrice || 0,
        total: Number(updatedItems[index].quantity) * Number(product.basePrice || 0)
      };
      return { ...prev, items: updatedItems };
    });
    setActiveSearchIdx(null);
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
        id: editingOrder?.id,
        vendor: { id: parseInt(newOrder.vendorId) },
        amount: calculateTotal(),
        date: new Date(newOrder.date).toISOString()
      };

      const response = await apiFetch('/api/purchases/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowAddModal(false);
        setEditingOrder(null);
        setNewOrder(initialOrderState);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOrder = async (id: number) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
        await apiFetch(`/api/purchases/orders/${id}`, { method: 'DELETE' });
        fetchOrders();
    } catch (error) {
        console.error('Error deleting order:', error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'TRANSIT': return 'bg-indigo-100 text-indigo-700';
      case 'BILLED': return 'bg-amber-100 text-amber-700';
      case 'RECEIVED': return 'bg-emerald-100 text-emerald-700';
      case 'PARTIALLY PAID': return 'bg-violet-100 text-violet-700';
      case 'CLOSE': return 'bg-gray-100 text-gray-700';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const response = await apiFetch(`/api/purchases/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...order, status: newStatus })
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setNewOrder({
      purchaseId: order.purchaseId,
      date: order.date.split('T')[0],
      vendorId: order.vendor.id.toString(),
      status: order.status,
      discount: 0, // We should ideally store discount in DB too, but for now 0
      referenceId: order.referenceId || '',
      instruction: '', // Same for instruction
      items: order.items.map(item => ({...item}))
    });
    setShowAddModal(true);
  };

  const fetchOrderHistory = async (order: PurchaseOrder) => {
    try {
      setActiveHistoryOrder(order);
      const response = await apiFetch(`/api/purchases/orders/${order.id}/history`);
      if (response.ok) {
        const data = await response.json();
        setOrderHistory(data);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-8 gap-8 font-inter overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px]">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#001828] rounded-xl flex items-center justify-center shadow-lg shadow-[#001828]/20">
            <ShoppingCart className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Purchase Orders</h1>
            <p className="text-sm text-[#64748b]">Track and manage your inventory procurement</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddModal(true)}
            title="Create a new procurement order"
            className="px-5 py-2.5 bg-[#001828] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
          >
            <Plus size={18} />
            Create Purchase
          </button>
          
          <div className="relative group min-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
            <input 
              type="text" 
              placeholder="Search purchases..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#001828]/30 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-[#e2e8f0]">
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Purchase ID</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Reference ID</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {isLoading ? (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                        <Loader2 className="animate-spin inline-block mr-2" /> Loading records...
                    </td>
                </tr>
              ) : orders.filter(o => (o.purchaseId || '').toLowerCase().includes((searchTerm || '').toLowerCase())).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-all font-medium">
                  <td className="px-6 py-4 text-sm font-bold text-[#001828]">{order.purchaseId}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-bold">
                        {order.vendor.name.charAt(0)}
                      </div>
                      <span className="text-sm text-[#1e293b]">{order.vendor.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#1e293b]">₹{order.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none border-none cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="TRANSIT">TRANSIT</option>
                      <option value="BILLED">BILLED</option>
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="PARTIALLY PAID">PARTIALLY PAID</option>
                      <option value="CLOSE">CLOSE</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-[#64748b] font-mono">
                    {order.referenceId || `Pur_${Math.random().toString(36).substring(2, 10).toUpperCase()}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => fetchOrderHistory(order)}
                            title="View audit history of price changes"
                            className="p-2 text-[#94a3b8] hover:text-[#001828] hover:bg-indigo-50 rounded-lg transition-all"
                        >
                            <Eye size={18} />
                        </button>
                        <button 
                            onClick={() => handleEditOrder(order)}
                            title="Edit purchase order details"
                            className="p-2 text-[#94a3b8] hover:text-[#001828] hover:bg-indigo-50 rounded-lg transition-all"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => deleteOrder(order.id)} 
                            title="Delete this purchase order permanently"
                            className="p-2 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#001828]/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#001828] rounded-xl flex items-center justify-center text-white">
                  {editingOrder ? <ShoppingCart size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1e293b]">{editingOrder ? 'Edit Purchase Order' : 'Create New Purchase'}</h2>
                  <p className="text-xs text-[#64748b]">{editingOrder ? 'Update terms or quantities' : 'Draft a new inventory procurement order'}</p>
                </div>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingOrder(null); setNewOrder(initialOrderState); }} title="Close window" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-[#64748b]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Purchase ID</label>
                  <input type="text" value={newOrder.purchaseId} readOnly className="w-full px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl text-sm font-bold text-[#001828] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Date</label>
                  <input type="date" value={newOrder.date} onChange={e => setNewOrder({...newOrder, date: e.target.value})} className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#001828]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Vendor</label>
                  <select 
                    required
                    value={newOrder.vendorId} 
                    onChange={e => setNewOrder({...newOrder, vendorId: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#001828]"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Status</label>
                  <select value={newOrder.status} onChange={e => setNewOrder({...newOrder, status: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#001828]">
                    <option value="OPEN">OPEN</option>
                    <option value="TRANSIT">TRANSIT</option>
                    <option value="BILLED">BILLED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="PARTIALLY PAID">PARTIALLY PAID</option>
                    <option value="CLOSE">CLOSE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">Order Items</h3>
                    <button type="button" onClick={handleAddItem} className="text-xs font-bold text-[#001828] hover:underline flex items-center gap-1">
                        <Plus size={14} /> Add Item
                    </button>
                </div>
                
                <div className="border border-[#e2e8f0] rounded-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-[#e2e8f0]">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-black text-[#64748b] uppercase">Product Name</th>
                                <th className="px-4 py-3 text-[10px] font-black text-[#64748b] uppercase w-32">Quantity</th>
                                <th className="px-4 py-3 text-[10px] font-black text-[#64748b] uppercase w-40">Rate</th>
                                <th className="px-4 py-3 text-[10px] font-black text-[#64748b] uppercase w-40">Total</th>
                                <th className="px-4 py-3 text-[10px] font-black text-[#64748b] uppercase w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {newOrder.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 relative product-search-container">
                                        <input 
                                            type="text" 
                                            placeholder="Search or type product..." 
                                            value={item.productName} 
                                            onChange={e => handleItemChange(idx, 'productName', e.target.value)} 
                                            onFocus={() => setActiveSearchIdx(idx)}
                                            className="w-full bg-transparent text-sm font-bold outline-none" 
                                        />
                                        {activeSearchIdx === idx && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-2xl z-[150] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                                {availableProducts
                                                    .filter(p => {
                                                        const name = p.name || '';
                                                        const query = (item.productName || '').toLowerCase();
                                                        return name.toLowerCase().includes(query);
                                                    })
                                                    .slice(0, 10)
                                                    .map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevent focus loss
                                                                handleProductSelect(idx, p);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex flex-col transition-colors border-b border-[#f1f5f9] last:border-0"
                                                        >
                                                            <span className="text-sm font-bold text-[#1e293b]">{p.name}</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">{p.category || 'No Category'}</span>
                                                                <span className="text-[10px] font-bold text-[#001828]">Cost: ₹{p.basePrice || 0}</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                }
                                                {item.productName && !availableProducts.some(p => p.name.toLowerCase() === item.productName.toLowerCase()) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSearchIdx(null)}
                                                        className="w-full text-left px-4 py-3 hover:bg-amber-50 flex items-center gap-3 transition-colors text-amber-600"
                                                    >
                                                        <Plus size={16} />
                                                        <span className="text-sm font-bold">Order "{item.productName}" as new item</span>
                                                    </button>
                                                )}
                                                {availableProducts.length === 0 && (
                                                    <div className="px-4 py-3 text-xs text-[#64748b] italic">No existing products found</div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value))} className="w-full bg-transparent text-sm font-bold outline-none" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[#94a3b8] text-sm">₹</span>
                                            <input type="number" value={item.rate} onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value))} className="w-full bg-transparent text-sm font-bold outline-none" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-black text-[#1e293b]">
                                        ₹{item.total.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button type="button" onClick={() => setNewOrder({...newOrder, items: newOrder.items.filter((_, i) => i !== idx)})} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Reference ID</label>
                        <input type="text" value={newOrder.referenceId} onChange={e => setNewOrder({...newOrder, referenceId: e.target.value})} className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#001828]" placeholder="Optional ref #" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Instruction</label>
                        <textarea rows={3} value={newOrder.instruction} onChange={e => setNewOrder({...newOrder, instruction: e.target.value})} className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#001828]" placeholder="Any notes..." />
                    </div>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-[#64748b]">Subtotal</span>
                        <span className="font-black text-[#1e293b]">₹{newOrder.items.reduce((s, i) => s + i.total, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-[#64748b]">Discount</span>
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">-</span>
                            <input type="number" value={newOrder.discount} onChange={e => setNewOrder({...newOrder, discount: parseFloat(e.target.value) || 0})} className="w-24 text-right bg-white border border-[#e2e8f0] rounded-lg px-2 py-1 text-sm font-black text-red-500 outline-none" />
                        </div>
                    </div>
                    <div className="h-[1px] bg-[#e2e8f0] my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="font-black text-[#1e293b]">Net Amount</span>
                        <span className="text-xl font-black text-[#001828]">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-4 border-2 border-[#e2e8f0] text-[#64748b] font-bold rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-10 py-4 bg-[#001828] text-white font-bold rounded-2xl shadow-xl shadow-[#001828]/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Finalize Purchase Order</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showHistoryModal && activeHistoryOrder && (
        <div className="fixed inset-0 bg-[#001828]/20 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-[#e2e8f0] flex justify-between items-center bg-[#001828] text-white">
              <div className="flex items-center gap-4">
                <Eye size={20} />
                <div>
                  <h2 className="text-xl font-bold">Audit History: {activeHistoryOrder.purchaseId}</h2>
                  <p className="text-xs text-indigo-200">Tracking amount adjustments</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {orderHistory.length === 0 ? (
                <div className="text-center py-10 text-[#64748b]">
                  <p className="text-sm font-bold uppercase tracking-widest">No adjustments recorded</p>
                  <p className="text-xs mt-1 italic">This order amount hasn't changed since creation.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orderHistory.map((h, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== orderHistory.length - 1 && (
                        <div className="absolute left-3 top-7 bottom-0 w-[2px] bg-slate-100 -mb-6"></div>
                      )}
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-[#001828] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                            {new Date(h.changeDate).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-[#94a3b8] italic">Amount Change</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-bold">
                          <span className="text-red-400">₹{h.oldAmount.toLocaleString()}</span>
                          <span className="text-[#94a3b8]">→</span>
                          <span className="text-emerald-500">₹{h.newAmount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-[#64748b] mt-1 italic">Reason: {h.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 flex justify-end px-8">
              <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-[#001828] text-white rounded-xl text-sm font-bold">Close Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
