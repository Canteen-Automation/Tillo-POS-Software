import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { Search, Building2, Phone, Mail, MoreVertical, List, LayoutGrid, Edit2, Trash2, X, Loader2, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import Pagination from '../components/Pagination';

interface VendorDto {
  id: number;
  name: string;
  companyName: string;
  contactNumber: string;
  email: string;
  totalOrders: number;
  totalAmount: number;
}

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDto | null>(null);
  const [form, setForm] = useState({ name: '', companyName: '', contactNumber: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Notification State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Action Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchVendors();
  }, [currentPage, pageSize]);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/purchases/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
        setTotalElements(data.length);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddClick = () => {
    setEditingVendor(null);
    setForm({ name: '', companyName: '', contactNumber: '', email: '' });
    setShowModal(true);
    setErrors({});
  };

  const handleEditClick = (vendor: VendorDto) => {
    setEditingVendor(vendor);
    setForm({ 
      name: vendor.name, 
      companyName: vendor.companyName, 
      contactNumber: vendor.contactNumber, 
      email: vendor.email 
    });
    setShowModal(true);
    setOpenMenuId(null);
    setErrors({});
  };

  const handleDeleteClick = async (vendor: VendorDto) => {
    if (!window.confirm(`Are you sure you want to delete ${vendor.name}?`)) return;
    
    try {
      const response = await apiFetch(`/api/purchases/vendors/${vendor.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showNotification(`${vendor.name} deleted successfully`, 'success');
        fetchVendors();
      }
    } catch (error) {
      showNotification('Failed to delete vendor', 'error');
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!form.name.trim()) newErrors.name = 'Vendor Name is required';
    if (!form.contactNumber.trim()) newErrors.contactNumber = 'Contact Number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const response = await apiFetch('/api/purchases/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVendor ? { ...form, id: editingVendor.id } : form),
      });
      
      if (response.ok) {
        showNotification(`Vendor ${editingVendor ? 'updated' : 'created'} successfully`, 'success');
        setShowModal(false);
        fetchVendors();
      } else {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        showNotification(`Failed to save: ${errorText || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification('Could not connect to server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVendors = vendors.filter(v => {
    if (!v) return false;
    const search = (searchTerm || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    const company = (v.companyName || '').toLowerCase();
    return name.includes(search) || company.includes(search);
  });

  return (
    <>
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-[#f8fafc] p-8 gap-8 overflow-y-auto animate-slideUp font-inter relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#001828] rounded-xl flex items-center justify-center shadow-lg shadow-[#001828]/20">
              <Building2 className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1e293b]">Vendor Management</h1>
              <p className="text-sm text-[#64748b]">Manage your product suppliers and their contact information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleAddClick}
              title="Register a new supplier in the database"
              className="px-5 py-2.5 bg-[#001828] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-[#001828]/20"
            >
              <Plus size={18} />
              Add Vendor
            </button>

            <div className="relative group min-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
              <input 
                type="text" 
                placeholder="Search vendors..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#001828]/30 transition-all shadow-sm"
              />
            </div>
            
            <div className="flex p-1 bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
              <button 
                title="Table View"
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#001828] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                onClick={() => setViewMode('table')}
              >
                <List size={20} />
              </button>
              <button 
                title="Grid View"
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#001828] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#e2e8f0]">
              <div className="w-10 h-10 border-4 border-[#001828]/10 border-t-[#001828] rounded-full animate-spin"></div>
              <p className="mt-4 text-[#64748b] font-medium text-sm">Loading vendors...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-[#e2e8f0]">
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Vendor Info</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Total Orders</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {filteredVendors.map((vendor) => (
                        <tr key={vendor.id} className="hover:bg-gray-50/50 transition-all">
                          <td className="px-6 py-4 text-sm font-bold text-[#64748b]">{vendor.id}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-bold text-[#1e293b]">{vendor.name}</p>
                              <p className="text-[11px] text-[#64748b] uppercase font-bold">{vendor.companyName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[13px] text-[#1e293b] font-medium">
                                <Phone size={12} className="text-[#94a3b8]" />
                                <span>{vendor.contactNumber}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
                                <Mail size={12} className="text-[#94a3b8]" />
                                <span>{vendor.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold transition-all">
                              {vendor.totalOrders || 0} Orders
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-[#1e293b]">
                            ₹{(vendor.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right relative">
                            <button 
                                onClick={() => setOpenMenuId(openMenuId === vendor.id ? null : vendor.id)} 
                                title="Open actions menu"
                                className="p-1.5 text-[#94a3b8] hover:text-[#001828] rounded-lg"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {openMenuId === vendor.id && (
                              <div className="absolute right-6 top-10 w-40 bg-white rounded-xl shadow-2xl border border-[#e2e8f0] z-50 overflow-hidden">
                                <button onClick={() => handleEditClick(vendor)} title="Edit vendor contact and profile" className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-[#475569] font-medium border-b border-[#f1f5f9]">
                                  <Edit2 size={16} /> Edit Vendor
                                </button>
                                <button onClick={() => handleDeleteClick(vendor)} title="Delete vendor permanently" className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-red-600 font-bold">
                                  <Trash2 size={16} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                  {filteredVendors.map(vendor => (
                    <div key={vendor.id} className="p-6 bg-white border border-[#e2e8f0] rounded-2xl flex flex-col items-center text-center hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="w-16 h-16 bg-[#001828] rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-4">
                        {vendor.name.charAt(0)}
                      </div>
                      <h3 className="text-lg font-bold text-[#1e293b]">{vendor.name}</h3>
                      <p className="text-xs text-[#64748b] font-bold uppercase mb-4">{vendor.companyName}</p>
                      <div className="w-full pt-4 border-t border-[#f1f5f9] space-y-2">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                          <span>Orders</span>
                          <span className="text-[#1e293b]">{vendor.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                          <span>Volume</span>
                          <span className="text-[#1e293b]">₹{(vendor.totalAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleEditClick(vendor)}
                        title="View and edit vendor profile"
                        className="w-full mt-6 py-2.5 bg-gray-50 border border-[#e2e8f0] text-[#1e293b] hover:bg-[#001828] hover:text-white rounded-xl text-sm font-bold transition-all"
                      >
                        Edit Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Pagination 
                currentPage={currentPage}
                pageSize={pageSize}
                totalElements={totalElements}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#001828]/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#001828] rounded-xl flex items-center justify-center text-white">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1e293b]">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                  <p className="text-xs text-[#64748b]">Fill in the information below</p>
                </div>
              </div>
               <button onClick={() => setShowModal(false)} title="Close" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-[#64748b]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Vendor Name</label>
                  <input 
                    required
                    type="text" 
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl text-sm font-bold focus:border-[#001828] outline-none transition-all"
                    placeholder="e.g. Fresh Foods Ltd"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Company Name</label>
                  <input 
                    type="text" 
                    value={form.companyName}
                    onChange={(e) => setForm({...form, companyName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl text-sm font-bold focus:border-[#001828] outline-none transition-all"
                    placeholder="Official company name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Contact Number</label>
                    <input 
                      required
                      type="text" 
                      value={form.contactNumber}
                      onChange={(e) => setForm({...form, contactNumber: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl text-sm font-bold focus:border-[#001828] outline-none transition-all"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-[#64748b] mb-1.5 tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl text-sm font-bold focus:border-[#001828] outline-none transition-all"
                      placeholder="vendor@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                 <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  title="Discard changes"
                  className="flex-1 px-6 py-3 border border-[#e2e8f0] text-[#64748b] font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                 <button 
                  type="submit" 
                  disabled={isSaving}
                  title={editingVendor ? "Update vendor records" : "Save new vendor"}
                  className="flex-[1.5] px-6 py-3 bg-[#001828] text-white font-bold rounded-xl shadow-lg shadow-[#001828]/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all text-sm"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Vendors;
