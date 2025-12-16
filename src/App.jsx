import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
} from 'firebase/firestore';
import {
  Package,
  Truck,
  Hammer,
  LogOut,
  CheckCircle2,
  LayoutDashboard,
  X,
  Search,
  Globe,
  ArrowLeft,
  ScanBarcode,
  Keyboard,
  CheckCheck,
  Loader2,
  Activity,
  Clock,
  Upload,
  FileSpreadsheet,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart3,
  PieChart,
  Download,
  Lock,
  Settings,
  Key,
  Plus,
  Trash2,
  User,
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
// Your specific configuration is now hardcoded here
const firebaseConfig = {
  apiKey: 'AIzaSyAF8i2DtMi7qLjtjEgDqH7cz01hFMxwUu0',
  authDomain: 'hvglobalwarehouse.firebaseapp.com',
  projectId: 'hvglobalwarehouse',
  storageBucket: 'hvglobalwarehouse.firebasestorage.app',
  messagingSenderId: '603320500296',
  appId: '1:603320500296:web:8f38e782f33e5a3df5187d',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// This ID separates your data in the database.
// Don't change this if you want to keep your history.
const appId = 'hv-global-warehouse-ops-v1';

// --- UTILITIES ---
const parseQty = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const num = parseInt(String(val).replace(/[^0-9-]/g, ''));
  return isNaN(num) ? 0 : num;
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

// --- COMPONENTS ---

const PickModal = ({ isOpen, onClose, onConfirm, order }) => {
  const [pickQty, setPickQty] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && order) {
      setPickQty(order.quantity);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pickQty);
    if (!isNaN(val) && val > 0 && val <= order.quantity) {
      onConfirm(val);
    } else {
      const input = inputRef.current;
      if (input) {
        input.classList.add('animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="bg-slate-50 p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Confirm Picking</h3>
          <p className="text-slate-500 text-sm mt-1">
            SKU:{' '}
            <span className="font-mono font-bold text-slate-700">
              {order.sku}
            </span>
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-8 flex flex-col items-center"
        >
          <p className="text-slate-600 mb-4 font-medium">How many units?</p>
          <div className="flex items-center gap-4 mb-6 w-full">
            <input
              ref={inputRef}
              type="number"
              min="1"
              max={order.quantity}
              className="w-full text-center text-5xl font-bold text-blue-600 border-b-2 border-blue-200 focus:border-blue-600 outline-none pb-2 bg-transparent transition-all"
              value={pickQty}
              onChange={(e) => setPickQty(e.target.value)}
            />
          </div>
          <div className="w-full bg-slate-100 rounded-lg p-3 text-center mb-2">
            <p className="text-sm text-slate-500">
              Total Available: <strong>{order.quantity}</strong>
            </p>
          </div>
          <button
            type="submit"
            className="w-full mt-4 p-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            Confirm (Enter)
          </button>
        </form>
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="text-slate-500 text-sm font-bold hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AUTH COMPONENTS ---

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
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'staff_directory'),
        where('role', '==', role)
      );
      getDocs(q).then((snap) => {
        const staffList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    const user = users.find((u) => u.id === selectedUser);
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
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {role === 'ADMIN' ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Password
              </label>
              <input
                type="password"
                className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Admin Password"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
            >
              Unlock Console
            </button>
          </form>
        ) : (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" /> Loading
                Staff...
              </div>
            ) : users.length === 0 ? (
              <div className="py-4 text-center text-amber-600 bg-amber-50 rounded-lg p-4">
                No staff found for this role. <br />
                Please ask Admin to add you in Settings.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Select Staff Member
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    required
                  >
                    <option value="">-- Select Name --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your Password"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                  disabled={!selectedUser}
                >
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <LoginModal
        isOpen={!!loginRole}
        onClose={() => setLoginRole(null)}
        role={loginRole}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* UPDATED: Changed max-w-5xl to max-w-7xl for wider desktop view */}
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-6 p-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              H.V Global
              <br />
              Warehouse OPS
            </h1>
            <p className="text-slate-400 text-lg mt-4 leading-relaxed max-w-xl">
              Real-time inventory orchestration for Finished Goods,
              Semi-Finished components, and WIP production lines.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm flex-1">
              <div className="text-emerald-400 font-bold text-xl mb-1">
                Live
              </div>
              <div className="text-slate-400 text-xs">Sync Enabled</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm flex-1">
              <div className="text-blue-400 font-bold text-xl mb-1">Secure</div>
              <div className="text-slate-400 text-xs">Role Access</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 transform hover:scale-[1.01] transition-transform duration-300">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Enter Portal
          </h2>

          <button
            onClick={() => handleRoleClick('ADMIN')}
            className="w-full p-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-4 group shadow-lg shadow-slate-200"
          >
            <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
              <LayoutDashboard className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">Admin Dashboard</div>
              <div className="text-xs text-slate-400">
                Master Control & Analytics
              </div>
            </div>
          </button>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Staff Access
            </p>
            {[
              {
                id: 'FG_STORE',
                label: 'Finished Goods',
                icon: Package,
                color: 'emerald',
              },
              {
                id: 'SFG_STORE',
                label: 'Semi-Finished Store',
                icon: Truck,
                color: 'amber',
              },
              {
                id: 'WIP_FLOOR',
                label: 'Production Floor (WIP)',
                icon: Hammer,
                color: 'rose',
              },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleClick(role.id)}
                className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all hover:shadow-md group bg-white hover:border-${role.color}-200 border-slate-100`}
              >
                <div
                  className={`p-2 rounded-lg bg-${role.color}-50 text-${role.color}-600`}
                >
                  <role.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900">
                  {role.label}
                </span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="w-4 h-4 rotate-180 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = ({ role, loggedInUser, logout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [selectedMasterSku, setSelectedMasterSku] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState(null);
  const [scanQuery, setScanQuery] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const scanInputRef = useRef(null);

  useEffect(() => {
    // If no db, just return
    if (!db) return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(allOrders.filter((o) => o.category === role));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  useEffect(() => {
    if (!modalOpen && !loading && selectedPortal !== undefined) {
      const timer = setTimeout(() => {
        if (scanInputRef.current && !manualMode) scanInputRef.current.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [modalOpen, loading, selectedPortal, role, manualMode]);

  const toggleInputMode = () => {
    setManualMode((prev) => !prev);
    if (scanInputRef.current) {
      scanInputRef.current.blur();
      setTimeout(() => {
        if (scanInputRef.current) scanInputRef.current.focus();
      }, 50);
    }
  };

  const initiateMarkOut = (order) => {
    if (order.status === 'COMPLETED') return;
    const qty = parseInt(order.quantity) || 0;
    if (qty > 1) {
      setTargetOrder(order);
      setModalOpen(true);
    } else {
      completeOrder(order.id);
    }
  };

  const handleModalConfirm = async (pickQty) => {
    setModalOpen(false);
    if (!targetOrder) return;
    if (pickQty === targetOrder.quantity) {
      await completeOrder(targetOrder.id);
    } else {
      await partialPick(targetOrder, pickQty);
    }
    setTargetOrder(null);
    setScanQuery('');
  };

  const processScan = (code) => {
    const scannedSku = code.trim().toUpperCase();
    if (!scannedSku) return;
    const relevantList =
      role === 'FG_STORE' && selectedPortal
        ? orders.filter((o) => (o.portal || 'General') === selectedPortal)
        : orders;
    const matchedOrder = relevantList.find(
      (o) => o.sku.trim().toUpperCase() === scannedSku && o.status === 'PENDING'
    );

    if (matchedOrder) {
      initiateMarkOut(matchedOrder);
      setScanQuery('');
    } else {
      if (role === 'FG_STORE' && !selectedPortal) {
        const anyMatch = orders.find(
          (o) =>
            o.sku.trim().toUpperCase() === scannedSku && o.status === 'PENDING'
        );
        if (anyMatch) {
          if (!selectedPortal && anyMatch.portal)
            setSelectedPortal(anyMatch.portal);
          else if (selectedPortal !== anyMatch.portal)
            setSelectedPortal(anyMatch.portal || 'General');
          setTimeout(() => initiateMarkOut(anyMatch), 100);
        }
      }
      setScanQuery('');
    }
  };

  const handleScanKey = (e) => {
    if (e.key === 'Enter') processScan(e.currentTarget.value);
  };

  const completeOrder = async (orderId) => {
    try {
      const orderRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'daily_orders',
        orderId
      );
      await updateDoc(orderRef, {
        status: 'COMPLETED',
        pickedBy: loggedInUser ? loggedInUser.name : 'Staff',
        pickedAt: serverTimestamp(),
      });
      setScanQuery('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const partialPick = async (originalOrder, pickedQty) => {
    try {
      const batch = writeBatch(db);
      const originalRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'daily_orders',
        originalOrder.id
      );
      batch.update(originalRef, {
        quantity: originalOrder.quantity - pickedQty,
      });

      const newOrderRef = doc(
        collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders')
      );
      const completedOrder = {
        ...originalOrder,
        quantity: pickedQty,
        status: 'COMPLETED',
        pickedBy: loggedInUser ? loggedInUser.name : 'Staff',
        pickedAt: serverTimestamp(),
      };
      delete completedOrder.id;

      batch.set(newOrderRef, completedOrder);
      await batch.commit();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getRoleTitle = () => {
    if (role === 'FG_STORE') return 'Finished Goods Store';
    if (role === 'SFG_STORE') return 'Semi-Finished Store';
    return 'WIP / Production Floor';
  };

  const portalGroups = useMemo(() => {
    if (role !== 'FG_STORE') return {};
    const groups = {};
    orders.forEach((order) => {
      if (order.status !== 'PENDING') return;
      const portal = order.portal || 'General';
      if (!groups[portal])
        groups[portal] = { count: 0, units: 0, name: portal };
      groups[portal].count += 1;
      groups[portal].units += order.quantity || 0;
    });
    return groups;
  }, [orders, role]);

  const currentViewOrders = useMemo(() => {
    if (role === 'FG_STORE' && selectedPortal)
      return orders.filter((o) => (o.portal || 'General') === selectedPortal);
    return orders;
  }, [orders, role, selectedPortal]);

  const masterSkuStats = useMemo(() => {
    const stats = {};
    currentViewOrders.forEach((order) => {
      if (order.status !== 'PENDING') return;
      const master = getMasterSku(order.sku);
      if (!stats[master]) stats[master] = 0;
      stats[master] += order.quantity || 0;
    });
    return stats;
  }, [currentViewOrders]);

  const displayOrders = useMemo(() => {
    let list = currentViewOrders;
    if (selectedMasterSku)
      list = list.filter((o) => getMasterSku(o.sku) === selectedMasterSku);
    if (scanQuery && manualMode)
      list = list.filter((o) =>
        o.sku.toUpperCase().includes(scanQuery.toUpperCase())
      );
    return list.sort((a, b) => {
      if (a.status === b.status) return a.sku.localeCompare(b.sku);
      return a.status === 'PENDING' ? -1 : 1;
    });
  }, [currentViewOrders, selectedMasterSku, scanQuery, manualMode]);

  const totalUnits = orders
    .filter((o) => o.status === 'PENDING')
    .reduce((sum, order) => sum + (order.quantity || 0), 0);
  const styles =
    role === 'FG_STORE'
      ? { bg: 'bg-emerald-600', btn: 'text-emerald-600 border-emerald-100' }
      : role === 'SFG_STORE'
      ? { bg: 'bg-amber-600', btn: 'text-amber-600 border-amber-100' }
      : { bg: 'bg-rose-600', btn: 'text-rose-600 border-rose-100' };

  if (role === 'FG_STORE' && !selectedPortal) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div
          className={`${styles.bg} text-white p-4 shadow-lg sticky top-0 z-10`}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6" />
                {getRoleTitle()}
              </h2>
              <p className="text-emerald-100 text-sm opacity-90">
                Select Portal
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4 mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.values(portalGroups).length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              No pending orders for Finished Goods
            </div>
          )}
          {Object.values(portalGroups).map((group) => (
            <button
              key={group.name}
              onClick={() => setSelectedPortal(group.name)}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
              <h3 className="text-lg font-bold text-slate-800 uppercase">
                {group.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-800">
                  {group.units}
                </span>
                <span className="text-sm text-slate-500 font-medium">
                  units
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 pb-20`}>
      <PickModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
        order={targetOrder}
      />

      <div
        className={`${styles.bg} text-white p-4 shadow-lg sticky top-0 z-20`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              {role === 'FG_STORE' && selectedPortal && (
                <button
                  onClick={() => setSelectedPortal(null)}
                  className="p-1 -ml-2 mr-1 hover:bg-white/20 rounded-full"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-xl font-bold">
                {role === 'FG_STORE' ? selectedPortal : getRoleTitle()}
              </h2>
            </div>
            <div className="flex gap-3 text-sm opacity-90">
              <span>
                {displayOrders.filter((o) => o.status === 'PENDING').length}{' '}
                Tasks
              </span>
              <span className="opacity-60">|</span>
              <span className="font-semibold">{totalUnits} Units Pending</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4 mt-4">
        <div className="bg-white p-3 rounded-xl shadow-md border-2 border-slate-300 flex items-center gap-2 sticky top-24 z-10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
          <button
            onClick={toggleInputMode}
            className={`p-3 rounded-lg transition ${
              manualMode
                ? 'bg-blue-100 text-blue-600'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {manualMode ? (
              <Keyboard className="w-6 h-6" />
            ) : (
              <ScanBarcode className="w-6 h-6" />
            )}
          </button>
          <div className="flex-1 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-3 h-12">
            <div className="mr-2">
              {manualMode ? (
                <Search className="w-6 h-6 text-slate-400" />
              ) : (
                <ScanBarcode className="w-6 h-6 text-blue-500 animate-pulse" />
              )}
            </div>
            <input
              ref={scanInputRef}
              type="text"
              placeholder={manualMode ? 'Type to search...' : 'Scan Barcode...'}
              className="flex-1 bg-transparent outline-none font-mono text-lg text-slate-800 font-bold"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              onKeyDown={handleScanKey}
              autoFocus
              autoComplete="off"
            />
            {scanQuery && (
              <button
                onClick={() => setScanQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {Object.keys(masterSkuStats).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <button
              onClick={() => setSelectedMasterSku(null)}
              className={`snap-start flex-shrink-0 px-5 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                !selectedMasterSku
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              All Items
            </button>
            {Object.entries(masterSkuStats).map(([master, qty]) => (
              <button
                key={master}
                onClick={() =>
                  setSelectedMasterSku(
                    selectedMasterSku === master ? null : master
                  )
                }
                className={`snap-start flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm border-2 flex flex-col items-center justify-center min-w-[80px] transition-all ${
                  selectedMasterSku === master
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md scale-105'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                }`}
              >
                <span className="text-xs uppercase opacity-70">SKU</span>
                <span className="text-lg leading-none mb-1">{master}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                    selectedMasterSku === master
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {qty} Units
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden min-h-[200px]">
          {displayOrders.length === 0 && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
              <p>No tasks found for this filter</p>
            </div>
          )}
          {displayOrders.map((order) => {
            const isCompleted = order.status === 'COMPLETED';
            return (
              <div
                key={order.id}
                className={`p-4 flex items-center justify-between transition ${
                  isCompleted
                    ? 'bg-emerald-50/50 opacity-60'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isCompleted ? 'COMPLETED' : order.portal || 'Standard'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {getMasterSku(order.sku)}
                    </span>
                  </div>
                  <h3
                    className={`text-lg font-bold font-mono truncate ${
                      isCompleted
                        ? 'text-emerald-800 line-through decoration-emerald-500/50'
                        : 'text-slate-800'
                    }`}
                  >
                    {order.sku}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`block text-2xl font-bold leading-none ${
                        isCompleted ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {order.quantity}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      Units
                    </span>
                  </div>
                  {isCompleted ? (
                    <div className="p-3">
                      <CheckCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                  ) : (
                    <button
                      onClick={() => initiateMarkOut(order)}
                      className={`p-3 rounded-xl border-2 transition active:scale-95 flex items-center justify-center ${styles.btn} hover:bg-current hover:text-white`}
                    >
                      <CheckCircle2 className="w-8 h-8" />
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

const SettingsView = () => {
  const [staff, setStaff] = useState([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('FG_STORE');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'staff_directory')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newName || !newPassword) return;
    setLoading(true);
    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'staff_directory'),
        {
          name: newName,
          role: newRole,
          password: newPassword,
          createdAt: serverTimestamp(),
        }
      );
      setNewName('');
      setNewPassword('');
      setLoading(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      await deleteDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'staff_directory', id)
      );
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" /> Add New Staff
        </h3>
        <form
          onSubmit={handleAddStaff}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Name
            </label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Role
            </label>
            <select
              className="w-full p-2.5 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="FG_STORE">Finished Goods</option>
              <option value="SFG_STORE">Semi-Finished</option>
              <option value="WIP_FLOOR">WIP Floor</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Password
            </label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Set Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="p-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Add User'
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
          <Users className="w-5 h-5" /> Staff Directory
        </div>
        <div className="divide-y divide-slate-100">
          {staff.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No staff members added yet.
            </div>
          )}
          {staff.map((user) => (
            <div
              key={user.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    user.role === 'FG_STORE'
                      ? 'bg-emerald-100 text-emerald-600'
                      : user.role === 'SFG_STORE'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">{user.name}</div>
                  <div className="text-xs font-mono text-slate-400">
                    Pass: {user.password}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {user.role === 'FG_STORE'
                    ? 'Finished Goods'
                    : user.role === 'SFG_STORE'
                    ? 'Semi-Finished'
                    : 'WIP Floor'}
                </span>
                <button
                  onClick={() => handleDeleteStaff(user.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReportsView = ({ allOrders, stats }) => {
  const pendingTasks = stats.fg + stats.sfg + stats.wip;
  const isLocked = pendingTasks > 0;

  const handleExport = () => {
    if (isLocked) {
      alert(`Cannot export report. ${pendingTasks} tasks are still pending.`);
      return;
    }

    // Create Worksheet
    const wsData = allOrders.map((order) => ({
      SKU: order.sku,
      'Master SKU': getMasterSku(order.sku),
      Category: order.category,
      Quantity: order.quantity,
      Status: order.status,
      Portal: order.portal || 'N/A',
      'Picked By': order.pickedBy || 'N/A',
      'Time Picked': order.pickedAt ? formatTime(order.pickedAt) : '',
      Date: new Date().toLocaleDateString(),
    }));

    const ws = window.XLSX.utils.json_to_sheet(wsData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
    window.XLSX.writeFile(
      wb,
      `Warehouse_Daily_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const portalDistribution = useMemo(() => {
    const dist = {};
    allOrders.forEach((o) => {
      if (o.category === 'FG_STORE' && o.portal) {
        dist[o.portal] = (dist[o.portal] || 0) + o.quantity;
      }
    });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [allOrders]);

  // Aggregate user performance
  const userPerformance = useMemo(() => {
    const perf = {};
    allOrders.forEach((o) => {
      if (o.status === 'COMPLETED' && o.pickedBy) {
        if (!perf[o.pickedBy]) perf[o.pickedBy] = { lines: 0, units: 0 };
        perf[o.pickedBy].lines += 1;
        perf[o.pickedBy].units += o.quantity || 0;
      }
    });
    return Object.entries(perf).sort((a, b) => b[1].units - a[1].units);
  }, [allOrders]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Export Card */}
      <div
        className={`rounded-2xl p-8 border transition-all duration-300 flex flex-col items-center text-center space-y-4 ${
          isLocked
            ? 'bg-slate-50 border-slate-200'
            : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-xl shadow-emerald-100'
        }`}
      >
        <div
          className={`p-4 rounded-full ${
            isLocked
              ? 'bg-slate-200 text-slate-400'
              : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          {isLocked ? (
            <Lock className="w-10 h-10" />
          ) : (
            <Download className="w-10 h-10 animate-bounce" />
          )}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800">
            Daily Completion Report
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            {isLocked
              ? `Export is currently locked because there are ${pendingTasks} pending tasks remaining. Please complete all tasks to generate the EOD report.`
              : 'All tasks completed! You can now download the comprehensive End-of-Day report containing detailed timestamps and SKU breakdowns.'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isLocked}
          className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            isLocked
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:scale-105'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          Download Excel Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Portal Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-500" /> Portal Distribution
          </h4>
          <div className="space-y-3">
            {portalDistribution.map(([portal, qty]) => (
              <div key={portal} className="flex items-center gap-3">
                <div className="w-24 text-xs font-bold text-slate-500 uppercase text-right truncate">
                  {portal}
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${
                        (qty /
                          portalDistribution.reduce((a, b) => a + b[1], 0)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="w-12 text-right font-bold text-slate-700 text-sm">
                  {qty}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log / Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" /> Picker Performance
          </h4>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 text-right">Lines</th>
                  <th className="px-4 py-3 text-right">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userPerformance.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-4 text-center text-slate-400 italic"
                    >
                      No activity yet
                    </td>
                  </tr>
                )}
                {userPerformance.map(([user, data]) => (
                  <tr key={user} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {user}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {data.lines}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      {data.units}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ user, logout }) => {
  const [view, setView] = useState('DASHBOARD'); // 'DASHBOARD' | 'REPORTS' | 'SETTINGS'
  const [stats, setStats] = useState({
    fg: 0,
    sfg: 0,
    wip: 0,
    totalFgDay: 0,
    totalSfgDay: 0,
    totalWipDay: 0,
    completedUnits: 0,
  });
  const [portalStats, setPortalStats] = useState({ grandTotal: 0 });
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders for reports
  const [grandTotal, setGrandTotal] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [columnMap, setColumnMap] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // Stats Summary Listener
    const statsRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'stats',
      'daily_summary'
    );
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) setGrandTotal(docSnap.data().grandTotal || 0);
    });

    // Main Orders Listener
    const ordersQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders')
    );
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllOrders(orders); // Save full list for reports

      const calcStats = (cat) => ({
        pending: orders
          .filter((o) => o.category === cat && o.status === 'PENDING')
          .reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0),
        total: orders
          .filter((o) => o.category === cat)
          .reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0),
      });

      const fg = calcStats('FG_STORE');
      const sfg = calcStats('SFG_STORE');
      const wip = calcStats('WIP_FLOOR');

      setStats({
        fg: fg.pending,
        sfg: sfg.pending,
        wip: wip.pending,
        totalFgDay: fg.total,
        totalSfgDay: sfg.total,
        totalWipDay: wip.total,
        completedUnits: orders
          .filter((o) => o.status === 'COMPLETED')
          .reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0),
      });

      // Recent Completed List (for Live View)
      const completedList = orders
        .filter((o) => o.status === 'COMPLETED')
        .sort((a, b) => {
          const timeA = a.pickedAt?.seconds || 0;
          const timeB = b.pickedAt?.seconds || 0;
          return timeB - timeA;
        })
        .slice(0, 50);
      setRecentCompleted(completedList);

      const livePortals = {
        ajio: 0,
        nykaa: 0,
        flipkart: 0,
        amazon: 0,
        myntra: 0,
        firstcry: 0,
        website: 0,
      };
      orders.forEach((order) => {
        if (
          order.status === 'PENDING' &&
          order.category === 'FG_STORE' &&
          order.portal
        ) {
          const p = order.portal.toLowerCase();
          if (livePortals[p] !== undefined)
            livePortals[p] += parseInt(order.quantity) || 0;
        }
      });
      setPortalStats((prev) => ({ ...livePortals, grandTotal: grandTotal }));
    });
    return () => {
      unsubStats();
      unsubOrders();
    };
  }, [user, grandTotal]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = window.XLSX.utils.sheet_to_json(
        window.XLSX.read(evt.target.result, { type: 'binary' }).Sheets[
          window.XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]
        ],
        { header: 1 }
      );
      setParsedData(data);

      // Auto-detect headers
      let headerRowIndex = -1;
      let colIndices = {
        sku: -1,
        fg: -1,
        sfg: -1,
        wip: -1,
        ajio: -1,
        nykaa: -1,
        flipkart: -1,
        amazon: -1,
        myntra: -1,
        firstcry: -1,
        website: -1,
        grandTotal: -1,
      };
      let maxScore = 0;

      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const row = (data[i] || []).map((c) =>
          String(c || '')
            .toLowerCase()
            .trim()
        );
        let score = 0;
        let ci = { ...colIndices };
        const skuIdx = row.findIndex(
          (c) => c === 'mastersku' || c === 'master sku'
        );
        if (skuIdx !== -1) {
          score += 5;
          ci.sku = skuIdx;
        }
        if (
          row.findIndex((c) => c.includes('finish') && c.includes('good')) !==
          -1
        ) {
          score += 3;
          ci.fg = row.findIndex(
            (c) => c.includes('finish') && c.includes('good')
          );
        }
        if (
          row.findIndex((c) => c.includes('semi') && c.includes('finish')) !==
          -1
        ) {
          score += 3;
          ci.sfg = row.findIndex(
            (c) => c.includes('semi') && c.includes('finish')
          );
        }
        if (row.findIndex((c) => c.includes('wip')) !== -1) {
          score += 3;
          ci.wip = row.findIndex((c) => c.includes('wip'));
        }
        if (row.findIndex((c) => c === 'grand total') !== -1) {
          score += 3;
          ci.grandTotal = row.findIndex((c) => c === 'grand total');
        }
        if (row.findIndex((c) => c === 'ajio') !== -1)
          ci.ajio = row.findIndex((c) => c === 'ajio');
        if (row.findIndex((c) => c.includes('nykaa')) !== -1)
          ci.nykaa = row.findIndex((c) => c.includes('nykaa'));
        if (row.findIndex((c) => c.includes('flipkart')) !== -1)
          ci.flipkart = row.findIndex((c) => c.includes('flipkart'));
        if (row.findIndex((c) => c.includes('amazon')) !== -1)
          ci.amazon = row.findIndex((c) => c.includes('amazon'));
        if (row.findIndex((c) => c.includes('myntra')) !== -1)
          ci.myntra = row.findIndex((c) => c.includes('myntra'));
        if (row.findIndex((c) => c.includes('firstcry')) !== -1)
          ci.firstcry = row.findIndex((c) => c.includes('firstcry'));
        if (row.findIndex((c) => c.includes('website')) !== -1)
          ci.website = row.findIndex((c) => c.includes('website'));

        if (score > maxScore) {
          maxScore = score;
          headerRowIndex = i;
          colIndices = ci;
        }
      }
      if (headerRowIndex !== -1)
        setColumnMap({ headerRowIndex, ...colIndices });
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessUpload = async () => {
    if (parsedData.length === 0 || !columnMap) return;
    setIsUploading(true);
    const batch = [];
    let grandTotalSum = 0;
    const {
      headerRowIndex,
      sku: skuIdx,
      fg: fgIdx,
      sfg: sfgIdx,
      wip: wipIdx,
      grandTotal: totalIdx,
    } = columnMap;

    for (let i = headerRowIndex + 1; i < parsedData.length; i++) {
      const row = parsedData[i];
      if (!row) continue;
      const sku = row[skuIdx];
      if (!sku || String(sku).toLowerCase().includes('total')) continue;

      const fgAvailable = fgIdx !== -1 ? parseQty(row[fgIdx]) : 0;
      const sfgQty = sfgIdx !== -1 ? parseQty(row[sfgIdx]) : 0;
      const wipQty = wipIdx !== -1 ? parseQty(row[wipIdx]) : 0;

      if (sfgQty > 0)
        batch.push({
          sku,
          quantity: sfgQty,
          category: 'SFG_STORE',
          status: 'PENDING',
          createdAt: serverTimestamp(),
          portal: 'General',
        });
      if (wipQty > 0)
        batch.push({
          sku,
          quantity: wipQty,
          category: 'WIP_FLOOR',
          status: 'PENDING',
          createdAt: serverTimestamp(),
          portal: 'General',
        });

      if (fgAvailable > 0) {
        let remainingFg = fgAvailable;
        const portals = [
          'Ajio',
          'Nykaa',
          'Flipkart',
          'Amazon',
          'Myntra',
          'FirstCry',
          'Website',
        ];
        const pIndices = [
          columnMap.ajio,
          columnMap.nykaa,
          columnMap.flipkart,
          columnMap.amazon,
          columnMap.myntra,
          columnMap.firstcry,
          columnMap.website,
        ];

        portals.forEach((pName, idx) => {
          const pQty = pIndices[idx] !== -1 ? parseQty(row[pIndices[idx]]) : 0;
          if (remainingFg > 0 && pQty > 0) {
            const take = Math.min(remainingFg, pQty);
            batch.push({
              sku,
              quantity: take,
              category: 'FG_STORE',
              status: 'PENDING',
              createdAt: serverTimestamp(),
              portal: pName,
            });
            remainingFg -= take;
          }
        });
        if (remainingFg > 0)
          batch.push({
            sku,
            quantity: remainingFg,
            category: 'FG_STORE',
            status: 'PENDING',
            createdAt: serverTimestamp(),
            portal: 'General Stock',
          });
      }

      grandTotalSum += totalIdx !== -1 ? parseQty(row[totalIdx]) : 0;
    }

    try {
      const collectionRef = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'daily_orders'
      );
      await Promise.all(batch.map((item) => addDoc(collectionRef, item)));
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'daily_summary'),
        { grandTotal: grandTotalSum }
      );
      setParsedData([]);
      setFileName('');
      setColumnMap(null);
    } catch (err) {
      console.error(err);
      alert('Error uploading. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAll = async () => {
    if (prompt("Type 'RESET' to delete all data") !== 'RESET') return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'daily_orders')
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    await setDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'daily_summary'),
      { grandTotal: 0 }
    );
    alert('Reset Complete');
  };

  const getPercentage = (part, total) =>
    !total ? 0 : Math.round((part / total) * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 text-slate-900">
      {/* Modern Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">
                Admin Console
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Warehouse Operations
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setView('DASHBOARD')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === 'DASHBOARD'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView('REPORTS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                view === 'REPORTS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Reports
            </button>
            <button
              onClick={() => setView('SETTINGS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                view === 'SETTINGS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {view === 'DASHBOARD' && (
            <button
              onClick={() => document.getElementById('file-upload').click()}
              className="flex items-center gap-2 text-sm font-medium bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Excel</span>
            </button>
          )}
          <button
            onClick={logout}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics & Controls */}
        <div className="lg:col-span-2 space-y-8">
          {view === 'REPORTS' ? (
            <ReportsView allOrders={allOrders} stats={stats} />
          ) : view === 'SETTINGS' ? (
            <SettingsView />
          ) : (
            <>
              {/* Upload Status */}
              {isUploading && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-bold">
                    Processing Order File... This may take a moment.
                  </span>
                </div>
              )}

              {fileName && !isUploading && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{fileName}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {columnMap
                          ? 'Headers Detected Successfully'
                          : 'Columns not identified'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleProcessUpload}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Process & Go Live
                  </button>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Total Load
                    </p>
                    <p className="text-4xl font-bold mt-2">{grandTotal}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Units from Excel
                    </p>
                  </div>
                  <div className="absolute right-0 top-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">
                      FG Store
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-800">
                      {stats.fg}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${getPercentage(
                              stats.totalFgDay,
                              grandTotal
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {getPercentage(stats.totalFgDay, grandTotal)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">
                      SFG Store
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-800">
                      {stats.sfg}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${getPercentage(
                              stats.totalSfgDay,
                              grandTotal
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {getPercentage(stats.totalSfgDay, grandTotal)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                      <Hammer className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">
                      WIP Floor
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-800">
                      {stats.wip}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{
                            width: `${getPercentage(
                              stats.totalWipDay,
                              grandTotal
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {getPercentage(stats.totalWipDay, grandTotal)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow md:col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">
                      Total Throughput
                    </span>
                  </div>
                  <div className="flex items-end gap-4">
                    <p className="text-4xl font-bold text-slate-800">
                      {stats.completedUnits}
                    </p>
                    <p className="text-slate-400 text-sm font-medium mb-2">
                      units picked & processed
                    </p>
                  </div>
                </div>
              </div>

              {/* Portal Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Portal Pending (Live)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(portalStats)
                    .filter(([k]) => k !== 'grandTotal')
                    .map(([portal, count]) => (
                      <div
                        key={portal}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors"
                      >
                        <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                          {portal}
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {count}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 text-red-500 font-bold text-xs hover:bg-red-50 px-4 py-2 rounded-lg transition"
                >
                  <AlertCircle className="w-4 h-4" /> Reset System Data
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Live Feed */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-8rem)] sticky top-24">
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Live Activity
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>

            <div className="overflow-y-auto flex-1 p-0 divide-y divide-slate-50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {recentCompleted.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No activity yet today.
                </div>
              )}
              {recentCompleted.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(task.pickedAt)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        task.category === 'FG_STORE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : task.category === 'SFG_STORE'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {task.category === 'FG_STORE'
                        ? 'FG'
                        : task.category === 'SFG_STORE'
                        ? 'SFG'
                        : 'WIP'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 text-sm font-mono">
                        {task.sku}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {task.pickedBy || 'Staff'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-lg font-bold text-emerald-600 leading-none">
                        +{task.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      // START FIX: Removed custom token logic to prevent ReferenceError and Mismatch Error
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Auth failed:', error);
      }
      // END FIX
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleRoleSelection = (selectedRole, userObj) => {
    setRole(selectedRole);
    setLoggedInUser(userObj || null);
  };

  const handleLogout = () => {
    setRole(null);
    setLoggedInUser(null);
  };

  if (!auth)
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Firebase Config Error
      </div>
    );
  if (!user)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin" /> Loading Warehouse System...
      </div>
    );

  if (!role) return <RoleSelection onSelectRole={handleRoleSelection} />;

  return role === 'ADMIN' ? (
    <AdminDashboard user={user} logout={handleLogout} />
  ) : (
    <StaffDashboard
      role={role}
      loggedInUser={loggedInUser}
      logout={handleLogout}
    />
  );
}
