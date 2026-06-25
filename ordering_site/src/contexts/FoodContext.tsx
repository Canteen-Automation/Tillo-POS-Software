import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FoodItem, Category, Stall } from '../types';

interface FoodContextType {
  categories: Category[];
  foodItems: FoodItem[];
  stalls: Stall[];
  isLoading: boolean;
  error: string | null;
  refreshData: (silent?: boolean) => Promise<void>;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

const API_BASE_URL = `http://${window.location.hostname}:8080/api`;

const EMOJIS = ['🍦', '🍪', '🧃', '🍫', '🥨', '🥐', '🍹', '📦', '🍳', '🍱', '🍔', '🍕', '🥗', '🍲'];
const COLORS = ['#FFF0F6', '#FFF7ED', '#FFFFEB', '#FDF3EF', '#F0FDF4', '#FEFCE8', '#EFF6FF'];

export const FoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [baseItemsRes, productsRes, stallsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/base-items?size=100`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/products?size=100`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/stalls/active`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/feedback/stats`, { cache: 'no-store' }).catch(() => null)
      ]);

      if (!baseItemsRes.ok || !productsRes.ok || !stallsRes.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const baseItemsDataRaw = await baseItemsRes.json();
      const productsDataRaw = await productsRes.json();
      const stallsData = await stallsRes.json();

      const baseItemsData = baseItemsDataRaw.content || baseItemsDataRaw;
      const productsData = productsDataRaw.content || productsDataRaw;

      // Extract top rated items names by customer feedback count
      let topRatedNames: string[] = [];
      if (statsRes && statsRes.ok) {
        try {
          const statsData = await statsRes.json();
          const ratedItems = statsData.ratedItems || [];
          // Sort items by count of feedbacks descending
          const sorted = [...ratedItems].sort((a: any, b: any) => b.count - a.count);
          // Get names of top 3 items with at least 1 feedback
          topRatedNames = sorted
            .filter((x: any) => x.count > 0)
            .slice(0, 3)
            .map((x: any) => x.name.toLowerCase());
        } catch (e) {
          console.error('Error parsing feedback stats:', e);
        }
      }

      // Map BaseItems to Categories
      const mappedCategories: Category[] = baseItemsData.map((item: any, index: number) => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description,
        emoji: EMOJIS[index % EMOJIS.length],
        image: item.imageData?.trim() ? (item.imageData.trim().startsWith('data:') ? item.imageData.trim() : `data:image/png;base64,${item.imageData.trim()}`) : '', 
        color: COLORS[index % COLORS.length]
      }));

      // Map Stalls and build a product-to-stall lookup map
      const productToStallMap: Record<string, { id: string, name: string }> = {};
      const categoryToStallMap: Record<string, { id: string, name: string }> = {};

      const mappedStalls: Stall[] = stallsData.map((item: any) => {
        const stallInfo = { id: item.id.toString(), name: item.name };
        
        // Map category/baseItems to this stall for indirect lookup
        if (item.baseItems) {
          item.baseItems.forEach((bi: any) => {
            if (!categoryToStallMap[bi.name.toLowerCase()]) {
              categoryToStallMap[bi.name.toLowerCase()] = stallInfo;
            }
          });
        }

        // If this stall explicitly lists products, add them to map
        if (item.products) {
          item.products.forEach((p: any) => {
            if (!productToStallMap[p.id.toString()]) {
              productToStallMap[p.id.toString()] = stallInfo;
            }
          });
        }
        
        return {
          id: stallInfo.id,
          name: stallInfo.name,
          description: item.description || 'Our delicious stall',
          imageData: item.imageData?.trim() ? (item.imageData.trim().startsWith('data:') ? item.imageData.trim() : `data:image/png;base64,${item.imageData.trim()}`) : '',
          active: item.active,
          temporarilyClosed: item.temporarilyClosed
        };
      });

      // Map Products to FoodItems using the lookup map as fallback
      const mappedFoodItems: FoodItem[] = productsData.map((item: any) => {
        const rawImg = item.imageData?.trim();
        const finalImage = rawImg ? (rawImg.startsWith('data:') ? rawImg : `data:image/png;base64,${rawImg}`) : '';
        
        const itemId = item.id.toString();
        const stallFromBackend = item.stalls && item.stalls.length > 0 ? { id: item.stalls[0].id.toString(), name: item.stalls[0].name } : null;
        const stallFromMap = productToStallMap[itemId];
        const stallFromCategory = item.category ? categoryToStallMap[item.category.toLowerCase()] : null;
        
        // Dynamic bestseller isPopular flag based on feedback stats
        const isBestseller = topRatedNames.includes(item.name.toLowerCase());

        return {
          id: itemId,
          name: item.name,
          description: item.description || 'No description available',
          price: item.price || item.basePrice || 0,
          category: item.category,
          image: finalImage,
          isVeg: item.veg,
          isPopular: isBestseller, 
          stock: item.stock,
          stallId: (stallFromBackend?.id || stallFromMap?.id || stallFromCategory?.id),
          stallName: (stallFromBackend?.name || stallFromMap?.name || stallFromCategory?.name)
        };
      });

      setCategories(mappedCategories);
      setFoodItems(mappedFoodItems);
      setStalls(mappedStalls);
    } catch (err: any) {
      if (!silent) setError(err.message);
      console.error('Error fetching food data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Silent background polling every 10 seconds to sync stock
    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  return (
    <FoodContext.Provider value={{ categories, foodItems, stalls, isLoading, error, refreshData: fetchData }}>
      {children}
    </FoodContext.Provider>
  );
};

export const useFood = () => {
  const context = useContext(FoodContext);
  if (context === undefined) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
};
