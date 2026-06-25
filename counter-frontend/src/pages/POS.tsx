import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  UtensilsCrossed,
  Coffee,
  IceCream,
  Pizza,
  Cake,
  Phone,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageData?: string;
}

const getCategoryIcon = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes('ICE')) return IceCream;
  if (cat.includes('JUICE') || cat.includes('DRINK')) return UtensilsCrossed;
  if (cat.includes('COFFEE') || cat.includes('TEA') || cat.includes('BISCUIT')) return Coffee;
  if (cat.includes('PIZZA') || cat.includes('SNACK')) return Pizza;
  if (cat.includes('CAKE') || cat.includes('SWEET') || cat.includes('CHOCO')) return Cake;
  return UtensilsCrossed;
};

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['ALL']);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const [prodRes, catRes] = await Promise.all([
        fetch(`http://${host}:8080/api/products?size=1000`),
        fetch(`http://${host}:8080/api/products/categories`)
      ]);

      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.content || []);
      }

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(['ALL', ...data]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p) return false;
      const search = (searchQuery || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const matchesSearch = name.includes(search);
      const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCompleteOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const host = window.location.hostname;
      const orderData = {
        userId: 1, // Using test user ID
        totalAmount: total,
        paymentMethod: "CASH", // Default to CASH for now
        status: "COMPLETED",
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const token = sessionStorage.getItem('counterToken');
      const response = await fetch(`http://${host}:8080/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        alert("Order placed successfully! Stock has been updated.");
        setCart([]);
        fetchInitialData();
      } else {
        let errorMessage = "Unknown error";
        try {
          const responseText = await response.text();
          try {
            const err = JSON.parse(responseText);
            errorMessage = err.error || err.message || JSON.stringify(err);
          } catch (e) {
            errorMessage = responseText || response.statusText;
          }
        } catch (e) {
          errorMessage = response.statusText;
        }
        alert(`Failed to place order: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("Network error while placing order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Left Section: Menu */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Categories Bar */}
        <div className="p-4 bg-white border-b border-slate-200 overflow-x-auto no-scrollbar">
          <div className="flex gap-4">
            {categories.map((catName) => {
              const Icon = getCategoryIcon(catName);
              return (
                <button
                  key={catName}
                  onClick={() => setActiveCategory(catName)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all border-2 whitespace-nowrap ${activeCategory === catName
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-white text-slate-400 border-indigo-50 hover:border-primary/30'
                    }`}
                >
                  <Icon size={16} />
                  {catName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Products Grid */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          <div className="relative group max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
            />
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag size={64} className="mb-4 opacity-20" />
              <p className="font-bold">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <motion.div
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group flex flex-col relative"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${(product.stock || 0) < 20 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                      }`}>
                      {product.stock || 0} left
                    </span>
                  </div>

                  <div className="aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-200 group-hover:bg-primary/5 transition-colors overflow-hidden">
                    {product.imageData ? (
                      <img src={product.imageData} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={48} />
                    )}
                  </div>

                  <h3 className="text-xs font-black text-slate-800 leading-snug mb-1 line-clamp-2 uppercase">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <p className="text-lg font-black text-primary">🅡{product.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Current Order */}
      <div className="w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Current Order</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <Phone size={10} className="text-primary" /> +91 9043941910
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-colors">View Orders</button>
            <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase shadow-lg shadow-primary/20">{cart.length} items</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-4">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
                  <ShoppingBag size={40} className="text-slate-200" />
                </div>
                <div>
                  <h3 className="font-black text-slate-600">Cart is empty</h3>
                  <p className="text-xs font-medium">Select products to start billing</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="bg-[#ebfaf4] border border-[#d1f4e6] rounded-[2rem] p-5 relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-12">
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight">{item.name}</h4>
                      <p className="text-[10px] font-bold text-[#42ab7e] mt-1 uppercase">🅡{item.price} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-9 h-9 bg-white text-rose-500 rounded-xl flex items-center justify-center shadow-sm border border-rose-50 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-slate-50">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-black text-sm text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 tracking-tight">🅡{item.price * item.quantity}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[3rem]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-black text-slate-900">Total:</span>
            <span className="text-4xl font-black text-primary tracking-tighter">🅡{total}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={handleCompleteOrder}
            className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            Complete Order
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      ` }} />
    </div>
  );
};

export default POS;
