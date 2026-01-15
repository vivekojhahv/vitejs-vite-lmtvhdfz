import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  deleteDoc,
  getDocs,
  writeBatch,
  setDoc,
  where,
  orderBy,
  getDoc,
  increment 
} from "firebase/firestore";
import { 
  Package, Truck, Hammer, LogOut, CheckCircle, 
  LayoutDashboard, X, Search, 
  Globe, ArrowLeft, 
  ScanBarcode, Keyboard, CheckCheck, Loader2, 
  Activity, Clock, Upload, FileText, 
  TrendingUp, Users, AlertCircle, BarChart3, 
  PieChart, Download, Lock, Settings, Plus, Trash2, User, ChevronRight, Link, Eye
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyD_FBXkrMiZS-LiMlsdHVGOSL5cY57bLBk",
  authDomain: "hvg-warehouse.firebaseapp.com",
  projectId: "hvg-warehouse",
  storageBucket: "hvg-warehouse.firebasestorage.app",
  messagingSenderId: "230747092768",
  appId: "1:230747092768:web:b6161a2769986ea4c20945",
  measurementId: "G-JCH13J2BFL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = "hv-global-warehouse-ops-v1"; 

// --- UTILITIES ---
const parseQty = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  if (/^[\d\s]+$/.test(s)) {
      const num = parseInt(s.replace(/\s/g, ''));
      return isNaN(num) ? 0 : num;
  }
  return 0;
};

const getMasterSku = (sku) => {
  if (!sku) return 'Other';
  const match = sku.match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : 'OTHER';
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  // Safety check for objects that aren't dates or firestore timestamps
  if (typeof timestamp === 'object' && !timestamp.toDate && !(timestamp instanceof Date)) {
      return '';
  }
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  // Safety check for objects that aren't dates or firestore timestamps
  if (typeof timestamp === 'object' && !timestamp.toDate && !(timestamp instanceof Date)) {
      return ''; 
  }
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    html, body, #root {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F3F4F6; /* Gray-100 */
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;  
        scrollbar-width: none;  
    }
    .safe-area-pb {
        padding-bottom: env(safe-area-inset-bottom);
    }
    /* Custom Scrollbar for desktop */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: transparent; 
    }
    ::-webkit-scrollbar-thumb {
        background: #D1D5DB; 
        border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #9CA3AF; 
    }
  `}</style>
);

// --- LAYOUT COMPONENT ---
const DashboardLayout = ({ title, user, logout, currentTab, setTab, tabs, children }) => {
  return (
    <>
      <GlobalStyles />
      <div className="flex flex-col h-[100dvh] w-screen bg-gray-50 text-gray-900 overflow-hidden">
        {/* Header */}
        <header className="flex-none h-18 bg-white/80 backdrop-blur-md border-b border-gray-200/60 z-50 flex items-center justify-between px-4 sm:px-6 py-3 shadow-sm sticky top-0">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
             <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 sm:p-2.5 rounded-xl text-white shadow-lg shadow-violet-200 flex-shrink-0">
               <Package className="w-5 h-5" />
             </div>
             <div className="min-w-0">
               <h1 className="text-lg sm:text-xl font-extrabold text-gray-800 leading-none tracking-tight truncate">{title}</h1>
               <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1 truncate">{user?.name || 'User'}</div>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
             {/* Desktop Navigation */}
             {tabs && (
               <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200">
                 {tabs.map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setTab(tab.id)}
                     className={`px-4 lg:px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${currentTab === tab.id ? 'bg-white text-violet-700 shadow-md shadow-gray-200 scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                   >
                     <tab.icon className={`w-4 h-4 ${currentTab === tab.id ? 'text-violet-500' : ''}`} />
                     {tab.label}
                   </button>
                 ))}
               </nav>
             )}
             <button onClick={logout} className="p-2 sm:p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full scroll-smooth">
           <div className="max-w-[1600px] mx-auto p-3 sm:p-6 md:p-8 pb-28 md:pb-8 min-h-full">
              {children}
           </div>
        </main>

        {/* Mobile Bottom Nav */}
        {tabs && (
          <div className="md:hidden flex-none fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
            <nav className="bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl shadow-gray-300/50 rounded-2xl flex justify-around items-center px-2 py-3 safe-area-pb pointer-events-auto">
                {tabs.map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${currentTab === tab.id ? 'text-violet-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <tab.icon className={`w-6 h-6 ${currentTab === tab.id ? 'fill-current opacity-20' : ''}`} strokeWidth={currentTab === tab.id ? 2.5 : 2} />
                    <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                </button>
                ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );
};

// --- MODALS ---

const StockInModal = ({ isOpen, onClose, onConfirm, sku }) => {
    const [qty, setQty] = useState('1');
    const inputRef = useRef(null);
  
    useEffect(() => {
      if (isOpen) {
        setQty('1'); 
        setTimeout(() => { if(inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }}, 50);
      }
    }, [isOpen, sku]);
  
    if (!isOpen || !sku) return null;
  
    const handleSubmit = (e) => {
      e.preventDefault();
      const val = parseInt(qty);
      if (!isNaN(val) && val > 0) { onConfirm(val); }
    };
  
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 border border-white/20 ring-1 ring-black/5">
          <div className="bg-blue-50/50 p-8 text-center border-b border-blue-100">
              <h3 className="text-2xl font-bold text-gray-800 flex flex-col items-center gap-2">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Download className="w-8 h-8"/></div>
                  Stock In
              </h3>
              <p className="text-gray-500 text-sm mt-2 font-medium">Adding to Inventory</p>
              <div className="mt-4 bg-white px-4 py-2 rounded-xl border border-gray-200 font-mono text-lg font-bold text-gray-800">{sku}</div>
          </div>
          <form onSubmit={handleSubmit} className="p-8">
            <div className="flex justify-center mb-8 relative">
              <input 
                  ref={inputRef}
                  type="number"
                  min="1"
                  className="w-40 text-center text-6xl font-bold text-blue-600 border-none outline-none bg-transparent focus:ring-0 placeholder-gray-200"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
              />
              <span className="absolute bottom-2 text-sm font-bold text-gray-400 uppercase tracking-widest">Units</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={onClose} className="py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button>
              <button type="submit" className="py-4 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 bg-blue-600 hover:bg-blue-700 shadow-blue-200">
                  Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    );
};

const StockOutModal = ({ isOpen, onClose, onConfirm, sku }) => {
    const [qty, setQty] = useState('1');
    const inputRef = useRef(null);
  
    useEffect(() => {
      if (isOpen) {
        setQty('1'); 
        setTimeout(() => { if(inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }}, 50);
      }
    }, [isOpen, sku]);
  
    if (!isOpen || !sku) return null;
  
    const handleSubmit = (e) => {
      e.preventDefault();
      const val = parseInt(qty);
      if (!isNaN(val) && val > 0) { onConfirm(val); }
    };
  
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 border border-white/20 ring-1 ring-black/5">
          <div className="bg-purple-50/50 p-8 text-center border-b border-purple-100">
              <h3 className="text-2xl font-bold text-gray-800 flex flex-col items-center gap-2">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Upload className="w-8 h-8"/></div>
                  Stock Out
              </h3>
              <p className="text-gray-500 text-sm mt-2 font-medium">Removing from Inventory</p>
              <div className="mt-4 bg-white px-4 py-2 rounded-xl border border-gray-200 font-mono text-lg font-bold text-gray-800">{sku}</div>
          </div>
          <form onSubmit={handleSubmit} className="p-8">
            <div className="flex justify-center mb-8 relative">
              <input 
                  ref={inputRef}
                  type="number"
                  min="1"
                  className="w-40 text-center text-6xl font-bold text-purple-600 border-none outline-none bg-transparent focus:ring-0 placeholder-gray-200"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
              />
              <span className="absolute bottom-2 text-sm font-bold text-gray-400 uppercase tracking-widest">Units</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={onClose} className="py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button>
              <button type="submit" className="py-4 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 bg-purple-600 hover:bg-purple-700 shadow-purple-200">
                  Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    );
};

const PickModal = ({ isOpen, onClose, onConfirm, order, role }) => {
  const [pickQty, setPickQty] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && order) {
      setPickQty(order.quantity); 
      setTimeout(() => { if(inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }}, 50);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pickQty);
    if (!isNaN(val) && val > 0 && val <= order.quantity) { onConfirm(val); }
  };

  let buttonText = "Confirm Pick";
  let buttonColor = "bg-violet-600 hover:bg-violet-700 shadow-violet-200";
   
  if (role === 'WIP_FLOOR') {
      if (order.status === 'PENDING') { buttonText = "Start Process"; buttonColor = "bg-orange-500 hover:bg-orange-600 shadow-orange-200"; }
      else if (order.status === 'WIP_PROCESSING') { buttonText = "Finish Process"; buttonColor = "bg-teal-600 hover:bg-teal-700 shadow-teal-200"; }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 border border-white/20 ring-1 ring-black/5">
        <div className="bg-gray-50/50 p-8 text-center border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800">{role === 'WIP_FLOOR' ? 'Process Item' : 'Confirm Pick'}</h3>
            <p className="text-gray-500 text-sm mt-2 break-all font-medium">SKU: <span className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{order.sku}</span></p>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-center mb-8 relative">
            <input 
                ref={inputRef}
                type="number"
                min="1"
                max={order.quantity}
                className="w-40 text-center text-6xl font-bold text-violet-600 border-none outline-none bg-transparent focus:ring-0 placeholder-gray-200"
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
            />
            <span className="absolute bottom-2 text-sm font-bold text-gray-400 uppercase tracking-widest">Units</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={onClose} className="py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button>
            <button type="submit" className={`py-4 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${buttonColor}`}>
                {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryDetailModal = ({ category, onClose, orders }) => {
    const [selectedPortal, setSelectedPortal] = useState(null);

    useEffect(() => { setSelectedPortal(null); }, [category]);

    if (!category) return null;
    
    const filtered = orders.filter(o => o.category === category);
    
    let content;
    if (category === 'FG_STORE') {
        const grouped = {};
        filtered.forEach(o => {
            let p = o.portal || 'All Stock'; 
            if(p === 'General' || p === 'General Stock') p = 'All Stock';
            if(!grouped[p]) grouped[p] = [];
            grouped[p].push(o);
        });
        
        const sortedPortals = Object.entries(grouped).sort((a,b) => {
            if(a[0] === 'All Stock') return -1;
            if(b[0] === 'All Stock') return 1;
            return a[0].localeCompare(b[0]);
        });

        if (selectedPortal) {
             const items = grouped[selectedPortal] || [];
             content = (
                 <div className="h-full flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">
                     <button onClick={() => setSelectedPortal(null)} className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-violet-600 px-1 flex-none transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Portals</button>
                     <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 flex-1 flex flex-col min-h-0">
                         <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-none backdrop-blur-sm">
                             <span className="font-bold text-gray-800 flex gap-3 items-center text-lg"><Globe className="w-5 h-5 text-blue-500"/> {selectedPortal}</span>
                             <span className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 font-mono font-bold text-gray-500 shadow-sm">{items.reduce((a,b)=>a+(b.quantity||0),0)} units</span>
                         </div>
                         <div className="overflow-y-auto flex-1 p-0">
                             <table className="w-full text-sm text-left">
                                 <thead className="text-xs text-gray-400 font-bold uppercase bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-md"><tr><th className="px-6 py-4">SKU</th><th className="px-6 py-4 text-right">Qty</th><th className="px-6 py-4 text-center">Status</th></tr></thead>
                                 <tbody className="divide-y divide-gray-50">
                                     {items.map((o, i) => (
                                         <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                                             <td className="px-6 py-4"><div className="font-mono font-bold text-gray-700">{o.sku}</div>{o.fgSku && <div className="text-[10px] text-teal-600 mt-1 font-medium bg-teal-50 inline-block px-1.5 rounded">FG: {o.fgSku}</div>}</td>
                                             <td className="px-6 py-4 text-right font-bold text-gray-800">{o.quantity}</td>
                                             <td className="px-6 py-4 text-center"><span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide ${o.status === 'COMPLETED' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>{o.status}</span></td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 </div>
             );
        } else {
            content = (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pb-8">
                    {sortedPortals.map(([portal, items]) => (
                        <button key={portal} onClick={() => setSelectedPortal(portal)} className="bg-white border border-gray-100 p-6 rounded-3xl hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50 transition-all text-left group h-36 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-transparent to-gray-50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex justify-between items-start relative z-10"><div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-colors"><Globe className="w-6 h-6"/></div><ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 transition-transform group-hover:translate-x-1"/></div>
                            <div className="relative z-10"><div className="font-bold text-gray-800 text-lg truncate">{portal}</div><div className="text-sm text-gray-500 font-medium">{items.reduce((a,b)=>a+b.quantity,0)} Units</div></div>
                        </button>
                    ))}
                    {sortedPortals.length === 0 && <div className="col-span-full text-center text-gray-400 py-12 flex flex-col items-center"><Package className="w-12 h-12 opacity-20 mb-2"/>No Items Found</div>}
                </div>
            );
        }
        
    } else {
        content = (
             <div className="overflow-x-auto border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 bg-white h-full flex flex-col">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 font-bold uppercase bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th className="px-6 py-4">Master SKU</th>
                            <th className="px-6 py-4 text-right">Qty</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((order, idx) => (
                            <tr key={order.id || idx} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-mono font-bold text-gray-700">{order.sku}</div>
                                    {category === 'SFG_STORE' && order.sfgSku && <div className="text-xs text-orange-600 font-mono mt-1 bg-orange-50 inline-block px-1.5 rounded">SFG: {order.sfgSku}</div>}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-800">{order.quantity}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide ${order.status === 'COMPLETED' ? 'bg-teal-100 text-teal-700' : (order.status === 'WIP_PROCESSING' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')}`}>
                                        {order.status === 'COMPLETED' ? 'DONE' : (order.status === 'WIP_PROCESSING' ? 'PROCESS' : 'PENDING')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 italic">No items found.</td></tr>}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[80] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-gray-50 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/20">
                <div className="p-6 border-b border-gray-200/60 flex justify-between items-center bg-white/80 backdrop-blur-md flex-none">
                    <h3 className="text-xl font-extrabold text-gray-800 flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${category === 'FG_STORE' ? 'bg-teal-100 text-teal-600' : category === 'SFG_STORE' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
                            {category === 'FG_STORE' ? <Package className="w-5 h-5"/> : 
                             category === 'SFG_STORE' ? <Truck className="w-5 h-5"/> : 
                             <Hammer className="w-5 h-5"/>}
                        </div>
                        {category === 'FG_STORE' ? 'Finished Goods' : category === 'SFG_STORE' ? 'Semi-Finished' : 'WIP Floor'} Details
                    </h3>
                    <button onClick={onClose} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {content}
                </div>
            </div>
        </div>
    );
};

// ... LoginModal ...
const LoginModal = ({ isOpen, onClose, role, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && role !== 'ADMIN') {
        setLoading(true);
        // Fetch users for this role
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'staff_directory'), where('role', '==', role));
        getDocs(q).then(snap => {
            const staffList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(staffList);
            setLoading(false);
        });
    }
  }, [isOpen, role]);

  const handleAdminLogin = (e) => {
      e.preventDefault();
      if (password === 'HV@2026') {
          onLoginSuccess({ name: 'Administrator', role: 'ADMIN' });
      } else {
          setError('Incorrect Admin Password');
      }
  };

  const handleStaffLogin = (e) => {
      e.preventDefault();
      const user = users.find(u => u.id === selectedUser);
      if (user && user.password === password) {
          onLoginSuccess(user);
      } else {
          setError('Invalid Password');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 border border-white/20">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Lock className="w-6 h-6" /></div>
                    {role === 'ADMIN' ? 'Admin Access' : 'Staff Login'}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>

            {role === 'ADMIN' ? (
                <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full p-4 border border-gray-200 rounded-2xl mt-1 outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all bg-gray-50 focus:bg-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Admin Password"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl text-center">{error}</p>}
                    <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-transform active:scale-95 shadow-lg shadow-gray-300">
                        Unlock Console
                    </button>
                </form>
            ) : (
                <form onSubmit={handleStaffLogin} className="space-y-5">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-violet-500" /> Loading Staff...</div>
                    ) : users.length === 0 ? (
                        <div className="py-6 text-center text-amber-600 bg-amber-50 rounded-2xl p-6 font-medium">
                            No staff found for this role. <br/><span className="text-sm opacity-80">Please ask Admin to add you in Settings.</span>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Select Staff Member</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-4 border border-gray-200 rounded-2xl mt-1 outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 bg-gray-50 appearance-none font-bold text-gray-700"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Name --</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    <ChevronRight className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/3 rotate-90 pointer-events-none"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                                <input 
                                    type="password" 
                                    className="w-full p-4 border border-gray-200 rounded-2xl mt-1 outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all bg-gray-50 focus:bg-white"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter Your Password"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl text-center">{error}</p>}
                            <button type="submit" className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition-all active:scale-95 shadow-lg shadow-violet-200" disabled={!selectedUser}>
                                Login to Store
                            </button>
                        </>
                    )}
                </form>
            )}
        </div>
    </div>
  );
};

// 4. SKU Mapping Modal
// ... SkuMappingModal ...
const SkuMappingModal = ({ isOpen, onClose }) => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [mappingStats, setMappingStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('UPLOAD'); 

    useEffect(() => {
        if (!isAuthenticated) return;
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'sku_upload_history'), orderBy('uploadedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'HV@2026') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Incorrect Password');
        }
    };

    const handleFile = (e) => {
        setFile(e.target.files[0]);
        setError('');
        setMappingStats(null);
    };

    const processMappingFile = async () => {
        if (!file) return;
        if (!window.XLSX) {
             alert("System still initializing. Please try again.");
             return;
        }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const rawData = window.XLSX.utils.sheet_to_json(window.XLSX.read(evt.target.result, { type: 'binary' }).Sheets[window.XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]]);
                
                const batch = writeBatch(db);
                let count = 0;
                
                rawData.forEach(row => {
                    const keys = Object.keys(row);
                    const masterKey = keys.find(k => k.toLowerCase().includes('master'));
                    const fgKey = keys.find(k => k.toLowerCase().includes('fg') && k.toLowerCase().includes('sku'));
                    const sfgKey = keys.find(k => k.toLowerCase().includes('sf') && k.toLowerCase().includes('sku'));

                    if (masterKey) {
                        const masterSku = String(row[masterKey]).trim();
                        
                        if (fgKey && row[fgKey]) {
                            const fgCode = String(row[fgKey]).trim().toUpperCase();
                            const ref = doc(db, 'artifacts', appId, 'public', 'data', 'sku_mappings', fgCode);
                            batch.set(ref, { masterSku: masterSku, type: 'FG' });
                            count++;
                        }

                        if (sfgKey && row[sfgKey]) {
                            const sfgCode = String(row[sfgKey]).trim().toUpperCase();
                            const ref = doc(db, 'artifacts', appId, 'public', 'data', 'sku_mappings', sfgCode);
                            batch.set(ref, { masterSku: masterSku, type: 'SFG' });
                            count++;
                        }
                    }
                });

                // Save to history
                const historyRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'sku_upload_history'));
                batch.set(historyRef, {
                    fileName: file.name,
                    uploadedAt: serverTimestamp(),
                    uploadedBy: 'Admin',
                    rowCount: rawData.length,
                    rawData: JSON.stringify(rawData) 
                });

                await batch.commit();
                setMappingStats(count);
                setFile(null);
            } catch (err) {
                console.error(err);
                setError('Failed to process file. Ensure standard headers or file size under limit.');
            } finally {
                setUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleClearMappings = async () => {
        if (!confirm("Are you sure you want to delete ALL existing SKU mappings? This cannot be undone and will break scanning for mapped items.")) return;
        setUploading(true);
        try {
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'sku_mappings'));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            alert("All mappings cleared successfully.");
        } catch(e) {
            console.error(e);
            alert("Error clearing mappings.");
        } finally {
            setUploading(false);
        }
    };

    const deleteHistoryItem = async (id) => {
         if (!confirm("Delete this history record?")) return;
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sku_upload_history', id));
    };

    const downloadHistoryItem = (item) => {
        try {
            const data = JSON.parse(item.rawData);
            const ws = window.XLSX.utils.json_to_sheet(data);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "Mapping");
            window.XLSX.writeFile(wb, item.fileName || 'mapping_backup.xlsx');
        } catch (e) {
            alert("Error downloading file: Data may be corrupted.");
        }
    };

    const downloadSampleTemplate = () => {
        const wsData = [
            { "Master SKU": "ALL004_36", "FG SKU": "FG000079", "SFG SKU": "SF001130" },
            { "Master SKU": "ALL005_42", "FG SKU": "FG000080", "SFG SKU": "SF001131" }
        ];
        const ws = window.XLSX.utils.json_to_sheet(wsData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Template");
        window.XLSX.writeFile(wb, "SKU_Mapping_Template.xlsx");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[80vh] flex flex-col border border-white/10">
                <div className="flex justify-between items-center mb-8 flex-none">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Link className="w-6 h-6" /></div>
                        SKU Mapping
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                {!isAuthenticated ? (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <p className="text-gray-500 font-medium">Enter Admin password to manage SKU links.</p>
                        <input 
                            type="password" 
                            className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-gray-50" 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                        <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:scale-[1.02] transition-transform">Unlock</button>
                    </form>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl flex-none">
                            <button onClick={() => setActiveTab('UPLOAD')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'UPLOAD' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>New Upload</button>
                            <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Upload History</button>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {activeTab === 'UPLOAD' ? (
                                <div className="space-y-6 pt-2">
                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 text-sm text-indigo-800">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-base">Instructions</p>
                                            <button onClick={downloadSampleTemplate} className="text-xs bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 flex items-center gap-1 text-indigo-600 font-bold transition-colors">
                                                <Download className="w-3 h-3" /> Template
                                            </button>
                                        </div>
                                        <p className="leading-relaxed">Upload an Excel file. Required columns: <strong>Master SKU</strong>, <strong>FG SKU</strong>, and <strong>SFG SKU</strong>.</p>
                                        <p className="mt-3 text-xs font-semibold text-indigo-600/70 uppercase tracking-wide">Tip: Use "Clear All" for a fresh start.</p>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/10 transition-all bg-gray-50">
                                        <input type="file" id="mapping-upload" className="hidden" onChange={handleFile} accept=".xlsx,.xls" />
                                        <label htmlFor="mapping-upload" className="cursor-pointer block">
                                            <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                                            <span className="text-sm font-bold text-gray-600 block">{file ? file.name : "Click to Upload Excel"}</span>
                                        </label>
                                    </div>
                                    {mappingStats !== null && <div className="bg-teal-50 border border-teal-100 text-teal-700 p-4 rounded-2xl text-sm text-center font-bold">Successfully mapped {mappingStats} codes!</div>}
                                    {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-xl">{error}</p>}
                                    <div className="flex gap-4">
                                        <button onClick={handleClearMappings} className="px-5 py-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 flex-none border border-red-100 transition-colors" title="Delete ALL SKU mappings to start fresh"><Trash2 className="w-5 h-5" /></button>
                                        <button onClick={processMappingFile} disabled={!file || uploading} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 transition-transform active:scale-95">
                                            {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Database'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 pt-2">
                                    {history.length === 0 && <div className="text-center text-gray-400 py-12 flex flex-col items-center"><FileText className="w-10 h-10 opacity-20 mb-2"/>No upload history found.</div>}
                                    {history.map((item) => (
                                        <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all flex justify-between items-center group">
                                            <div className="min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1"><div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><FileText className="w-4 h-4" /></div><span className="font-bold text-gray-700 truncate text-sm">{item.fileName}</span></div>
                                                <div className="text-xs text-gray-400 flex items-center gap-2 pl-1"><Clock className="w-3 h-3" /> {formatDate(item.uploadedAt)}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => downloadHistoryItem(item)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                                                <button onClick={() => deleteHistoryItem(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 5. Settings View
const SettingsView = () => {
    // ... same logic
    const [staff, setStaff] = useState([]);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('FG_STORE');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mappingModalOpen, setMappingModalOpen] = useState(false);

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'staff_directory'));
        const unsubscribe = onSnapshot(q, (snap) => {
            setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!newName || !newPassword) return;
        setLoading(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_directory'), {
                name: newName,
                role: newRole,
                password: newPassword,
                createdAt: serverTimestamp()
            });
            setNewName('');
            setNewPassword('');
            setLoading(false);
        } catch (error) {
            console.error("Error adding staff:", error);
            setLoading(false);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (confirm('Are you sure you want to remove this staff member?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_directory', id));
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <SkuMappingModal isOpen={mappingModalOpen} onClose={() => setMappingModalOpen(false)} />
            
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
                <h3 className="font-extrabold text-gray-800 mb-6 flex items-center gap-3 text-lg"><Settings className="w-6 h-6 text-indigo-500" /> System Configuration</h3>
                <div className="flex flex-wrap gap-4">
                     <button onClick={() => setMappingModalOpen(true)} className="flex items-center gap-4 px-6 py-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl hover:shadow-lg hover:border-indigo-200 transition-all group text-left w-full sm:w-auto">
                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform text-indigo-600"><Link className="w-6 h-6" /></div>
                        <div><div className="font-bold text-gray-800 text-lg">SKU Mapping</div><div className="text-sm text-gray-500">Manage Master/FG/SFG Links</div></div>
                     </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 h-fit">
                    <h3 className="font-extrabold text-gray-800 mb-6 flex items-center gap-3 text-lg"><Plus className="w-6 h-6 text-blue-500" /> Add New Staff</h3>
                    <form onSubmit={handleAddStaff} className="space-y-5">
                        <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Name</label><input type="text" className="w-full p-3.5 border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors" placeholder="John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Role</label><div className="relative"><select className="w-full p-3.5 border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 appearance-none font-medium" value={newRole} onChange={(e) => setNewRole(e.target.value)}><option value="FG_STORE">Finished Goods</option><option value="SFG_STORE">Semi-Finished</option><option value="WIP_FLOOR">WIP Floor</option><option value="STOCK_IN">Stock In</option><option value="STOCK_OUT">Stock Out</option></select><ChevronRight className="absolute right-4 top-1/2 translate-y-0 text-gray-400 rotate-90 pointer-events-none w-4 h-4"/></div></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label><input type="text" className="w-full p-3.5 border border-gray-200 rounded-xl mt-1 outline-none font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors" placeholder="Set Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                        <button type="submit" disabled={loading} className="w-full p-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95 flex justify-center items-center">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create User'}</button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col">
                    <div className="p-6 bg-gray-50/50 border-b border-gray-100 font-extrabold text-gray-800 flex items-center gap-3 text-lg"><Users className="w-6 h-6 text-violet-500" /> Staff Directory</div>
                    <div className="divide-y divide-gray-50 flex-1 overflow-y-auto max-h-[600px]">
                        {staff.length === 0 && <div className="p-8 text-center text-gray-400 italic">No staff added yet.</div>}
                        {staff.map(user => (
                            <div key={user.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-5">
                                    <div className={`p-3 rounded-2xl shadow-sm ${user.role === 'FG_STORE' ? 'bg-teal-100 text-teal-600' : user.role === 'SFG_STORE' ? 'bg-orange-100 text-orange-600' : user.role === 'WIP_FLOOR' ? 'bg-rose-100 text-rose-600' : user.role === 'STOCK_IN' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg">{user.name}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">{user.role.replace('_', ' ')}</span>
                                            <span className="text-xs font-mono text-gray-400">Pass: {user.password}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteStaff(user.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 6. Reports View
const ReportsView = ({ allOrders, stats }) => {
    // ... same logic
    const pendingTasks = stats.fg.pending + stats.sfg.pending + stats.wip.pending;
    const isLocked = pendingTasks > 0;
    
    const handleExport = () => {
        if (isLocked) { alert(`Cannot export. ${pendingTasks} tasks pending.`); return; }
        if (!window.XLSX) return;
        const wsData = allOrders.map(order => ({ 'SKU': order.sku, 'Category': order.category, 'Quantity': order.quantity, 'Status': order.status, 'Portal': order.portal || 'N/A', 'Picked By': order.pickedBy || 'N/A', 'Time': order.pickedAt ? formatTime(order.pickedAt) : '' }));
        const ws = window.XLSX.utils.json_to_sheet(wsData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Daily Report");
        window.XLSX.writeFile(wb, `Warehouse_Daily_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const portalDistribution = useMemo(() => {
        const dist = {};
        allOrders.forEach(o => {
        if (o.category === 'FG_STORE' && o.portal) {
            dist[o.portal] = (dist[o.portal] || 0) + o.quantity;
        }
        });
        return Object.entries(dist).sort((a,b) => b[1] - a[1]);
    }, [allOrders]);

    const userPerformance = useMemo(() => {
        const perf = {};
        allOrders.forEach(o => {
            if (o.status === 'COMPLETED' && o.pickedBy) {
                if (!perf[o.pickedBy]) perf[o.pickedBy] = { lines: 0, units: 0 };
                perf[o.pickedBy].lines += 1;
                perf[o.pickedBy].units += (o.quantity || 0);
            }
        });
        return Object.entries(perf).sort((a,b) => b[1].units - a[1].units);
    }, [allOrders]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className={`rounded-3xl p-10 border transition-all duration-300 flex flex-col items-center text-center space-y-6 ${isLocked ? 'bg-gray-100 border-gray-200' : 'bg-gradient-to-br from-teal-50 to-white border-teal-100 shadow-2xl shadow-teal-100/50'}`}>
            <div className={`p-6 rounded-full shadow-inner ${isLocked ? 'bg-gray-200 text-gray-400' : 'bg-teal-100 text-teal-600'}`}>
                {isLocked ? <Lock className="w-12 h-12" /> : <Download className="w-12 h-12 animate-bounce" />}
            </div>
            <div>
                <h3 className="text-3xl font-extrabold text-gray-800">Daily Completion Report</h3>
                <p className="text-gray-500 mt-2 max-w-lg mx-auto font-medium">
                    {isLocked 
                    ? `Export is currently locked because there are ${pendingTasks} pending tasks remaining.` 
                    : "All tasks completed! You can now download the comprehensive End-of-Day report."}
                </p>
            </div>
            <button onClick={handleExport} disabled={isLocked} className={`px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all text-lg shadow-lg ${isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-teal-600 text-white hover:bg-teal-700 hover:scale-105 shadow-teal-200'}`}>
                <FileText className="w-6 h-6" /> Download Excel Report
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
                <h4 className="font-extrabold text-gray-800 mb-8 flex items-center gap-3 text-lg"><PieChart className="w-6 h-6 text-blue-500" /> Portal Distribution</h4>
                <div className="space-y-5">
                    {portalDistribution.map(([portal, qty]) => (
                    <div key={portal} className="flex items-center gap-4">
                        <div className="w-24 text-xs font-bold text-gray-400 uppercase text-right truncate">{portal}</div>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full shadow-sm" style={{ width: `${(qty / portalDistribution.reduce((a,b) => a+b[1], 0)) * 100}%` }}></div></div>
                        <div className="w-16 text-right font-bold text-gray-800 text-base">{qty}</div>
                    </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
                <h4 className="font-extrabold text-gray-800 mb-8 flex items-center gap-3 text-lg"><BarChart3 className="w-6 h-6 text-violet-500" /> Picker Performance</h4>
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase text-xs"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4 text-right">Lines</th><th className="px-6 py-4 text-right">Units</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {userPerformance.length === 0 && <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400 italic">No activity yet</td></tr>}
                        {userPerformance.map(([user, data]) => (
                            <tr key={user} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-bold text-gray-700">{user}</td><td className="px-6 py-4 text-right text-gray-500 font-medium">{data.lines}</td><td className="px-6 py-4 text-right font-bold text-violet-600 text-lg">{data.units}</td></tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
        </div>
    );
};

const StatsView = ({ currentOrders }) => {
    // ... same logic
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState(7); 

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'history'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setHistory(data);
        });
        return () => unsubscribe();
    }, []);

    const today = new Date().toISOString().split('T')[0];
    
    const liveToday = useMemo(() => {
        if (!currentOrders || currentOrders.length === 0) return null;
        return {
            id: 'live-today',
            day: today,
            date: today,
            total: currentOrders.length,
            units: currentOrders.reduce((a,b) => a + (b.quantity||0), 0),
            fg: currentOrders.filter(o => o.category === 'FG_STORE').length,
            sfg: currentOrders.filter(o => o.category === 'SFG_STORE').length,
            wip: currentOrders.filter(o => o.category === 'WIP_FLOOR').length,
            completed: currentOrders.filter(o => o.status === 'COMPLETED').length
        };
    }, [currentOrders, today]);

    const combinedHistory = useMemo(() => {
        const past = history.filter(h => h.date !== today);
        if (liveToday) return [...past, liveToday];
        return past;
    }, [history, liveToday, today]);

    const filteredHistory = useMemo(() => {
        if (filter === 'ALL') return combinedHistory;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filter);
        return combinedHistory.filter(item => new Date(item.date) >= cutoff);
    }, [combinedHistory, filter]);

    const aggregate = useMemo(() => {
        return filteredHistory.reduce((acc, curr) => ({
            total: acc.total + (curr.total || 0),
            units: acc.units + (curr.units || 0),
            fg: acc.fg + (curr.fg || 0),
            sfg: acc.sfg + (curr.sfg || 0),
            wip: acc.wip + (curr.wip || 0),
            completed: acc.completed + (curr.completed || 0),
        }), { total: 0, units: 0, fg: 0, sfg: 0, wip: 0, completed: 0 });
    }, [filteredHistory]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/40 gap-4">
                <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto">
                    {[7, 30, 'ALL'].map((f) => (
                        <button key={f} onClick={() => setFilter(f)} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {f === 'ALL' ? 'All Time' : `Last ${f} Days`}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100"><p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Units</p><p className="text-4xl font-extrabold text-gray-800 mt-2">{aggregate.units.toLocaleString()}</p></div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100"><p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Completion Rate</p><p className="text-4xl font-extrabold text-teal-500 mt-2">{aggregate.total ? Math.round((aggregate.completed / aggregate.total) * 100) : 0}%</p></div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100"><p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Orders</p><p className="text-4xl font-extrabold text-blue-500 mt-2">{aggregate.total.toLocaleString()}</p></div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100"><p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Daily Units</p><p className="text-4xl font-extrabold text-violet-500 mt-2">{filteredHistory.length ? Math.round(aggregate.units / filteredHistory.length) : 0}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
                    <h3 className="font-extrabold text-gray-800 mb-8 flex items-center gap-3 text-lg"><PieChart className="w-6 h-6 text-violet-500" /> Category Split</h3>
                    <div className="space-y-6">
                        {[{ label: 'Finished Goods', val: aggregate.fg, color: 'bg-teal-500' }, { label: 'Semi-Finished', val: aggregate.sfg, color: 'bg-orange-500' }, { label: 'WIP Floor', val: aggregate.wip, color: 'bg-rose-500' }].map((cat) => (
                            <div key={cat.label}><div className="flex justify-between text-sm font-bold text-gray-600 mb-2"><span>{cat.label}</span><span>{Math.round((cat.val / (aggregate.total || 1)) * 100)}%</span></div><div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${cat.color} shadow-sm`} style={{ width: `${(cat.val / (aggregate.total || 1)) * 100}%` }}></div></div></div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                     <h3 className="font-extrabold text-gray-800 mb-8 flex items-center gap-3 text-lg"><TrendingUp className="w-6 h-6 text-blue-500" /> Daily Output Trend</h3>
                    <div className="flex items-end justify-between gap-3 h-48 mt-8">
                        {filteredHistory.slice(-14).map((h, i) => {
                            const max = Math.max(...filteredHistory.map(x => x.units), 100);
                            const height = Math.max((h.units / max) * 100, 5);
                            return (<div key={i} className="flex flex-col items-center flex-1 group relative"><div className="w-full bg-blue-100 rounded-t-lg group-hover:bg-blue-500 transition-all relative duration-300" style={{ height: `${height}%` }}><div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">{h.units}</div></div><span className="text-[10px] font-bold text-gray-300 group-hover:text-gray-500 mt-3 rotate-0 truncate w-full text-center transition-colors">{h.day.split('-')[2]}</span></div>);
                        })}
                        {filteredHistory.length === 0 && <div className="w-full text-center text-gray-400 text-sm self-center font-medium italic">No history data available yet.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- INVENTORY VIEW (NEW) ---
const InventoryView = () => {
    const [inventory, setInventory] = useState([]);
    const [filter, setFilter] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'));
        const unsub = onSnapshot(q, (snap) => {
            setInventory(snap.docs.map(d => ({ sku: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const handleInventoryUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.XLSX) {
            alert("System still initializing. Please try again.");
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = window.XLSX.utils.sheet_to_json(window.XLSX.read(evt.target.result, { type: 'binary' }).Sheets[window.XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]]);
                const batch = writeBatch(db);
                
                data.forEach(row => {
                    // Try to find SKU and Quantity columns flexibly
                    const skuKey = Object.keys(row).find(k => k.toLowerCase().includes('sku'));
                    const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('stock'));
                    
                    if (skuKey && qtyKey) {
                        const sku = String(row[skuKey]).trim();
                        const qty = parseInt(row[qtyKey]);
                        if (sku && !isNaN(qty)) {
                             const ref = doc(db, 'artifacts', appId, 'public', 'data', 'inventory', sku);
                             // Overwrite or update? Usually inventory upload is a reset or adjustment. 
                             // Using set without merge will overwrite. Using merge will update fields.
                             // Let's assume overwrite for "Upload Existing Inventory" implies setting the current state.
                             batch.set(ref, { 
                                 quantity: qty, 
                                 updatedAt: serverTimestamp(),
                                 updatedBy: 'Admin Upload'
                             });
                        }
                    }
                });

                await batch.commit();
                alert("Inventory updated successfully!");
            } catch (err) {
                console.error(err);
                alert("Failed to process inventory file.");
            } finally {
                setIsUploading(false);
                e.target.value = null; // Reset input
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleInventoryExport = () => {
        if (!window.XLSX) return;
        const wsData = inventory.map(item => ({
            'SKU': item.sku,
            'Quantity': item.quantity,
            'Last Updated': item.updatedAt ? formatDate(item.updatedAt) : ''
        }));
        const ws = window.XLSX.utils.json_to_sheet(wsData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Current Inventory");
        window.XLSX.writeFile(wb, `Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadInventoryTemplate = () => {
        if (!window.XLSX) return;
        const wsData = [
            { "SKU": "FG000001", "Quantity": 50 },
            { "SKU": "SF000001", "Quantity": 100 }
        ];
        const ws = window.XLSX.utils.json_to_sheet(wsData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Inventory_Template");
        window.XLSX.writeFile(wb, "Inventory_Upload_Template.xlsx");
    };

    const filteredInv = inventory.filter(i => i.sku.toLowerCase().includes(filter.toLowerCase()));
    
    // Calculate Stats
    const totalStock = inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalSkus = inventory.length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             {/* Header Actions */}
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4 w-full md:w-auto">
                    <h3 className="font-extrabold text-gray-800 text-xl flex items-center gap-3"><Package className="w-6 h-6 text-indigo-500"/> Inventory Management</h3>
                    <div className="flex gap-2">
                        <button onClick={downloadInventoryTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition text-sm">
                            <Download className="w-4 h-4" /> Template
                        </button>
                        
                        <button onClick={() => document.getElementById('inv-upload').click()} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition text-sm">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />} Upload
                        </button>
                        <input id="inv-upload" type="file" className="hidden" onChange={handleInventoryUpload} accept=".xlsx,.xls" />
                        
                        <button onClick={handleInventoryExport} className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-xl font-bold hover:bg-teal-100 transition text-sm">
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                 </div>
                 <div className="relative w-full md:w-64">
                    <input type="text" placeholder="Search Inventory..." className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-100" value={filter} onChange={e => setFilter(e.target.value)} />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 </div>
             </div>
             
             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">Total Inventory Count</p>
                        <p className="text-5xl font-extrabold tracking-tight">{totalStock.toLocaleString()}</p>
                        <p className="text-xs text-indigo-200 font-medium mt-1">Units on hand</p>
                    </div>
                    <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-white/20 transition-colors"></div>
                    <Package className="absolute bottom-6 right-6 w-12 h-12 text-indigo-200/20" />
                </div>
                
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Unique SKUs</p>
                        <p className="text-5xl font-extrabold tracking-tight text-gray-800">{totalSkus.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">Distinct items tracked</p>
                    </div>
                    <ScanBarcode className="absolute bottom-6 right-6 w-12 h-12 text-gray-100" />
                </div>
             </div>

             {/* Table */}
             <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase text-xs sticky top-0 backdrop-blur-sm z-10">
                            <tr><th className="px-8 py-5">SKU</th><th className="px-8 py-5 text-right">Quantity</th><th className="px-8 py-5 text-right">Last Updated</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredInv.length === 0 && <tr><td colSpan="3" className="text-center py-12 text-gray-400 italic">No inventory records found.</td></tr>}
                            {filteredInv.map((item) => (
                                <tr key={item.sku} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-5 font-mono font-bold text-gray-700">{item.sku}</td>
                                    <td className="px-8 py-5 text-right font-extrabold text-indigo-600 text-lg">{item.quantity}</td>
                                    <td className="px-8 py-5 text-right text-sm text-gray-400">{item.updatedAt ? formatDate(item.updatedAt) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    )
};

// ... AdminDashboard ...
const AdminDashboard = ({ user, logout }) => {
  const [view, setView] = useState('DASHBOARD');
  const [stats, setStats] = useState({ fg: {pending: 0, total: 0}, sfg: {pending: 0, total: 0}, wip: {pending: 0, total: 0} });
  const [portalStats, setPortalStats] = useState({ grandTotal: 0 });
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 
  const [grandTotal, setGrandTotal] = useState(0); 
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [columnMap, setColumnMap] = useState(null); 
  const [detailCategory, setDetailCategory] = useState(null); 
  const [completedUnits, setCompletedUnits] = useState(0);
  const [activeActivityTab, setActiveActivityTab] = useState('FG_STORE');
  const [lastUploadTime, setLastUploadTime] = useState(null); 

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const ordersQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllOrders(orders); 
      
      const calc = (cat) => ({
         pending: orders.filter(o => o.category === cat && (o.status === 'PENDING' || o.status === 'WIP_PROCESSING')).reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0),
         total: orders.filter(o => o.category === cat).reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0)
      });

      const fg = calc('FG_STORE');
      const sfg = calc('SFG_STORE');
      const wip = calc('WIP_FLOOR');
      
      const completedCount = orders.filter(o => o.status === 'COMPLETED').reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0);
      setCompletedUnits(completedCount);
      
      const dynamicTotal = orders.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0);
      setGrandTotal(dynamicTotal);

      setStats({ fg, sfg, wip });

      const completedList = orders
        .filter(o => o.status === 'COMPLETED')
        .sort((a, b) => {
            const timeA = a.pickedAt?.seconds || 0;
            const timeB = b.pickedAt?.seconds || 0;
            return timeB - timeA;
        });
      setRecentCompleted(completedList);

      const livePortals = { ajio: 0, nykaa: 0, flipkart: 0, amazon: 0, myntra: 0, firstcry: 0, website: 0 };
      orders.forEach(order => {
        if((order.status === 'PENDING' || order.status === 'WIP_PROCESSING') && order.category === 'FG_STORE' && order.portal) {
           const p = order.portal.toLowerCase();
           if (livePortals[p] !== undefined) livePortals[p] += (parseInt(order.quantity) || 0);
        }
      });
      setPortalStats(prev => ({ ...livePortals, grandTotal: dynamicTotal })); 
    });
    return () => { unsubOrders(); };
  }, [user]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'last_upload'), (doc) => {
        if (doc.exists()) {
            setLastUploadTime(doc.data().timestamp);
        }
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.XLSX) {
        alert("System is still initializing resources. Please try again in a few seconds.");
        return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = window.XLSX.utils.sheet_to_json(window.XLSX.read(evt.target.result, { type: 'binary' }).Sheets[window.XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]], { header: 1 });
        setParsedData(data);
        let headerRowIndex = -1;
        let colIndices = { sku: -1, fg: -1, sfg: -1, wip: -1, ajio: -1, nykaa: -1, flipkart: -1, amazon: -1, myntra: -1, firstcry: -1, website: -1, grandTotal: -1 };
        let maxScore = 0;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = (data[i] || []).map(c => String(c || '').toLowerCase().trim());
            let score = 0;
            let ci = { ...colIndices };
            const skuIdx = row.findIndex(c => c === 'mastersku' || c === 'master sku');
            if (skuIdx !== -1) { score += 5; ci.sku = skuIdx; }
            // FG/SFG code logic
            if (row.findIndex(c => c.includes('fg') && c.includes('sku')) !== -1) ci.fgSku = row.findIndex(c => c.includes('fg') && c.includes('sku'));
            else if (row.findIndex(c => c.includes('fg') && c.includes('code')) !== -1) ci.fgSku = row.findIndex(c => c.includes('fg') && c.includes('code'));
            if (row.findIndex(c => (c.includes('sfg') || c.includes('semi')) && c.includes('sku')) !== -1) ci.sfgSku = row.findIndex(c => (c.includes('sfg') || c.includes('semi')) && c.includes('sku'));
            else if (row.findIndex(c => (c.includes('sfg') || c.includes('semi')) && c.includes('code')) !== -1) ci.sfgSku = row.findIndex(c => (c.includes('sfg') || c.includes('semi')) && c.includes('code'));
            
            if (row.findIndex(c => c.includes('ajio')) !== -1) ci.ajio = row.findIndex(c => c.includes('ajio') && !c.includes('date') && !c.includes('id'));
            if (row.findIndex(c => c.includes('nykaa')) !== -1) ci.nykaa = row.findIndex(c => c.includes('nykaa') && !c.includes('date') && !c.includes('id'));
            if (row.findIndex(c => c.includes('flipkart')) !== -1) ci.flipkart = row.findIndex(c => c.includes('flipkart') && !c.includes('date') && !c.includes('id'));
            if (row.findIndex(c => c.includes('amazon')) !== -1) ci.amazon = row.findIndex(c => c.includes('amazon') && !c.includes('date') && !c.includes('id'));
            if (row.findIndex(c => c.includes('myntra')) !== -1) ci.myntra = row.findIndex(c => c.includes('myntra') && !c.includes('date') && !c.includes('id'));
            if (row.findIndex(c => c.includes('firstcry')) !== -1) ci.firstcry = row.findIndex(c => c.includes('firstcry') && !c.includes('date') && !c.includes('id'));
            if (row.findIndex(c => c.includes('website')) !== -1) ci.website = row.findIndex(c => c.includes('website') && !c.includes('date') && !c.includes('id'));

            const isQtyHeader = c => c.includes('qty') || c.includes('quantity') || c.includes('stock') || c.includes('count') || c.includes('unit') || c.includes('available');

            if (row.findIndex(c => c.includes('finish') && c.includes('good') && isQtyHeader(c)) !== -1) { score += 3; ci.fg = row.findIndex(c => c.includes('finish') && c.includes('good') && isQtyHeader(c)); }
            else if (row.findIndex(c => c.includes('fg') && isQtyHeader(c)) !== -1) { score += 3; ci.fg = row.findIndex(c => c.includes('fg') && isQtyHeader(c)); }

            if (row.findIndex(c => c.includes('semi') && c.includes('finish') && isQtyHeader(c)) !== -1) { score += 3; ci.sfg = row.findIndex(c => c.includes('semi') && c.includes('finish') && isQtyHeader(c)); }
            else if (row.findIndex(c => c.includes('sfg') && isQtyHeader(c)) !== -1) { score += 3; ci.sfg = row.findIndex(c => c.includes('sfg') && isQtyHeader(c)); }

            if (row.findIndex(c => c.includes('wip') && (isQtyHeader(c) || c.includes('pick'))) !== -1) { score += 3; ci.wip = row.findIndex(c => c.includes('wip') && (isQtyHeader(c) || c.includes('pick'))); }
            
            if (score > maxScore) { maxScore = score; headerRowIndex = i; colIndices = ci; }
        }
        if (headerRowIndex !== -1) setColumnMap({ headerRowIndex, ...colIndices });
      } catch (e) {
        console.error("File parse error:", e);
        alert("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessUpload = async () => {
    if (parsedData.length === 0 || !columnMap) return;
    setIsUploading(true);
    const batch = [];
    let grandTotalSum = 0;
    const { headerRowIndex, sku: skuIdx, fg: fgIdx, sfg: sfgIdx, wip: wipIdx, fgSku: fgSkuIdx, sfgSku: sfgSkuIdx, grandTotal: totalIdx } = columnMap;

    for (let i = headerRowIndex + 1; i < parsedData.length; i++) {
      const row = parsedData[i];
      if (!row) continue;
      const sku = row[skuIdx];
      if (!sku || String(sku).toLowerCase().includes('total')) continue;

      const fgAvailable = fgIdx !== -1 ? parseQty(row[fgIdx]) : 0;
      const sfgQty = sfgIdx !== -1 ? parseQty(row[sfgIdx]) : 0;
      const wipQty = wipIdx !== -1 ? parseQty(row[wipIdx]) : 0;
      
      const fgSku = fgSkuIdx && fgSkuIdx !== -1 ? String(row[fgSkuIdx]).trim() : '';
      const sfgSku = sfgSkuIdx && sfgSkuIdx !== -1 ? String(row[sfgSkuIdx]).trim() : '';
      const baseItem = { sku, fgSku, sfgSku };

      if (sfgQty > 0) batch.push({ ...baseItem, quantity: sfgQty, category: 'SFG_STORE', status: 'PENDING', createdAt: serverTimestamp(), portal: 'General' });
      if (wipQty > 0) batch.push({ ...baseItem, quantity: wipQty, category: 'WIP_FLOOR', status: 'PENDING', createdAt: serverTimestamp(), portal: 'General' });

      if (fgAvailable > 0) {
        let remainingFg = fgAvailable;
        const portals = ['Ajio', 'Nykaa', 'Flipkart', 'Amazon', 'Myntra', 'FirstCry', 'Website'];
        const pIndices = [columnMap.ajio, columnMap.nykaa, columnMap.flipkart, columnMap.amazon, columnMap.myntra, columnMap.firstcry, columnMap.website];
        
        portals.forEach((pName, idx) => {
            const pIndex = pIndices[idx];
            if (pIndex !== undefined && pIndex !== -1) {
                const pQty = parseQty(row[pIndex]);
                if (remainingFg > 0 && pQty > 0) {
                    const take = Math.min(remainingFg, pQty);
                    batch.push({ ...baseItem, quantity: take, category: 'FG_STORE', status: 'PENDING', createdAt: serverTimestamp(), portal: pName });
                    remainingFg -= take;
                }
            }
        });
        if (remainingFg > 0) batch.push({ ...baseItem, quantity: remainingFg, category: 'FG_STORE', status: 'PENDING', createdAt: serverTimestamp(), portal: 'All Stock' });
      }

      grandTotalSum += totalIdx !== -1 ? parseQty(row[totalIdx]) : 0; 
    }

    try {
      const statsUpdate = {
          total: batch.length,
          units: batch.reduce((acc, item) => acc + (item.quantity || 0), 0),
          fg: batch.filter(i => i.category === 'FG_STORE').length,
          sfg: batch.filter(i => i.category === 'SFG_STORE').length,
          wip: batch.filter(i => i.category === 'WIP_FLOOR').length
      };

      const today = new Date().toISOString().split('T')[0];
      const historyRef = doc(db, 'artifacts', appId, 'public', 'data', 'history', today);

      await setDoc(historyRef, {
          day: today,
          date: today, 
          total: increment(statsUpdate.total),
          units: increment(statsUpdate.units),
          fg: increment(statsUpdate.fg),
          sfg: increment(statsUpdate.sfg),
          wip: increment(statsUpdate.wip)
      }, { merge: true });

      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders');
      await Promise.all(batch.map(item => addDoc(collectionRef, item)));
      
      const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'last_upload');
      await setDoc(metaRef, { timestamp: serverTimestamp() });

      setParsedData([]); setFileName(''); setColumnMap(null);
    } catch (err) { console.error(err); alert("Error uploading. Check console."); } 
    finally { setIsUploading(false); }
  };

  const handleClearAll = async () => {
    if(prompt("Type 'RESET' to delete all data") !== 'RESET') return;
    
    const today = new Date().toISOString().split('T')[0];
    const finalStats = {
        total: allOrders.length,
        units: allOrders.reduce((a,b) => a + (b.quantity||0), 0),
        fg: allOrders.filter(o => o.category === 'FG_STORE').length,
        sfg: allOrders.filter(o => o.category === 'SFG_STORE').length,
        wip: allOrders.filter(o => o.category === 'WIP_FLOOR').length,
        completed: allOrders.filter(o => o.status === 'COMPLETED').length
    };
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'history', today), {
        ...finalStats,
        day: today, 
        date: today
    }, { merge: true });

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'daily_summary'), { grandTotal: 0 });
    alert("Reset Complete. Today's stats have been archived.");
  };

  const getPercentage = (part, total) => (!total ? 0 : Math.round((part / total) * 100));
   
  const filteredActivity = recentCompleted.filter(t => t.category === activeActivityTab);

  return (
    <DashboardLayout 
        title="Admin Console" 
        user={user} 
        logout={logout}
        currentTab={view}
        setTab={setView}
        tabs={[
            { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'REPORTS', label: 'Reports', icon: FileText }, // Replaced FileSpreadsheet
            { id: 'STATS', label: 'Stats', icon: BarChart3 },
            { id: 'INVENTORY', label: 'Inventory', icon: Package }, 
            { id: 'SETTINGS', label: 'Settings', icon: Settings },
        ]}
    >
        <CategoryDetailModal category={detailCategory} onClose={() => setDetailCategory(null)} orders={allOrders} />

        {view === 'REPORTS' && <ReportsView allOrders={allOrders} stats={stats} />}
        {view === 'STATS' && <StatsView currentOrders={allOrders} />}
        {view === 'INVENTORY' && <InventoryView />}
        {view === 'SETTINGS' && <SettingsView />}
        
        {view === 'DASHBOARD' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
                    <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm"><Clock className="w-5 h-5"/></div>
                        <div>
                            <span className="block text-[10px] uppercase tracking-wider font-bold text-blue-400">Last Data Refresh</span>
                            <span className="text-blue-900 font-bold text-sm">{lastUploadTime ? formatDate(lastUploadTime) : "No data uploaded"}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => document.getElementById('file-upload').click()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-lg shadow-gray-300"><Upload className="w-4 h-4"/> Upload Excel</button>
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                    </div>
                </div>
                {fileName && !isUploading && (
                    <div className="bg-violet-50 p-6 rounded-3xl shadow-sm border border-violet-100 flex justify-between items-center animate-in slide-in-from-top-4"><div className="flex items-center gap-4"><div className="p-3 bg-white rounded-2xl text-violet-600 shadow-sm"><FileText className="w-6 h-6"/></div><span className="font-bold text-violet-900 text-lg">{fileName}</span></div><button onClick={handleProcessUpload} className="bg-violet-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 hover:scale-105 transition-all">Process File</button></div>
                )}
                {isUploading && <div className="bg-blue-50 p-8 rounded-3xl text-blue-700 flex flex-col items-center gap-4 border border-blue-100"><Loader2 className="animate-spin w-10 h-10"/><span className="font-bold text-lg">Processing your data...</span></div>}
                
                {/* Row 1: High Level Stats - 2 columns on medium, side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-800 to-black rounded-3xl p-8 text-white shadow-2xl shadow-gray-400/50 relative overflow-hidden group">
                        <div className="relative z-10"><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Load</p><p className="text-5xl font-extrabold tracking-tight">{grandTotal.toLocaleString()}</p></div>
                        <div className="absolute top-0 right-0 p-24 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-white/10 transition-colors"></div>
                        <div className="absolute bottom-0 left-0 p-16 bg-blue-500/20 rounded-full blur-2xl -ml-8 -mb-8"></div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl shadow-teal-200/50 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-2">Completed</p>
                            <p className="text-5xl font-extrabold tracking-tight">{completedUnits.toLocaleString()}</p>
                            <p className="text-xs text-teal-50 font-medium mt-1">Total Units Done</p>
                        </div>
                        <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-white/20 transition-colors"></div>
                        <CheckCircle className="absolute bottom-4 right-4 w-12 h-12 text-teal-200/20" />
                    </div>
                </div>

                {/* Row 2: Category Breakdown - 3 columns on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <button onClick={() => setDetailCategory('FG_STORE')} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-teal-100/50 hover:border-teal-200 transition-all text-left group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-teal-100 text-teal-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm"><Package className="w-6 h-6" /></div>
                                <span className="font-bold text-gray-700">Finished Goods</span>
                            </div>
                            <p className="text-4xl font-extrabold text-gray-800 mb-1">{stats.fg.pending}</p>
                            
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Pending Units</p>
                                <span className="text-xs font-bold text-gray-500">{getPercentage(stats.fg.total, grandTotal)}% of Load</span>
                            </div>

                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{width: `${getPercentage(stats.fg.total, grandTotal)}%`}}></div></div>
                        </div>
                    </button>
                    <button onClick={() => setDetailCategory('SFG_STORE')} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-orange-100/50 hover:border-orange-200 transition-all text-left group relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                         <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm"><Truck className="w-6 h-6" /></div>
                                <span className="font-bold text-gray-700">Semi-Finished</span>
                            </div>
                            <p className="text-4xl font-extrabold text-gray-800 mb-1">{stats.sfg.pending}</p>

                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Pending Units</p>
                                <span className="text-xs font-bold text-gray-500">{getPercentage(stats.sfg.total, grandTotal)}% of Load</span>
                            </div>

                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{width: `${getPercentage(stats.sfg.total, grandTotal)}%`}}></div></div>
                         </div>
                    </button>
                    <button onClick={() => setDetailCategory('WIP_FLOOR')} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-rose-100/50 hover:border-rose-200 transition-all text-left group relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                         <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm"><Hammer className="w-6 h-6" /></div>
                                <span className="font-bold text-gray-700">WIP Floor</span>
                            </div>
                            <p className="text-4xl font-extrabold text-gray-800 mb-1">{stats.wip.pending}</p>

                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Pending Units</p>
                                <span className="text-xs font-bold text-gray-500">{getPercentage(stats.wip.total, grandTotal)}% of Load</span>
                            </div>

                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{width: `${getPercentage(stats.wip.total, grandTotal)}%`}}></div></div>
                         </div>
                    </button>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/40 flex flex-col overflow-hidden h-[500px]">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="font-extrabold text-gray-800 flex items-center gap-3 text-lg"><Activity className="w-6 h-6 text-violet-500" /> Live Activity Stream</h3>
                            <div className="flex bg-gray-200/50 p-1.5 rounded-2xl">
                                <button onClick={() => setActiveActivityTab('FG_STORE')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeActivityTab === 'FG_STORE' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Finished Goods</button>
                                <button onClick={() => setActiveActivityTab('SFG_STORE')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeActivityTab === 'SFG_STORE' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semi-Finished</button>
                                <button onClick={() => setActiveActivityTab('WIP_FLOOR')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeActivityTab === 'WIP_FLOOR' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>WIP Floor</button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-0 divide-y divide-gray-50">
                        {filteredActivity.length === 0 && <div className="text-gray-400 text-sm italic text-center py-20 flex flex-col items-center"><Activity className="w-12 h-12 opacity-10 mb-2"/>No recent activity.</div>}
                        {filteredActivity.map((task) => (
                            <div key={task.id} className="p-5 hover:bg-gray-50/80 transition-colors flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${task.category === 'FG_STORE' ? 'bg-teal-50 text-teal-600' : task.category === 'SFG_STORE' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'}`}>
                                        <CheckCheck className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold text-gray-800 text-base">{task.sku}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/> {task.pickedBy}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`block font-extrabold text-lg ${task.category === 'FG_STORE' ? 'text-teal-600' : task.category === 'SFG_STORE' ? 'text-orange-600' : 'text-rose-600'}`}>+{task.quantity}</span>
                                    <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{formatTime(task.pickedAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-4"><button onClick={handleClearAll} className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 px-6 py-3 rounded-2xl transition border border-transparent hover:border-red-100"><AlertCircle className="w-4 h-4" /> Reset System Data</button></div>
            </div>
        )}
    </DashboardLayout>
  );
};

// 10. Role Selection Component
const RoleSelection = ({ onSelectRole }) => {
    const [loginRole, setLoginRole] = useState(null);

    const handleRoleClick = (role) => {
        setLoginRole(role);
    };

    const handleLoginSuccess = (user) => {
        setLoginRole(null);
        onSelectRole(user.role, user);
    };

    return (
        <div className="min-h-screen h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 font-sans overflow-y-auto">
            <LoginModal isOpen={!!loginRole} onClose={() => setLoginRole(null)} role={loginRole} onLoginSuccess={handleLoginSuccess} />
            <div className="w-full max-w-[2000px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center p-8">
                <div className="text-white space-y-8 lg:pl-12 text-center lg:text-left">
                    <div>
                        <div className="inline-block px-4 py-1.5 rounded-full border border-gray-700 bg-gray-800/50 text-xs font-bold uppercase tracking-widest text-violet-400 mb-6 backdrop-blur-sm">Internal Logistics v2.0</div>
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-white leading-[1.1]">H.V Global<br/>Warehouse</h1>
                        <p className="text-gray-400 text-lg sm:text-xl md:text-2xl mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">Orchestrating inventory flow for a modern production environment.</p>
                    </div>
                    <div className="flex flex-row justify-center lg:justify-start gap-6 pt-4">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md flex-1 max-w-[180px] hover:bg-white/10 transition-colors">
                            <div className="text-teal-400 font-extrabold text-2xl mb-1">Live Sync</div><div className="text-gray-400 text-sm font-medium">Real-time Updates</div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md flex-1 max-w-[180px] hover:bg-white/10 transition-colors">
                            <div className="text-violet-400 font-extrabold text-2xl mb-1">Secure</div><div className="text-gray-400 text-sm font-medium">Role Access</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl shadow-black/50 p-8 sm:p-10 space-y-6 mx-auto w-full max-w-md lg:max-w-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-teal-500"></div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-8 flex items-center gap-3">Select Portal <ChevronRight className="w-6 h-6 text-gray-600" /></h2>
                    
                    <button onClick={() => handleRoleClick('ADMIN')} className="w-full p-5 bg-gradient-to-r from-gray-800 to-black border border-gray-700 text-white rounded-2xl hover:scale-[1.02] transition-all flex items-center gap-5 group shadow-lg shadow-black/20">
                        <div className="p-3.5 bg-gray-700 rounded-xl group-hover:bg-gray-600 transition-colors shrink-0"><LayoutDashboard className="w-6 h-6 text-blue-400" /></div>
                        <div className="text-left"><div className="font-bold text-lg">Admin Console</div><div className="text-xs text-gray-400 font-medium">Master Control & Analytics</div></div>
                    </button>

                    <div className="space-y-4 pt-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Staff Access</p>
                        {[
                            { id: 'FG_STORE', label: 'Finished Goods', icon: Package, color: 'teal', desc: 'Manage FG Inventory' },
                            { id: 'SFG_STORE', label: 'Semi-Finished Store', icon: Truck, color: 'orange', desc: 'Manage SFG Logistics' },
                            { id: 'WIP_FLOOR', label: 'Production Floor', icon: Hammer, color: 'rose', desc: 'WIP Line Updates' },
                            { id: 'STOCK_IN', label: 'Stock In', icon: Download, color: 'blue', desc: 'Add Inventory' }, // Replaced ArrowDownToLine with Download
                            { id: 'STOCK_OUT', label: 'Stock Out', icon: Upload, color: 'purple', desc: 'Dispatch Inventory' },
                        ].map((role) => (
                            <button key={role.id} onClick={() => handleRoleClick(role.id)} className={`w-full flex items-center gap-5 p-5 border rounded-2xl transition-all hover:scale-[1.02] group bg-white hover:bg-gray-50 border-white/10 shadow-sm`}>
                                <div className={`p-3.5 rounded-xl bg-${role.color}-100 text-${role.color}-600 shrink-0 shadow-sm`}><role.icon className="w-6 h-6" /></div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800 text-lg">{role.label}</div>
                                    <div className="text-xs text-gray-400 font-medium">{role.desc}</div>
                                </div>
                                <div className="ml-auto bg-gray-100 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ArrowLeft className="w-4 h-4 rotate-180 text-gray-400" /></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 11. Staff Dashboard
const StaffDashboard = ({ role, loggedInUser, logout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [selectedMasterSku, setSelectedMasterSku] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState(null);
  const [targetStockSku, setTargetStockSku] = useState(null);
  const [scanQuery, setScanQuery] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [skuMappings, setSkuMappings] = useState({});
  const [reverseMappings, setReverseMappings] = useState({}); 
  const [scanError, setScanError] = useState(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'sku_mappings'));
    const unsubscribe = onSnapshot(q, (snap) => {
        const mapping = {};
        const reverse = {};
        snap.docs.forEach(d => {
            const data = d.data();
            const childCode = d.id; 
            const master = data.masterSku;
            const type = data.type; 
            mapping[childCode] = master;
            if (!reverse[master]) reverse[master] = {};
            reverse[master][type] = childCode;
        });
        setSkuMappings(mapping);
        setReverseMappings(reverse);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || role === 'STOCK_IN' || role === 'STOCK_OUT') {
        setLoading(false);
        return;
    }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(allOrders.filter(o => o.category === role));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  const currentViewOrders = useMemo(() => {
    if (role === 'FG_STORE' && selectedPortal) return orders.filter(o => (o.portal || 'All Stock') === selectedPortal);
    return orders;
  }, [orders, role, selectedPortal]);

  const updateInventory = async (sku, change) => {
      try {
          const invRef = doc(db, 'artifacts', appId, 'public', 'data', 'inventory', sku);
          await setDoc(invRef, {
              quantity: increment(change),
              updatedAt: serverTimestamp(),
              updatedBy: 'Auto Deduct'
          }, { merge: true });
      } catch (e) {
          console.error("Failed to update inventory", e);
      }
  };

  const completeOrder = async (orderId, status) => {
      try {
        const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'daily_orders', orderId);
        await updateDoc(orderRef, { status: status, pickedBy: loggedInUser ? loggedInUser.name : 'Staff', pickedAt: serverTimestamp() });
        setScanQuery('');
      } catch (error) { console.error("Error:", error); }
  };

  const partialPick = async (originalOrder, pickedQty, status) => {
      try {
          const batch = writeBatch(db);
          batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'daily_orders', originalOrder.id), { quantity: originalOrder.quantity - pickedQty });
          const newRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
          const orderData = { ...originalOrder };
          delete orderData.id; 
          batch.set(newRef, { 
            ...orderData, 
            quantity: pickedQty, 
            status: status, 
            pickedBy: loggedInUser ? loggedInUser.name : 'Staff', 
            pickedAt: serverTimestamp() 
          });
          await batch.commit();
      } catch (error) { console.error("Error:", error); }
  };

  const handleStockIn = async (qty, directSku = null) => {
    // If directSku is passed (from Auto Scan), use it. Otherwise use the state (from Modal).
    const skuToUpdate = directSku || targetStockSku;
    
    if (!skuToUpdate) return;

    try {
        const invRef = doc(db, 'artifacts', appId, 'public', 'data', 'inventory', skuToUpdate);
        await setDoc(invRef, {
            quantity: increment(qty),
            updatedAt: serverTimestamp(),
            updatedBy: loggedInUser ? loggedInUser.name : 'Staff'
        }, { merge: true });

        // IF AUTO SCAN (directSku exists): Just clear input so they can scan again immediately
        if (directSku) {
            setScanQuery('');
            // We do NOT show an alert here to keep the scanning flow fast.
            // If you want a sound or small toast, add it here.
        } 
        // IF MANUAL (Modal): Close modal and show alert
        else {
            setStockInModalOpen(false);
            setTargetStockSku(null);
            setScanQuery('');
            alert(`Added ${qty} units to ${skuToUpdate}`);
        }
    } catch (error) {
        console.error("Stock in error:", error);
    }
};
const handleStockOut = async (qty, directSku = null) => {
    // If directSku is passed (from Auto Scan), use it. Otherwise use the state (from Modal).
    const skuToUpdate = directSku || targetStockSku;

    if (!skuToUpdate) return;

    try {
        const invRef = doc(db, 'artifacts', appId, 'public', 'data', 'inventory', skuToUpdate);
        await setDoc(invRef, {
            quantity: increment(-qty), // Decrementing
            updatedAt: serverTimestamp(),
            updatedBy: loggedInUser ? loggedInUser.name : 'Staff'
        }, { merge: true });

        // IF AUTO SCAN (directSku exists): Just clear input
        if (directSku) {
            setScanQuery('');
        } 
        // IF MANUAL (Modal): Close modal and show alert
        else {
            setStockOutModalOpen(false);
            setTargetStockSku(null);
            setScanQuery('');
            alert(`Removed ${qty} units of ${skuToUpdate}`);
        }
    } catch (error) {
        console.error("Stock out error:", error);
    }
  };

  const initiateMarkOut = (order) => {
    if (role !== 'WIP_FLOOR' && order.status === 'COMPLETED') return;
    if (role === 'WIP_FLOOR' && order.status === 'COMPLETED') return;

    const qty = parseInt(order.quantity) || 0;
    if (qty === 1) {
         let nextStatus = 'COMPLETED';
         if (role === 'WIP_FLOOR') {
             if (order.status === 'PENDING') nextStatus = 'WIP_PROCESSING';
             else if (order.status === 'WIP_PROCESSING') nextStatus = 'COMPLETED';
         }
         completeOrder(order.id, nextStatus);
    } else {
         setTargetOrder(order); setModalOpen(true);
    }
  };

  const processScan = (code) => {
    if (!code) return;
    
    // 1. Clean the input: ensure it is a string, remove spaces, and make uppercase
    const raw = String(code).trim().toUpperCase();
    
    // 2. Look up the Master SKU in your mapping list
    const mappedMaster = skuMappings[raw];
    
    // 3. Determine the final SKU to use:
    // If a Master SKU is found in the map, use it. Otherwise, use the scanned code.
    const resolvedSku = mappedMaster ? mappedMaster : raw; 

    // --- AUTO SCAN LOGIC START ---
    if (role === 'STOCK_IN') {
        // This sends the RESOLVED SKU (Master) to the inventory function
        handleStockIn(1, resolvedSku);
        return;
    }

    if (role === 'STOCK_OUT') {
        // This sends the RESOLVED SKU (Master) to the inventory function
        handleStockOut(1, resolvedSku);
        return;
    }
    // --- AUTO SCAN LOGIC END ---
    
    // --- EXISTING LOGIC FOR PICKING/WIP ---
    let match = currentViewOrders.find(o => 
        (o.sku.toUpperCase() === raw || 
         (o.fgSku && o.fgSku.toUpperCase() === raw) || 
         (o.sfgSku && o.sfgSku.toUpperCase() === raw)) && 
        o.status !== 'COMPLETED'
    );

    if (!match) {
        if (mappedMaster) {
            match = currentViewOrders.find(o => 
                o.sku.toUpperCase() === mappedMaster.toUpperCase() && 
                o.status !== 'COMPLETED'
            );
        }
    }

    if (match) {
        if (match.quantity === 1) {
            initiateMarkOut(match);
        } else {
            setScanQuery(match.sku);
        }
    } else {
        // If no order match, fill the search box with the RESOLVED SKU
        setScanQuery(resolvedSku);
    }
  };

  const handleInputChange = (e) => {
      const val = e.target.value;
      setScanQuery(val);
      if(scanError) setScanError(null);
      if(scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
          if(val.length > 3) {
             processScan(val);
          }
      }, 800); 
  };

  const handleModalConfirm = (pickQty) => {
    setModalOpen(false);
    if (!targetOrder) return;
    let nextStatus = 'COMPLETED';
    if (role === 'WIP_FLOOR') {
        if (targetOrder.status === 'PENDING') nextStatus = 'WIP_PROCESSING';
        else if (targetOrder.status === 'WIP_PROCESSING') nextStatus = 'COMPLETED';
    }
    if (pickQty === targetOrder.quantity) completeOrder(targetOrder.id, nextStatus);
    else partialPick(targetOrder, pickQty, nextStatus);
    setTargetOrder(null); setScanQuery('');
  };

  const getRoleTitle = () => {
    if (role === 'FG_STORE') return 'Finished Goods Store';
    if (role === 'SFG_STORE') return 'Semi-Finished Store';
    if (role === 'STOCK_IN') return 'Stock In (Inventory)';
    if (role === 'STOCK_OUT') return 'Stock Out (Dispatch)';
    return 'WIP / Production Floor';
  };

  const portalGroups = useMemo(() => {
    if (role !== 'FG_STORE') return {};
    const groups = {};
    orders.forEach(order => {
      if (order.status !== 'PENDING') return;
      let p = order.portal || 'All Stock';
      if (p === 'General' || p === 'General Stock') p = 'All Stock';
      if (!groups[p]) groups[p] = { count: 0, units: 0, name: p };
      groups[p].count += 1;
      groups[p].units += (order.quantity || 0);
    });
    return groups;
  }, [orders, role]);

  const sortedPortalKeys = useMemo(() => {
     return Object.keys(portalGroups).sort((a,b) => {
         if(a === 'All Stock') return -1;
         if(b === 'All Stock') return 1;
         return a.localeCompare(b);
     });
  }, [portalGroups]);

  const masterSkuStats = useMemo(() => {
    if (role === 'STOCK_IN' || role === 'STOCK_OUT') return {};
    const stats = {};
    currentViewOrders.forEach(order => {
        if (order.status === 'COMPLETED') return;
        const master = getMasterSku(order.sku);
        if (!stats[master]) stats[master] = 0;
        stats[master] += (order.quantity || 0);
    });
    return stats;
  }, [currentViewOrders, role]);

  const displayOrders = useMemo(() => {
    if (role === 'STOCK_IN' || role === 'STOCK_OUT') return [];
    let list = currentViewOrders;
    if (selectedMasterSku) list = list.filter(o => getMasterSku(o.sku) === selectedMasterSku);
    if (scanQuery) {
        const q = scanQuery.toUpperCase();
        list = list.filter(o => o.sku.toUpperCase().includes(q));
    }
    return list.sort((a, b) => {
        const score = (s) => s === 'PENDING' ? 1 : s === 'WIP_PROCESSING' ? 2 : 3;
        const statusDiff = score(a.status) - score(b.status);
        if (statusDiff !== 0) return statusDiff;
        return a.sku.localeCompare(b.sku);
    });
  }, [currentViewOrders, selectedMasterSku, scanQuery, manualMode, role]);

  const styles = role === 'FG_STORE' ? { bg: 'bg-gradient-to-r from-teal-500 to-emerald-500', btn: 'text-teal-600 border-teal-100' } 
                : role === 'SFG_STORE' ? { bg: 'bg-gradient-to-r from-orange-500 to-amber-500', btn: 'text-orange-600 border-orange-100' } 
                : role === 'STOCK_IN' ? { bg: 'bg-gradient-to-r from-blue-600 to-indigo-600', btn: 'text-blue-600 border-blue-100' }
                : role === 'STOCK_OUT' ? { bg: 'bg-gradient-to-r from-purple-600 to-violet-600', btn: 'text-purple-600 border-purple-100' }
                : { bg: 'bg-gradient-to-r from-rose-500 to-pink-600', btn: 'text-rose-600 border-rose-100' };

  if (role === 'FG_STORE' && !selectedPortal) {
    return (
      <div className="min-h-screen h-[100dvh] bg-gray-50 flex flex-col font-sans overflow-hidden w-full">
        <div className={`${styles.bg} text-white p-6 shadow-xl flex-none z-20`}>
          <div className="w-full px-2 flex justify-between items-center max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3"><Package className="w-8 h-8" />{getRoleTitle()}</h2>
                <p className="text-white/80 text-sm font-medium mt-1">Welcome, {loggedInUser ? loggedInUser.name : 'Staff'}</p>
            </div>
            <button onClick={logout} className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 backdrop-blur-md transition-colors"><LogOut className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
            {Object.values(portalGroups).length === 0 && !loading && (
                <div className="col-span-full py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center">
                    <Package className="w-16 h-16 opacity-20 mb-3" />
                    <span className="font-bold text-lg">All caught up!</span>
                    <span className="text-sm">No pending orders for Finished Goods</span>
                </div>
            )}
            {sortedPortalKeys.map((portal) => {
                const group = portalGroups[portal];
                return (
                <button key={portal} onClick={() => setSelectedPortal(portal)} className="bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all text-left relative overflow-hidden group w-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-extrabold text-gray-800 uppercase tracking-tight mb-2 truncate">{portal}</h3>
                    <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-gray-900 tracking-tighter">{group.units}</span><span className="text-sm text-gray-400 font-bold uppercase tracking-wider">units</span></div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
            )})}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] bg-gray-50 flex flex-col font-sans overflow-hidden w-full max-w-[100vw]">
      <PickModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleModalConfirm} order={targetOrder} role={role} />
      <StockInModal isOpen={stockInModalOpen} onClose={() => setStockInModalOpen(false)} onConfirm={handleStockIn} sku={targetStockSku} />
      <StockOutModal isOpen={stockOutModalOpen} onClose={() => setStockOutModalOpen(false)} onConfirm={handleStockOut} sku={targetStockSku} />
      
      {/* HEADER */}
      <div className={`${styles.bg} text-white p-4 shadow-xl flex-none z-20 w-full`}>
        <div className="w-full px-2 flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {role === 'FG_STORE' && selectedPortal && <button onClick={() => setSelectedPortal(null)} className="p-2 -ml-2 mr-1 hover:bg-white/20 rounded-full shrink-0 backdrop-blur-md transition-colors"><ArrowLeft className="w-6 h-6" /></button>}
              <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">{role === 'FG_STORE' ? selectedPortal : getRoleTitle()}</h2>
            </div>
            {role !== 'STOCK_IN' && role !== 'STOCK_OUT' && (
                <div className="flex gap-3 text-xs sm:text-sm font-medium text-white/80 truncate mt-1">
                    <span className="truncate">{loggedInUser ? loggedInUser.name : 'Staff'}</span>
                    <span className="opacity-40">|</span>
                    <span className="truncate bg-white/20 px-2 rounded-md text-white font-bold">{displayOrders.filter(o => o.status !== 'COMPLETED').length} Pending</span>
                </div>
            )}
            {role === 'STOCK_IN' && <div className="text-xs sm:text-sm font-medium text-white/80 truncate mt-1">Ready to receive inventory</div>}
            {role === 'STOCK_OUT' && <div className="text-xs sm:text-sm font-medium text-white/80 truncate mt-1">Ready to dispatch inventory</div>}
          </div>
          <button onClick={logout} className="p-3 bg-white/20 rounded-xl hover:bg-white/30 shrink-0 ml-2 backdrop-blur-md transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex-none p-4 pb-0 z-10 bg-gray-50 w-full max-w-[1600px] mx-auto">
        <div className={`bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3 transition-all ${scanError ? 'ring-2 ring-red-100 border-red-200' : 'focus-within:ring-2 focus-within:ring-violet-100 focus-within:border-violet-300'}`}>
            <button onClick={toggleInputMode} className={`p-3 rounded-xl transition-colors ${manualMode ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {manualMode ? <Keyboard className="w-6 h-6" /> : <ScanBarcode className="w-6 h-6" />}
            </button>
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl border border-gray-200 px-4 h-12">
                <div className="mr-3">{manualMode ? <Search className="w-5 h-5 text-gray-400" /> : <ScanBarcode className="w-5 h-5 text-violet-500 animate-pulse" />}</div>
                <input 
                    ref={scanInputRef} 
                    type="text" 
                    placeholder={manualMode ? (role === 'STOCK_IN' || role === 'STOCK_OUT' ? "Type SKU..." : "Search SKU...") : "Ready to Scan..."} 
                    className="flex-1 bg-transparent outline-none font-mono text-lg text-gray-800 font-bold w-full placeholder-gray-400" 
                    value={scanQuery} 
                    onChange={handleInputChange} 
                    onKeyDown={e => { if(e.key === 'Enter') processScan(e.currentTarget.value) }} 
                    autoFocus 
                    autoComplete="off" 
                />
                {scanQuery && <button onClick={() => setScanQuery('')} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>}
            </div>
        </div>
        {scanError && <div className="bg-red-50 text-red-500 text-xs font-bold mt-2 ml-2 py-1 px-3 rounded-lg inline-block animate-bounce">{scanError}</div>}

        {/* Master SKU Filter - Hidden for Stock In/Out */}
        {role !== 'STOCK_IN' && role !== 'STOCK_OUT' && Object.keys(masterSkuStats).length > 0 && (
          <div className="w-full overflow-x-auto pb-2 pt-4 scrollbar-hide snap-x touch-pan-x">
             <div className="flex gap-3 min-w-min">
             <button onClick={() => setSelectedMasterSku(null)} className={`snap-start flex-shrink-0 px-5 py-3 rounded-2xl font-bold text-sm border transition-all ${!selectedMasterSku ? 'bg-gray-800 text-white border-gray-800 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                ALL
             </button>
             {Object.entries(masterSkuStats).map(([master, qty]) => (
                 <button key={master} onClick={() => setSelectedMasterSku(selectedMasterSku === master ? null : master)} className={`snap-start flex-shrink-0 px-4 py-2 rounded-2xl font-bold text-sm border flex flex-col items-center justify-center min-w-[80px] transition-all ${selectedMasterSku === master ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-200'}`}>
                    <span className="text-[10px] uppercase opacity-60 mb-0.5">SKU</span>
                    <span className="text-base leading-none mb-1 font-extrabold">{master}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedMasterSku === master ? 'bg-violet-200 text-violet-900' : 'bg-gray-100 text-gray-500'}`}>{qty}</span>
                 </button>
             ))}
             </div>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 w-full max-w-[1600px] mx-auto">
        {role === 'STOCK_IN' ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-20">
                <Package className="w-24 h-24 mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-gray-500">Ready to Receive</h3>
                <p className="max-w-xs text-center mt-2 opacity-60">Scan any FG, SFG, or Master SKU to add it to the inventory.</p>
            </div>
        ) : role === 'STOCK_OUT' ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-20">
                <Upload className="w-24 h-24 mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-gray-500">Ready to Dispatch</h3>
                <p className="max-w-xs text-center mt-2 opacity-60">Scan any SKU to remove it from the inventory.</p>
            </div>
        ) : (
            <div className={displayOrders.length > 0 ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20" : "pb-20"}>
                {displayOrders.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200 mx-4">
                        <div className="p-4 bg-gray-50 rounded-full mb-4"><CheckCircle className="w-12 h-12 opacity-20" /></div>
                        <p className="font-medium text-lg">No tasks found</p>
                        <p className="text-sm opacity-60">Adjust filters or scan a new item</p>
                    </div>
                )}
                {displayOrders.map(order => {
                const isCompleted = order.status === 'COMPLETED';
                const isWipProcess = order.status === 'WIP_PROCESSING';
                const displayFG = reverseMappings[order.sku]?.FG;
                const displaySFG = reverseMappings[order.sku]?.SFG;

                return (
                    <div key={order.id} className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden ${isCompleted ? 'bg-gray-50/80 border-gray-200 opacity-70 grayscale' : (isWipProcess ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100' : 'bg-white border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:scale-[1.01]')}`}>
                    {isWipProcess && <div className="absolute top-0 right-0 p-2 bg-blue-100 rounded-bl-2xl text-blue-600"><Loader2 className="w-5 h-5 animate-spin"/></div>}
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider ${isCompleted ? 'bg-teal-100 text-teal-700' : (isWipProcess ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}`}>
                                {isCompleted ? 'Done' : (isWipProcess ? 'Processing' : (order.portal || 'Standard'))}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{getMasterSku(order.sku)}</span>
                            </div>
                            <h3 className={`text-xl font-black font-mono tracking-tight truncate ${isCompleted ? 'text-gray-400 line-through decoration-2' : 'text-gray-800'}`}>{order.sku}</h3>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                                {role === 'FG_STORE' && displayFG && (
                                    <div className="text-[10px] font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100 font-bold">FG: {displayFG}</div>
                                )}
                                {role === 'SFG_STORE' && displaySFG && (
                                    <div className="text-[10px] font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 font-bold">SFG: {displaySFG}</div>
                                )}
                            </div>
                        </div>
                        {isCompleted && <div className="bg-teal-100 p-2 rounded-full text-teal-600"><CheckCircle className="w-6 h-6" /></div>}
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-gray-100 mt-auto relative z-10">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Quantity</span>
                            <div className={`text-3xl font-black leading-none mt-0.5 ${isCompleted ? 'text-teal-600' : 'text-gray-900'}`}>{order.quantity}</div>
                        </div>
                        
                        {!isCompleted && (
                            <button 
                                onClick={() => initiateMarkOut(order)} 
                                className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-md ${isWipProcess ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-gray-900 text-white hover:bg-black shadow-gray-300'}`}
                            >
                                {isWipProcess ? 'Finish' : 'Pick'} <ArrowLeft className="w-4 h-4 rotate-180" />
                            </button>
                        )}
                    </div>
                    </div>
                );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  // Initialize state from localStorage if available
  const [role, setRole] = useState(() => localStorage.getItem('hv_app_role') || null);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem('hv_app_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      // START FIX: Removed custom token logic to prevent ReferenceError and Mismatch Error
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth failed:", error);
      }
      // END FIX
    };
    initAuth();
    // Load XLSX
    if (!document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleRoleSelection = (selectedRole, userObj) => {
      setRole(selectedRole);
      setLoggedInUser(userObj || null);
      localStorage.setItem('hv_app_role', selectedRole);
      if (userObj) localStorage.setItem('hv_app_user', JSON.stringify(userObj));
  };

  const handleLogout = () => {
      setRole(null);
      setLoggedInUser(null);
      localStorage.removeItem('hv_app_role');
      localStorage.removeItem('hv_app_user');
  };

  if (!auth) return <div className="h-screen flex items-center justify-center text-red-500">Firebase Config Error</div>;
  if (!user) return <div className="h-screen flex items-center justify-center text-gray-400 gap-3 font-medium bg-gray-50"><Loader2 className="animate-spin w-6 h-6 text-violet-600" /> Loading Warehouse System...</div>;
   
  if (!role) return <RoleSelection onSelectRole={handleRoleSelection} />;
   
  return role === 'ADMIN' 
    ? <AdminDashboard user={user} logout={handleLogout} /> 
    : <StaffDashboard role={role} loggedInUser={loggedInUser} logout={handleLogout} />;
}