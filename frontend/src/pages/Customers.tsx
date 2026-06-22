import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Tag, ChevronRight, UserCheck, UserMinus, MoreVertical, LayoutGrid, List, Edit2, Trash2, Shield, X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, CircleDollarSign } from 'lucide-react';
import Pagination from '../components/Pagination';

interface UserDto {
  id: number;
  mobileNumber: string;
  name: string;
  loggedIn: boolean;
  isSuspended: boolean;
  ritzTokenBalance: number;
}

const Customers: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [editForm, setEditForm] = useState({ name: '', mobileNumber: '', pin: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Notification State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Action Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, debouncedSearchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const host = window.location.hostname;
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const response = await apiFetch(`http://${host}:8080/api/auth/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.content) {
          // Normalize the data (backend sends 'suspended', frontend expects 'isSuspended')
          const normalizedUsers = data.content.map((u: any) => ({
            ...u,
            isSuspended: u.isSuspended !== undefined ? u.isSuspended : u.suspended,
            loggedIn: u.loggedIn !== undefined ? u.loggedIn : u.isLoggedIn
          }));
          setUsers(normalizedUsers);
          setTotalElements(data.totalElements);
        } else {
          setUsers([]);
          setTotalElements(0);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEditClick = (user: UserDto) => {
    setEditingUser(user);
    setEditForm({ name: user.name, mobileNumber: user.mobileNumber, pin: '' });
    setShowEditModal(true);
    setOpenMenuId(null);
    setErrors({});
    setShowPin(false);
  };

  const handleDeleteClick = async (user: UserDto) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) return;
    
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/auth/users/${user.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showNotification(`${user.name} deleted successfully`, 'success');
        fetchUsers();
        setOpenMenuId(null);
      } else {
        showNotification('Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('Error connecting to server', 'error');
    }
  };

  const handleSuspendToggle = async (user: UserDto) => {
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/auth/users/${user.id}/suspend`, {
        method: 'PATCH',
      });
      if (response.ok) {
        showNotification(`${user.name} ${user.isSuspended ? 'unsuspended' : 'suspended'} successfully`, 'success');
        fetchUsers();
        setOpenMenuId(null);
      } else {
        showNotification('Failed to update suspension status', 'error');
      }
    } catch (error) {
      console.error('Error toggling suspension:', error);
      showNotification('Error connecting to server', 'error');
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!editForm.name.trim()) newErrors.name = 'Full Name is required';
    
    if (!/^[0-9]{10}$/.test(editForm.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }
    
    if (editForm.pin && !/^[0-9]{6}$/.test(editForm.pin)) {
      newErrors.pin = 'PIN must be exactly 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      if (response.ok) {
        showNotification('Customer profile updated successfully', 'success');
        setShowEditModal(false);
        fetchUsers();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('Connection error, try again later', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Toast Notification - Moved outside animation trapping */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Animated Container */}
      <div className="flex flex-col h-full bg-[#f8fafc] p-8 gap-8 overflow-y-auto animate-slideUp font-inter relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#001828] rounded-xl flex items-center justify-center shadow-lg shadow-[#001828]/20">
              <User className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1e293b]">Customer Management</h1>
              <p className="text-sm text-[#64748b]">View and manage customers registered through the ordering site</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group min-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#001828] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#001828]/30 transition-all shadow-sm"
              />
            </div>
            
            <div className="flex p-1 bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
              <button 
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#001828] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                onClick={() => setViewMode('table')}
              >
                <List size={20} />
              </button>
              <button 
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#001828] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1600px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
              <div className="w-10 h-10 border-4 border-[#001828]/10 border-t-[#001828] rounded-full animate-spin"></div>
              <p className="mt-4 text-[#64748b] font-medium text-sm">Loading customer base...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-[#e2e8f0]">
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Customer Info</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Membership</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Wallet Balance</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#001828] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {getInitials(user.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#1e293b]">{user.name}</p>
                                  <p className="text-[11px] text-[#64748b]">ID: {user.id.toString().padStart(4, '0')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-[#1e293b] font-medium">
                                <Phone size={14} className="text-[#94a3b8]" />
                                <span>{user.mobileNumber}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold whitespace-nowrap">
                                REGULAR CUSTOMER
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                  <CircleDollarSign size={16} />
                                </div>
                                <span className="text-sm font-black text-[#001828]">
                                  R{user.ritzTokenBalance?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                user.isSuspended
                                  ? 'bg-red-100 text-red-700'
                                  : user.loggedIn 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : user.loggedIn ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {user.isSuspended ? 'Suspended' : user.loggedIn ? 'Active Now' : 'Offline'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right relative">
                              <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="p-1.5 text-[#94a3b8] hover:text-[#001828] rounded-lg transition-colors">
                                <MoreVertical size={18} />
                              </button>
                              
                              {openMenuId === user.id && (
                                <div className="absolute right-6 top-10 w-40 bg-white rounded-xl shadow-2xl border border-[#e2e8f0] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                  <button onClick={() => handleEditClick(user)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-[#475569] font-medium border-b border-[#f1f5f9]">
                                    <Edit2 size={16} /> Edit User
                                  </button>
                                  <button onClick={() => handleSuspendToggle(user)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 font-medium border-b border-[#f1f5f9] ${user.isSuspended ? 'text-amber-600' : 'text-red-500'}`}>
                                    {user.isSuspended ? <UserCheck size={16} /> : <UserMinus size={16} />}
                                    {user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                                  </button>
                                  <button onClick={() => handleDeleteClick(user)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-red-600 font-medium font-bold">
                                    <Trash2 size={16} /> Delete User
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#64748b]">
                            <div className="flex flex-col items-center justify-center">
                              <User size={40} className="mb-2 opacity-20" />
                              <p className="font-medium">No customers found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                  {users.map(user => (
                    <div key={user.id} className="group relative p-6 bg-white border border-[#e2e8f0] rounded-xl flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1">
                      <div className="absolute top-4 right-4">
                        <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="p-1.5 text-[#94a3b8] hover:text-[#001828] rounded-lg">
                          <MoreVertical size={18} />
                        </button>
                        {openMenuId === user.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-[#e2e8f0] z-50 overflow-hidden">
                            <button onClick={() => handleEditClick(user)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-[#475569] font-medium border-b border-[#f1f5f9]">
                              <Edit2 size={16} /> Edit
                            </button>
                            <button onClick={() => handleSuspendToggle(user)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 font-medium border-b border-[#f1f5f9] ${user.isSuspended ? 'text-amber-600' : 'text-red-500'}`}>
                              {user.isSuspended ? <UserCheck size={16} /> : <UserMinus size={16} />}
                              {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                            <button onClick={() => handleDeleteClick(user)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-red-600 font-medium">
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="relative mb-4">
                        <div className="w-20 h-20 bg-[#001828] rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-[#001828]/20">
                          {getInitials(user.name)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${user.loggedIn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-[#1e293b] mb-0.5">{user.name}</h3>
                      <p className="text-sm text-[#64748b] font-medium mb-4">{user.mobileNumber}</p>
                      
                      <div className="flex items-center gap-2 mb-6">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-wider">
                          RIT STUDENT
                        </span>
                        {user.isSuspended && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 uppercase tracking-wider">
                            SUSPENDED
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 uppercase tracking-wider">
                          R{user.ritzTokenBalance?.toLocaleString() || '0'} TOKENS
                        </span>
                      </div>
                      
                      <button onClick={() => handleEditClick(user)} className="w-full py-2.5 bg-gray-50 border border-[#e2e8f0] text-[#1e293b] hover:bg-[#001828] hover:text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all">
                        Edit Profile <Edit2 size={16} />
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
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(0);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal - Positioned absolutely relative to viewport */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#001828]/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="px-10 py-8 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#001828]/5 rounded-xl flex items-center justify-center text-[#001828]">
                  <Edit2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1e293b]">Edit Customer</h2>
                  <p className="text-sm text-[#64748b]">Update account details and security credentials</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={24} className="text-[#64748b]" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] uppercase font-black text-[#64748b] mb-2.5 tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input 
                      required
                      type="text" 
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm({...editForm, name: e.target.value});
                        if (errors.name) setErrors({...errors, name: ''});
                      }}
                      className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-base font-bold focus:ring-4 focus:ring-[#001828]/5 focus:border-[#001828] transition-all outline-none ${
                        errors.name ? 'border-red-500 ring-4 ring-red-500/5' : 'border-[#e2e8f0]'
                      }`}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12} />{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-black text-[#64748b] mb-2.5 tracking-widest ml-1">Mobile Number</label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input 
                      required
                      type="text"
                      maxLength={10}
                      value={editForm.mobileNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setEditForm({...editForm, mobileNumber: val});
                        if (errors.mobileNumber) setErrors({...errors, mobileNumber: ''});
                      }}
                      className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-base font-bold focus:ring-4 focus:ring-[#001828]/5 focus:border-[#001828] transition-all outline-none ${
                        errors.mobileNumber ? 'border-red-500 ring-4 ring-red-500/5' : 'border-[#e2e8f0]'
                      }`}
                      placeholder="10-digit number"
                    />
                  </div>
                  {errors.mobileNumber && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12} />{errors.mobileNumber}</p>}
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-[#e2e8f0] border-dashed">
                <label className="block text-[11px] uppercase font-black text-[#64748b] mb-3 tracking-widest ml-1">Reset Security PIN (Optional)</label>
                <div className="relative max-w-sm">
                  <Shield size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input 
                    type={showPin ? "text" : "password"} 
                    maxLength={6}
                    value={editForm.pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEditForm({...editForm, pin: val});
                      if (errors.pin) setErrors({...errors, pin: ''});
                    }}
                    className={`w-full pl-12 pr-12 py-4 bg-white border rounded-2xl text-base font-bold focus:ring-4 focus:ring-[#001828]/5 focus:border-[#001828] transition-all outline-none ${
                      errors.pin ? 'border-red-500 ring-4 ring-red-500/5' : 'border-[#e2e8f0]'
                    }`}
                    placeholder="Enter new 6-digit PIN"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#001828] transition-colors p-1"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.pin ? (
                  <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12} />{errors.pin}</p>
                ) : (
                  <p className="text-xs text-[#94a3b8] mt-3 font-semibold ml-1">Only update this if the student has forgotten their credentials.</p>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-8 py-4 border-2 border-[#e2e8f0] text-[#64748b] font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[1.5] px-8 py-4 bg-[#001828] text-white font-bold rounded-2xl shadow-xl shadow-[#001828]/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 text-sm"
                >
                  {isSaving ? (
                    <><Loader2 size={20} className="animate-spin" /> Syncing Details...</>
                  ) : (
                    <><Edit2 size={20} /> Save Account Updates</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Customers;
