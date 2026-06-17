import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Info } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import CartTab from '../components/CartTab';
import BottomNav from '../components/BottomNav';
import type { Stall } from '../types';
import './StallDetailScreen.css';

const StallDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStallDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://${window.location.hostname}:8080/api/stalls/${id}`);
        if (!response.ok) throw new Error('Stall not found');
        const data = await response.json();
        
        // Map backend stall to frontend Stall type
        const mappedStall: Stall = {
          id: data.id.toString(),
          name: data.name,
          description: data.description || 'Quality food prepared with care',
          imageData: data.imageData?.trim() ? (data.imageData.trim().startsWith('data:') ? data.imageData.trim() : `data:image/png;base64,${data.imageData.trim()}`) : '',
          active: data.active,
          temporarilyClosed: data.temporarilyClosed,
          products: data.products.map((p: any) => {
            const rawImg = p.imageData?.trim();
            const finalImage = rawImg ? (rawImg.startsWith('data:') ? rawImg : `data:image/png;base64,${rawImg}`) : '';
            
            return {
              id: p.id.toString(),
              name: p.name,
              description: p.description || 'Delicious meal item',
              price: p.price || p.basePrice || 0,
              category: p.category,
              image: finalImage,
              isVeg: p.veg,
              isPopular: p.active,
              stock: p.stock,
              stallId: data.id.toString(),
              stallName: data.name
            };
          })
        };
        
        setStall(mappedStall);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStallDetails();

    // SSE Real-time stock updates
    const host = window.location.hostname;
    const eventSource = new EventSource(`http://${host}:8080/api/stock/stream`);

    eventSource.addEventListener('stockUpdate', (event: any) => {
      try {
        const update = JSON.parse(event.data);
        setStall(prevStall => {
          if (!prevStall) return prevStall;
          return {
            ...prevStall,
            products: prevStall.products ? prevStall.products.map(p => 
              p.id === update.productId.toString() ? { ...p, stock: update.stock } : p
            ) : []
          };
        });
      } catch (err) {
        console.error('Error processing stock update:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container stall-detail-page loading">
        <div className="loading-spinner">Loading Stall Details...</div>
      </div>
    );
  }

  if (error || !stall) {
    return (
      <div className="container stall-detail-page error">
        <header className="detail-header sticky">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
        </header>
        <div className="error-content">
          <h2>Stall Not Found</h2>
          <p>{error || "We couldn't find the stall you're looking for."}</p>
          <button className="primary-button" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container stall-detail-page">
      <header className="detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-image-container">
          {stall.imageData ? (
            <img src={stall.imageData} alt={stall.name} className="header-bg-image" />
          ) : (
            <div className="header-placeholder" />
          )}
          <div className="header-overlay"></div>
        </div>
      </header>

      <main className="detail-content safe-area-bottom">
        <div className="stall-main-card">
          <div className="stall-header-info">
            <h1 className="stall-title">{stall.name}</h1>
            {stall.temporarilyClosed && (
              <span className="status-tag closed">Closed Now</span>
            )}
          </div>
          <p className="stall-description">{stall.description}</p>
          
          <div className="stall-meta">
            <div className="meta-item">
              <Clock size={16} />
              <span>Fast Preparation</span>
            </div>
            <div className="meta-item">
              <Info size={16} />
              <span>Clean & Hygienic</span>
            </div>
          </div>
        </div>

        <section className="stall-items-section">
          <h2 className="section-title">Available Products</h2>
          <div className="items-list">
            {stall.products && stall.products.length > 0 ? (
              stall.products.map((item, index) => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  isLast={index === stall.products!.length - 1} 
                />
              ))
            ) : (
              <div className="no-items">
                <p>No products available from this stall at the moment.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <CartTab />
      <BottomNav />
    </div>
  );
};

export default StallDetailScreen;
