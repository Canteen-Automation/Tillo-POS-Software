import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShoppingBag as ShoppingBagIcon, ChevronRight as ChevronRightIcon, X, RefreshCcw, AlertCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../contexts/AuthContext';
import { useFood } from '../contexts/FoodContext';
import { useCart } from '../contexts/CartContext';
import type { FoodItem } from '../types';
import './MyOrdersScreen.css';

interface Order {
  id: number;
  orderNumber: string;
  displayOrderId: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  isArchived: boolean;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

const MyOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { foodItems } = useFood();
  const { addToCart, clearCart } = useCart();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // State for stock alert
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  const [pendingItems, setPendingItems] = useState<FoodItem[]>([]);
  
  const [isCancelling, setIsCancelling] = useState(false);
  const prevOrdersState = React.useRef<Record<number, string>>({});

  const isOrderExpired = (order: Order) => {
    if (order.isArchived) return true;
    const orderDate = new Date(order.createdAt).toDateString();
    const today = new Date().toDateString();
    return orderDate !== today;
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  // Polling for live updates (Sync when Dashboard regenerates QR or changes status)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    // Only poll if there are active (non-finalized) orders
    const hasActiveOrders = orders.some(o => 
      o.status.toUpperCase() !== 'COMPLETED' && 
      o.status.toUpperCase() !== 'CANCELLED'
    );

    if (user?.id && hasActiveOrders) {
      interval = setInterval(() => {
        fetchOrders();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.id, orders]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:8080/api/orders/user/${user?.id}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      const newOrdersState: Record<number, string> = {};
      data.forEach((o: Order) => {
        newOrdersState[o.id] = o.status;
        if (prevOrdersState.current[o.id] === 'CANCEL_PENDING' && (o.status === 'COMPLETED' || o.status === 'DELIVERED')) {
          alert('Order #' + (o.displayOrderId || o.id) + ' has been delivered/completed, so cannot cancel order.');
        }
      });
      prevOrdersState.current = newOrdersState;
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatOrder = (order: Order) => {
    const missing: string[] = [];
    const available: FoodItem[] = [];

    order.items.forEach(orderItem => {
      const currentItem = foodItems.find(fi => fi.name === orderItem.productName);
      
      if (currentItem && currentItem.stock !== undefined && currentItem.stock > 0) {
        // Only add up to available stock
        const canAdd = Math.min(orderItem.quantity, currentItem.stock);
        
        for (let i = 0; i < canAdd; i++) {
          available.push(currentItem);
        }

        if (canAdd < orderItem.quantity) {
          missing.push(`${orderItem.productName} (only ${canAdd} of ${orderItem.quantity} available)`);
        }
      } else {
        missing.push(orderItem.productName); // Item no longer exists or out of stock
      }
    });

    if (missing.length > 0) {
      setUnavailableItems(missing);
      setPendingItems(available);
      setShowStockAlert(true);
    } else {
      // All items available
      performRepeat(available);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:8080/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'CANCEL_PENDING' });
        }
        if (data.message) {
          alert(data.message);
        }
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order');
    } finally {
      setIsCancelling(false);
    }
  };

  const performRepeat = (items: FoodItem[]) => {
    clearCart();
    items.forEach(item => addToCart(item));
    navigate('/cart');
  };

  const handleProceedPartial = () => {
    performRepeat(pendingItems);
    setShowStockAlert(false);
  };

  const latestOrder = orders.length > 0 ? orders[0] : null;
  const previousOrders = orders.length > 1 ? orders.slice(1) : [];

  if (loading) {
    return <div className="container">Loading your orders...</div>;
  }

  return (
    <div className="container orders-page">
      <Header title="My Orders" showCart={false} />
      
      <main className="orders-content safe-area-bottom">
        {orders.length === 0 ? (
          <div className="empty-orders">
            <ShoppingBagIcon size={64} className="empty-icon" />
            <h3>No orders yet</h3>
            <p>Hungry? Place your first order now!</p>
          </div>
        ) : (
          <>
            {/* Latest Order Section */}
            {latestOrder && (
              <section className="latest-order-section">
                <div className="section-label">Active/Latest Order</div>
                <div className="latest-order-card" onClick={() => setSelectedOrder(latestOrder)}>
                  <div className="latest-order-info">
                    <div className="order-main-info">
                      <span className="order-number">Order #{latestOrder.displayOrderId || latestOrder.id}</span>
                      <span className="order-date">{new Date(latestOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="order-status-badge">{latestOrder.status}</div>
                  </div>
                  
                  <div className={`latest-qr-wrapper ${latestOrder.status.toUpperCase() === 'COMPLETED' ? 'qr-completed' : ''} ${latestOrder.status.toUpperCase() === 'CANCELLED' ? 'qr-cancelled' : ''} ${isOrderExpired(latestOrder) ? 'qr-expired' : ''}`}>
                    <div className="qr-container">
                      <QRCodeCanvas value={latestOrder.orderNumber} size={120} className="mini-qr" />
                      {latestOrder.status.toUpperCase() === 'COMPLETED' && (
                        <div className="qr-overlay mini">
                          <span className="overlay-text mini">COMPLETED</span>
                        </div>
                      )}
                      {latestOrder.status.toUpperCase() === 'CANCELLED' && (
                        <div className="qr-overlay mini">
                          <span className="overlay-text mini cancelled">CANCELLED</span>
                        </div>
                      )}
                      {isOrderExpired(latestOrder) && (
                        <div className="qr-overlay mini">
                          <span className="overlay-text mini expired">EXPIRED</span>
                        </div>
                      )}
                    </div>
                    <div className="qr-hint-text">
                      {isOrderExpired(latestOrder) ? 'QR Expired' : (latestOrder.status.toUpperCase() === 'COMPLETED' ? 'Order Fulfilled' : latestOrder.status.toUpperCase() === 'CANCELLED' ? 'Order Cancelled' : latestOrder.status.toUpperCase() === 'CANCEL_PENDING' ? 'Cancellation Processing...' : 'Tap to enlarge QR')}
                    </div>
                  </div>
                  
                  <div className="order-items-summary">
                    {latestOrder.items.map((item, idx) => (
                      <span key={idx}>{item.quantity}x {item.productName}{idx < latestOrder.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                  
                  <div className="order-total-bar">
                    <span>Total Amount</span>
                    <span className="amount-text">R{latestOrder.totalAmount.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="repeat-order-btn mini" 
                      style={{ flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepeatOrder(latestOrder);
                      }}
                    >
                      <RefreshCcw size={16} /> Repeat
                    </button>
                    {latestOrder.status.toUpperCase() !== 'COMPLETED' && latestOrder.status.toUpperCase() !== 'CANCELLED' && latestOrder.status.toUpperCase() !== 'CANCEL_PENDING' && !isOrderExpired(latestOrder) && (
                      <button 
                        className="repeat-order-btn mini" 
                        style={{ flex: 1, backgroundColor: '#fee2e2', color: '#dc2626' }}
                        disabled={isCancelling}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(latestOrder.id);
                        }}
                      >
                        <X size={16} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Previous Orders List */}
            {previousOrders.length > 0 && (
              <section className="previous-orders-section">
                <div className="section-label">Previous Orders</div>
                <div className="orders-list">
                  {previousOrders.map((order) => (
                    <div key={order.id} className="order-item-list" onClick={() => setSelectedOrder(order)}>
                      <div className="order-icon-bg">
                        <Clock size={20} />
                      </div>
                      <div className="order-list-info">
                        <div className="order-list-top">
                          <span className="order-list-number">#{order.displayOrderId}</span>
                          <span className="order-list-price">R{order.totalAmount.toFixed(0)}</span>
                        </div>
                        <div className="order-list-bottom">
                          <span className="order-list-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="order-list-items">{order.items.length} items</span>
                        </div>
                      </div>
                      <ChevronRightIcon size={20} className="list-chevron" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Order Detail Modal / Overlay */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="order-detail-overlay" 
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="order-detail-modal" 
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-details" onClick={() => setSelectedOrder(null)}>
                <X size={24} />
              </button>
              
              <div className="modal-header">
                <h3>Order Details</h3>
                <p className="modal-order-id">Order #{selectedOrder.displayOrderId}</p>
              </div>
              
              <div className={`modal-qr-section ${selectedOrder.status.toUpperCase() === 'COMPLETED' ? 'qr-completed' : ''} ${selectedOrder.status.toUpperCase() === 'CANCELLED' ? 'qr-cancelled' : ''} ${isOrderExpired(selectedOrder) ? 'qr-expired' : ''}`}>
                <div className="qr-container">
                  <QRCodeCanvas value={selectedOrder.orderNumber} size={200} includeMargin={true} />
                  {selectedOrder.status.toUpperCase() === 'COMPLETED' && (
                    <div className="qr-overlay">
                      <span className="overlay-text">COMPLETED</span>
                    </div>
                  )}
                  {selectedOrder.status.toUpperCase() === 'CANCELLED' && (
                    <div className="qr-overlay">
                      <span className="overlay-text cancelled">CANCELLED</span>
                    </div>
                  )}
                  {isOrderExpired(selectedOrder) && (
                    <div className="qr-overlay">
                      <span className="overlay-text expired">EXPIRED</span>
                    </div>
                  )}
                </div>
                <p className="modal-qr-hint">
                  {isOrderExpired(selectedOrder)
                    ? 'QR Expired'
                    : selectedOrder.status.toUpperCase() === 'COMPLETED'
                      ? 'This order has been fulfilled'
                      : selectedOrder.status.toUpperCase() === 'CANCELLED'
                        ? 'This order has been cancelled'
                        : selectedOrder.status.toUpperCase() === 'CANCEL_PENDING'
                          ? 'Cancellation Processing (5 min delay)'
                          : 'Show this QR code at the counter'}
                </p>
                </div>
                <div className="modal-info-list">
                <div className="info-item">
                  <span className="label">Date</span>
                  <span className="value">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <span className="label">Payment</span>
                  <span className="value">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status</span>
                  <span className={`value status-badge ${selectedOrder.status.toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
              
              <div className="modal-items-section">
                <h4>Items Ordered</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="modal-item-row">
                    <span>{item.quantity} x {item.productName}</span>
                    <span>R{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div className="modal-total-row">
                  <span>Grand Total</span>
                  <span>R{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="repeat-order-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => handleRepeatOrder(selectedOrder)}>
                  <RefreshCcw size={18} /> Repeat
                </button>
                {selectedOrder.status.toUpperCase() !== 'COMPLETED' && selectedOrder.status.toUpperCase() !== 'CANCELLED' && selectedOrder.status.toUpperCase() !== 'CANCEL_PENDING' && !isOrderExpired(selectedOrder) && (
                  <button 
                    className="repeat-order-btn" 
                    style={{ flex: 1, marginTop: 0, backgroundColor: '#fee2e2', color: '#dc2626' }}
                    disabled={isCancelling}
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                  >
                    <X size={18} /> Cancel
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Alert Dialog */}
      <AnimatePresence>
        {showStockAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="stock-alert-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="stock-alert-modal"
            >
              <div className="alert-icon-wrapper">
                <AlertCircle size={32} />
              </div>
              <h3>Items Unavailable</h3>
              <p>Some items from your previous order are currently out of stock or unavailable.</p>
              
              <div className="unavailable-items-list">
                {unavailableItems.map((item, idx) => (
                  <div key={idx} className="unavailable-item-chip">
                    <X size={14} /> {item}
                  </div>
                ))}
              </div>

              <div className="alert-actions">
                {pendingItems.length > 0 ? (
                  <button className="btn-proceed" onClick={handleProceedPartial}>
                    Proceed without these items
                  </button>
                ) : (
                  <div style={{ marginBottom: '12px', fontSize: '13px', color: '#e11d48', fontWeight: '600' }}>
                    All items in this order are currently unavailable.
                  </div>
                )}
                <button className="btn-discard" onClick={() => setShowStockAlert(false)}>
                  Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default MyOrdersScreen;
