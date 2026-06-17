import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import './FeedbackModal.css';

interface OrderItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  orderNumber: string;
  items: OrderItem[];
}

interface FeedbackModalProps {
  order: Order;
  userName: string;
  userId: number;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ order, userName, userId, onClose, onSubmit }) => {
  const [ratings, setRatings] = useState<Record<number, number>>(
    order.items.reduce((acc, item) => ({ ...acc, [item.productId]: 0 }), {})
  );
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetRating = (productId: number, rating: number) => {
    setRatings(prev => ({ ...prev, [productId]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one item is rated
    const hasAtLeastOneRating = Object.values(ratings).some(r => r > 0);
    if (!hasAtLeastOneRating) {
      alert('Please provide at least one rating');
      return;
    }

    setIsSubmitting(true);
    
    const itemRatings = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      rating: ratings[item.productId] || 0
    }));

    const feedbackData = {
      order: { id: order.id },
      userId: userId,
      userName: userName,
      itemRatings: itemRatings,
      comment: comment
    };

    try {
      await onSubmit(feedbackData);
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="feedback-modal" 
        onClick={e => e.stopPropagation()}
      >
        <div className="feedback-header">
          <h2>Rate Your Meal</h2>
          <p>How was your experience with Order #{order.orderNumber.split('-')[1]}?</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-body">
          {order.items.map((item) => (
            <div key={item.productId} className="rating-item-card">
              <div className="rating-item-info">
                <span className="rating-item-name">{item.productName}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                  {item.quantity} {item.quantity > 1 ? 'Units' : 'Unit'}
                </span>
              </div>
              <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${ratings[item.productId] >= star ? 'active' : ''}`}
                    onClick={() => handleSetRating(item.productId, star)}
                  >
                    <Star size={32} fill={ratings[item.productId] >= star ? "currentColor" : "none"} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="feedback-comment-section">
            <label>Additional Comments</label>
            <textarea 
              placeholder="What did you like or what can we improve?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
            />
          </div>
        </form>

        <div className="feedback-footer">
          <button type="button" className="btn-skip-feedback" onClick={onClose}>
            Skip
          </button>
          <button 
            type="submit" 
            className="btn-submit-feedback" 
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Sending...' : 'Submit Rating'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
