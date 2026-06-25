import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import Header from '../components/Header';
import { useCart } from '../contexts/CartContext';
import './CartScreen.css';

const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="container empty-cart-container">
        <Header title="Cart" />
        <div className="empty-cart-content">
          <ShoppingBag size={80} className="empty-cart-icon" />
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-subtitle">Look like you haven't added anything to your cart yet.</p>
          <button className="primary-button" onClick={() => navigate('/')}>
            Explore Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <Header title="Cart" showCart={false} />
      
      <main className="safe-area-bottom">
        <div className="cart-items-section">
          {cart.map((item) => (
            <div key={item.id} className="cart-item-row">
              <div className="cart-item-image-box">
                <img src={item.image} alt={item.name} className="cart-item-image" />
              </div>
              
              <div className="cart-item-info">
                <div className="cart-item-header">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <button onClick={() => removeFromCart(item.id)} className="remove-item">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="cart-item-footer">
                  <span className="cart-item-price">🅡{(item.price * item.quantity).toFixed(2)}</span>
                  
                  <div className="cart-quantity-controls">
                    <button onClick={() => updateQuantity(item.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="cart-quantity">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bill-details">
          <h2 className="section-title">Bill Details</h2>
          <div className="bill-row">
            <span>Item Total</span>
            <span>🅡{totalPrice.toFixed(2)}</span>
          </div>
          <div className="bill-row">
            <span>Delivery Fee</span>
            <span className="free">FREE</span>
          </div>
          <div className="bill-row">
            <span>Taxes and Charges</span>
            <span>🅡2.50</span>
          </div>
          <div className="bill-row total">
            <span>To Pay</span>
            <span>🅡{(totalPrice + 2.5).toFixed(2)}</span>
          </div>
        </div>
      </main>

      <div className="cart-footer">
        <div className="footer-total">
          <span className="items-count">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
          <span className="final-price">🅡{(totalPrice + 2.5).toFixed(2)}</span>
        </div>
        <button 
          className="checkout-button"
          onClick={() => navigate('/checkout')}
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default CartScreen;
