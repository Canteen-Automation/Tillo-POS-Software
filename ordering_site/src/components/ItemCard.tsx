import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FoodItem } from '../types';
import { useCart } from '../contexts/CartContext';
import { Star } from 'lucide-react';
import './ItemCard.css';

interface ItemCardProps {
  item: FoodItem;
  isLast?: boolean;
  variant?: 'carousel' | 'list';
}

const ItemCard: React.FC<ItemCardProps> = ({ item, isLast, variant = 'list' }) => {
  const navigate = useNavigate();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);
  const isLimitReached = item.stock !== undefined && quantity >= item.stock && item.stock > 0;

  // Visual helper values matching mockup metadata
  const rating = 4.5;

  if (variant === 'carousel') {
    return (
      <div 
        className={`item-card-carousel ${item.stock === 0 ? 'out-of-stock' : ''}`}
        onClick={() => navigate(`/item/${item.id}`)}
      >
        <div className="carousel-rating-badge">
          <Star size={10} fill="currentColor" className="star-icon-filled" />
          <span>{rating}</span>
        </div>

        <div className="carousel-image-container">
          {item.image ? (
            <img src={item.image} alt={item.name} className="carousel-image" />
          ) : (
            <div className="carousel-placeholder">🍲</div>
          )}
        </div>

        <div className="carousel-info">
          <h3 className="carousel-item-name">{item.name}</h3>
          <p className="carousel-vendor">{item.stallName || 'Cookie Heaven'}</p>

          <div className="carousel-footer" onClick={(e) => e.stopPropagation()}>
            <span className="carousel-price">🅡{item.price.toFixed(2)}</span>
            <div className="carousel-action-container">
              {quantity === 0 ? (
                <button 
                  className="carousel-plus-btn"
                  onClick={() => addToCart(item)}
                  disabled={item.stock === 0}
                >
                  +
                </button>
              ) : (
                <div className="carousel-qty-controls">
                  <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                  <span className="carousel-qty">{quantity}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    disabled={isLimitReached}
                  >+</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // default 'list' layout
  return (
    <div 
      className={`item-card-list ${isLast ? 'last' : ''} ${item.stock === 0 ? 'out-of-stock' : ''} ${isLimitReached ? 'limit-reached' : ''}`} 
      onClick={() => navigate(`/item/${item.id}`)}
    >
      <div className="list-image-container" onClick={(e) => e.stopPropagation()}>
        {item.image ? (
          <img src={item.image} alt={item.name} className="list-image" />
        ) : (
          <div className="list-placeholder">🍲</div>
        )}
        {item.isPopular && <span className="bestseller-badge">Bestseller</span>}
        {item.stock === 0 && <span className="soldout-badge">Sold Out</span>}
      </div>

      <div className="list-info">
        <div className="list-title-row">
          <h3 className="list-item-name">{item.name}</h3>
          <div className="list-rating-badge">
            <Star size={10} fill="currentColor" className="star-icon-filled" />
            <span>{rating}</span>
          </div>
        </div>

        <p className="list-vendor">{item.stallName || 'Cookie Heaven'}</p>
        <p className="list-address">📍 54 Summit Street</p>

        <div className="list-footer" onClick={(e) => e.stopPropagation()}>
          <span className="list-price">🅡{item.price.toFixed(2)}</span>
          
          <div className="list-action-container">
            {quantity === 0 ? (
              <button 
                className="list-add-btn"
                onClick={() => addToCart(item)}
                disabled={item.stock === 0}
              >
                + Add
              </button>
            ) : (
              <div className="list-qty-controls">
                <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                <span className="list-qty">{quantity}</span>
                <button 
                  onClick={() => addToCart(item)}
                  disabled={isLimitReached}
                >+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
