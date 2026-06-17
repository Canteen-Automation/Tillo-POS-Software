import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCcw, X, Star, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import ItemCard from '../components/ItemCard';
import CartTab from '../components/CartTab';
import BottomNav from '../components/BottomNav';
import FeedbackModal from '../components/FeedbackModal';
import { useFood } from '../contexts/FoodContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import walletIcon from '../assets/front.png';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { categories, stalls, foodItems, isLoading, error, refreshData } = useFood();
  const { user, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback state
  const [unratedOrder, setUnratedOrder] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackSnackbar, setShowFeedbackSnackbar] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkForUnratedOrder();
      refreshUser();
    }
  }, [user]);

  const checkForUnratedOrder = async () => {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem('feedback_dismissed')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:8080/api/feedback/latest-unrated/${user?.id}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.status === 200) {
        const order = await response.json();
        console.log('Unrated order found:', order);
        setUnratedOrder(order);
        setShowFeedbackSnackbar(true);
      } else {
        console.log('No unrated orders or error status:', response.status);
      }
    } catch (error) {
      console.error('Error checking for unrated orders:', error);
    }
  };

  const handleSkipFeedback = async () => {
    if (!unratedOrder) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://${window.location.hostname}:8080/api/feedback/skip/${unratedOrder.id}`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      setShowFeedbackModal(false);
      setShowFeedbackSnackbar(false);
      setUnratedOrder(null);
      sessionStorage.setItem('feedback_dismissed', 'true');
    } catch (error) {
      console.error('Error skipping feedback:', error);
      // Fallback: still hide it locally
      setShowFeedbackModal(false);
      setShowFeedbackSnackbar(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:8080/api/feedback/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(feedbackData)
      });
      
      if (response.ok) {
        setShowFeedbackModal(false);
        setShowFeedbackSnackbar(false);
        setUnratedOrder(null);
        sessionStorage.setItem('feedback_dismissed', 'true'); // Don't show for others in this session
      }
    } catch (error) {
      throw error;
    }
  };

  const popularItems = useMemo(() => foodItems.filter(item => item.isPopular), [foodItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return foodItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  }, [foodItems, searchQuery]);

  if (isLoading && categories.length === 0) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner">Loading delicious food...</div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>Oops! Something went wrong</h2>
        <p style={{ color: 'var(--text-mid)', marginBottom: 24 }}>{error}</p>
        <button className="primary-button" onClick={() => refreshData()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCcw size={18} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />

      <main className="safe-area-bottom">
        <div className="welcome-section">
          <div className="greeting-row">
            <h1 className="welcome-message">Hello {user?.name || 'Guest'}!</h1>
            {user && (
              <div className="wallet-badge" onClick={() => navigate('/wallet')}>
                <img src={walletIcon} alt="Wallet" className="wallet-icon-img" />
                <span className="wallet-balance-text">R {user.ritzTokenBalance || 0}</span>
              </div>
            )}
          </div>
          <p className="welcome-subtitle">What would you like to eat today?</p>
        </div>

        <div className="search-bar-container">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {searchQuery.trim() ? (
          <section className="search-results-section">
            <div className="section-header">
              <h2 className="section-title">Search Results for "{searchQuery}"</h2>
            </div>
            <div className="items-list">
              {filteredItems.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isLast={index === filteredItems.length - 1}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="no-results">
                  <p>No items found matching your search.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="categories-section">
              <div className="section-header">
                <h2 className="section-title">Categories</h2>
              </div>
              <div className="categories-grid">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="category-item"
                    onClick={() => navigate(`/category/${category.name}`)}
                  >
                    <div className="category-image-wrapper" style={{ backgroundColor: category.color }}>
                      <span style={{ fontSize: 32 }}>{category.emoji}</span>
                    </div>
                    <span className="category-name">{category.name}</span>
                  </div>
                ))}
              </div>
              {categories.length === 0 && !isLoading && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)' }}>
                  No categories found.
                </div>
              )}
            </section>
            
            <section className="stalls-section">
              <div className="section-header">
                <h2 className="section-title">Our Favorite Stalls</h2>
              </div>
              <div className="stalls-carousel">
                {stalls.map((stall) => (
                  <div 
                    key={stall.id} 
                    className={`stall-card ${stall.temporarilyClosed ? 'closed' : ''}`}
                    onClick={() => navigate(`/stall/${stall.id}`)}
                  >
                    <div className="stall-image-container">
                      {stall.imageData ? (
                        <img src={stall.imageData} alt={stall.name} className="stall-image" />
                      ) : (
                        <div className="header-placeholder" style={{ width: '100%', height: '100%' }} />
                      )}
                      <div className="stall-vignette" />
                      <div className="stall-info-overlay">
                        <h3 className="stall-name">{stall.name}</h3>
                        <p className="stall-desc">{stall.description}</p>
                      </div>
                      {stall.temporarilyClosed && (
                        <div className="stall-closed-overlay">CLOSED</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {stalls.length === 0 && !isLoading && (
                <div className="no-stalls">No stalls available.</div>
              )}
            </section>

            <section className="popular-section">
              <div className="section-header">
                <h2 className="section-title">Popular Items</h2>
              </div>
              <div className="items-list">
                {popularItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isLast={index === popularItems.length - 1}
                  />
                ))}
                {popularItems.length === 0 && !isLoading && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)' }}>
                    No popular items at the moment.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <CartTab />
      <BottomNav />

      <AnimatePresence>
        {showFeedbackSnackbar && unratedOrder && !showFeedbackModal && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="feedback-snackbar"
            onClick={() => setShowFeedbackModal(true)}
          >
            <div className="feedback-snackbar-content">
              <div className="feedback-snackbar-icon">
                <Star size={20} fill="currentColor" />
              </div>
              <div className="feedback-snackbar-text">
                <h4>Rate your last meal</h4>
                <p>Order #{unratedOrder.displayOrderId || unratedOrder.id}</p>
              </div>
            </div>
            <div className="feedback-snackbar-action">
              <ChevronRight size={20} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeedbackModal && unratedOrder && (
          <FeedbackModal 
            order={unratedOrder}
            userId={user?.id || 0}
            userName={user?.name || 'User'}
            onClose={handleSkipFeedback}
            onSubmit={handleFeedbackSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeScreen;
