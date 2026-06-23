import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  CreditCard, 
  User,
  ShoppingBag,
  MoreVertical,
  RefreshCw,
  Trash2,
  Plus,
  Minus,
  Check,
  X as XIcon,
  RotateCcw,
  Edit2,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';
import Pagination from '../components/Pagination';

interface OrderItem {
  id?: number;
  productName: string;
  quantity: number;
  price: number;
  productId: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface UserData {
  name: string;
  mobileNumber: string;
}

interface Order {
  id: number;
  orderNumber: string;
  displayOrderId: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  user: UserData;
  items: OrderItem[];
}

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

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Action Menu & Edit Modal States
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editingItems, setEditingItems] = useState<OrderItem[]>([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [showQRMenu, setShowQRMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate, statusFilter, paymentFilter, currentPage, pageSize, debouncedSearchQuery]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/products?size=1000`);
      if (response.ok) {
        const data = await response.json();
        setAllProducts(Array.isArray(data) ? data : (data.content || []));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('archived', 'false'); // Only show live orders
      if (startDate) params.append('startDate', `${startDate}T00:00:00`);
      if (endDate) params.append('endDate', `${endDate}T23:59:59`);
      if (statusFilter) params.append('status', statusFilter);
      if (paymentFilter) params.append('paymentType', paymentFilter);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());

      const response = await apiFetch(`http://${window.location.hostname}:8080/api/orders/all?${params.toString()}`);
      const data = await response.json();
      
      if (data && data.content && Array.isArray(data.content)) {
        setOrders(data.content);
        setTotalElements(data.totalElements);
        
        // If we have a selected order, try to refresh it from the data list
        if (selectedOrder) {
          const updated = data.content.find((o: Order) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        } else if (data.content.length > 0) {
          setSelectedOrder(data.content[0]);
        }
      } else {
        console.error('API did not return a valid Page object:', data);
        setOrders([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: number) => {
    try {
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      
      if (response.ok) {
        fetchOrders();
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleMarkUndelivered = async (orderId: number) => {
    try {
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' })
      });
      
      if (response.ok) {
        setShowActionMenu(false);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error marking undelivered:', error);
    }
  };

  const handleEditOrder = () => {
    if (!selectedOrder) return;
    setEditingItems([...selectedOrder.items]);
    setIsEditModalOpen(true);
    setShowActionMenu(false);
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const newItems = [...editingItems];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    setEditingItems(newItems);
  };

  const removeItem = (index: number) => {
    setEditingItems(editingItems.filter((_, i) => i !== index));
  };

  const addProductToOrder = (product: Product) => {
    // Check if product already in list
    const existing = editingItems.findIndex(item => item.productId === product.id);
    if (existing !== -1) {
      updateItemQuantity(existing, 1);
    } else {
      setEditingItems([...editingItems, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
    setEditSearchQuery('');
  };

  const editTotal = useMemo(() => {
    return editingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [editingItems]);

  const saveOrderEdits = async () => {
    if (!selectedOrder) return;
    setIsUpdatingOrder(true);
    try {
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedOrder,
          items: editingItems,
          totalAmount: editTotal
        })
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        fetchOrders();
      } else {
        alert('Failed to update order details');
      }
    } catch (error) {
      console.error('Error saving edits:', error);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handlePrintQR = () => {
    const canvas = document.querySelector('.qr-canvas canvas') as HTMLCanvasElement;
    if (!canvas || !selectedOrder) return;
    
    const qrDataURL = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - Order #${selectedOrder.displayOrderId}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
              img { width: 300px; height: 300px; }
              .order-info { margin-top: 40px; text-align: center; }
              h1 { margin: 0; font-size: 24px; }
              p { margin: 5px 0; color: #666; }
            </style>
          </head>
          <body>
            <img src="${qrDataURL}" />
            <div class="order-info">
              <h1>Order #${selectedOrder.displayOrderId}</h1>
              <p>Scan to verify at terminal</p>
              <p>Customer: ${selectedOrder.user?.name || 'Walk-in'}</p>
            </div>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 100);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleRegenerateQR = async () => {
    if (!selectedOrder) return;
    setIsRegenerating(true);
    try {
      const newOrderNumber = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedOrder,
          orderNumber: newOrderNumber
        })
      });

      if (response.ok) {
        fetchOrders(); // This will refresh the whole list and the selected order
        setShowQRMenu(false);
      } else {
        alert('Failed to regenerate sync ID');
      }
    } catch (error) {
      console.error('Error regenerating QR:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!editSearchQuery.trim()) return [];
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(editSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(editSearchQuery.toLowerCase())
    ).slice(0, 5); // Limit results
  }, [allProducts, editSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PAID': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#f8fafc] overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4 max-w-[1600px] mx-auto">
          {/* Date Picker */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 gap-2 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
            <Calendar size={18} className="text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent border-none text-sm font-medium text-slate-700 outline-none" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-300">|</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-sm font-medium text-slate-700 outline-none" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Status Select */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 gap-2 min-w-[140px]">
            <Filter size={18} className="text-slate-400" />
            <select 
              className="bg-transparent border-none text-sm font-medium text-slate-700 outline-none w-full cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Type */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 gap-2 min-w-[140px]">
            <CreditCard size={18} className="text-slate-400" />
            <select 
              className="bg-transparent border-none text-sm font-medium text-slate-700 outline-none w-full cursor-pointer"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">Payment Type</option>
              <option value="UPI">UPI Payment</option>
              <option value="CREDIT">Credit</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 gap-3 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all shadow-inner">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Order ID, Customer Name, Mobile..." 
              className="bg-transparent border-none text-sm w-full outline-none text-slate-700 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            title="Filter orders by date and criteria"
            className="bg-primary hover:bg-opacity-90 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            Apply Filters
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setPaymentFilter('');
              setStartDate(format(new Date(), 'yyyy-MM-dd'));
              setEndDate(format(new Date(), 'yyyy-MM-dd'));
            }}
            className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            title="Clear Filters"
          >
            <RefreshCw size={18} />
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex max-w-[1800px] mx-auto w-full p-4 gap-4">
        {/* Left Column: Orders List */}
        <div className="w-[400px] flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar pb-4 shrink-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
              <RefreshCw className="animate-spin" size={20} />
              <span>Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-slate-600 font-semibold mb-1">No orders found</h3>
              <p className="text-slate-400 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            orders.map((order) => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`group relative bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] ${
                  selectedOrder?.id === order.id 
                    ? 'border-primary ring-1 ring-primary shadow-md' 
                    : 'border-slate-200 hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Grand Total</div>
                    <div className="text-lg font-black text-slate-900 leading-none">₹{order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-medium mb-1">Order #</div>
                    <div className="text-2xl font-black text-slate-800 leading-none tracking-tight">#{order.displayOrderId || order.id}</div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md w-fit uppercase">
                      <CreditCard size={12} />
                      {order.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700 mb-1 truncate max-w-[150px]">
                      {order.user?.name || 'Anonymous User'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {format(new Date(order.createdAt), 'dd/MM/yy HH:mm')}
                    </div>
                    <div className="mt-3 text-[10px] inline-flex items-center gap-1 font-bold px-2 py-0.5 bg-[#001828] text-white rounded shadow-sm uppercase">
                      <User size={10} />
                      {order.user?.name ? 'REGISTERED' : 'WALK-IN'}
                    </div>
                  </div>
                </div>
                
                {selectedOrder?.id === order.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                )}
              </div>
            ))
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

        {/* Right Column: Order Details */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden relative mb-4">
          {selectedOrder ? (
            <>
              {/* Order Detail Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-3 rounded-xl text-white shadow-lg shadow-primary/10">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight uppercase">
                       Active Order #{selectedOrder.displayOrderId || selectedOrder.id}
                    </h2>
                    <p className="text-xs text-slate-400 font-black tracking-[0.2em] uppercase">Session ID: {selectedOrder.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-3">
                     <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Creation Time</div>
                     <div className="text-xs font-bold text-slate-700">{format(new Date(selectedOrder.createdAt), 'HH:mm:ss')}</div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase border shadow-sm ${getStatusColor(selectedOrder.status)}`}>
                     {selectedOrder.status}
                  </div>
                </div>
              </div>

              {/* Tabs Container */}
              <div className="px-6 bg-white border-b border-slate-50 flex gap-8 shrink-0">
                {['Orders', 'Payment Information', 'Customer Details'].map((tab, idx) => (
                  <button 
                    key={tab}
                    className={`py-4 text-xs font-bold uppercase tracking-widest relative transition-colors ${
                      idx === 0 ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                    {idx === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </button>
                ))}
              </div>

              {/* Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                         <User size={28} />
                      </div>
                      <div>
                         <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Customer Info</div>
                         <div className="text-lg font-black text-slate-800 leading-none mb-1">{selectedOrder.user?.name || 'Walk-in Customer'}</div>
                         <div className="text-xs font-bold text-slate-400">{selectedOrder.user?.mobileNumber || 'No Contact Data'}</div>
                      </div>
                   </div>
                   <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex items-center gap-6 relative">
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                         <CreditCard size={28} />
                      </div>
                      <div>
                         <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Payment Method</div>
                         <div className="text-lg font-black text-slate-800 leading-none mb-1">{selectedOrder.paymentMethod.toUpperCase()}</div>
                         <div className="text-xs font-bold text-primary">Secure Sync ID: {selectedOrder.orderNumber.split('-')[1] || '000'}</div>
                      </div>
                      
                      {/* Interactive Controls Overlay for active orders */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {selectedOrder.status.toUpperCase() !== 'COMPLETED' && selectedOrder.status.toUpperCase() !== 'DELIVERED' && (
                          <button 
                            onClick={handleEditOrder}
                            className="p-2 bg-white rounded-lg border border-slate-200 text-primary shadow-sm hover:border-primary/50 transition-all active:scale-95 cursor-pointer"
                            title="Edit Order"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <div className="relative action-menu-container">
                          <button 
                            onClick={() => setShowActionMenu(!showActionMenu)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${showActionMenu ? 'bg-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'}`}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {showActionMenu && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in duration-200">
                              <button 
                                onClick={() => handleMarkUndelivered(selectedOrder.id)}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <RotateCcw size={14} className="text-amber-500" /> Mark Undelivered
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Items</h3>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Price</h3>
                  </div>
                  
                  <div className="divide-y divide-slate-50">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-5 flex justify-between items-center group hover:bg-slate-50/50 transition-colors rounded-lg -mx-2 px-2">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                             {item.productName.substring(0, 2)}
                           </div>
                           <div>
                              <div className="font-black text-slate-800 text-sm">{item.productName}</div>
                              <div className="text-xs text-slate-400 font-medium">Standard Portion</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <div className="text-sm font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</div>
                              <div className="text-[10px] font-bold text-slate-400">
                                {item.quantity} x <span className="text-primary font-black">₹{item.price}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Summary Panel */}
              <div className="bg-[#001828] p-8 text-white relative shrink-0">
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                
                <div className="flex justify-between relative z-10">
                   <div className="flex gap-12 items-center">
                      <div>
                        <div className="text-[10px] text-primary/80 uppercase font-black tracking-widest mb-2">Unique Items</div>
                        <div className="text-2xl font-black">{selectedOrder.items.length} Items</div>
                      </div>
                      
                      {/* QR Verification Section */}
                      <div className="flex items-center gap-5 pl-12 border-l border-white/10">
                        <div className="relative">
                          <div 
                            onClick={() => setShowQRMenu(!showQRMenu)}
                            className="p-1.5 bg-white rounded-lg shadow-sm transition-all hover:scale-105 hover:ring-2 hover:ring-white/50 cursor-pointer qr-canvas relative group"
                          >
                            <QRCodeCanvas 
                              value={selectedOrder.orderNumber} 
                              size={60} 
                              level="H"
                              includeMargin={false}
                            />
                            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors rounded-lg flex items-center justify-center">
                              <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          {showQRMenu && (
                            <div className="absolute bottom-full left-0 mb-4 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">Sync Actions</div>
                              <button 
                                onClick={handlePrintQR}
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Printer size={16} className="text-emerald-500" /> Print Sync Token
                              </button>
                              <button 
                                onClick={handleRegenerateQR}
                                disabled={isRegenerating}
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <RefreshCw size={16} className={`text-primary ${isRegenerating ? 'animate-spin' : ''}`} /> 
                                {isRegenerating ? 'Regenerating...' : 'Regenerate Sync ID'}
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[9px] text-primary/80 uppercase font-black tracking-widest mb-0.5">Verification</div>
                          <div className="text-[10px] font-black text-white uppercase tracking-tighter opacity-80">Manual Sync ID</div>
                        </div>
                      </div>
                   </div>

                   <div className="text-right flex flex-col gap-1 min-w-[250px]">
                      <div className="text-[10px] text-primary/80 uppercase font-black tracking-widest mb-1">Active Grand Total</div>
                      <div className="text-4xl font-black text-emerald-400 leading-none mb-1">₹{selectedOrder.totalAmount.toLocaleString()}</div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">{selectedOrder.status === 'COMPLETED' ? 'Transaction Completed' : 'Transaction Pending Approval'}</div>
                   </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/10 flex gap-4 relative z-10">
                  <button 
                    onClick={() => handlePrintQR()}
                    className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/20 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={16} /> Print Token
                  </button>
                  <button 
                    onClick={() => handleApproveOrder(selectedOrder.id)}
                    disabled={selectedOrder.status.toUpperCase() === 'COMPLETED'}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] cursor-pointer ${
                      selectedOrder.status.toUpperCase() === 'COMPLETED'
                        ? 'bg-emerald-500 text-white cursor-not-allowed opacity-80'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-950/20'
                    }`}
                  >
                    {selectedOrder.status.toUpperCase() === 'COMPLETED' ? 'Session Completed' : 'Approve & Release'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <ShoppingBag size={48} className="text-slate-200" />
              </div>
              <h3 className="text-slate-600 font-bold text-lg mb-2">Select an order to view details</h3>
              <p className="max-w-xs mx-auto text-sm">Pick an order from the list on the left to see full transaction history, items, and customer info.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Order Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-2.5 rounded-xl text-white">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Order Items</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order #{selectedOrder?.displayOrderId || selectedOrder?.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-all hover:rotate-90 cursor-pointer"
              >
                <XIcon size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Left Column: Line Items */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar border-r border-slate-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Items</h3>
                  <span className="text-[10px] font-black bg-indigo-50 text-primary px-2.5 py-1 rounded-full uppercase tracking-widest">{editingItems.length} Total</span>
                </div>
                
                <div className="space-y-3">
                  {editingItems.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                       <ShoppingBag className="mx-auto text-slate-300 mb-2" size={32} />
                       <p className="text-sm font-bold text-slate-400">No items in this order</p>
                    </div>
                  ) : (
                    editingItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-primary/50 hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center font-black text-slate-400 text-xs uppercase border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                            {item.productName.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{item.productName}</div>
                            <div className="text-[10px] font-black text-primary uppercase">₹{item.price} each</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                            <button 
                              onClick={() => updateItemQuantity(idx, -1)}
                              className="p-1.5 hover:bg-white hover:text-rose-500 rounded-lg transition-all active:scale-90 cursor-pointer"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center text-sm font-black text-slate-700">{item.quantity}</span>
                            <button 
                              onClick={() => updateItemQuantity(idx, 1)}
                              className="p-1.5 hover:bg-white hover:text-emerald-500 rounded-lg transition-all active:scale-90 cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <div className="text-sm font-black text-slate-900 leading-none mb-1">₹{(item.price * item.quantity).toFixed(2)}</div>
                            <button 
                              onClick={() => removeItem(idx)}
                              className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors flex items-center gap-1 active:scale-95 cursor-pointer mx-auto"
                            >
                              <Trash2 size={10} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Search Items to Add */}
              <div className="w-[350px] bg-slate-50/50 p-8 flex flex-col shrink-0">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Add Items</h3>
                <div className="relative mb-6">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                     <Plus size={16} />
                   </div>
                   <input 
                     type="text"
                     placeholder="Search food items..."
                     className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                     value={editSearchQuery}
                     onChange={(e) => setEditSearchQuery(e.target.value)}
                   />
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => addProductToOrder(product)}
                        className="w-full text-left p-3 bg-white border border-slate-100 rounded-xl hover:border-primary hover:shadow-md transition-all group flex justify-between items-center animate-in slide-in-from-right-4 duration-300 cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{product.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.category}</div>
                        </div>
                        <div className="font-black text-emerald-600 text-xs">₹{product.price}</div>
                      </button>
                    ))
                  ) : editSearchQuery ? (
                    <div className="text-center py-6 text-slate-400 italic text-sm">No items matching your search</div>
                  ) : (
                    <div className="text-center py-6 flex flex-col items-center gap-2">
                       <div className="bg-white p-3 rounded-2xl shadow-sm text-slate-200">
                         <Search size={24} />
                       </div>
                       <p className="text-xs font-bold text-slate-400 max-w-[150px] mx-auto">Start typing to add delicious items to the order</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Order Total</span>
                      <span className="text-2xl font-black text-emerald-600 tracking-tighter">₹{editTotal.toFixed(2)}</span>
                   </div>
                   <button 
                    onClick={saveOrderEdits}
                    disabled={isUpdatingOrder || editingItems.length === 0}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                      isUpdatingOrder || editingItems.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#001828] text-white hover:bg-slate-900'
                    }`}
                   >
                     {isUpdatingOrder ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                     {isUpdatingOrder ? 'Updating...' : 'Update Order'}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .action-menu-container .animate-in {
          transform-origin: top right;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .flex-1.bg-white.border.border-slate-200.rounded-2xl, 
          .flex-1.bg-white.border.border-slate-200.rounded-2xl * {
            visibility: visible;
          }
          .flex-1.bg-white.border.border-slate-200.rounded-2xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
          button, 
          .px-6.bg-white.border-b.border-slate-50.flex.gap-8,
          .action-menu-container {
            display: none !important;
          }
          .p-8 {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Orders;
