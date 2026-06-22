import { apiFetch } from '../api';
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, Filter, MoreVertical, RefreshCw, Edit2, Power, PowerOff, Tag, Package, Image as ImageIcon, Barcode, DollarSign, ChevronDown, Clock, Check, Trash2, Database } from 'lucide-react';
import Pagination from '../components/Pagination';

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
  baseItems?: { id: number; name: string }[];
}

interface BaseItem {
  id: number;
  name: string;
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const getDefaultSessions = (): ProductSession[] => 
  DAYS.map(day => ({ dayOfWeek: day, active: true, startTime: '00:00', endTime: '23:59' }));

const emptyProduct: Product = {
  productId: '',
  name: '',
  category: '',
  description: '',
  basePrice: 0,
  price: 0,
  offerPrice: 0,
  discountPercent: 0,
  discountAmount: 0,
  counter: '',
  tag: '',
  parcelCharges: 0,
  barcode: '',
  attributesOptional: false,
  veg: false,
  hasAllergy: false,
  parcelNotAllowed: false,
  sessionOptional: false,
  sessions: getDefaultSessions(),
  imageData: '',
  active: true,
  stock: 0
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [baseItems, setBaseItems] = useState<BaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>(emptyProduct);
  const [allStalls, setAllStalls] = useState<Stall[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchProducts();

    // SSE Real-time stock updates
    const host = window.location.hostname;
    const eventSource = new EventSource(`http://${host}:8080/api/stock/stream`);

    eventSource.addEventListener('stockUpdate', (event: any) => {
      try {
        const update = JSON.parse(event.data);
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === update.productId ? { ...p, stock: update.stock } : p
          )
        );
      } catch (err) {
        console.error('Error processing stock update:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [currentPage, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchBaseItems();
    fetchAllStalls();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const host = window.location.hostname;
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const response = await apiFetch(`http://${host}:8080/api/products?${params.toString()}`);
      const data = await response.json();
      if (data && data.content) {
        setProducts(data.content);
        setTotalElements(data.totalElements);
      } else {
        setProducts([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseItems = async () => {
    try {
      const response = await apiFetch('http://localhost:8080/api/base-items?size=100');
      const data = await response.json();
      setBaseItems(data.content || data);
    } catch (error) {
      console.error('Error fetching base items:', error);
    }
  };

  const fetchAllStalls = async () => {
    try {
      const response = await apiFetch('http://localhost:8080/api/stalls');
      const data = await response.json();
      setAllStalls(data);
    } catch (error) {
      console.error('Error fetching stalls:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct 
      ? `http://localhost:8080/api/products/${editingProduct.id}`
      : 'http://localhost:8080/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowModal(false);
        setEditingProduct(null);
        setFormData(emptyProduct);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      sessions: product.sessions && product.sessions.length > 0 ? product.sessions : getDefaultSessions()
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await apiFetch(`http://localhost:8080/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, active: !product.active }),
      });
      if (response.ok) {
        fetchProducts();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      const response = await apiFetch(`http://localhost:8080/api/products/${product.id}/toggle-stock`, {
        method: 'PATCH',
      });
      if (response.ok) {
        fetchProducts();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error toggling stock status:', error);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}?`)) return;
    try {
      const response = await apiFetch(`http://localhost:8080/api/products/${product.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchProducts();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageData: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSession = (index: number, updates: Partial<ProductSession>) => {
    const newSessions = [...formData.sessions];
    newSessions[index] = { ...newSessions[index], ...updates };
    setFormData({ ...formData, sessions: newSessions });
  };

  return (
    <div className="p-8 font-inter">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Products</h1>
          <p className="text-sm text-[#64748b]">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData(emptyProduct);
            setShowModal(true);
          }}
          className="bg-[#001828] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] mb-6 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#001828]/30 transition-all"
            />
          </div>
        </div>
        <button onClick={fetchProducts} className="p-2 text-[#64748b] hover:bg-gray-100 rounded-lg transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm mb-6">
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-[#e2e8f0]">
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Selling at</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Price Details</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#64748b]"><RefreshCw className="animate-spin inline mr-2" />Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#64748b]">No products found</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageData ? (
                        <img src={product.imageData} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[#001828]"><Package size={20} /></div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-[#1e293b]">{product.name}</p>
                        <p className="text-[11px] text-[#64748b]">ID: {product.productId || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        // Combine direct stalls with stalls that have this product's category in their baseItems
                        const directStalls = product.stalls || [];
                        const indirectStalls = allStalls.filter(s => 
                          s.baseItems?.some(bi => bi.name.toLowerCase() === product.category?.toLowerCase())
                        ).map(s => ({ id: s.id, name: s.name }));

                        // Unique stalls by ID
                        const combinedStalls = Array.from(
                          new Map([...directStalls, ...indirectStalls].map(s => [s.id, s])).values()
                        );

                        return combinedStalls.length > 0 ? (
                          combinedStalls.map(stall => (
                            <span key={stall.id} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold border border-purple-100 italic whitespace-nowrap">
                              {stall.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#94a3b8] italic">Not Assigned</span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#1e293b]">₹{product.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${product.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        <Database size={12} />
                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right relative ${openMenuId === product.id ? 'z-[100]' : 'z-0'}`}>
                    <button onClick={() => setOpenMenuId(openMenuId === product.id ? null : (product.id as number))} className="p-1.5 text-[#94a3b8] hover:text-[#001828] rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === product.id && (
                      <div 
                        ref={menuRef} 
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-2xl border border-[#e2e8f0] z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <button onClick={() => handleEdit(product)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-[#475569] font-medium"><Edit2 size={16} />Edit</button>
                        <button onClick={() => handleToggleStock(product)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-[#475569] font-medium border-t border-[#f1f5f9]">
                          <Database size={16} className={product.stock > 0 ? "text-orange-500" : "text-green-500"} />
                          {product.stock > 0 ? "Mark Out of Stock" : "Mark In Stock"}
                        </button>
                        <button onClick={() => handleToggleActive(product)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-[#475569] font-medium border-t border-[#f1f5f9]">
                          {product.active ? <><PowerOff size={16} className="text-red-500" />Deactivate</> : <><Power size={16} className="text-green-500" />Activate</>}
                        </button>
                        <button onClick={() => handleDelete(product)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-red-600 font-medium border-t border-[#f1f5f9]"><Trash2 size={16} />Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#001828]/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl my-8 overflow-hidden">
            <div className="px-8 py-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-[#1e293b]">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={24} className="text-[#64748b]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Product ID</label><input type="text" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm" /></div>
                  <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Product Name *</label><input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm font-semibold" /></div>
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Category</label>
                    <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm">
                      <option value="">Select Category</option>
                      {baseItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm resize-none" /></div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Base Price</label><input type="number" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm" /></div>
                    <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Sale Price (R)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm font-bold" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Discount %</label><input type="number" value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm" /></div>
                    <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Offer Price</label><input type="number" value={formData.offerPrice} onChange={(e) => setFormData({ ...formData, offerPrice: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm" /></div>
                  </div>
                  <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Barcode</label><input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm" /></div>
                  <div><label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Stock Quantity</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm font-semibold" /></div>
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5">Counter (Stall) *</label>
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
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm font-semibold focus:ring-4 focus:ring-[#001828]/5 focus:border-[#001828] transition-all outline-none"
                    >
                      <option value="">Select Stall</option>
                      {allStalls.map(stall => (
                        <option key={stall.id} value={stall.name}>{stall.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[11px] uppercase font-bold text-[#64748b] mb-1.5 ml-1">Product Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#e2e8f0] rounded-2xl p-6 flex flex-col items-center justify-center text-[#94a3b8] hover:border-[#001828]/30 hover:bg-gray-50 transition-all cursor-pointer h-40 overflow-hidden"
                    >
                      {formData.imageData ? (
                        <img src={formData.imageData} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <ImageIcon size={32} strokeWidth={1.5} className="mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-center">Drop or Select image</p>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="mt-8 space-y-6">
                <div className="flex flex-wrap gap-8 p-6 bg-gray-50 rounded-2xl border border-[#e2e8f0]">
                  <div className="flex flex-col gap-4 min-w-[200px]">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="text-sm font-bold text-[#1e293b]">Additional Attributes</p></div>
                      <button type="button" onClick={() => setFormData({ ...formData, attributesOptional: !formData.attributesOptional })} className={`w-11 h-6 rounded-full relative transition-all ${formData.attributesOptional ? 'bg-[#001828]' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.attributesOptional ? 'translate-x-5' : ''}`} /></button>
                    </div>
                    {formData.attributesOptional && (
                      <div className="flex gap-4 animate-in fade-in slide-in-from-left-2">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.veg} onChange={(e) => setFormData({ ...formData, veg: e.target.checked })} className="w-4 h-4 rounded text-[#001828]" /><span className="text-xs font-semibold">Veg</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.hasAllergy} onChange={(e) => setFormData({ ...formData, hasAllergy: e.target.checked })} className="w-4 h-4 rounded text-[#001828]" /><span className="text-xs font-semibold">Allergy</span></label>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 min-w-[200px]">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="text-sm font-bold text-[#1e293b]">Session</p></div>
                      <button type="button" onClick={() => setFormData({ ...formData, sessionOptional: !formData.sessionOptional })} className={`w-11 h-6 rounded-full relative transition-all ${formData.sessionOptional ? 'bg-[#001828]' : 'bg-gray-300'}`}><div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.sessionOptional ? 'translate-x-5' : ''}`} /></button>
                    </div>
                    {formData.sessionOptional && (
                      <button type="button" onClick={() => setShowSessionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#001828]/20 text-[#001828] text-xs font-bold rounded-xl hover:bg-[#001828]/5 transition-all w-fit animate-in fade-in slide-in-from-left-2"><Clock size={14} /> Configure Session</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-4 border-2 border-[#e2e8f0] text-[#64748b] font-bold rounded-2xl hover:bg-gray-50 transition-all">Discard</button>
                <button type="submit" className="flex-[2] px-8 py-4 bg-[#001828] text-white font-bold rounded-2xl shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2"><Package size={20} /><span>{editingProduct ? 'Update Product' : 'Save Product'}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Configuration Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-[#001828]/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10">
              <h2 className="text-2xl font-bold text-[#1e293b] text-center mb-8">Select the session that the time product show in menu</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
                {formData.sessions.map((session, index) => (
                  <div key={session.dayOfWeek} className="p-6 rounded-3xl border-2 border-[#e2e8f0] relative">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div 
                        onClick={() => updateSession(index, { active: !session.active })}
                        className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all ${session.active ? 'bg-[#51133d]' : 'bg-gray-200'}`}
                      >
                        {session.active && <Check size={14} className="text-white" strokeWidth={4} />}
                      </div>
                      <span className="text-lg font-bold text-[#1e293b]">{session.dayOfWeek}</span>
                    </div>
                    
                    <div className="space-y-4 opacity-100 transition-opacity">
                      <div className="relative">
                        <label className="absolute -top-2 left-4 bg-white px-1 text-[10px] font-bold text-[#94a3b8] z-10">Start Time</label>
                        <div className="flex items-center justify-between px-5 py-4 bg-white border border-[#e2e8f0] rounded-2xl">
                          <input 
                            type="time" 
                            disabled={!session.active}
                            value={session.startTime} 
                            onChange={(e) => updateSession(index, { startTime: e.target.value })}
                            className="bg-transparent border-none outline-none text-sm font-bold text-[#1e293b] w-full disabled:text-gray-400" 
                          />
                          <Clock size={18} className="text-[#94a3b8]" />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="absolute -top-2 left-4 bg-white px-1 text-[10px] font-bold text-[#94a3b8] z-10">End Time</label>
                        <div className="flex items-center justify-between px-5 py-4 bg-white border border-[#e2e8f0] rounded-2xl">
                          <input 
                            type="time" 
                            disabled={!session.active}
                            value={session.endTime} 
                            onChange={(e) => updateSession(index, { endTime: e.target.value })}
                            className="bg-transparent border-none outline-none text-sm font-bold text-[#1e293b] w-full disabled:text-gray-400" 
                          />
                          <Clock size={18} className="text-[#94a3b8]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-4 mt-10 pt-4">
                <button onClick={() => setShowSessionModal(false)} className="px-10 py-4 bg-[#f46d43] text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all">Close</button>
                <button onClick={() => setShowSessionModal(false)} className="px-10 py-4 bg-[#3d1351] text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all">Submit</button>
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

export default Products;
