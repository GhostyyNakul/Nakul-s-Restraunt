import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Mail, Lock, ShieldCheck, KeyRound, CheckCircle2, 
  AlertCircle, Clock, ShoppingBag, History, ChevronDown, ChevronUp, MapPin, CreditCard
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { hashPassword, isHashed } from '../utils/security';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; isAdmin: boolean; password?: string } | null;
  onUpdateUser: (updatedUser: { name: string; email: string; isAdmin: boolean; password?: string }) => void;
  theme: 'dark' | 'light';
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  theme,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'security' | 'history'>('security');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear states and load order history when opening/closing
  useEffect(() => {
    if (isOpen) {
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setActiveTab('security');
      
      // Load user order history from cc_orders in local storage
      if (user) {
        const savedOrders = localStorage.getItem('cc_orders');
        if (savedOrders) {
          try {
            const parsed: Order[] = JSON.parse(savedOrders);
            // Filter orders that correspond to the logged-in user's email address
            const filtered = parsed.filter(order => 
              order.customerEmail && order.customerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()
            );
            // Put newest orders first
            setOrders(filtered.reverse());
          } catch (err) {
            console.error("Failed to parse orders from localStorage:", err);
          }
        }
      }
    }
  }, [isOpen, user]);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (!isOpen || !user) return null;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (user.isAdmin) {
      // Admin password change (using localStorage)
      const currentAdminKey = localStorage.getItem('cc_admin_key') || 'admin';
      const inputHashed = hashPassword(currentPasswordInput, 'admin');

      const isCurrentValid = isHashed(currentAdminKey)
        ? (currentAdminKey === inputHashed)
        : (currentAdminKey === currentPasswordInput);
      
      // If current password is wrong
      if (!isCurrentValid) {
        setError('Incorrect current security key.');
        return;
      }

      const nextAdminHash = hashPassword(newPassword, 'admin');
      localStorage.setItem('cc_admin_key', nextAdminHash);
      
      // Update global user state with password representation
      onUpdateUser({
        ...user,
        password: nextAdminHash
      });

      setSuccess('Cave Command key changed successfully! Use this to authenticate next time.');
    } else {
      // Normal Customer Password change
      // Retrieve registered database of customers
      const registeredStr = localStorage.getItem('cc_registered_users');
      let registeredUsers: Array<{ name: string; email: string; password?: string }> = [];
      if (registeredStr) {
        try {
          registeredUsers = JSON.parse(registeredStr);
        } catch (e) {
          registeredUsers = [];
        }
      }

      // Find this user
      const userIdx = registeredUsers.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      
      let actualCurrentPassword = user.password || '';
      
      if (userIdx !== -1 && registeredUsers[userIdx].password) {
        actualCurrentPassword = registeredUsers[userIdx].password || '';
      }

      const inputHashed = hashPassword(currentPasswordInput, user.email);

      const isCurrentValid = isHashed(actualCurrentPassword)
        ? (actualCurrentPassword === inputHashed)
        : (actualCurrentPassword === currentPasswordInput);

      // If user had a password but entered the wrong one
      if (actualCurrentPassword && !isCurrentValid) {
        setError('Incorrect current password.');
        return;
      }

      const nextCustomerHash = hashPassword(newPassword, user.email);

      // If they had no password stored yet, we let them set it
      // Let's update in local array
      if (userIdx !== -1) {
        registeredUsers[userIdx].password = nextCustomerHash;
      } else {
        registeredUsers.push({
          name: user.name,
          email: user.email,
          password: nextCustomerHash
        });
      }

      localStorage.setItem('cc_registered_users', JSON.stringify(registeredUsers));

      // Update logged-in user state
      onUpdateUser({
        ...user,
        password: nextCustomerHash
      });

      setSuccess('Your Nakul\'s Restraunt account password has been updated securely.');
    }

    // Reset password fields
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className={`relative z-10 max-w-xl w-full rounded-[2.5rem] overflow-hidden shadow-2xl border ${
            isDark 
              ? 'bg-[#1a1919] border-white/10 text-white' 
              : 'bg-white border-orange-100 text-[#261d19]'
          }`}
        >
          {/* Top colored accent line */}
          <div className={`h-2 w-full ${user.isAdmin ? 'bg-[#fabd00]' : 'bg-[#ff5c00]'}`} />

          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-200" />
          </button>

          <div className="p-8">
            {/* Header / Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                user.isAdmin 
                  ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-500 border border-amber-500/30' 
                  : 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-[#ff5c00] border border-[#ff5c00]/30'
              }`}>
                {user.isAdmin ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  user.isAdmin 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                  {user.isAdmin ? 'Cave Commander (Admin)' : 'Gourmet Explorer'}
                </span>
                <h3 className="font-sora font-extrabold text-xl mt-1 tracking-tight">
                  {user.name}
                </h3>
              </div>
            </div>

            {/* Seamless Tab Switches */}
            <div className={`flex border-b mb-6 ${
              isDark ? 'border-white/5' : 'border-orange-100/50'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setActiveTab('security');
                }}
                className={`flex items-center gap-2 pb-3 font-sora font-extrabold text-xs border-b-2 px-4 transition-colors ${
                  activeTab === 'security'
                    ? (user.isAdmin ? 'border-[#fabd00] text-amber-400' : 'border-[#ff5c00] text-[#ff5c00]')
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Security Credentials</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setActiveTab('history');
                }}
                className={`flex items-center gap-2 pb-3 font-sora font-extrabold text-xs border-b-2 px-4 transition-colors relative ${
                  activeTab === 'history'
                    ? (user.isAdmin ? 'border-[#fabd00] text-amber-400' : 'border-[#ff5c00] text-[#ff5c00]')
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Order History</span>
                {orders.length > 0 && (
                  <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ml-1.5 ${
                    user.isAdmin
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-orange-500/10 text-[#ff5c00]'
                  }`}>
                    {orders.length}
                  </span>
                )}
              </button>
            </div>

            {/* Security Settings Tab */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                {/* Profile fields details */}
                <div className={`p-4 rounded-2xl space-y-3 mb-4 border ${
                  isDark ? 'bg-black/20 border-white/5' : 'bg-orange-50/30 border-orange-100/50'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-500" /> Authorized Email
                    </span>
                    <span className="font-semibold">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" /> Session Node
                    </span>
                    <span className="font-mono text-xxs font-bold text-gray-500">
                      {user.isAdmin ? 'SECURE_CONSOLE_ACTIVE' : 'LOCAL_STORAGE_PERSISTED'}
                    </span>
                  </div>
                </div>

                {/* Notices / Badges */}
                {error && (
                  <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Dynamic change password form */}
                <form onSubmit={handlePasswordChange} className="space-y-4 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <KeyRound className={`w-4 h-4 ${user.isAdmin ? 'text-amber-500' : 'text-[#ff5c00]'}`} />
                    <h4 className="font-sora font-extrabold text-sm tracking-tight">
                      Update Security Credentials
                    </h4>
                  </div>

                  <div>
                    <label className={`block font-sora font-bold text-[9px] uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Current Password / Key
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Enter current password/key"
                        className={`w-full pl-11 pr-4 bg-white/5 border rounded-xl py-2.5 text-xs focus:outline-none focus:ring-1 ${
                          user.isAdmin ? 'focus:ring-amber-500' : 'focus:ring-[#ff5c00]'
                        } transition-colors ${
                          isDark ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-sora font-bold text-[9px] uppercase tracking-wider mb-1.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        New Password / Key
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3 w-4 h-4 text-gray-500" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 4 chars"
                          className={`w-full pl-11 pr-4 bg-white/5 border rounded-xl py-2.5 text-xs focus:outline-none focus:ring-1 ${
                            user.isAdmin ? 'focus:ring-amber-500' : 'focus:ring-[#ff5c00]'
                          } transition-colors ${
                            isDark ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block font-sora font-bold text-[9px] uppercase tracking-wider mb-1.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3 w-4 h-4 text-gray-500" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className={`w-full pl-11 pr-4 bg-white/5 border rounded-xl py-2.5 text-xs focus:outline-none focus:ring-1 ${
                            user.isAdmin ? 'focus:ring-amber-500' : 'focus:ring-[#ff5c00]'
                          } transition-colors ${
                            isDark ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl ${
                        isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className={`px-5 py-2 rounded-xl font-sora font-extrabold text-xs transition-transform active:scale-95 ${
                        user.isAdmin
                          ? 'bg-[#fabd00] hover:bg-[#e0a900] text-black'
                          : 'bg-[#ff5c00] hover:bg-[#ff2e00] text-white'
                      }`}
                    >
                      Save New Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className={`w-4 h-4 ${user.isAdmin ? 'text-[#fabd00]' : 'text-[#ff5c00]'}`} />
                  <h4 className="font-sora font-extrabold text-sm tracking-tight text-inherit">
                    Authorized Order Logs
                  </h4>
                </div>

                {orders.length === 0 ? (
                  <div className={`text-center py-10 px-4 rounded-3xl border border-dashed flex flex-col items-center justify-center ${
                    isDark ? 'border-white/10 bg-black/10' : 'border-orange-100 bg-orange-50/10'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#ff5c00] flex items-center justify-center mb-3">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="font-sora font-extrabold text-xs">No orders logged yet</p>
                    <p className="text-xxs text-gray-400 mt-1.5 max-w-xs leading-relaxed text-center">
                      Your authorized email address hasn't stoked our fire-ovens yet. Stroll through the culinary options and place an order!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {orders.map((order) => {
                      const isExpanded = !!expandedOrders[order.id];
                      
                      // Status color calculations
                      const getStatusColor = (status: OrderStatus) => {
                        switch (status) {
                          case 'Pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                          case 'Stoking Flames': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
                          case 'Out for Delivery': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
                          case 'Delivered': return 'text-green-500 bg-green-500/10 border-green-500/20';
                          case 'Cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
                          default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
                        }
                      };

                      return (
                        <div
                          key={order.id}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isDark 
                              ? 'bg-black/25 border-white/5 hover:border-white/10' 
                              : 'bg-orange-50/30 border-orange-100 hover:border-orange-200'
                          }`}
                        >
                          {/* Order Summary Row */}
                          <div 
                            onClick={() => toggleOrderExpand(order.id)}
                            className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`font-mono text-xs font-black ${
                                  isDark ? 'text-white' : 'text-[#261d19]'
                                }`}>
                                  #{order.id}
                                </span>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span>{order.date} {order.time ? `• ${order.time}` : ''}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-extrabold">Total</p>
                                <p className="text-xs font-black font-mono text-[#ff5c00]">₹{order.totalAmount}</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Order Expanded details */}
                          {isExpanded && (
                            <div className={`p-4 border-t text-xs space-y-3 ${
                              isDark ? 'border-white/5 bg-black/15' : 'border-orange-100/30 bg-orange-50/15'
                            }`}>
                              {/* Order Content / Items list */}
                              <div className="space-y-1.5">
                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Items Ordered ({order.items.reduce((acc, it) => acc + it.quantity, 0)})</p>
                                <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xxs">
                                      <span className="font-medium text-inherit flex items-center gap-1 py-0.5">
                                        <span className="font-mono text-gray-500">[{item.quantity}x]</span> {item.name}
                                      </span>
                                      <span className="font-mono text-gray-400">₹{item.price * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Destination details & Payment details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-dashed border-gray-400/10">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-500" /> Delivery Address
                                  </p>
                                  <p className="text-xxs text-gray-400 leading-normal line-clamp-2">
                                    {order.address}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3 text-gray-500" /> Payment & Method
                                  </p>
                                  <p className="text-xxs text-gray-400">
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery 💵' : 'ONLINE UPI / CARD Paid 💳'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
