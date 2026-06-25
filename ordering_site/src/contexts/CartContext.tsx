import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FoodItem, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  totalItems: number;
  totalPrice: number;
  stockError: string | null;
  clearStockError: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [stockError, setStockError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const clearStockError = () => setStockError(null);

  const addToCart = (item: FoodItem) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.id === item.id);
      
      // Stock check
      const currentQty = existingIndex !== -1 ? prevCart[existingIndex].quantity : 0;
      if (item.stock !== undefined && currentQty >= item.stock) {
        setStockError(`Maximum available stock reached for ${item.name}`);
        return prevCart;
      }

      if (existingIndex !== -1) {
        const newCart = [...prevCart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
        };
        return newCart;
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        const item = prevCart[index];
        const newQty = item.quantity + delta;

        // Stock check for increment
        if (delta > 0 && item.stock !== undefined && item.quantity >= item.stock) {
          setStockError(`Maximum available stock reached for ${item.name}`);
          return prevCart;
        }

        if (newQty > 0) {
          const newCart = [...prevCart];
          newCart[index] = { ...newCart[index], quantity: newQty };
          return newCart;
        } else {
          return prevCart.filter((item) => item.id !== itemId);
        }
      }
      return prevCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getItemQuantity = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        totalItems,
        totalPrice,
        stockError,
        clearStockError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
