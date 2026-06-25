import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  ChevronRight, 
  AlertCircle,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';
import tokenImage from '../assets/display_ritz.png';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import StockConflictModal from '../components/StockConflictModal';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useFood } from '../contexts/FoodContext';
import './CheckoutScreen.css';

const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const { refreshData } = useFood();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(user?.ritzTokenBalance || 0);
  
  // Conflict state
  const [stockConflicts, setStockConflicts] = useState<any[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:8080/api/wallet/balance/${user.id}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      setCurrentBalance(data.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const isInsufficient = currentBalance < totalPrice;

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (isInsufficient) {
      alert('Insufficient Ritz Tokens. Please top up your wallet.');
      return;
    }
    
    setIsProcessing(true);

    const orderData = {
      userId: user.id,
      totalAmount: totalPrice,
      paymentMethod: 'RITZ_TOKEN',
      orderType: 'MY_ORDER',
      items: cart.map(item => ({
        productId: Number(item.id),
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        stallId: item.stallId ? Number(item.stallId) : null,
        stallName: item.stallName || null
      })),
      user: { id: user.id } // Backend needs user object for token deduction
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:8080/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (data.success) {
        await refreshData();
        clearCart();
        navigate('/success', { 
          state: { 
            orderNumber: data.orderNumber, 
            displayOrderId: data.displayOrderId 
          } 
        });
      } else if (data.errorType === 'STOCK_ERROR') {
        setStockConflicts(data.conflicts || []);
        setShowConflictModal(true);
        await refreshData(true);
      } else if (data.errorType === 'TOKEN_ERROR') {
        alert(data.message || 'Insufficient Tokens');
        fetchBalance(); // Sync balance
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Error connecting to server. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveConflictItem = (productId: number) => {
    removeFromCart(productId.toString());
    const remaining = stockConflicts.filter(c => c.productId !== productId);
    setStockConflicts(remaining);
    if (remaining.length === 0) setShowConflictModal(false);
  };

  const handleAdjustConflictQuantity = (productId: number, newQty: number) => {
    const item = cart.find(i => i.id === productId.toString());
    if (item) {
      const delta = newQty - item.quantity;
      updateQuantity(productId.toString(), delta);
    }
    const remaining = stockConflicts.filter(c => c.productId !== productId);
    setStockConflicts(remaining);
    if (remaining.length === 0) setShowConflictModal(false);
  };

  return (
    <div className="container checkout-page">
      <Header title="Checkout" showCart={false} />
      
      <main className="safe-area-bottom">
        <section className="checkout-section">
          <div className="section-header">
            <h2 className="section-title">Payment Method</h2>
            <p className="section-subtitle">Food orders are paid using Ritz Tokens</p>
          </div>
          
          <div className="payment-options">
            <div className={`payment-card ritz-payment-card ${isInsufficient ? 'insufficient-state' : 'selected'}`}>
              <div className="payment-icon ritz-token-avatar">
                <img src={tokenImage} alt="Ritz Token" className="token-image-main" />
              </div>
              <div className="payment-info">
                <div className="payment-name-row">
                  <span className="payment-name">Pay with Ritz Tokens</span>
                  {isInsufficient && (
                    <motion.span 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="status-badge-premium error"
                    >
                      Insufficient
                    </motion.span>
                  )}
                </div>
                <div className="wallet-balance-info">
                  <Wallet size={14} className={isInsufficient ? 'text-rose-400' : ''} />
                  <span>Your Balance: </span>
                  <span className={`balance-val ${isInsufficient ? 'insufficient-val' : ''}`}>
                    🅡{currentBalance.toLocaleString()}
                  </span>
                </div>
              </div>
              {!isInsufficient && (
                <div className="selection-radio">
                  <div className="radio-inner" />
                </div>
              )}
            </div>

            {isInsufficient && (
              <motion.button 
                className="add-tokens-checkout-btn"
                onClick={() => navigate('/topup')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="btn-content">
                  <PlusCircle size={20} />
                  <span>Top up Ritz Tokens</span>
                </div>
                <ChevronRight size={18} />
              </motion.button>
            )}
          </div>

          <div className="payment-security-note">
            <ShieldCheck size={14} />
            <span>Secured by Ritz Token Protocol. 1 Token = 🅡1.00</span>
          </div>
        </section>

        <div className="order-summary-mini">
          <div className="summary-row">
            <span>Tokens to be deducted</span>
            <span className="summary-price ritz-text">🅡{totalPrice.toLocaleString()}</span>
          </div>
          <p className="tax-info">Exclusive of any platform bonuses</p>
        </div>

        {isInsufficient && (
          <motion.div 
            className="insufficient-warning-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="warning-icon-wrapper token-warning-visual">
              <img src={tokenImage} alt="" className="token-image-mini" />
              <div className="warning-icon-overlay">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="warning-content">
              <div className="shortfall-amount">
                Short by <span className="highlight">🅡{(totalPrice - currentBalance).toLocaleString()}</span>
              </div>
              <p className="warning-instruction">Add tokens to your wallet to complete this order.</p>
            </div>
          </motion.div>
        )}
      </main>

      <div className="checkout-footer">
        <button 
          className="place-order-button ritz-order-btn"
          onClick={handlePlaceOrder}
          disabled={isProcessing || isInsufficient}
        >
          {isProcessing ? (
            <div className="loading-spinner-small" />
          ) : isInsufficient ? (
            'Insufficient Tokens'
          ) : (
            `Pay 🅡${totalPrice.toLocaleString()} & Place Order`
          )}
        </button>
      </div>

      <AnimatePresence>
        {showConflictModal && (
          <StockConflictModal 
            conflicts={stockConflicts}
            onRemoveItem={handleRemoveConflictItem}
            onAdjustQuantity={handleAdjustConflictQuantity}
            onClose={() => navigate('/cart')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutScreen;
