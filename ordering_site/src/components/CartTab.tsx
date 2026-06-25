import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './CartTab.css';

const CartTab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, totalPrice } = useCart();

  if (totalItems === 0) return null;

  const isItemPage = location.pathname.startsWith('/item/');

  return (
    <div className={`cart-tab-container ${isItemPage ? 'has-footer' : ''}`}>
      <div className="cart-tab">
        <div className="cart-left-info" onClick={() => navigate('/cart')}>
          <div className="cart-stats">
            <ShoppingBag size={16} className="cart-icon" />
            <span className="cart-tab-count">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="cart-total">🅡{totalPrice.toFixed(0)}</div>
        </div>
        
        <button className="place-order-btn" onClick={() => navigate('/checkout')}>
          Place Order
          <ChevronRight size={18} className="chevron-icon" />
        </button>
      </div>
    </div>
  );
};

export default CartTab;
