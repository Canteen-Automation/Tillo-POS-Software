import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  DollarSign,
  Percent,
  Search,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface StatBoxProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: any;
  colorClass: string;
}

const StatBox = ({ title, value, subtext, icon: Icon, colorClass }: StatBoxProps) => (
  <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] flex-1 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black text-[#1e293b]">₹{value}</h3>
      </div>
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-[11px] text-[#94a3b8] font-medium leading-relaxed">{subtext}</p>
  </div>
);

interface ProductAnalytics {
  product: string;
  qty: number;
  basePrice: number;
  currentPrice: number;
  inflatedAmount: number;
  deflatedAmount: number;
  rate: number;
  trend: 'up' | 'down' | 'stable';
}

const PurchaseAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'up' | 'down'>('all');
  const [summary, setSummary] = useState({
    totalBase: 0,
    totalInflated: 0,
    totalDeflated: 0,
    inflationRate: 0,
    inflatedCount: 0,
    deflatedCount: 0
  });

  const [dateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/purchases/orders');
      if (response.ok) {
        const data = await response.json();
        processAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalytics = (purchaseOrders: any[]) => {
    const productStats: Record<string, { qty: number, prices: { date: Date, rate: number }[] }> = {};

    purchaseOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        if (!productStats[item.productName]) {
          productStats[item.productName] = { qty: 0, prices: [] };
        }
        productStats[item.productName].qty += item.quantity;
        productStats[item.productName].prices.push({
          date: new Date(order.date),
          rate: item.rate
        });
      });
    });

    let totalBase = 0;
    let totalInflated = 0;
    let totalDeflated = 0;
    let inflatedCount = 0;
    let deflatedCount = 0;

    const analyzedData: ProductAnalytics[] = Object.keys(productStats).map(productName => {
      const stats = productStats[productName];
      stats.prices.sort((a, b) => a.date.getTime() - b.date.getTime());

      const basePrice = stats.prices[0].rate;
      const currentPrice = stats.prices[stats.prices.length - 1].rate;
      const qty = stats.qty;

      const priceDiff = currentPrice - basePrice;
      const impactAmount = Math.abs(priceDiff * qty);

      let inflatedAmount = 0;
      let deflatedAmount = 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (priceDiff > 0) {
        inflatedAmount = impactAmount;
        totalInflated += inflatedAmount;
        inflatedCount++;
        trend = 'up';
      } else if (priceDiff < 0) {
        deflatedAmount = impactAmount;
        totalDeflated += deflatedAmount;
        deflatedCount++;
        trend = 'down';
      }

      totalBase += basePrice * qty;
      const rate = basePrice !== 0 ? (Math.abs(priceDiff) / basePrice) * 100 : 0;

      return {
        product: productName,
        qty,
        basePrice,
        currentPrice,
        inflatedAmount,
        deflatedAmount,
        rate,
        trend
      };
    });

    const inflationRate = totalBase !== 0 ? (totalInflated / totalBase) * 100 : 0;

    setAnalytics(analyzedData);
    setSummary({
      totalBase,
      totalInflated,
      totalDeflated,
      inflationRate,
      inflatedCount,
      deflatedCount
    });
  };

  const filteredAnalytics = analytics.filter(item => {
    const matchesSearch = (item.product || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesFilter = filterType === 'all' || item.trend === filterType;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#003317]" size={40} />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Calculating Market Analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#003317] tracking-tight uppercase">Purchase Analytics</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-[#003317]/10 text-[#003317] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Start: {format(dateRange.start, 'yyyy-MM-dd')}
            </span>
            <span className="bg-[#003317]/10 text-[#003317] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              End: {format(dateRange.end, 'yyyy-MM-dd')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filterType === 'all' ? 'bg-[#003317] text-white shadow-lg' : 'bg-white border text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            Show All
          </button>
          <button title="Calendar" className="p-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] transition-all"><Calendar size={18} /></button>
          <button title="Filter" className="p-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] transition-all"><Filter size={18} /></button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox title="Total Base Amount" value={summary.totalBase.toFixed(2)} subtext="Initial purchase costs" icon={DollarSign} colorClass="bg-gray-100 text-gray-500" />
        <StatBox title="Total Inflated Amount" value={summary.totalInflated.toFixed(2)} subtext="Extra cost from hikes" icon={TrendingUp} colorClass="bg-rose-100 text-rose-500" />
        <StatBox title="Total Deflated Amount" value={summary.totalDeflated.toFixed(2)} subtext="Actual savings realized" icon={TrendingDown} colorClass="bg-emerald-100 text-emerald-500" />
        <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] flex-1 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">Inflation Rate</p>
              <h3 className="text-2xl font-black text-[#1e293b]">{summary.inflationRate.toFixed(2)}%</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-100 text-violet-500"><Percent size={18} /></div>
          </div>
          <p className="text-[11px] text-[#94a3b8] font-medium leading-relaxed">Overall price impact percentage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/30">
            <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">
              {filterType === 'up' ? 'Price Hikes (Inflated)' : filterType === 'down' ? 'Savings (Deflated)' : 'Market Price Status'}
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={14} />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-xl text-xs outline-none focus:border-[#003317]/30 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest leading-none">Product</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest leading-none">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest leading-none text-right">Base Price</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest leading-none text-right">Impact Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest leading-none text-center">Impact Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredAnalytics.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No matching trends found</td></tr>
                ) : (
                  filteredAnalytics.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4"><p className="text-xs font-bold text-[#1e293b] group-hover:text-[#003317]">{item.product}</p></td>
                      <td className="px-6 py-4 text-xs font-bold text-[#475569]">{item.qty}</td>
                      <td className="px-6 py-4 text-xs font-bold text-[#475569] text-right">₹{item.basePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-black ${item.trend === 'up' ? 'text-rose-500' : item.trend === 'down' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}₹{(item.inflatedAmount || item.deflatedAmount).toFixed(2)}
                          </span>
                          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">
                            {item.trend === 'up' ? 'Incurred' : item.trend === 'down' ? 'Saved' : 'Neutral'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${item.trend === 'up' ? 'bg-rose-50 text-rose-600' : item.trend === 'down' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          {item.rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm">
            <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider mb-6">Market Trends</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFilterType('up')}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:border-[#003317]/50 border-2 ${filterType === 'up' ? 'bg-[#003317] text-white border-[#003317]' : 'bg-gray-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
              >
                <TrendingUp size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Inflation</span>
                <span className="text-sm font-black">{summary.inflatedCount}</span>
              </button>
              <button
                onClick={() => setFilterType('down')}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:border-emerald-600/50 border-2 ${filterType === 'down' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
              >
                <TrendingDown size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Deflation</span>
                <span className="text-sm font-black">{summary.deflatedCount}</span>
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center py-8">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[10px] border-slate-100"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-[#1e293b]">{filterType === 'up' ? summary.inflatedCount : filterType === 'down' ? summary.deflatedCount : summary.inflatedCount + summary.deflatedCount}</p>
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase">Selected</p>
                </div>
              </div>
              <div className={`mt-8 w-full p-4 rounded-2xl border ${filterType === 'up' ? 'bg-rose-50 border-rose-100 text-rose-600' : filterType === 'down' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <p className="text-[10px] font-bold text-center uppercase">
                  {filterType === 'up' ? 'Showing all price hikes' : filterType === 'down' ? 'Showing all price drops' : 'Select a trend to filter table'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseAnalytics;
