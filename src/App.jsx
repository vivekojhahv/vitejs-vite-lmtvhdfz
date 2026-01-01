import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
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
  orderBy
} from "firebase/firestore";
import { 
  Package, Truck, Hammer, LogOut, CheckCircle2, 
  LayoutDashboard, X, Search, 
  Globe, ArrowLeft, 
  ScanBarcode, Keyboard, CheckCheck, Loader2, 
  Activity, Clock, Upload, FileSpreadsheet, 
  TrendingUp, Users, AlertCircle, BarChart3, 
  PieChart, Download, Lock, Settings, Plus, Trash2, User, ChevronRight, Menu, Link, FileClock, RefreshCw, FileDown, Eye, FolderOpen
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
// Using your specific configuration
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

// Using your specific App ID for Firestore paths
const appId = "hv-global-warehouse-ops-v1"; 

// --- UTILITIES ---
const parseQty = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  // Only parse integers
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
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
      background-color: #F8FAFC; 
    }
    /* Hide scrollbar for Chrome, Safari and Opera */
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
    .safe-area-pb {
        padding-bottom: env(safe-area-inset-bottom);
    }
  `}</style>
);

// --- LAYOUT COMPONENT ---
const DashboardLayout = ({ title, user, logout, currentTab, setTab, tabs, children }) => {
  return (
    <>
      <GlobalStyles />
      <div className="flex flex-col h-[100dvh] w-screen bg-slate-50 text-slate-900 overflow-hidden">
        {/* Header */}
        <header className="flex-none h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm flex-shrink-0">
               <Package className="w-5 h-5" />
             </div>
             <div className="min-w-0">
               <h1 className="text-lg font-bold text-slate-800 leading-none truncate">{title}</h1>
               <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{user?.name || 'User'}</div>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
             {/* Desktop Navigation */}
             {tabs && (
               <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                 {tabs.map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setTab(tab.id)}
                     className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${currentTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                   >
                     <tab.icon className="w-4 h-4" />
                     {tab.label}
                   </button>
                 ))}
               </nav>
             )}
             <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full scroll-smooth">
           <div className="max-w-[1600px] mx-auto p-4 sm:p-6 pb-24 md:pb-6 min-h-full">
              {children}
           </div>
        </main>

        {/* Mobile Bottom Nav */}
        {tabs && (
          <nav className="md:hidden flex-none h-16 bg-white border-t border-slate-200 z-50 flex justify-around items-center px-1 safe-area-pb">
             {tabs.map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setTab(tab.id)}
                 className={`flex flex-col items-center justify-center w-full h-full gap-1 ${currentTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <tab.icon className={`w-6 h-6 transition-transform ${currentTab === tab.id ? '-translate-y-0.5' : ''}`} />
                 <span className="text-[10px] font-bold">{tab.label}</span>
               </button>
             ))}
          </nav>
        )}
      </div>
    </>
  );
};

// --- COMPONENTS ---

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
  let buttonColor = "bg-blue-600 hover:bg-blue-700";
   
  if (role === 'WIP_FLOOR') {
      if (order.status === 'PENDING') { buttonText = "Start Process"; buttonColor = "bg-amber-500 hover:bg-amber-600"; }
      else if (order.status === 'WIP_PROCESSING') { buttonText = "Finish Process"; buttonColor = "bg-green-600 hover:bg-green-700"; }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100">
        <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800">{role === 'WIP_FLOOR' ? 'Process Item' : 'Confirm Pick'}</h3>
            <p className="text-slate-500 text-sm mt-1 break-all">SKU: <span className="font-mono font-bold text-slate-900">{order.sku}</span></p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-center mb-6">
            <input 
                ref={inputRef}
                type="number"
                min="1"
                max={order.quantity}
                className="w-32 text-center text-5xl font-bold text-indigo-600 border-b-2 border-indigo-200 focus:border-indigo-600 outline-none bg-transparent"
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
            />
          </div>
          <div className="text-center mb-6 text-sm text-slate-400 font-medium uppercase tracking-wide">
             Total Quantity: {order.quantity}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="py-3.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className={`py-3.5 text-white font-bold rounded-xl transition-all shadow-lg ${buttonColor}`}>
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
                 <div className="h-full flex flex-col animate-in slide-in-from-right-4 fade-in">
                     <button onClick={() => setSelectedPortal(null)} className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 px-1 flex-none"><ArrowLeft className="w-4 h-4" /> Back to Portals</button>
                     <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                         <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center flex-none">
                             <span className="font-bold text-slate-800 flex gap-2 items-center"><Globe className="w-4 h-4 text-blue-500"/> {selectedPortal}</span>
                             <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-slate-500">{items.reduce((a,b)=>a+(b.quantity||0),0)} units</span>
                         </div>
                         <div className="overflow-y-auto flex-1">
                             <table className="w-full text-sm text-left">
                                 <thead className="text-xs text-slate-500 uppercase bg-white border-b sticky top-0 z-10"><tr><th className="px-4 py-3">SKU</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-center">Status</th></tr></thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {items.map((o, i) => (
                                         <tr key={i} className="hover:bg-slate-50">
                                             <td className="px-4 py-3"><div className="font-mono font-bold text-slate-700">{o.sku}</div>{o.fgSku && <div className="text-[10px] text-emerald-600 mt-0.5">FG: {o.fgSku}</div>}</td>
                                             <td className="px-4 py-3 text-right font-bold">{o.quantity}</td>
                                             <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${o.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{o.status}</span></td>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-8">
                    {sortedPortals.map(([portal, items]) => (
                        <button key={portal} onClick={() => setSelectedPortal(portal)} className="bg-white border border-slate-200 p-5 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-left group h-32 flex flex-col justify-between">
                            <div className="flex justify-between items-start"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100"><Globe className="w-5 h-5"/></div><ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500"/></div>
                            <div><div className="font-bold text-slate-700 truncate">{portal}</div><div className="text-xs text-slate-500">{items.reduce((a,b)=>a+b.quantity,0)} Units</div></div>
                        </button>
                    ))}
                    {sortedPortals.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">No Items Found</div>}
                </div>
            );
        }
        
    } else {
        content = (
             <div className="overflow-x-auto border rounded-xl shadow-sm bg-white h-full flex flex-col">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3">Master SKU</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((order, idx) => (
                            <tr key={order.id || idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="font-mono font-bold text-slate-700">{order.sku}</div>
                                    {category === 'SFG_STORE' && order.sfgSku && <div className="text-xs text-amber-600 font-mono mt-0.5">SFG: {order.sfgSku}</div>}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-700">{order.quantity}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : (order.status === 'WIP_PROCESSING' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}`}>
                                        {order.status === 'COMPLETED' ? 'DONE' : (order.status === 'WIP_PROCESSING' ? 'PROCESS' : 'PENDING')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">No items found.</td></tr>}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white flex-none">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {category === 'FG_STORE' ? <Package className="w-5 h-5 text-emerald-500"/> : 
                         category === 'SFG_STORE' ? <Truck className="w-5 h-5 text-amber-500"/> : 
                         <Hammer className="w-5 h-5 text-rose-500"/>}
                        {category === 'FG_STORE' ? 'Finished Goods' : category === 'SFG_STORE' ? 'Semi-Finished' : 'WIP Floor'} Details
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-500" />
                    {role === 'ADMIN' ? 'Admin Access' : 'Staff Login'}
                </h3>
                <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>

            {role === 'ADMIN' ? (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                        <input 
                            type="password" 
                            className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Admin Password"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
                        Unlock Console
                    </button>
                </form>
            ) : (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                    {loading ? (
                        <div className="py-8 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /> Loading Staff...</div>
                    ) : users.length === 0 ? (
                        <div className="py-4 text-center text-amber-600 bg-amber-50 rounded-lg p-4">
                            No staff found for this role. <br/>Please ask Admin to add you in Settings.
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Select Staff Member</label>
                                <select 
                                    className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Name --</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                                <input 
                                    type="password" 
                                    className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter Your Password"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700" disabled={!selectedUser}>
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-none">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Link className="w-5 h-5 text-indigo-500" /> SKU Mapping
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                {!isAuthenticated ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <p className="text-sm text-slate-500">Enter Admin password to manage SKU links.</p>
                        <input 
                            type="password" 
                            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">Unlock</button>
                    </form>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg flex-none">
                            <button onClick={() => setActiveTab('UPLOAD')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'UPLOAD' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>New Upload</button>
                            <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Upload History</button>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {activeTab === 'UPLOAD' ? (
                                <div className="space-y-6 pt-2">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold">How this works:</p>
                                            <button onClick={downloadSampleTemplate} className="text-xs bg-white border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50 flex items-center gap-1 text-indigo-600 font-bold">
                                                <FileDown className="w-3 h-3" /> Template
                                            </button>
                                        </div>
                                        <p>Upload an Excel with columns for <strong>Master SKU</strong>, <strong>FG SKU</strong>, and <strong>SFG SKU</strong>.</p>
                                        <p className="mt-2 text-xs opacity-75">Tip: Use "Clear All Mappings" below before uploading a completely new set if you want to remove old codes.</p>
                                    </div>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50">
                                        <input type="file" id="mapping-upload" className="hidden" onChange={handleFile} accept=".xlsx,.xls" />
                                        <label htmlFor="mapping-upload" className="cursor-pointer block">
                                            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                                            <span className="text-sm font-bold text-slate-600 block">{file ? file.name : "Click to Upload Mapping Excel"}</span>
                                        </label>
                                    </div>
                                    {mappingStats !== null && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-medium">Successfully mapped {mappingStats} codes!</div>}
                                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                    <div className="flex gap-3">
                                        <button onClick={handleClearMappings} className="px-4 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 flex-none border border-red-200" title="Delete ALL SKU mappings to start fresh"><Trash2 className="w-5 h-5" /></button>
                                        <button onClick={processMappingFile} disabled={!file || uploading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                                            {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Database'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 pt-2">
                                    {history.length === 0 && <div className="text-center text-slate-400 py-8 italic">No upload history found.</div>}
                                    {history.map((item) => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition flex justify-between items-center group">
                                            <div className="min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1"><FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" /><span className="font-bold text-slate-700 truncate text-sm">{item.fileName}</span></div>
                                                <div className="text-xs text-slate-400 flex items-center gap-2"><Clock className="w-3 h-3" /> {formatDate(item.uploadedAt)}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => downloadHistoryItem(item)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition" title="Download Original File"><Download className="w-4 h-4" /></button>
                                                <button onClick={() => deleteHistoryItem(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete History Record"><Trash2 className="w-4 h-4" /></button>
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
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <SkuMappingModal isOpen={mappingModalOpen} onClose={() => setMappingModalOpen(false)} />
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> System Configuration</h3>
                <div className="flex flex-wrap gap-4">
                     <button onClick={() => setMappingModalOpen(true)} className="flex items-center gap-3 px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition group text-left">
                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform"><Link className="w-5 h-5 text-indigo-600" /></div>
                        <div><div className="font-bold text-slate-700">SKU Mapping</div><div className="text-xs text-slate-500">Manage Master/FG/SFG Links</div></div>
                     </button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /> Add New Staff</h3>
                <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" className="w-full p-2.5 border rounded-lg mt-1 outline-none" placeholder="John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Role</label><select className="w-full p-2.5 border rounded-lg mt-1 outline-none bg-white" value={newRole} onChange={(e) => setNewRole(e.target.value)}><option value="FG_STORE">Finished Goods</option><option value="SFG_STORE">Semi-Finished</option><option value="WIP_FLOOR">WIP Floor</option></select></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Password</label><input type="text" className="w-full p-2.5 border rounded-lg mt-1 outline-none font-mono" placeholder="Set Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                    <button type="submit" disabled={loading} className="p-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex justify-center items-center">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add User'}</button>
                </form>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2"><Users className="w-5 h-5" /> Staff Directory</div>
                <div className="divide-y divide-slate-100">
                    {staff.map(user => (
                        <div key={user.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 transition gap-4">
                            <div className="flex items-center gap-4"><div className={`p-2 rounded-lg ${user.role === 'FG_STORE' ? 'bg-emerald-100 text-emerald-600' : user.role === 'SFG_STORE' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}><User className="w-5 h-5" /></div><div><div className="font-bold text-slate-800">{user.name}</div><div className="text-xs font-mono text-slate-400">Pass: {user.password}</div></div></div>
                            <button onClick={() => handleDeleteStaff(user.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className={`rounded-2xl p-8 border transition-all duration-300 flex flex-col items-center text-center space-y-4 ${isLocked ? 'bg-slate-50 border-slate-200' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-xl shadow-emerald-100'}`}>
            <div className={`p-4 rounded-full ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                {isLocked ? <Lock className="w-10 h-10" /> : <Download className="w-10 h-10 animate-bounce" />}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-slate-800">Daily Completion Report</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    {isLocked 
                    ? `Export is currently locked because there are ${pendingTasks} pending tasks remaining. Please complete all tasks to generate the EOD report.` 
                    : "All tasks completed! You can now download the comprehensive End-of-Day report containing detailed timestamps and SKU breakdowns."}
                </p>
            </div>
            <button onClick={handleExport} disabled={isLocked} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:scale-105'}`}>
                <FileSpreadsheet className="w-5 h-5" /> Download Excel Report
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-blue-500" /> Portal Distribution</h4>
                <div className="space-y-3">
                    {portalDistribution.map(([portal, qty]) => (
                    <div key={portal} className="flex items-center gap-3">
                        <div className="w-24 text-xs font-bold text-slate-500 uppercase text-right truncate">{portal}</div>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(qty / portalDistribution.reduce((a,b) => a+b[1], 0)) * 100}%` }}></div></div>
                        <div className="w-12 text-right font-bold text-slate-700 text-sm">{qty}</div>
                    </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-500" /> Picker Performance</h4>
                <div className="overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3 text-right">Lines</th><th className="px-4 py-3 text-right">Units</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {userPerformance.length === 0 && <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400 italic">No activity yet</td></tr>}
                        {userPerformance.map(([user, data]) => (
                            <tr key={user} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-700">{user}</td><td className="px-4 py-3 text-right text-slate-600">{data.lines}</td><td className="px-4 py-3 text-right font-bold text-blue-600">{data.units}</td></tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
        </div>
    );
};

const StatsView = () => {
    // ... same logic
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState(7); // Default to 7 days

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'history'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by date ascending
            data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setHistory(data);
        });
        return () => unsubscribe();
    }, []);

    const filteredHistory = useMemo(() => {
        if (filter === 'ALL') return history;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filter);
        return history.filter(item => new Date(item.date) >= cutoff);
    }, [history, filter]);

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

    const handleExportHistory = () => {
        const wsData = filteredHistory.map(h => ({
            'Date': h.day,
            'Total Lines': h.total,
            'Total Units': h.units,
            'FG Lines': h.fg,
            'SFG Lines': h.sfg,
            'WIP Lines': h.wip,
            'Completed Lines': h.completed,
            'Completion Rate': h.total ? Math.round((h.completed/h.total)*100)+'%' : '0%'
        }));

        const ws = window.XLSX.utils.json_to_sheet(wsData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "History");
        window.XLSX.writeFile(wb, `Warehouse_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
                <div className="flex gap-2">
                    {[7, 30, 'ALL'].map((f) => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            {f === 'ALL' ? 'All Time' : `Last ${f} Days`}
                        </button>
                    ))}
                </div>
                <button onClick={handleExportHistory} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold hover:bg-emerald-200 transition">
                    <Download className="w-4 h-4" /> Export History
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Total Units Processed</p><p className="text-3xl font-bold text-slate-800 mt-1">{aggregate.units.toLocaleString()}</p></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Completion Rate</p><p className="text-3xl font-bold text-emerald-600 mt-1">{aggregate.total ? Math.round((aggregate.completed / aggregate.total) * 100) : 0}%</p></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Total Orders</p><p className="text-3xl font-bold text-blue-600 mt-1">{aggregate.total.toLocaleString()}</p></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Avg Daily Units</p><p className="text-3xl font-bold text-purple-600 mt-1">{filteredHistory.length ? Math.round(aggregate.units / filteredHistory.length) : 0}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-500" /> Category Split</h3>
                    <div className="space-y-4">
                        {[{ label: 'Finished Goods', val: aggregate.fg, color: 'bg-emerald-500' }, { label: 'Semi-Finished', val: aggregate.sfg, color: 'bg-amber-500' }, { label: 'WIP Floor', val: aggregate.wip, color: 'bg-rose-500' }].map((cat) => (
                            <div key={cat.label}><div className="flex justify-between text-sm font-medium text-slate-600 mb-1"><span>{cat.label}</span><span>{Math.round((cat.val / (aggregate.total || 1)) * 100)}%</span></div><div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${cat.color}`} style={{ width: `${(cat.val / (aggregate.total || 1)) * 100}%` }}></div></div></div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                     <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" /> Daily Output Trend</h3>
                    <div className="flex items-end justify-between gap-2 h-40 mt-8">
                        {filteredHistory.slice(-14).map((h, i) => {
                            const max = Math.max(...filteredHistory.map(x => x.units), 100);
                            const height = Math.max((h.units / max) * 100, 5);
                            return (<div key={i} className="flex flex-col items-center flex-1 group relative"><div className="w-full bg-blue-100 rounded-t-sm hover:bg-blue-200 transition-all relative" style={{ height: `${height}%` }}><div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">{h.units}</div></div><span className="text-[10px] text-slate-400 mt-2 rotate-0 truncate w-full text-center">{h.day.split('-')[2]}</span></div>);
                        })}
                        {filteredHistory.length === 0 && <div className="w-full text-center text-slate-400 text-sm self-center">No history data available yet.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... AdminDashboard, RoleSelection, App components follow ...
const AdminDashboard = ({ user, logout }) => {
  const [view, setView] = useState('DASHBOARD'); // 'DASHBOARD' | 'REPORTS' | 'SETTINGS' | 'STATS'
  const [stats, setStats] = useState({ fg: {pending: 0, total: 0}, sfg: {pending: 0, total: 0}, wip: {pending: 0, total: 0} });
  const [portalStats, setPortalStats] = useState({ grandTotal: 0 });
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders for reports
  const [grandTotal, setGrandTotal] = useState(0); 
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [columnMap, setColumnMap] = useState(null); 
  const [detailCategory, setDetailCategory] = useState(null); // 'FG_STORE' | 'SFG_STORE' | 'WIP_FLOOR'
  const [completedUnits, setCompletedUnits] = useState(0);
  const [activeActivityTab, setActiveActivityTab] = useState('FG_STORE');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    
    // Main Orders Listener
    const ordersQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllOrders(orders); // Save full list for reports
      
      const calc = (cat) => ({
         pending: orders.filter(o => o.category === cat && (o.status === 'PENDING' || o.status === 'WIP_PROCESSING')).reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0),
         total: orders.filter(o => o.category === cat).reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0)
      });

      const fg = calc('FG_STORE');
      const sfg = calc('SFG_STORE');
      const wip = calc('WIP_FLOOR');
      
      const completedCount = orders.filter(o => o.status === 'COMPLETED').reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0);
      setCompletedUnits(completedCount);
      
      // Dynamic Grand Total calculation
      const dynamicTotal = orders.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0);
      setGrandTotal(dynamicTotal);

      setStats({ fg, sfg, wip });

      // Recent Completed List (for Live View)
      const completedList = orders
        .filter(o => o.status === 'COMPLETED')
        .sort((a, b) => {
            const timeA = a.pickedAt?.seconds || 0;
            const timeB = b.pickedAt?.seconds || 0;
            return timeB - timeA;
        })
        .slice(0, 50);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
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
          
          // Enhanced Portal Detection - check if header INCLUDES the name
          if (row.findIndex(c => c.includes('ajio')) !== -1) ci.ajio = row.findIndex(c => c.includes('ajio') && !c.includes('date') && !c.includes('id'));
          if (row.findIndex(c => c.includes('nykaa')) !== -1) ci.nykaa = row.findIndex(c => c.includes('nykaa') && !c.includes('date') && !c.includes('id'));
          if (row.findIndex(c => c.includes('flipkart')) !== -1) ci.flipkart = row.findIndex(c => c.includes('flipkart') && !c.includes('date') && !c.includes('id'));
          if (row.findIndex(c => c.includes('amazon')) !== -1) ci.amazon = row.findIndex(c => c.includes('amazon') && !c.includes('date') && !c.includes('id'));
          if (row.findIndex(c => c.includes('myntra')) !== -1) ci.myntra = row.findIndex(c => c.includes('myntra') && !c.includes('date') && !c.includes('id'));
          if (row.findIndex(c => c.includes('firstcry')) !== -1) ci.firstcry = row.findIndex(c => c.includes('firstcry') && !c.includes('date') && !c.includes('id'));
          if (row.findIndex(c => c.includes('website')) !== -1) ci.website = row.findIndex(c => c.includes('website') && !c.includes('date') && !c.includes('id'));

          // Avoid picking up columns like "Order ID" or "Line No"
          const isQtyHeader = c => c.includes('qty') || c.includes('quantity') || c.includes('stock') || c.includes('count') || c.includes('unit') || c.includes('available');

          if (row.findIndex(c => c.includes('finish') && c.includes('good') && isQtyHeader(c)) !== -1) { score += 3; ci.fg = row.findIndex(c => c.includes('finish') && c.includes('good') && isQtyHeader(c)); }
          else if (row.findIndex(c => c.includes('fg') && isQtyHeader(c)) !== -1) { score += 3; ci.fg = row.findIndex(c => c.includes('fg') && isQtyHeader(c)); } // Fallback

          if (row.findIndex(c => c.includes('semi') && c.includes('finish') && isQtyHeader(c)) !== -1) { score += 3; ci.sfg = row.findIndex(c => c.includes('semi') && c.includes('finish') && isQtyHeader(c)); }
           else if (row.findIndex(c => c.includes('sfg') && isQtyHeader(c)) !== -1) { score += 3; ci.sfg = row.findIndex(c => c.includes('sfg') && isQtyHeader(c)); }

          if (row.findIndex(c => c.includes('wip') && (isQtyHeader(c) || c.includes('pick'))) !== -1) { score += 3; ci.wip = row.findIndex(c => c.includes('wip') && (isQtyHeader(c) || c.includes('pick'))); }
          
          if (score > maxScore) { maxScore = score; headerRowIndex = i; colIndices = ci; }
      }
      if (headerRowIndex !== -1) setColumnMap({ headerRowIndex, ...colIndices });
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
      // Skip row if SKU is missing or looks like a summary row
      if (!sku || String(sku).toLowerCase().includes('total')) continue;

      // Use the explicit columns from Excel as the source of truth
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
        
        // Distribute the FIXED fgAvailable quantity across portals
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
        // Only if there is still FG quantity left over after fulfilling all portals, put it in 'All Stock'
        // This handles cases where FG > Sum of Portals (extra stock)
        // It does NOT handle cases where FG < Sum of Portals (shortage), as that is handled by the loop breaking early when remainingFg hits 0.
        if (remainingFg > 0) batch.push({ ...baseItem, quantity: remainingFg, category: 'FG_STORE', status: 'PENDING', createdAt: serverTimestamp(), portal: 'All Stock' });
      }

      grandTotalSum += totalIdx !== -1 ? parseQty(row[totalIdx]) : 0; 
    }

    try {
      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders');
      await Promise.all(batch.map(item => addDoc(collectionRef, item)));
      // Removed setDoc for daily_summary to rely on dynamic calc
      setParsedData([]); setFileName(''); setColumnMap(null);
    } catch (err) { console.error(err); alert("Error uploading. Check console."); } 
    finally { setIsUploading(false); }
  };

  const handleClearAll = async () => {
    if(prompt("Type 'RESET' to delete all data") !== 'RESET') return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'daily_summary'), { grandTotal: 0 });
    alert("Reset Complete");
  };

  const getPercentage = (part, total) => (!total ? 0 : Math.round((part / total) * 100));
   
  // Filter recent completed by active tab
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
            { id: 'REPORTS', label: 'Reports', icon: FileSpreadsheet },
            { id: 'STATS', label: 'Stats', icon: BarChart3 },
            { id: 'SETTINGS', label: 'Settings', icon: Settings },
        ]}
    >
        <CategoryDetailModal category={detailCategory} onClose={() => setDetailCategory(null)} orders={allOrders} />

        {view === 'REPORTS' && <ReportsView allOrders={allOrders} stats={stats} />}
        {view === 'STATS' && <StatsView />}
        {view === 'SETTINGS' && <SettingsView />}
        
        {view === 'DASHBOARD' && (
            <div className="space-y-6">
                <div className="flex justify-end gap-2">
                    <button onClick={() => document.getElementById('file-upload').click()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition"><Upload className="w-4 h-4"/> Upload Excel</button>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                </div>
                {fileName && !isUploading && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center animate-in fade-in"><div className="flex items-center gap-3"><FileSpreadsheet className="w-6 h-6 text-emerald-600"/><span className="font-bold text-slate-800">{fileName}</span></div><button onClick={handleProcessUpload} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700">Process</button></div>
                )}
                {isUploading && <div className="bg-blue-50 p-4 rounded-xl text-blue-700 flex items-center gap-3"><Loader2 className="animate-spin w-5 h-5"/> Processing...</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group"><div className="relative z-10"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Load</p><p className="text-4xl font-extrabold mt-1">{grandTotal}</p></div><div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div></div>
                    <button onClick={() => setDetailCategory('FG_STORE')} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all text-left group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><Package className="w-5 h-5" /></div>
                            <span className="font-bold text-slate-700 text-sm flex-1">Finished Goods</span>
                            <Eye className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stats.fg.pending}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1 mb-2">Pending FG Units</p>
                        <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Share of Load</span><span className="font-bold text-slate-700">{getPercentage(stats.fg.total, grandTotal)}%</span></div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${getPercentage(stats.fg.total, grandTotal)}%`}}></div></div>
                        </div>
                    </button>
                    <button onClick={() => setDetailCategory('SFG_STORE')} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all text-left group">
                         <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Truck className="w-5 h-5" /></div>
                            <span className="font-bold text-slate-700 text-sm flex-1">Semi-Finished</span>
                            <Eye className="w-4 h-4 text-slate-300 group-hover:text-amber-500" />
                        </div>
                         <p className="text-3xl font-bold text-slate-800">{stats.sfg.pending}</p><p className="text-xs text-slate-500 font-medium mt-1 mb-2">Pending SFG Units</p>
                         <div className="mt-3"><div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Share of Load</span><span className="font-bold text-slate-700">{getPercentage(stats.sfg.total, grandTotal)}%</span></div><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{width: `${getPercentage(stats.sfg.total, grandTotal)}%`}}></div></div></div>
                    </button>
                    <button onClick={() => setDetailCategory('WIP_FLOOR')} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all text-left group"><div className="flex justify-between items-start mb-3"><div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform"><Hammer className="w-5 h-5" /></div><Eye className="w-4 h-4 text-slate-300 group-hover:text-rose-500" /></div><p className="text-3xl font-bold text-slate-800">{stats.wip.pending}</p><p className="text-xs text-slate-500 font-medium mt-1 mb-2">Pending WIP Units</p>
                         <div className="mt-3"><div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Share of Load</span><span className="font-bold text-slate-700">{getPercentage(stats.wip.total, grandTotal)}%</span></div><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500" style={{width: `${getPercentage(stats.wip.total, grandTotal)}%`}}></div></div></div>
                    </button>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group"><div className="flex justify-between items-start mb-3"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp className="w-5 h-5" /></div></div><p className="text-3xl font-bold text-slate-800">{completedUnits}</p><p className="text-xs text-slate-500 font-medium mt-1">Total Completed Units</p></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[400px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-emerald-500" /> Live Activity Stream</h3>
                        <div className="flex bg-slate-200 p-1 rounded-lg">
                            <button onClick={() => setActiveActivityTab('FG_STORE')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeActivityTab === 'FG_STORE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Finished Goods</button>
                            <button onClick={() => setActiveActivityTab('SFG_STORE')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeActivityTab === 'SFG_STORE' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}>Semi-Finished</button>
                            <button onClick={() => setActiveActivityTab('WIP_FLOOR')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeActivityTab === 'WIP_FLOOR' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>WIP Floor</button>
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-0 divide-y divide-slate-50">
                        {filteredActivity.length === 0 && <div className="text-slate-400 text-sm italic text-center py-10">No completed tasks yet.</div>}
                        {filteredActivity.map((task) => (
                            <div key={task.id} className="p-3 hover:bg-slate-50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] px-1.5 rounded font-bold uppercase ${task.category === 'FG_STORE' ? 'bg-emerald-100 text-emerald-700' : task.category === 'SFG_STORE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {task.category === 'FG_STORE' ? 'FG' : task.category === 'SFG_STORE' ? 'SFG' : 'WIP'}
                                        </span>
                                        <span className="font-bold text-slate-700 text-sm font-mono">{task.sku}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1"><User className="w-3 h-3"/> {task.pickedBy}</div>
                                </div>
                                <div className="text-right"><span className="block font-bold text-emerald-600 text-sm">+{task.quantity}</span><span className="text-[10px] text-slate-400">{formatTime(task.pickedAt)}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-4"><button onClick={handleClearAll} className="flex items-center gap-2 text-red-500 font-bold text-xs hover:bg-red-50 px-4 py-2 rounded-lg transition border border-red-200 hover:border-red-300"><AlertCircle className="w-4 h-4" /> Reset System Data</button></div>
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
        <div className="min-h-screen h-[100dvh] bg-slate-900 flex items-center justify-center p-4 font-sans overflow-y-auto">
            <LoginModal isOpen={!!loginRole} onClose={() => setLoginRole(null)} role={loginRole} onLoginSuccess={handleLoginSuccess} />
            <div className="w-full max-w-[2000px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center p-6">
                <div className="text-white space-y-6 lg:pl-12 text-center lg:text-left">
                    <div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 leading-tight">H.V Global<br/>Warehouse OPS</h1>
                        <p className="text-slate-400 text-base sm:text-lg md:text-xl mt-4 sm:mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0">Real-time inventory orchestration for Finished Goods, Semi-Finished components, and WIP production lines.</p>
                    </div>
                    <div className="flex flex-row justify-center lg:justify-start gap-3 pt-4">
                        <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700 backdrop-blur-sm flex-1 max-w-[150px]">
                            <div className="text-emerald-400 font-bold text-lg sm:text-xl mb-1">Live Sync</div><div className="text-slate-400 text-xs sm:text-sm">Real-time Updates</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700 backdrop-blur-sm flex-1 max-w-[150px]">
                            <div className="text-blue-400 font-bold text-lg sm:text-xl mb-1">Secure</div><div className="text-slate-400 text-xs sm:text-sm">Role Access</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 transform lg:hover:scale-[1.01] transition-transform duration-300 mx-auto w-full max-w-md lg:max-w-lg">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">Let's Pack the Comfort <ChevronRight className="w-5 h-5 text-slate-400" /></h2>
                    <button onClick={() => handleRoleClick('ADMIN')} className="w-full p-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-4 group shadow-lg shadow-slate-200">
                        <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors shrink-0"><LayoutDashboard className="w-6 h-6 text-blue-400" /></div>
                        <div className="text-left"><div className="font-bold text-lg">Admin Dashboard</div><div className="text-xs text-slate-400">Master Control & Analytics</div></div>
                    </button>
                    <div className="space-y-3 pt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Store Staff Access</p>
                        {[
                            { id: 'FG_STORE', label: 'Finished Goods', icon: Package, color: 'emerald' },
                            { id: 'SFG_STORE', label: 'Semi-Finished Store', icon: Truck, color: 'amber' },
                            { id: 'WIP_FLOOR', label: 'Production Floor (WIP)', icon: Hammer, color: 'rose' },
                        ].map((role) => (
                            <button key={role.id} onClick={() => handleRoleClick(role.id)} className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all hover:shadow-md group bg-white hover:border-${role.color}-200 border-slate-100`}>
                                <div className={`p-2 rounded-lg bg-${role.color}-50 text-${role.color}-600 shrink-0`}><role.icon className="w-5 h-5" /></div>
                                <span className="font-bold text-slate-700 group-hover:text-slate-900">{role.label}</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><ArrowLeft className="w-4 h-4 rotate-180 text-slate-300" /></div>
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
  const [targetOrder, setTargetOrder] = useState(null);
  const [scanQuery, setScanQuery] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [skuMappings, setSkuMappings] = useState({});
  const [reverseMappings, setReverseMappings] = useState({}); 
  const [scanError, setScanError] = useState(null);
  const scanInputRef = useRef(null);

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
    if (!db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(allOrders.filter(o => o.category === role));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  useEffect(() => {
    if (!modalOpen && !loading && selectedPortal !== undefined) {
        const timer = setTimeout(() => { if (scanInputRef.current && !manualMode) scanInputRef.current.focus(); }, 200);
        return () => clearTimeout(timer);
    }
  }, [modalOpen, loading, selectedPortal, role, manualMode]);

  const toggleInputMode = () => {
    setManualMode(prev => !prev);
    if (scanInputRef.current) {
        scanInputRef.current.blur();
        setTimeout(() => { if(scanInputRef.current) scanInputRef.current.focus(); }, 50);
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
          // Update original doc (decrement quantity)
          batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'daily_orders', originalOrder.id), { quantity: originalOrder.quantity - pickedQty });
          
          // Create new split doc
          const newRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders'));
          
          // Clone and clean data
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

  const getRoleTitle = () => {
    if (role === 'FG_STORE') return 'Finished Goods Store';
    if (role === 'SFG_STORE') return 'Semi-Finished Store';
    return 'WIP / Production Floor';
  };

  const portalGroups = useMemo(() => {
    if (role !== 'FG_STORE') return {};
    const groups = {};
    orders.forEach(order => {
      if (order.status !== 'PENDING') return;
      
      // Default to "All Stock" if portal is undefined, null, or 'General'
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

  const currentViewOrders = useMemo(() => {
    if (role === 'FG_STORE' && selectedPortal) return orders.filter(o => (o.portal || 'All Stock') === selectedPortal);
    return orders;
  }, [orders, role, selectedPortal]);

  const masterSkuStats = useMemo(() => {
    const stats = {};
    currentViewOrders.forEach(order => {
        if (order.status === 'COMPLETED') return;
        const master = getMasterSku(order.sku);
        if (!stats[master]) stats[master] = 0;
        stats[master] += (order.quantity || 0);
    });
    return stats;
  }, [currentViewOrders]);

  const displayOrders = useMemo(() => {
    let list = currentViewOrders;
    if (selectedMasterSku) list = list.filter(o => getMasterSku(o.sku) === selectedMasterSku);
    if (scanQuery && manualMode) list = list.filter(o => o.sku.toUpperCase().includes(scanQuery.toUpperCase()));
    return list.sort((a, b) => {
        const score = (s) => s === 'PENDING' ? 1 : s === 'WIP_PROCESSING' ? 2 : 3;
        const statusDiff = score(a.status) - score(b.status);
        if (statusDiff !== 0) return statusDiff;
        return a.sku.localeCompare(b.sku);
    });
  }, [currentViewOrders, selectedMasterSku, scanQuery, manualMode]);

  const styles = role === 'FG_STORE' ? { bg: 'bg-emerald-600', btn: 'text-emerald-600 border-emerald-100' } : role === 'SFG_STORE' ? { bg: 'bg-amber-600', btn: 'text-amber-600 border-amber-100' } : { bg: 'bg-rose-600', btn: 'text-rose-600 border-rose-100' };

  if (role === 'FG_STORE' && !selectedPortal) {
    return (
      <div className="min-h-screen h-[100dvh] bg-slate-50 flex flex-col font-sans overflow-hidden w-full">
        <div className={`${styles.bg} text-white p-4 shadow-lg flex-none z-20`}>
          <div className="w-full px-2 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Package className="w-6 h-6" />{getRoleTitle()}</h2>
                <p className="text-emerald-100 text-sm opacity-90">Welcome, {loggedInUser ? loggedInUser.name : 'Staff'}</p>
            </div>
            <button onClick={logout} className="p-2 bg-white/20 rounded-lg hover:bg-white/30"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {Object.values(portalGroups).length === 0 && !loading && (
                <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No pending orders for Finished Goods</div>
            )}
            {sortedPortalKeys.map((portal) => {
                const group = portalGroups[portal];
                return (
                <button key={portal} onClick={() => setSelectedPortal(portal)} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition text-left relative overflow-hidden group w-full">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
                <h3 className="text-lg font-bold text-slate-800 uppercase">{portal}</h3>
                <div className="flex items-baseline gap-2"><span className="text-4xl font-bold text-slate-800">{group.units}</span><span className="text-sm text-slate-500 font-medium">units</span></div>
                </button>
            )})}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] bg-slate-50 flex flex-col font-sans overflow-hidden w-full max-w-[100vw]">
      <PickModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleModalConfirm} order={targetOrder} role={role} />
      
      {/* HEADER - FIXED TOP */}
      <div className={`${styles.bg} text-white p-4 shadow-lg flex-none z-20 w-full`}>
        <div className="w-full px-2 flex justify-between items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {role === 'FG_STORE' && selectedPortal && <button onClick={() => setSelectedPortal(null)} className="p-1 -ml-2 mr-1 hover:bg-white/20 rounded-full shrink-0"><ArrowLeft className="w-6 h-6" /></button>}
              <h2 className="text-lg sm:text-xl font-bold truncate">{role === 'FG_STORE' ? selectedPortal : getRoleTitle()}</h2>
            </div>
            <div className="flex gap-2 text-xs sm:text-sm opacity-90 truncate mt-0.5">
                <span className="font-semibold truncate">{loggedInUser ? loggedInUser.name : 'Staff'}</span>
                <span className="opacity-60">|</span>
                <span className="truncate">{displayOrders.filter(o => o.status !== 'COMPLETED').length} Tasks</span>
            </div>
          </div>
          <button onClick={logout} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 shrink-0 ml-2"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      {/* FIXED CONTROLS SECTION */}
      <div className="flex-none p-2 sm:p-4 pb-0 z-10 bg-slate-50 w-full max-w-full">
        {/* Search Bar */}
        <div className={`bg-white p-2 sm:p-3 rounded-xl shadow-md border-2 flex items-center gap-2 transition-all ${scanError ? 'border-red-400 ring-4 ring-red-100' : 'border-slate-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100'}`}>
            <button onClick={toggleInputMode} className={`p-2 sm:p-3 rounded-lg transition ${manualMode ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                {manualMode ? <Keyboard className="w-5 h-5 sm:w-6 sm:h-6" /> : <ScanBarcode className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            <div className="flex-1 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2 sm:px-3 h-10 sm:h-12">
                <div className="mr-2">{manualMode ? <Search className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" /> : <ScanBarcode className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 animate-pulse" />}</div>
                <input ref={scanInputRef} type="text" placeholder={manualMode ? "Search..." : "Scan..."} className="flex-1 bg-transparent outline-none font-mono text-base sm:text-lg text-slate-800 font-bold w-full" value={scanQuery} onChange={(e) => {setScanQuery(e.target.value); if(scanError) setScanError(null);}} onKeyDown={e => { if(e.key === 'Enter') processScan(e.currentTarget.value) }} autoFocus autoComplete="off" />
                {scanQuery && <button onClick={() => setScanQuery('')} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>}
            </div>
        </div>
        {scanError && <p className="text-red-500 text-xs font-bold mt-1 ml-2 animate-bounce">{scanError}</p>}

        {/* Master SKU Filter */}
        {Object.keys(masterSkuStats).length > 0 && (
          <div className="w-full overflow-x-auto pb-2 pt-2 scrollbar-hide snap-x touch-pan-x">
             <div className="flex gap-2 min-w-min">
             <button onClick={() => setSelectedMasterSku(null)} className={`snap-start flex-shrink-0 px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all ${!selectedMasterSku ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                All
             </button>
             {Object.entries(masterSkuStats).map(([master, qty]) => (
                 <button key={master} onClick={() => setSelectedMasterSku(selectedMasterSku === master ? null : master)} className={`snap-start flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold text-sm border-2 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] transition-all ${selectedMasterSku === master ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'}`}>
                    <span className="text-[10px] uppercase opacity-70">SKU</span>
                    <span className="text-sm sm:text-base leading-none mb-0.5">{master}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedMasterSku === master ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>{qty}</span>
                 </button>
             ))}
             </div>
          </div>
        )}
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 w-full">
        {/* Responsive Grid Tasks (100% width on mobile) */}
        <div className={displayOrders.length > 0 ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pb-12" : "pb-12"}>
            {displayOrders.length === 0 && (
                <div className="col-span-full p-8 text-center text-slate-400 flex flex-col items-center bg-white rounded-xl border border-dashed border-slate-300">
                    <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                    <p>No tasks found for this filter</p>
                </div>
            )}
            {displayOrders.map(order => {
              const isCompleted = order.status === 'COMPLETED';
              const isWipProcess = order.status === 'WIP_PROCESSING';
              
              // Resolve display code from reverse map
              const displayFG = reverseMappings[order.sku]?.FG;
              const displaySFG = reverseMappings[order.sku]?.SFG;

              return (
                <div key={order.id} className={`p-4 rounded-xl border shadow-sm transition-all duration-200 flex flex-col justify-between h-full ${isCompleted ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : (isWipProcess ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:shadow-md hover:border-blue-300')}`}>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${isCompleted ? 'bg-emerald-100 text-emerald-700' : (isWipProcess ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}`}>
                              {isCompleted ? 'COMPLETED' : (isWipProcess ? 'IN PROCESS' : (order.portal || 'Standard'))}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{getMasterSku(order.sku)}</span>
                        </div>
                        <h3 className={`text-lg font-bold font-mono truncate ${isCompleted ? 'text-emerald-800 line-through decoration-emerald-500/50' : 'text-slate-800'}`}>{order.sku}</h3>
                        
                        {/* Display Mapped SKU codes */}
                        {role === 'FG_STORE' && displayFG && (
                            <div className="text-xs font-mono text-emerald-600 mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">FG: {displayFG}</div>
                        )}
                        {role === 'SFG_STORE' && displaySFG && (
                            <div className="text-xs font-mono text-amber-600 mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-100">SFG: {displaySFG}</div>
                        )}
                    </div>
                    {isCompleted && <CheckCheck className="w-6 h-6 text-emerald-500" />}
                    {isWipProcess && <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />}
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-slate-50 mt-auto">
                    <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Quantity</span>
                        <div className={`text-2xl font-bold leading-none ${isCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>{order.quantity}</div>
                    </div>
                    
                    {!isCompleted && (
                        <button 
                            onClick={() => initiateMarkOut(order)} 
                            className={`px-4 py-3 sm:py-2 rounded-lg font-bold text-sm transition active:scale-95 flex items-center gap-2 ${isWipProcess ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white border hover:bg-slate-50 text-slate-700'} shadow-sm`}
                        >
                            {isWipProcess ? 'Finish' : 'Pick Item'} <ArrowLeft className="w-4 h-4 rotate-180" />
                        </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
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
  if (!user) return <div className="h-screen flex items-center justify-center text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading Warehouse System...</div>;
   
  if (!role) return <RoleSelection onSelectRole={handleRoleSelection} />;
   
  return role === 'ADMIN' 
    ? <AdminDashboard user={user} logout={handleLogout} /> 
    : <StaffDashboard role={role} loggedInUser={loggedInUser} logout={handleLogout} />;
}