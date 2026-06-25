import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, User, ShoppingBag, LogOut } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import tilloLogo from '../assets/Tillo.png';
import './Header.css';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  showCart?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, showCart = true }) => {
  const navigate = useNavigate();
  const { totalItems, totalPrice } = useCart();
  const { user, logout } = useAuth();

  const handleBack = onBack || (() => navigate(-1));

  return (
    <header className="app-header">
      <div className="header-left">
        {onBack || (title && title !== "Tillo Canteen") ? (
          <button onClick={handleBack} className="back-button">
            <ArrowLeft size={20} />
          </button>
        ) : null}

        {title && title !== "Tillo Canteen" ? (
          <h1 className="header-title">{title}</h1>
        ) : (
          <div className="header-logo-container">
            <img 
              src={tilloLogo} 
              alt="Tillo Logo" 
              className="header-logo" 
              onClick={() => navigate('/')} 
            />
            <span className="header-tagline">Till yo tummy is full...</span>
          </div>
        )}
      </div>

      <div className="header-right">
        {user ? (
          <div className="user-profile-section">
            <button className="icon-button logout" onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
              }
            }}>
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button className="icon-button profile" onClick={() => navigate('/login')}>
            <User size={20} />
          </button>
        )}
        
        <button className="icon-button">
          <Bell size={20} />
        </button>
        
        {showCart && (
          <button 
            className={`cart-pill ${totalItems > 0 ? 'active' : ''}`}
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag size={18} />
            {totalItems > 0 ? (
              <>
                <span className="cart-count">{totalItems}</span>
                <span className="cart-price">🅡{totalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="cart-text">Cart</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
