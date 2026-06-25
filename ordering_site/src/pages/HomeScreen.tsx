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

  const categorizedGroups = useMemo(() => {
    const groups: { title: string; items: any[] }[] = [
      { title: "🍔 Quick Bites", items: [] },
      { title: "🍲 Hearty Meals", items: [] },
      { title: "🥤 Thirst Quenchers", items: [] },
      { title: "🍰 Sweet Cravings", items: [] }
    ];

    foodItems.forEach(item => {
      const cat = (item.category || '').toLowerCase();
      if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea') || cat.includes('coffee')) {
        groups[2].items.push(item);
      } else if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('ice') || cat.includes('bakery') || cat.includes('cake')) {
        groups[3].items.push(item);
      } else if (cat.includes('meal') || cat.includes('main') || cat.includes('rice') || cat.includes('combo') || cat.includes('platter')) {
        groups[1].items.push(item);
      } else {
        groups[0].items.push(item);
      }
    });

    return groups.filter(g => g.items.length > 0);
  }, [foodItems]);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`http://${window.location.hostname}:8080/api/products?search=${encodeURIComponent(debouncedSearch)}&size=100`);
        if (response.ok) {
          const data = await response.json();
          const products = data.content || data || [];
          const mapped = products.map((item: any) => {
            const rawImg = item.imageData?.trim();
            const finalImage = rawImg ? (rawImg.startsWith('data:') ? rawImg : `data:image/png;base64,${rawImg}`) : '';
            const stallFromBackend = item.stalls && item.stalls.length > 0 ? { id: item.stalls[0].id.toString(), name: item.stalls[0].name } : null;
            return {
              id: item.id.toString(),
              name: item.name,
              description: item.description || 'No description available',
              price: item.price || item.basePrice || 0,
              category: item.category,
              image: finalImage,
              isVeg: item.veg,
              isPopular: item.active,
              stock: item.stock,
              stallId: stallFromBackend?.id,
              stallName: stallFromBackend?.name
            };
          });
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearch]);

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
                <span className="wallet-balance-text">🅡 {user.ritzTokenBalance || 0}</span>
              </div>
            )}
          </div>
          <p className="welcome-subtitle">What would you like to eat today?</p>
        </div>

        <div className="search-bar-container">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="clear-search">
                <X size={18} />
              </button>
            ) : (
              <>
                <div className="search-divider" />
                <button className="voice-icon-btn">
                  <span style={{ fontSize: 16 }}>🎙️</span>
                </button>
              </>
            )}
          </div>
        </div>

        {searchQuery.trim() ? (
          <section className="search-results-section">
            <div className="section-header">
              <h2 className="section-title">Search Results for "{searchQuery}"</h2>
            </div>
            <div className="items-list">
              {isSearching ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)', width: '100%' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }}>Searching...</div>
                </div>
              ) : (
                <>
                  {searchResults.map((item, index) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      variant="list"
                      isLast={index === searchResults.length - 1}
                    />
                  ))}
                  {searchResults.length === 0 && (
                    <div className="no-results" style={{ width: '100%' }}>
                      <p>No items found matching your search.</p>
                    </div>
                  )}
                </>
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
              <div className="section-header carousel-header">
                <h2 className="section-title">Your trusted picks</h2>
                <span className="view-all-link">View all</span>
              </div>
              <div className="popular-carousel">
                {popularItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    variant="carousel"
                  />
                ))}
                {popularItems.length === 0 && !isLoading && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)', width: '100%' }}>
                    No popular items at the moment.
                  </div>
                )}
              </div>
            </section>

            {categorizedGroups.map((group) => (
              <section key={group.title} className="popular-section categorized-section-row">
                <div className="section-header carousel-header">
                  <h2 className="section-title">{group.title}</h2>
                  <span 
                    className="view-all-link"
                    onClick={() => navigate(`/category/${group.title.replace(/[^\w\s]/g, '').trim()}`)}
                  >
                    View all
                  </span>
                </div>
                <div className="popular-carousel">
                  {group.items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      variant="carousel"
                    />
                  ))}
                </div>
              </section>
            ))}
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
