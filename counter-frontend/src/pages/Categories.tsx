import { useState, useEffect } from 'react';
import { 
  Layers, 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/base-items`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : (data.content || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const host = window.location.hostname;
    const url = currentCategory?.id 
      ? `http://${host}:8080/api/base-items/${currentCategory.id}`
      : `http://${host}:8080/api/base-items`;
    
    const method = currentCategory?.id ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCategory)
      });
      if (response.ok) {
        setIsModalOpen(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar bg-slate-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Food Categories</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Manage your menu structure</p>
        </div>
        <button 
          onClick={() => {
            setCurrentCategory({ name: '', description: '', active: true });
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard icon={Layers} label="Active Categories" value={categories.filter(c => c.active).length} color="bg-primary/5 text-primary" />
        <StatCard icon={Package} label="Total Structure" value={categories.length} color="bg-emerald-50 text-emerald-500" />
      </div>

      <div className="bg-white p-4 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-6 relative group">
           <Search className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
           <input 
            type="text" 
            placeholder="Search categories by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100/50 rounded-2xl py-6 pl-16 pr-8 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-inner"
           />
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence>
            {loading ? (
              <div className="col-span-full h-40 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : filteredCategories.map((cat) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={cat.id}
                className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col gap-8 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150 ${cat.active ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                
                <div className="flex items-center justify-between relative z-10">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${cat.active ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-400'} group-hover:bg-primary group-hover:text-white`}>
                      <Layers size={32} />
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => window.location.href = `/products?category=${cat.name}`}
                        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 shadow-sm transition-all"
                        title="View Products"
                      >
                         <Package size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setCurrentCategory(cat);
                          setIsModalOpen(true);
                        }}
                        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 shadow-sm transition-all"
                        title="Edit Category"
                      >
                         <Edit2 size={16} />
                      </button>
                   </div>
                </div>
                <div className="relative z-10">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-3">{cat.name}</h3>
                   <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${cat.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{cat.active ? 'Active' : 'Inactive'}</p>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{currentCategory?.id ? 'Edit Category' : 'New Category'}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure category properties</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Category Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={currentCategory?.name || ''}
                  onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                  placeholder="e.g. FAST FOOD"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Description</label>
                <textarea 
                  value={currentCategory?.description || ''}
                  onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all h-32 resize-none"
                  placeholder="Tell us more about this category..."
                />
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800">Status</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enable or disable category visibility</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setCurrentCategory({...currentCategory, active: !currentCategory.active})}
                  className={`w-16 h-8 rounded-full transition-all relative ${currentCategory?.active ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${currentCategory?.active ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={18} /> {currentCategory?.id ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-2xl transition-all">
     <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all ${color.split(' ')[0]} ${color.split(' ')[1]}`}>
        <Icon size={32} />
     </div>
     <div>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
     </div>
  </div>
);

export default Categories;
