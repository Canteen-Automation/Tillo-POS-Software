import React from 'react';
import type { FoodItem } from '../types';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { useCart } from '../contexts/CartContext';
import { useFood } from '../contexts/FoodContext';
import CartTab from '../components/CartTab';
import './ItemDetailScreen.css';

const ItemDetailScreen: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { foodItems, isLoading: isGlobalLoading } = useFood();
  const [fetchedItem, setFetchedItem] = React.useState<FoodItem | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  
  const contextItem = foodItems.find((i) => i.id === itemId);
  const item = contextItem || fetchedItem;

  React.useEffect(() => {
    if (!contextItem && itemId) {
      const fetchItem = async () => {
        setIsFetching(true);
        try {
          const response = await fetch(`http://${window.location.hostname}:8080/api/products/${itemId}`);
          if (response.ok) {
            const data = await response.json();
            
            // Map backend product to FoodItem type
            const rawImg = data.imageData?.trim();
            const finalImage = rawImg ? (rawImg.startsWith('data:') ? rawImg : `data:image/png;base64,${rawImg}`) : '';
            
            const stallInfo = data.stalls && data.stalls.length > 0 ? data.stalls[0] : null;
            
            const mappedItem: FoodItem = {
              id: data.id.toString(),
              name: data.name,
              description: data.description || 'Quality food prepared with care',
              price: data.price || data.basePrice || 0,
              category: data.category,
              image: finalImage,
              isVeg: data.veg,
              isPopular: data.active,
              stock: data.stock,
              stallId: stallInfo?.id?.toString(),
              stallName: stallInfo?.name
            };
            setFetchedItem(mappedItem);
          }
        } catch (err) {
          console.error('Error fetching individual product:', err);
        } finally {
          setIsFetching(false);
        }
      };
      fetchItem();
    }
  }, [itemId, contextItem]);
  if (isGlobalLoading || isFetching || !item) {
    if (isGlobalLoading || isFetching) {
      return (
        <div className="container item-loading-wrapper">
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
            <p>Loading Delights...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container item-not-found-wrapper">
        <Header />
        <div className="not-found-content">
          <AlertCircle size={64} className="not-found-icon" />
          <h2>Item Not Found</h2>
          <p>Oops! The item you're looking for seems to have vanished.</p>
          <button className="back-home-btn" onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  const quantity = getItemQuantity(item.id);
  const isLimitReached = item.stock !== undefined && quantity >= item.stock && item.stock > 0;

  return (
    <div className={`container item-detail-page ${item.stock === 0 ? 'out-of-stock' : ''}`}>
      <Header title="" />
      
      <main className="safe-area-bottom">
        <div className="item-hero">
          {item.image ? (
            <img src={item.image} alt={item.name} className="item-hero-image" />
          ) : (
            <div className="item-hero-placeholder">
              <span className="placeholder-emoji">🍲</span>
            </div>
          )}
        </div>

        <div className="item-details-content">
          <div className="item-header-info">
            <div className="item-labels">
              <div className={`veg-icon ${item.isVeg ? 'veg' : 'non-veg'}`}>
                <div className="dot" />
              </div>
              {item.isPopular && <span className="bestseller-badge">Popular</span>}
              {item.stock === 0 && <span className="out-of-stock-badge">Sold Out</span>}
            </div>
            
            <h1 className="item-name-large">{item.name}</h1>
            <p className="item-price-large">R{item.price.toFixed(2)}</p>
          </div>

          <div className="item-description-section">
            <h2 className="section-title">Description</h2>
            <p className="item-long-description">
              {item.longDescription || item.description}
            </p>
          </div>

          <div className="item-extra-info">
            <div className="info-row">
              <span className="info-label">Category</span>
              <span className="info-value">{item.category}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Dietary</span>
              <span className="info-value">{item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Availability</span>
              <span className={`info-value ${item.stock && item.stock > 0 ? 'green' : 'red'}`}>
                {item.stock && item.stock > 0 ? `In Stock (${item.stock} left)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {isLimitReached && (
            <div className="limit-reached-info">
              <AlertCircle size={18} />
              <span>You have reached the maximum available quantity ({item.stock}) for this item.</span>
            </div>
          )}
        </div>
      </main>

      <footer className="item-footer">
        <div className="footer-price-info">
          <span className="total-label">Price</span>
          <span className="total-value">R{(item.price * Math.max(1, quantity)).toFixed(2)}</span>
        </div>
        
        <div className="footer-action">
          {quantity === 0 ? (
            <button 
              className="primary-action-button"
              onClick={() => addToCart(item)}
              disabled={item.stock === 0}
              style={{ opacity: item.stock === 0 ? 0.5 : 1 }}
            >
              {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          ) : (
            <div className="footer-quantity-controls">
              <button onClick={() => updateQuantity(item.id, -1)}>−</button>
              <span className="quantity">{quantity}</span>
              <button 
                onClick={() => addToCart(item)}
                disabled={isLimitReached}
              >+</button>
            </div>
          )}
        </div>
      </footer>
      <CartTab />
    </div>
  );
};

export default ItemDetailScreen;
