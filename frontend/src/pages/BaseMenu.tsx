import { apiFetch } from '../api';
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, Filter, MoreVertical, RefreshCw, Edit2, Power, PowerOff, ShoppingCart, Package, ExternalLink } from 'lucide-react';
import Pagination from '../components/Pagination';

interface BaseItem {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  active: boolean;
}

const BaseMenu = () => {
  const [items, setItems] = useState<BaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BaseItem | null>(null);
  const [newItem, setNewItem] = useState({ name: '', description: '', active: true });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Associated Products State
  const [selectedBaseItem, setSelectedBaseItem] = useState<BaseItem | null>(null);
  const [associatedProducts, setAssociatedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

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
    fetchItems();
  }, [currentPage, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const host = window.location.hostname;
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const response = await apiFetch(`http://${host}:8080/api/base-items?${params.toString()}`);
      const data = await response.json();
      if (data && data.content) {
        setItems(data.content);
        setTotalElements(data.totalElements);
      } else {
        setItems([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociatedProducts = async (baseItem: BaseItem) => {
    setSelectedBaseItem(baseItem);
    setShowProductsModal(true);
    setProductsLoading(true);
    try {
      const response = await apiFetch(`http://localhost:8080/api/products/category/${encodeURIComponent(baseItem.name)}`);
      const data = await response.json();
      setAssociatedProducts(data);
    } catch (error) {
      console.error('Error fetching associated products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem 
      ? `http://localhost:8080/api/base-items/${editingItem.id}`
      : 'http://localhost:8080/api/base-items';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (response.ok) {
        setShowModal(false);
        setEditingItem(null);
        setNewItem({ name: '', description: '', active: true });
        fetchItems();
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item: BaseItem) => {
    setEditingItem(item);
    setNewItem({ name: item.name, description: item.description, active: item.active });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleToggleActive = async (item: BaseItem) => {
    try {
      const response = await apiFetch(`http://localhost:8080/api/base-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, active: !item.active }),
      });
      if (response.ok) {
        fetchItems();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  return (
    <div className="p-8 font-inter">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Base Items</h1>
          <p className="text-sm text-[#64748b]">Manage your base inventory items</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setNewItem({ name: '', description: '', active: true });
            setShowModal(true);
          }}
          className="bg-[#001828] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] mb-6 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#001828]/30 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] hover:bg-gray-50 transition-all">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
        <button onClick={fetchItems} className="p-2 text-[#64748b] hover:bg-gray-100 rounded-lg transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-[#e2e8f0]">
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-center">Products</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748b]">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin" size={24} />
                      <p>Loading items...</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748b]">
                    <p className="text-lg font-medium mb-1">No items found</p>
                    <p className="text-sm">Try adjusting your search or add a new item.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-6 py-4 text-sm font-medium text-[#64748b]">#{item.id}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#1e293b]">{item.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748b] max-w-xs truncate">{item.description}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => fetchAssociatedProducts(item)}
                        className="p-2 text-[#001828] bg-[#001828]/5 hover:bg-[#001828]/10 rounded-xl transition-all"
                        title="View Associated Products"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                        className="p-1.5 text-[#94a3b8] hover:text-[#001828] hover:bg-[#001828]/5 rounded-lg transition-all"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openMenuId === item.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl border border-[#e2e8f0] z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                          <button 
                            onClick={() => handleEdit(item)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#475569] hover:bg-gray-50 hover:text-[#001828] transition-all"
                          >
                            <Edit2 size={16} />
                            <span className="font-semibold">Edit Item</span>
                          </button>
                          <button 
                            onClick={() => handleToggleActive(item)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#475569] hover:bg-gray-50 hover:text-[#001828] transition-all border-t border-[#e2e8f0]/50"
                          >
                            {item.active ? (
                              <>
                                <PowerOff size={16} className="text-red-500" />
                                <span className="font-semibold">Mark as Inactive</span>
                              </>
                            ) : (
                              <>
                                <Power size={16} className="text-green-500" />
                                <span className="font-semibold">Mark as Active</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
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

      {/* Associated Products Modal */}
      {showProductsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-[#1e293b]">Products for: {selectedBaseItem?.name}</h2>
                <p className="text-xs text-[#64748b] mt-0.5">Showing all associated products in this category</p>
              </div>
              <button onClick={() => setShowProductsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                <X size={24} className="text-[#64748b]" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {productsLoading ? (
                <div className="flex flex-col items-center py-12 text-[#64748b]">
                  <RefreshCw className="animate-spin mb-4" size={32} />
                  <p className="font-medium">Fetching associated products...</p>
                </div>
              ) : associatedProducts.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-[#94a3b8] mb-4">
                    <Package size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-[#1e293b]">No Products Found</h3>
                  <p className="text-sm text-[#64748b] mt-1 max-w-xs">There are no products currently linked to the "{selectedBaseItem?.name}" category.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {associatedProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-[#e2e8f0] hover:border-[#001828]/20 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#001828] shadow-sm group-hover:scale-105 transition-transform">
                          <Package size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1e293b]">{product.name}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${product.active ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-200'}`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#001828]">₹{product.price}</p>
                        <p className="text-[10px] text-[#64748b] font-medium">Sale Price</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-8 py-6 bg-gray-50/50 border-t border-[#e2e8f0] flex justify-end">
              <button 
                onClick={() => setShowProductsModal(false)}
                className="px-6 py-2.5 bg-[#001828] text-white font-bold rounded-xl shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Modal (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#1e293b]">
                {editingItem ? 'Edit Base Item' : 'Add New Base Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 rounded-lg transition-all">
                <X size={20} className="text-[#64748b]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#475569] mb-1.5">Item Name</label>
                <input
                  required
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Fresh Tomato"
                  className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#001828] focus:ring-1 focus:ring-[#001828] transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#475569] mb-1.5">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Tell us more about this item..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#001828] focus:ring-1 focus:ring-[#001828] transition-all text-sm resize-none"
                />
              </div>
              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setNewItem({ ...newItem, active: !newItem.active })}
                  className={`w-11 h-6 rounded-full transition-all relative ${newItem.active ? 'bg-[#001828]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newItem.active ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-semibold text-[#1e293b]">Mark as Active</span>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#e2e8f0] text-[#64748b] font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#001828] text-white font-bold rounded-xl shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                >
                  {editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseMenu;
