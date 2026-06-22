import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const Numpad: React.FC<NumpadProps> = ({ value, onChange, maxLength = 4 }) => {
  const handleNumberClick = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', 'DEL'
  ];

  return (
    <div className="w-full max-w-[280px] mx-auto p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
      {/* PIN Display Dots */}
      <div className="flex justify-center gap-3 mb-8">
        {[...Array(maxLength)].map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: i < value.length ? 1.2 : 1,
              backgroundColor: i < value.length ? '#001828' : '#e2e8f0'
            }}
            className="w-3 h-3 rounded-full"
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {buttons.map((btn) => (
          <motion.button
            key={btn}
            whileHover={{ scale: 1.05, backgroundColor: '#f8fafc' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (btn === 'C') handleClear();
              else if (btn === 'DEL') handleDelete();
              else handleNumberClick(btn);
            }}
            className={cn(
              "h-14 flex items-center justify-center rounded-xl text-lg font-bold transition-all",
              btn === 'C' ? "text-red-500 hover:text-red-600" : 
              btn === 'DEL' ? "text-gray-500" : "text-[#001828]"
            )}
          >
            {btn === 'DEL' ? <Delete size={20} /> : btn}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default Numpad;
