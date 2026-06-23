import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans selection:bg-[#003317]/10">
            <div className="max-w-4xl w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Visual Section */}
                    <div className="relative">
                        {/* Background Decorative Circles */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#003317]/5 rounded-full blur-3xl" />
                        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

                        {/* 404 Main Text */}
                        <div className="relative">
                            <h1 className="text-[180px] font-black leading-none tracking-tighter text-[#003317] opacity-20 select-none">
                                404
                            </h1>

                            {/* Detailed Icon Stack */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                                <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-white/50 backdrop-blur-xl relative z-10">
                                    <Search size={80} className="text-[#003317]" strokeWidth={1.5} />

                                    {/* Small Floating Icons */}
                                    <div className="absolute -top-4 -right-4 p-3 bg-white rounded-2xl shadow-lg border border-white">
                                        <HelpCircle size={24} className="text-indigo-500" />
                                    </div>

                                    <div className="absolute -bottom-6 -left-6 p-4 bg-[#003317] rounded-3xl shadow-xl border-4 border-white text-white">
                                        <span className="text-sm font-black tracking-widest uppercase">Lost?</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-red-100">
                            <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Error Code: 404
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-black text-[#1e293b] mb-6 leading-tight">
                            Well, this is <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003317] to-indigo-600">awkward.</span>
                        </h2>

                        <p className="text-[#64748b] text-lg mb-10 leading-relaxed font-medium">
                            The page you are looking for seems to have vanished into the grid. Either the URL is incorrect, or it's hiding in a different sector.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="group px-8 py-4 bg-[#003317] text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-[#003317]/20 hover:bg-[#1a5a92] transition-all hover:-translate-y-1 active:translate-y-0"
                            >
                                <Home size={18} className="group-hover:scale-110 transition-transform" />
                                Return to Safety
                            </button>

                            <button
                                onClick={() => navigate(-1)}
                                className="px-8 py-4 bg-white text-[#64748b] border border-[#e2e8f0] rounded-2xl font-bold flex items-center gap-3 hover:bg-gray-50 transition-all hover:text-[#1e293b]"
                            >
                                <ArrowLeft size={18} />
                                Go Back
                            </button>
                        </div>

                        {/* Quick Links Section */}
                        <div className="mt-16 pt-8 border-t border-[#e2e8f0]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Common Sectors</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start">
                                {['Orders', 'Inventory', 'Reports', 'Settings'].map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => navigate(`/${item.toLowerCase()}`)}
                                        className="text-xs font-bold text-[#64748b] hover:text-[#003317] transition-colors flex items-center gap-1 group"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-[#e2e8f0] group-hover:bg-[#003317] transition-colors" />
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
