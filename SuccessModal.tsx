import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, ShoppingBag, Plus, Sparkles, CheckCircle2, 
  Truck, Flame, Check, RefreshCw, LogOut, PackageOpen, Award, Image,
  Trash2, FileSpreadsheet, Database, Cloud, Loader2, Link2, ExternalLink, AlertCircle, Clock
} from 'lucide-react';
import { MenuItem, Order, OrderStatus } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
  menuItems: MenuItem[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onDeleteMenuItem: (id: string) => void;
  theme: 'dark' | 'light';
  
  // Google Sheets state and handlers
  googleUser: any;
  googleToken: string | null;
  spreadsheetConfig: { spreadsheetId: string; spreadsheetUrl: string } | null;
  onConnectGoogleSheets: () => void;
  onDisconnectGoogleSheets: () => void;
  onCreateNewSheet: () => void;
  onSyncAllOrders: () => void;
  isSheetsLoading: boolean;
  sheetsSyncStatus: 'idle' | 'syncing' | 'synced' | 'failed';
}

export default function AdminPanel({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  menuItems,
  onAddMenuItem,
  onDeleteMenuItem,
  theme,
  googleUser,
  googleToken,
  spreadsheetConfig,
  onConnectGoogleSheets,
  onDisconnectGoogleSheets,
  onCreateNewSheet,
  onSyncAllOrders,
  isSheetsLoading,
  sheetsSyncStatus,
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'inventory' | 'stats' | 'sheets'>('orders');

  // Input fields for adding menu item
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(150);
  const [newItemCategory, setNewItemCategory] = useState<'Burgers' | 'Pizzas' | 'Mojitos' | 'Combos' | 'Pasta' | 'Fries'>('Burgers');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemBest, setNewItemBest] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Calculators
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);
  
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const cookingOrders = orders.filter(o => o.status === 'Stoking Flames').length;
  const outOrders = orders.filter(o => o.status === 'Out for Delivery').length;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemDesc.trim()) return;

    // Use default premium food image if none is provided
    const imageToUse = newItemUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';

    onAddMenuItem({
      name: newItemName,
      description: newItemDesc,
      price: Number(newItemPrice),
      category: newItemCategory,
      imageUrl: imageToUse,
      bestSeller: newItemBest,
      isVeg: true
    });

    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice(150);
    setNewItemUrl('');
    setNewItemBest(false);
    setSuccessMsg('Successfully added gourmet dish to the Nakul\'s Restraunt list! 🔥');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Stoking Flames': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Out for Delivery': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'Delivered': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
    }
  };

  return (
    <div className={`min-h-screen p-6 md:p-12 ${
      theme === 'dark' ? 'bg-[#0f0e0e] text-white' : 'bg-[#FAF9F5] text-[#261d19]'
    }`}>
      {/* Header Panel */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500 text-white animate-pulse">
              Cave Commander Mode
            </span>
          </div>
          <h1 className="font-sora font-extrabold text-3xl tracking-tight">
            Administrative Control Deck
          </h1>
          <p className={`font-plus text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure live menus, manage hot orders, and analyze performance.
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-3 rounded-xl font-sora font-semibold text-xs flex items-center gap-2 border bg-orange-500 text-white cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Exit Command Mode
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Navigation Links & Fast Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`p-4 rounded-3xl border ${
            theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
          }`}>
            <nav className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveSubTab('orders')}
                className={`w-full py-3 px-4 rounded-xl text-left font-sora font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between ${
                  activeSubTab === 'orders'
                    ? 'bg-[#ff5c00] text-white'
                    : `text-gray-400 hover:text-orange-500 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-orange-50'}`
                }`}
              >
                <span>Flame Orders</span>
                {orders.length > 0 && (
                  <span className="bg-white text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSubTab('inventory')}
                className={`w-full py-3 px-4 rounded-xl text-left font-sora font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between ${
                  activeSubTab === 'inventory'
                    ? 'bg-[#ff5c00] text-white'
                    : `text-gray-400 hover:text-orange-500 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-orange-50'}`
                }`}
              >
                <span>Hearth Inventory</span>
                <span className="text-[10px] opacity-75">{menuItems.length} items</span>
              </button>

              <button
                onClick={() => setActiveSubTab('stats')}
                className={`w-full py-3 px-4 rounded-xl text-left font-sora font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between ${
                  activeSubTab === 'stats'
                    ? 'bg-[#ff5c00] text-white'
                    : `text-gray-400 hover:text-orange-500 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-orange-50'}`
                }`}
              >
                <span>Cave Metrics</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveSubTab('sheets')}
                className={`w-full py-3 px-4 rounded-xl text-left font-sora font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between ${
                  activeSubTab === 'sheets'
                    ? 'bg-[#ff5c00] text-white'
                    : `text-gray-400 hover:text-orange-500 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-orange-50'}`
                }`}
              >
                <span>Google Sheets</span>
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </nav>
          </div>

          {/* Quick numbers widget */}
          <div className={`p-5 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
          }`}>
            <h4 className="font-sora font-extrabold text-xs uppercase tracking-widest text-[#ff5c00]">
              Hot States
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-75 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Pending Queue
                </span>
                <span className="font-bold font-geist px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                  {pendingOrders}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-75 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cooking Chamber
                </span>
                <span className="font-bold font-geist px-2 py-0.5 rounded bg-orange-500/10 text-orange-500">
                  {cookingOrders}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-75 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Scout Delivery
                </span>
                <span className="font-bold font-geist px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
                  {outOrders}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="lg:col-span-3">
          {activeSubTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-sora font-extrabold text-xl">Incoming Order Queue</h3>
                <span className="text-xs opacity-75">Click status buttons to fast-update</span>
              </div>

              {orders.length === 0 ? (
                <div className={`p-12 rounded-[2rem] text-center border ${
                  theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                }`}>
                  <PackageOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="font-sora font-bold text-base mb-1">No orders submitted yet</p>
                  <p className="font-plus text-xs text-gray-400">
                    Use another browser tab to submit checkout forms and watch them populate instantly!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-6 rounded-[2rem] border transition-transform hover:scale-[1.01] ${
                        theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-sora font-black text-base text-[#ff5c00]">
                              {order.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className={`text-[10px] font-mono flex items-center gap-1.5 px-2 py-0.5 rounded ${
                              theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-orange-50/50 text-gray-600'
                            }`}>
                              <Clock className="w-3 h-3 text-[#ff5c00]" /> {order.date} &middot; {order.time || '11:00 AM'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold flex flex-wrap items-center gap-1.5">
                            <span>{order.customerName}</span>
                            <span className="text-gray-400 font-normal">&middot; {order.customerPhone}</span>
                            {order.customerEmail && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                theme === 'dark' ? 'bg-[#ff5c00]/10 border border-[#ff5c00]/20 text-[#ff5c00]' : 'bg-orange-50 border border-orange-100 text-orange-700'
                              }`}>
                                {order.customerEmail}
                              </span>
                            )}
                          </p>
                          <p className="text-xxs text-gray-400 mt-1">
                            Address: {order.address}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xxs uppercase tracking-wider text-gray-400">Total Invoice</p>
                          <p className="font-sora font-extrabold text-xl text-[#fabd00]">
                            ₹{order.totalAmount}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-gray-400">
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Paid'}
                          </span>
                        </div>
                      </div>

                      {/* Items Ordered List */}
                      <div className="py-4 font-plus text-xs space-y-2">
                        <p className="font-bold text-[10px] uppercase tracking-wider text-[#ff5c00]">Items Bundle:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between p-2 bg-black/10 rounded-lg">
                              <span>{i.name} <b>x{i.quantity}</b></span>
                              <span className="font-semibold text-gray-400">₹{i.price * i.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dispatch Controls */}
                      <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2 justify-end items-center">
                        <span className="text-xs text-gray-400 mr-2 font-semibold">Shift status:</span>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Pending')}
                          className="px-3 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors"
                        >
                          Queue
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Stoking Flames')}
                          className="px-3 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                        >
                          Flame-Cook
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Out for Delivery')}
                          className="px-3 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
                        >
                          Dispatch
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Delivered')}
                          className="px-3 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-sora font-extrabold text-xl">Command Inventory</h3>
                <span className="text-[#ff5c00] font-bold text-xs">{menuItems.length} active plates</span>
              </div>

              {successMsg && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold rounded-2xl text-center">
                  {successMsg}
                </div>
              )}

              {/* Add menu item form */}
              <div className={`p-6 rounded-[2rem] border ${
                theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
              }`}>
                <h4 className="font-sora font-extrabold text-base mb-4 flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-[#ff5c00]" /> Add New Gourmet Dish
                </h4>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs uppercase tracking-wider font-bold text-gray-400 mb-1.5">Dish Title</label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. Volcano Bacon Burger"
                        required
                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none ${
                          theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xxs uppercase tracking-wider font-bold text-gray-400 mb-1.5">Category</label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value as any)}
                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none ${
                          theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                        }`}
                      >
                        <option className="bg-[#151414]" value="Burgers">Burgers</option>
                        <option className="bg-[#151414]" value="Pizzas">Pizzas</option>
                        <option className="bg-[#151414]" value="Mojitos">Mojitos</option>
                        <option className="bg-[#151414]" value="Combos">Combos</option>
                        <option className="bg-[#151414]" value="Pasta">Pasta</option>
                        <option className="bg-[#151414]" value="Fries">Fries</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs uppercase tracking-wider font-bold text-gray-400 mb-1.5">Price (₹)</label>
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(Number(e.target.value))}
                        min={10}
                        required
                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none ${
                          theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xxs uppercase tracking-wider font-bold text-gray-400 mb-1.5">Gourmet Image URL (Optional)</label>
                      <div className="relative">
                        <Image className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-400" />
                        <input
                          type="url"
                          value={newItemUrl}
                          onChange={(e) => setNewItemUrl(e.target.value)}
                          placeholder="e.g. Unsplash URL or leave empty"
                          className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none ${
                            theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs uppercase tracking-wider font-bold text-gray-400 mb-1.5">Dish Description</label>
                    <textarea
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      placeholder="e.g. Crispy patties with cheddar cheese doused in hickory fire sauce."
                      rows={2}
                      required
                      className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none resize-none ${
                        theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <input
                      id="item-best"
                      type="checkbox"
                      checked={newItemBest}
                      onChange={(e) => setNewItemBest(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-[#ff5c00] focus:ring-0 w-4 h-4"
                    />
                    <label htmlFor="item-best" className="text-xs font-semibold cursor-pointer">
                      Label as Best Seller (Show banner on tile card)
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#ff5c00] hover:bg-[#ff2e00] text-white rounded-xl font-sora font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-transform active:scale-98"
                    >
                      <Sparkles className="w-4 h-4" /> Spark Cook & Add to Menu
                    </button>
                  </div>
                </form>
              </div>

              {/* View/List current active items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-sora text-xs font-bold truncate">{item.name}</p>
                          {item.bestSeller && (
                            <span className="bg-orange-500 text-white text-[8px] font-black uppercase px-1 rounded shrink-0">Best</span>
                          )}
                        </div>
                        <p className="text-xxs text-gray-400 line-clamp-1">{item.description}</p>
                        <p className="font-geist text-xxs font-bold text-[#ff5c00] mt-0.5">
                          {item.category} &middot; ₹{item.price}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteMenuItem(item.id)}
                      title={`Remove "${item.name}" from live menu`}
                      aria-label={`Remove ${item.name}`}
                      className="p-2 mr-1 rounded-xl transition-all hover:bg-red-500/10 text-gray-400 hover:text-red-500 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="font-sora font-extrabold text-xl font-bold">Cave Sales Analysis</h3>

              {/* Metrics Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-[2rem] border ${
                  theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                }`}>
                  <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-xxs uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    Total Revenue
                  </p>
                  <p className="font-sora font-extrabold text-2xl text-[#ff5c00] font-black">
                    ₹{totalSales}
                  </p>
                  <p className="text-xxs text-gray-400 mt-1">
                    Based on fully tracked active checkouts
                  </p>
                </div>

                <div className={`p-6 rounded-[2rem] border ${
                  theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                }`}>
                  <div className="w-10 h-10 bg-[#fabd00]/10 text-[#fabd00] rounded-xl flex items-center justify-center mb-4">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="text-xxs uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    Total Orders Placed
                  </p>
                  <p className="font-sora font-extrabold text-2xl text-[#fabd00] font-black">
                    {orders.length}
                  </p>
                  <p className="text-xxs text-gray-400 mt-1">
                    Average basket size: ~₹{(totalSales / Math.max(orders.length, 1)).toFixed(0)}
                  </p>
                </div>

                <div className={`p-6 rounded-[2rem] border ${
                  theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                }`}>
                  <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
                    <Award className="w-5 h-5 animate-bounce" />
                  </div>
                  <p className="text-xxs uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    Delivery Success Rate
                  </p>
                  <p className="font-sora font-extrabold text-2xl text-green-500 font-black">
                    {orders.length > 0 
                      ? `${(orders.filter(o => o.status === 'Delivered').length / orders.length * 100).toFixed(0)}%` 
                      : '100%'}
                  </p>
                  <p className="text-xxs text-gray-400 mt-1">
                    Scout average run time: 24 mins
                  </p>
                </div>
              </div>

              {/* Graphic/Representational Bento bar chart */}
              <div className={`p-6 rounded-[2rem] border ${
                theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
              }`}>
                <h4 className="font-sora font-extrabold text-sm mb-4">Sales split by category</h4>

                <div className="space-y-4">
                  {['Burgers', 'Pizzas', 'Mojitos', 'Combos', 'Pasta'].map((cat) => {
                    const count = menuItems.filter(i => i.category === cat).length;
                    const pct = (count / menuItems.length) * 100;
                    return (
                      <div key={cat} className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="opacity-75">{cat}</span>
                          <span>{count} models</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#ff5c00] h-full rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'sheets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-sora font-extrabold text-xl">Google Sheets Sync Deck</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  googleUser 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {googleUser ? 'Sheets Connected' : 'Authorization Required'}
                </span>
              </div>

              {!googleUser ? (
                <div className={`p-8 rounded-[2.5rem] border text-center max-w-xl mx-auto space-y-6 ${
                  theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                }`}>
                  <div className="w-16 h-16 bg-[#ff5c00]/15 text-[#ff5c00] rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-sora font-extrabold text-lg">Integrate Google Sheets</h4>
                    <p className={`text-xs leading-relaxed max-w-md mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Access premium restaurant tracking! Connect your Google Account using secure authentication to automatically log every incoming Nakul's Restraunt order directly into your personal Google Sheets in real-time.
                    </p>
                  </div>

                  <div className="pt-2">
                    {/* Google GSI-Material Button */}
                    <button
                      type="button"
                      onClick={onConnectGoogleSheets}
                      className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 text-[#1f1f1f] rounded-xl font-sora font-bold text-xs uppercase tracking-wider transition-all scale-100 hover:scale-[1.02] active:scale-98 shadow-sm cursor-pointer mx-auto"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      Connect Google Sheets
                    </button>
                  </div>

                  <div className={`p-4 rounded-2xl text-[11px] leading-relaxed max-w-md mx-auto ${
                    theme === 'dark' ? 'bg-[#ff5c00]/5 text-orange-200' : 'bg-orange-50/50 text-orange-800'
                  }`}>
                    🔒 **Secure REST OAuth protocol**: Authorization tokens are cached locally in-memory, never stored on database systems or exposed.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Controls Card */}
                  <div className={`lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] border ${
                    theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                  }`}>
                    <h4 className="font-sora font-extrabold text-base mb-6 flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-emerald-400" /> Active Spreadsheet Connection
                    </h4>

                    {/* Google User Detail */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/5 mb-6 gap-3">
                      <div>
                        <p className="text-xxs uppercase tracking-widest text-[#ff5c00] font-black">Authorized Operator</p>
                        <p className="text-sm font-bold font-mono mt-0.5">{googleUser.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={onDisconnectGoogleSheets}
                        className="px-4 py-2 bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xxs font-black uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        Disconnect Account
                      </button>
                    </div>

                    {/* Spreadsheet Config */}
                    {!spreadsheetConfig ? (
                      <div className="text-center py-6 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                          <Database className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold">No Synced Spreadsheet Setup</p>
                          <p className={`text-xxs max-w-sm mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Instantly create a beautiful pre-styled sheet inside your Google Drive to log columns of customer checkouts.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onCreateNewSheet}
                          disabled={isSheetsLoading}
                          className="px-5 py-3 bg-[#ff5c00] hover:bg-[#ff2e00] text-white rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-all scale-100 hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                          {isSheetsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Create Nakul's Restraunt Sheet
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className={`p-4 rounded-2xl border ${
                          theme === 'dark' ? 'bg-black/45 border-white/5' : 'bg-orange-50/20 border-orange-100'
                        }`}>
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <p className="text-xxs uppercase tracking-widest text-emerald-400 font-bold">Active Tracking Sheet</p>
                              <h5 className="font-sora font-extrabold text-sm text-[#ff5c00]">Nakul's Restraunt - Order Tracker 🍕</h5>
                              <p className="text-[10px] font-mono text-gray-400 truncate max-w-sm">ID: {spreadsheetConfig.spreadsheetId}</p>
                            </div>
                            <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 fill-current" /> Live Sync Active
                            </span>
                          </div>

                          <div className="mt-4 pt-4 border-t border-dashed border-gray-400/15 flex gap-3">
                            <a
                              href={spreadsheetConfig.spreadsheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] active:scale-99"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Google Sheet
                            </a>
                            
                            <button
                              type="button"
                              onClick={onSyncAllOrders}
                              disabled={isSheetsLoading || orders.length === 0}
                              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-99 disabled:opacity-40 cursor-pointer ${
                                theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {isSheetsLoading && sheetsSyncStatus === 'syncing' ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#ff5c00]" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              Bulk Sync ({orders.length} orders)
                            </button>
                          </div>
                        </div>

                        {/* Synchronization notification panel */}
                        {sheetsSyncStatus !== 'idle' && (
                          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
                            sheetsSyncStatus === 'syncing' 
                              ? 'bg-blue-500/5 border-blue-500/10 text-blue-400'
                              : sheetsSyncStatus === 'synced'
                                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/5 border-red-500/10 text-red-400'
                          }`}>
                            {sheetsSyncStatus === 'syncing' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                            {sheetsSyncStatus === 'synced' && <Check className="w-4 h-4 stroke-[3]" />}
                            {sheetsSyncStatus === 'failed' && <AlertCircle className="w-4 h-4" />}
                            <span className="font-semibold">
                              {sheetsSyncStatus === 'syncing' && 'Synchronizing rows with Google Cloud...'}
                              {sheetsSyncStatus === 'synced' && 'Historical sheets successfully synchronized and updated! ✅'}
                              {sheetsSyncStatus === 'failed' && 'Sync failed. Your OAuth credentials might be stale. Connect Google Sheets again.'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Columns documentation */}
                  <div className={`p-6 rounded-[2.5rem] border space-y-6 ${
                    theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                  }`}>
                    <h5 className="font-sora font-extrabold text-xs uppercase tracking-widest text-[#ff5c00]">
                      Sheet Column Schema
                    </h5>

                    <p className={`text-xxs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Orders are formatted in user-friendly sheets with automated parsing. The following indices are tracked:
                    </p>

                    <div className="space-y-2 font-mono text-[10px]">
                      {[
                        { col: "A", name: "Order ID", desc: "CC-2026-XXXX format" },
                        { col: "B", name: "Date", desc: "ISO splitting string" },
                        { col: "C", name: "Customer Name", desc: "Logged name string" },
                        { col: "D", name: "Customer Email", desc: "Autofilled / manual email" },
                        { col: "E", name: "Phone Number", desc: "Manual/autofill E.164" },
                        { col: "F", name: "Delivery Address", desc: "Reverse nominated OSM address" },
                        { col: "G", name: "Items Summary", desc: "Comma split summary" },
                        { col: "H", name: "Grand Total", desc: "Formula price integer" },
                        { col: "I", name: "Payment Method", desc: "Method string logged" },
                        { col: "J", name: "Status", desc: "Live dynamic status tracker" },
                      ].map((item, index) => (
                        <div key={index} className="flex gap-2 items-start justify-between py-1.5 border-b border-dashed border-gray-400/10">
                          <span className="text-[#fabd00] font-black shrink-0 px-1 bg-yellow-500/10 rounded">Col {item.col}</span>
                          <span className="font-bold font-sans text-gray-300 truncate">{item.name}</span>
                          <span className="text-[9px] text-gray-500">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
