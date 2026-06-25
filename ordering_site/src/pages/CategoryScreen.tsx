import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import ItemCard from '../components/ItemCard';
import CartTab from '../components/CartTab';
import BottomNav from '../components/BottomNav';
import { useFood } from '../contexts/FoodContext';

const CategoryScreen: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>(); // categoryId is categoryName
  const { categories, foodItems, isLoading } = useFood();
  
  const fancyCategoryNames = ["Quick Bites", "Hearty Meals", "Thirst Quenchers", "Sweet Cravings"];
  const isFancy = categoryId && fancyCategoryNames.includes(categoryId);

  const category = isFancy 
    ? { 
        name: categoryId, 
        emoji: categoryId === "Quick Bites" ? "🍔" : categoryId === "Hearty Meals" ? "🍲" : categoryId === "Thirst Quenchers" ? "🥤" : "🍰", 
        color: "#f2f6f1" 
      } 
    : categories.find((c) => c.name === categoryId);

  const items = isFancy
    ? foodItems.filter(item => {
        const cat = (item.category || '').toLowerCase();
        if (categoryId === "Thirst Quenchers") {
          return cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea') || cat.includes('coffee');
        } else if (categoryId === "Sweet Cravings") {
          return cat.includes('dessert') || cat.includes('sweet') || cat.includes('ice') || cat.includes('bakery') || cat.includes('cake');
        } else if (categoryId === "Hearty Meals") {
          return cat.includes('meal') || cat.includes('main') || cat.includes('rice') || cat.includes('combo') || cat.includes('platter');
        } else if (categoryId === "Quick Bites") {
          const isDrink = cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea') || cat.includes('coffee');
          const isSweet = cat.includes('dessert') || cat.includes('sweet') || cat.includes('ice') || cat.includes('bakery') || cat.includes('cake');
          const isMeal = cat.includes('meal') || cat.includes('main') || cat.includes('rice') || cat.includes('combo') || cat.includes('platter');
          return !isDrink && !isSweet && !isMeal;
        }
        return false;
      })
    : foodItems.filter((item) => item.category === categoryId);

  if (isLoading && categories.length === 0) {
    return <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!category && !isLoading) return <div className="container" style={{ padding: 24 }}>Category not found: {categoryId}</div>;

  return (
    <div className="container">
      <Header title={category?.name || categoryId} />
      
      <main className="safe-area-bottom">
        <div className="items-list">
          {items.map((item, index) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              isLast={index === items.length - 1} 
            />
          ))}
          {items.length === 0 && !isLoading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mid)' }}>
              No items found in this category.
            </div>
          )}
        </div>
      </main>
      <CartTab />
      <BottomNav />
    </div>
  );
};

export default CategoryScreen;
