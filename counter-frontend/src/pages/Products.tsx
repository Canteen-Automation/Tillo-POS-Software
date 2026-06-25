import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  X, 
  Search, 
  Edit2, 
  Trash2, 
  Database,
  ShoppingBag,
  Package,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Local authenticated fetch wrapper
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = sessionStorage.getItem('counterToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem('isCounterLoggedIn');
    sessionStorage.removeItem('counterToken');
    window.location.href = '/login';
  }
  return response;
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>(emptyProduct);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    if (catParam) {
      setSearchTerm(catParam);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0); // Reset to page 0 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const host = window.location.hostname;
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const response = await apiFetch(`http://${host}:8080/api/products?page=${currentPage}&size=${pageSize}${searchParam}`);
      const data = await response.json();
      
      if (data && data.content) {
        setProducts(data.content);
        setTotalElements(data.totalElements);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalElements(data.length);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/base-items`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : (data.content || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const host = window.location.hostname;
    const url = editingProduct?.id 
      ? `http://${host}:8080/api/products/${editingProduct.id}`
      : `http://${host}:8080/api/products`;
    const method = editingProduct?.id ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/products/${product.id}`, { method: 'DELETE' });
      if (response.ok) fetchProducts();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/products/${product.id}/toggle-stock`, { method: 'PATCH' });
      if (response.ok) fetchProducts();
    } catch (error) {
      console.error('Error toggling stock:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageData: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = products;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-inter">
      {/* Search & Header */}
      <div className="px-8 py-6 bg-white border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 shadow-sm relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Products</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manage catalog & stock details</p>
        </div>

        <div className="flex-1 max-w-2xl px-6 py-3 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-4 group focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          <Search size={22} className="text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search products by name or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm font-semibold text-slate-900"
          />
        </div>

        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData(emptyProduct);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Catalog...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((prod) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={prod.id}
                  className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col overflow-hidden relative"
                >
                  <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                     {prod.imageData ? (
                       <img src={prod.imageData} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-200 group-hover:text-primary/20 transition-all">
                          <ShoppingBag size={80} />
                       </div>
                     )}
                     <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-[9px] font-black uppercase text-primary border border-primary/10 shadow-sm">🅡{prod.price}</span>
                     </div>
                     <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                           onClick={() => { setEditingProduct(prod); setFormData(prod); setIsModalOpen(true); }}
                           className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-primary shadow-xl transition-all"
                        >
                           <Edit2 size={16} />
                        </button>
                        <button 
                           onClick={() => handleDelete(prod)}
                           className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-xl transition-all"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                  
                  <div className="p-8 flex flex-col gap-6 flex-1">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{prod.category}</span>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${prod.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {prod.stock > 0 ? `Stock: ${prod.stock}` : 'Out of Stock'}
                           </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{prod.name}</h3>
                     </div>

                     <div className="flex gap-3 mt-auto pt-4 border-t border-slate-50">
                        <button 
                           onClick={() => handleToggleStock(prod)}
                           className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                              prod.stock > 0 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                           }`}
                        >
                           <Database size={12} /> {prod.stock > 0 ? 'Out of Stock' : 'In Stock'}
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
             <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center">
                <Package size={48} />
             </div>
             <p className="font-black uppercase tracking-[0.3em] text-[10px]">No products matched your search</p>
          </div>
        )}
      </div>

      <Pagination 
        currentPage={currentPage}
        pageSize={pageSize}
        totalElements={totalElements}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(0); }}
      />

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 className="text-3xl font-black text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure catalog & inventory data</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="group">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Product Identity</label>
                       <div className="grid grid-cols-2 gap-4">
                          <input required type="text" placeholder="Prod Name*" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-2 bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all" />
                          <input type="text" placeholder="Prod ID" value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})} className="bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all" />
                          <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer">
                             <option value="">Category*</option>
                             {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="group">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Pricing & Value</label>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">🅡</span>
                             <input type="number" placeholder="MRP Price" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-10 pr-8 text-sm font-black outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-primary" />
                          </div>
                          <input type="number" placeholder="Inventory Count" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} className="bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="group">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Product Visual</label>
                       <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="h-48 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer overflow-hidden relative"
                       >
                          {formData.imageData ? (
                             <img src={formData.imageData} className="w-full h-full object-contain" />
                          ) : (
                             <>
                                <ImageIcon size={48} className="mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Select Image</span>
                             </>
                          )}
                          <input ref={fileInputRef} type="file" className="hidden" onChange={handleImageChange} />
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                       <button type="button" onClick={() => setFormData({...formData, veg: !formData.veg})} className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.veg ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>VEG ONLY</button>
                       <button type="button" onClick={() => setFormData({...formData, active: !formData.active})} className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.active ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>PUBLISHED</button>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-10 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">Discard Changes</button>
                <button type="submit" className="flex-[2] bg-primary text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><Check size={20} /> {editingProduct ? 'Save Updates' : 'Publish Product'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      ` }} />
    </div>
  );
};

export default Products;
