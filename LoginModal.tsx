import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, ShoppingCart, LogIn, LogOut, Phone, MapPin, 
  Mail, Star, ShieldCheck, Moon, Sun, ArrowRight, Flame, 
  Plus, Timer, Shield, Award, Send, AlertCircle, Sparkles, MessageSquare, User
} from 'lucide-react';

import { MenuItem, Category, CartItem, Order, Review, OrderStatus } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_REVIEWS } from './data';

import CartDrawer from './components/CartDrawer';
import LoginModal from './components/LoginModal';
import SuccessModal from './components/SuccessModal';
import ReviewModal from './components/ReviewModal';
import AdminPanel from './components/AdminPanel';
import UserProfileModal from './components/UserProfileModal';

import { initAuth, googleSignIn, logoutGoogle } from './utils/googleAuth';
import { createOrdersSpreadsheet, appendOrderToSheet, syncAllOrdersToSheet } from './utils/googleSheets';
import { sendOrderInvoiceEmail } from './utils/googleMail';

export default function App() {
  // Theme state: default to 'dark' matching the moody mockup
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Menu, Reviews and Orders database mock in localState
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('cc_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('cc_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('cc_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Basket State (Cart)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cc_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // User auth state
  const [user, setUser] = useState<{ name: string; email: string; isAdmin: boolean } | null>(() => {
    const saved = localStorage.getItem('cc_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Filter Categories
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  // Active Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Simulated Skeletal Menu Loading & Precise Geolocation Autofill State
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Google Sheets integration state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetConfig, setSpreadsheetConfig] = useState<{ spreadsheetId: string; spreadsheetUrl: string } | null>(() => {
    const saved = localStorage.getItem('cc_sheets_config');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');

  // Synchronize Google Auth persistent status on boot
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setGoogleUser(currentUser);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleConnectGoogleSheets = async () => {
    try {
      setIsSheetsLoading(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setSheetsSyncStatus('idle');
      }
    } catch (err) {
      console.error('Google Sheets sign-in failure:', err);
      setSheetsSyncStatus('failed');
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleDisconnectGoogleSheets = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      setSheetsSyncStatus('idle');
    } catch (err) {
      console.error('Disconnect failure:', err);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!googleToken) return;
    try {
      setIsSheetsLoading(true);
      setSheetsSyncStatus('syncing');
      const config = await createOrdersSpreadsheet(googleToken);
      setSpreadsheetConfig(config);
      localStorage.setItem('cc_sheets_config', JSON.stringify(config));
      setSheetsSyncStatus('synced');
    } catch (err) {
      console.error('Spreadsheet build failure:', err);
      setSheetsSyncStatus('failed');
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleSyncAllOrders = async () => {
    if (!googleToken || !spreadsheetConfig) return;
    try {
      setIsSheetsLoading(true);
      setSheetsSyncStatus('syncing');
      const success = await syncAllOrdersToSheet(googleToken, spreadsheetConfig.spreadsheetId, orders);
      if (success) {
        setSheetsSyncStatus('synced');
      } else {
        setSheetsSyncStatus('failed');
      }
    } catch (err) {
      console.error('Orders bulk sync failure:', err);
      setSheetsSyncStatus('failed');
    } finally {
      setIsSheetsLoading(false);
    }
  };

  // Trigger high fidelity initial page refresh skeleton loading simulator
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  // Helper to trigger skeletal delay when exploring cuisines
  const handleCategoryChange = (category: Category | 'All') => {
    setIsMenuLoading(true);
    setSelectedCategory(category);
    setTimeout(() => {
      setIsMenuLoading(false);
    }, 600);
  };

  // Precise browser geolocation and Nominatim address reverse-lookup
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setValidationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setValidationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Fetch reverse geocoded address directly from free OpenStreetMap Nominatim Engine
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': `CrustCaveApp-${latitude}-${longitude}`
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              setCheckoutAddress(data.display_name);
              setIsDetectingLocation(false);
              return;
            }
          }
        } catch (error) {
          console.error("OSM Nominatim reverse geocode error:", error);
        }

        // Reliable localized fallback layout matching the Yamuna Vihar brand location
        setCheckoutAddress(
          `Detected Location (Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}), Yamuna Vihar Sector, Delhi`
        );
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation fetch error:", error);
        let errorMsg = "Could not retrieve your location automatically. Please enter your address.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please allow location access or type your address manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Browser reported location info is unavailable. Please type your address.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location detection timed out. Please enter manually.";
        }
        setValidationError(errorMsg);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Completed Checkout Order variables
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{
    orderId: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    itemsSummary: string;
    time?: string;
  } | null>(null);

  // Dynamic Typed Tagline
  const taglines = [
    "The Best Burgers in Delhi, Yamuna Vihar!",
    "Loaded Pizzas Baked with Burning Fire!",
    "Chilled Mojitos Packed with Fresh Pressed Mint!",
    "Extreme Combo Deals Slashed to Premium Rates!",
  ];
  const [typedText, setTypedText] = useState("");
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Checkout Form fields
  const [checkoutName, setCheckoutName] = useState(user ? user.name : '');
  const [checkoutEmail, setCheckoutEmail] = useState(user ? user.email : '');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutPayment, setCheckoutPayment] = useState<'cod' | 'online'>('cod');
  const [formDropdownItem, setFormDropdownItem] = useState('Classic Veg Burger - ₹129');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-fill from active log-in accounts
  useEffect(() => {
    if (user) {
      if (!checkoutName) setCheckoutName(user.name);
      if (!checkoutEmail) setCheckoutEmail(user.email);
    } else if (googleUser) {
      if (!checkoutName && googleUser.displayName) setCheckoutName(googleUser.displayName);
      if (!checkoutEmail && googleUser.email) setCheckoutEmail(googleUser.email);
    }
  }, [user, googleUser]);

  // Sync state with LocalStorage for flawless durable persistence
  useEffect(() => {
    localStorage.setItem('cc_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('cc_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('cc_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('cc_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('cc_user', JSON.stringify(user));
    if (user) {
      setCheckoutName(user.name);
    }
  }, [user]);

  // Handle Typed Text logic for Hero section
  useEffect(() => {
    const handleType = () => {
      const currentFullText = taglines[taglineIdx];
      if (!isDeleting) {
        setTypedText(currentFullText.slice(0, charIdx + 1));
        setCharIdx(prev => prev + 1);
        if (charIdx + 1 === currentFullText.length) {
          // Pause at end of tagline
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setTypedText(currentFullText.slice(0, charIdx - 1));
        setCharIdx(prev => prev - 1);
        if (charIdx - 1 === 0) {
          setIsDeleting(false);
          setTaglineIdx(prev => (prev + 1) % taglines.length);
        }
      }
    };

    const typeSpeed = isDeleting ? 30 : 65;
    const timer = setTimeout(handleType, typeSpeed);
    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, taglineIdx]);

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.menuItem.id === itemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : i;
        }
        return i;
      });
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  const triggerCheckoutScroll = () => {
    const section = document.getElementById('order-form');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add custom review
  const handleAddReview = (newReviewDetail: { author: string; text: string; rating: number }) => {
    const colors = ['bg-orange-500', 'bg-yellow-500', 'bg-rose-500', 'bg-emerald-500', 'bg-indigo-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const fullReview: Review = {
      id: `review-${Date.now()}`,
      author: newReviewDetail.author,
      text: newReviewDetail.text,
      rating: newReviewDetail.rating,
      avatarColor: randomColor,
      date: new Date().toISOString().split('T')[0]
    };
    setReviews(prev => [fullReview, ...prev]);
  };

  // Login Success handler
  const handleLoginSuccess = (authenticatedUser: { name: string; email: string; isAdmin: boolean }) => {
    setUser(authenticatedUser);
    if (authenticatedUser.isAdmin) {
      setIsAdminPanelOpen(true);
    }
  };

  const handleLogOut = () => {
    setUser(null);
    setIsAdminPanelOpen(false);
  };

  // Update order status
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  // Add Item to Menu
  const handleAddMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    const createdItem: MenuItem = {
      ...newItem,
      id: `dish-${Date.now()}`
    };
    setMenuItems(prev => [createdItem, ...prev]);
  };

  // Remove Item from Menu
  const handleDeleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    // Also remove from cart items if it existed there
    setCartItems(prev => prev.filter(item => item.menuItem.id !== itemId));
  };

  // Submit order form
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate fields manually for better UX Control
    if (!checkoutName.trim()) {
      setValidationError("Full Name is required. Please enter your name.");
      return;
    }
    if (!checkoutEmail.trim()) {
      setValidationError("E-mail address is required for sending the bill invoice receipt.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail.trim())) {
      setValidationError("Please enter a valid e-mail address.");
      return;
    }
    if (!checkoutPhone.trim()) {
      setValidationError("Phone Number is required. Please enter your phone number.");
      return;
    }
    if (!checkoutAddress.trim()) {
      setValidationError("Delivery Address is required. Please enter your delivery address.");
      return;
    }

    const isBasketSelected = cartItems.length > 0;
    if (!isBasketSelected && (!formDropdownItem || !formDropdownItem.trim())) {
      setValidationError("Order Details are required. Please select an item to dispatch or add items to your basket.");
      return;
    }

    setIsFormSubmitting(true);

    // Generate Order ID (e.g. CC-2026-0001)
    const nextIndex = orders.length + 1;
    const pad = (num: number, size: number) => {
      let s = "0000" + num;
      return s.substring(s.length - size);
    };
    const generatedId = `CC-2026-${pad(nextIndex, 4)}`;

    let checkoutItems: { menuItemId: string; name: string; quantity: number; price: number }[] = [];
    let grandTotal = 0;
    let itemsSummaryStr = '';

    if (isBasketSelected) {
      // Use items from interactive cart drawer
      checkoutItems = cartItems.map(item => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price
      }));
      const sub = cartItems.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
      const delivery = sub > 500 ? 0 : 35;
      grandTotal = sub + delivery;
      itemsSummaryStr = cartItems.map(i => `${i.menuItem.name} (x${i.quantity})`).join(', ');
    } else {
      // Use fallback item from form select dropdown
      const matched = menuItems.find(item => formDropdownItem.includes(item.name)) || menuItems[0];
      checkoutItems = [{
        menuItemId: matched.id,
        name: matched.name,
        quantity: 1,
        price: matched.price
      }];
      grandTotal = matched.price + 35; // stardard shipping charge
      itemsSummaryStr = `${matched.name} (x1)`;
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const nextOrder: Order = {
      id: generatedId,
      customerName: checkoutName,
      customerPhone: checkoutPhone,
      customerEmail: checkoutEmail,
      address: checkoutAddress,
      items: checkoutItems,
      totalAmount: grandTotal,
      paymentMethod: checkoutPayment,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      time: currentTime
    };

    // Simulate cooking delay
    setTimeout(() => {
      setOrders(prev => {
        const updated = [nextOrder, ...prev];
        localStorage.setItem('cc_orders', JSON.stringify(updated));
        return updated;
      });
      setLastCompletedOrder({
        orderId: generatedId,
        customerName: checkoutName,
        customerPhone: checkoutPhone,
        totalAmount: grandTotal,
        itemsSummary: itemsSummaryStr,
        time: currentTime
      });
      setIsFormSubmitting(false);
      setCartItems([]); // wipe cart after successful order log
      setIsSuccessOpen(true);

      // If connected to Google Sheets, write order row as background task
      if (googleToken && spreadsheetConfig) {
        appendOrderToSheet(googleToken, spreadsheetConfig.spreadsheetId, {
          id: generatedId,
          date: nextOrder.date,
          customerName: checkoutName,
          customerEmail: checkoutEmail,
          customerPhone: checkoutPhone,
          address: checkoutAddress,
          itemsSummary: itemsSummaryStr,
          totalAmount: grandTotal,
          paymentMethod: checkoutPayment,
          status: 'Pending'
        }).then(success => {
          if (success) {
            console.log(`Order ${generatedId} logged to Google Sheets in background.`);
          } else {
            console.warn(`Background log to sheets failed.`);
          }
        }).catch(err => {
          console.error(`Background sheets logging error:`, err);
        });
      }

      // If connected to Google Account, send invoice email in the background 
      if (googleToken) {
        sendOrderInvoiceEmail(googleToken, nextOrder)
          .then(success => {
            if (success) {
              console.log(`Invoice email sent successfully to ${checkoutEmail}`);
            } else {
              console.warn(`Gmail invoice flow returned failure.`);
            }
          })
          .catch(err => {
            console.error(`Gmail api dispatch error:`, err);
          });
      }

      // Auto-clear the form after successful order
      setCheckoutName('');
      setCheckoutEmail('');
      setCheckoutPhone('');
      setCheckoutAddress('');
      setFormDropdownItem('Classic Veg Burger - ₹129');
    }, 1500);
  };

  // Filter current menu catalogs
  const filteredCatalog = menuItems.filter(item => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Fries') return item.category === 'Fries';
    return item.category === selectedCategory;
  });

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={`min-h-screen transition-colors duration-300 font-plus overflow-x-hidden ${
        theme === 'dark' 
          ? 'bg-[#131313] text-[#e5e2e1]' 
          : 'bg-[#FCFBF7] text-[#261d19]'
      }`}>
        
        {isInitialLoading ? (
          <div className="min-h-screen flex flex-col justify-between">
            {/* STICKY HEADER NAVIGATION BAR SKELETON */}
            <header className={`border-b px-6 md:px-12 py-4 transition-all ${
              theme === 'dark'
                ? 'bg-[#131313]/90 border-white/10 shadow-2xl'
                : 'bg-white/95 border-orange-100/50 shadow-md'
            }`}>
              <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-[#ff5c00]/30" />
                  <div className={`h-6 w-32 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                </div>
                <div className="hidden md:flex items-center gap-8 animate-pulse">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className={`h-4.5 w-16 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-4 animate-pulse">
                  <div className={`w-9 h-9 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                  <div className="w-10 h-10 rounded-full bg-[#ff5c00]/30" />
                </div>
              </div>
            </header>

            {/* HERO LOADING SKELETON */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center animate-pulse">
              <div className="lg:col-span-7 space-y-6">
                <div className="w-36 h-6 rounded-full bg-[#ff5c00]/25" />
                <div className={`h-11 md:h-14 w-11/12 rounded-2xl ${theme === 'dark' ? 'bg-white/15' : 'bg-gray-300'}`} />
                <div className={`h-11 md:h-14 w-3/4 rounded-2xl ${theme === 'dark' ? 'bg-white/15' : 'bg-gray-300'}`} />
                <div className="h-4.5 w-2/3 rounded-lg bg-[#ff5c00]/20" />
                <div className="space-y-2.5 pt-4">
                  <div className={`h-3 w-full rounded-md ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`} />
                  <div className={`h-3 w-5/6 rounded-md ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`} />
                  <div className={`h-3 w-4/5 rounded-md ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`} />
                </div>
                <div className="flex gap-4 pt-6">
                  <div className="h-12 w-36 bg-[#ff5c00]/35 rounded-2xl" />
                  <div className={`h-12 w-28 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                </div>
              </div>
              <div className="lg:col-span-5 flex justify-center">
                <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-dashed flex items-center justify-center ${
                  theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-orange-100 bg-orange-50/20'
                }`}>
                  <div className="w-56 h-56 md:w-72 md:h-72 bg-gradient-to-tr from-[#ff5c00]/15 to-amber-500/10 rounded-full animate-bounce" />
                </div>
              </div>
            </main>

            {/* DEALS BANNER SKELETON */}
            <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pb-12 animate-pulse">
              <div className={`rounded-3xl p-6 md:p-8 border ${
                theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
              }`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 flex-1 w-full">
                    <div className="w-24 h-4 rounded-full bg-amber-500/20" />
                    <div className={`h-6 w-3/4 rounded-xl ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                    <div className={`h-3 w-5/6 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200/50'}`} />
                  </div>
                  <div className="w-32 h-11 bg-[#ff5c00]/25 rounded-2xl shrink-0" />
                </div>
              </div>
            </div>
          </div>
        ) : isAdminPanelOpen && user?.isAdmin ? (
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            menuItems={menuItems}
            onAddMenuItem={handleAddMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            theme={theme}
            googleUser={googleUser}
            googleToken={googleToken}
            spreadsheetConfig={spreadsheetConfig}
            onConnectGoogleSheets={handleConnectGoogleSheets}
            onDisconnectGoogleSheets={handleDisconnectGoogleSheets}
            onCreateNewSheet={handleCreateNewSheet}
            onSyncAllOrders={handleSyncAllOrders}
            isSheetsLoading={isSheetsLoading}
            sheetsSyncStatus={sheetsSyncStatus}
          />
        ) : (
          <>
            {/* STICKY HEADER NAVIGATION BAR */}
            <nav className={`fixed top-0 w-full z-40 border-b transition-all ${
              theme === 'dark'
                ? 'bg-[#131313]/70 backdrop-blur-xl border-white/10 shadow-2xl'
                : 'bg-white/80 backdrop-blur-xl border-orange-100/50 shadow-md'
            }`}>
              <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto">
                
                {/* Logo with burning glowing design */}
                <a 
                  href="#" 
                  className="font-sora font-extrabold text-2xl tracking-tighter text-[#ff5c00] flex items-center gap-1.5"
                >
                  <Flame className="w-6 h-6 fill-current animate-pulse" />
                  <span>Nakul's Restraunt</span>
                </a>

                {/* Desktop Menu links */}
                <div className="hidden md:flex items-center space-x-8">
                  <a href="#home" className="text-xs font-bold uppercase tracking-wider text-[#ff5c00] hover:text-[#ff2e00] transition-colors">Home</a>
                  <a href="#menu" className={`text-xs font-bold uppercase tracking-wider transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Menu</a>
                  <a href="#combos" className={`text-xs font-bold uppercase tracking-wider transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Combos</a>
                  <a href="#about" className={`text-xs font-bold uppercase tracking-wider transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>About us</a>
                  <a href="#contact" className={`text-xs font-bold uppercase tracking-wider transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Visit Us</a>
                  
                  {user ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsProfileOpen(true)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 active:scale-95 duration-200 ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' 
                            : 'bg-orange-50 border-orange-100 text-[#ff5c00] hover:bg-orange-100/50'
                        }`}
                        title="View Profile & Change Password"
                      >
                        <User className="w-3.5 h-3.5 text-[#ff5c00]" />
                        <span>Hi, {user.name}</span>
                      </button>
                      {user.isAdmin && (
                        <button
                          onClick={() => setIsAdminPanelOpen(true)}
                          className="px-2.5 py-1 bg-amber-500 rounded-lg text-black text-xxs font-black uppercase tracking-widest flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3 fill-current" /> Command
                        </button>
                      )}
                      <button 
                        onClick={handleLogOut}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Logout From Cave"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsLoginOpen(true)}
                      className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    >
                      <LogIn className="w-4 h-4 text-[#ff5c00]" />
                      Login
                    </button>
                  )}
                </div>

                {/* Right side controls: theme toggler and basket basket toggler */}
                <div className="flex items-center gap-4">
                  
                  {/* Theme toggler */}
                  <button
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className={`p-2 rounded-full border transition-transform scale-100 hover:scale-110 active:scale-95 ${
                      theme === 'dark' ? 'border-white/10 text-yellow-400 bg-white/5' : 'border-orange-100 text-gray-700 bg-orange-50/50'
                    }`}
                  >
                    {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                  </button>

                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2.5 bg-[#ff5c00] hover:bg-[#ff2e00] text-white rounded-full transition-all scale-100 active:scale-90 flex items-center justify-center cursor-pointer shadow-lg shadow-orange-500/10"
                  >
                    <ShoppingCart className="w-4.5 h-4.5" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#131313] animate-bounce">
                        {cartItems.length}
                      </span>
                    )}
                  </button>

                  {/* Mobile navigation burger icon */}
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={`md:hidden p-2 rounded-full border ${theme === 'dark' ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-700'}`}
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Intuitive Mobile Menu dropdown with smooth spring animation */}
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`md:hidden border-t px-6 py-4 flex flex-col gap-4 ${
                      theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-50'
                    }`}
                  >
                    <a 
                      href="#home" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider text-[#ff5c00]"
                    >
                      Home
                    </a>
                    <a 
                      href="#menu" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Menu Catalog
                    </a>
                    <a 
                      href="#combos" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Extreme Combos
                    </a>
                    <a 
                      href="#about" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      About Us
                    </a>
                    <a 
                      href="#contact" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Visit the Cave
                    </a>
                    
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      {user ? (
                        <div className="flex items-center gap-3 w-full justify-between">
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setIsProfileOpen(true);
                            }}
                            className="text-xs font-bold flex items-center gap-1.5 text-left active:scale-95 py-1 px-2.5 rounded-lg bg-white/5 border border-white/10"
                            title="View Profile & Change Password"
                          >
                            <User className="w-3.5 h-3.5 text-[#ff5c00]" />
                            <span>Hi, {user.name}</span>
                          </button>
                          <div className="flex gap-2">
                            {user.isAdmin && (
                              <button
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setIsAdminPanelOpen(true);
                                }}
                                className="px-2.5 py-1 bg-amber-500 rounded-lg text-black text-xxs font-black"
                              >
                                Command
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleLogOut();
                              }}
                              className="text-red-400 hover:text-red-500"
                            >
                              <LogOut className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setIsLoginOpen(true);
                          }}
                          className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                        >
                          <LogIn className="w-4 h-4 text-[#ff5c00]" /> Login Access
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>

            {/* HERO HERO SECTION */}
            <header 
              id="home"
              className="relative min-h-screen flex items-center pt-24 overflow-hidden"
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeMosys8WqSuKuDBr03b_ORHYNOQ1sNs8aw0lmzuYM7GuCa0kIV58OV-N-VFcnP7IEVdh3hkfb9I6IAJ-7AlZjO3G0XTXWnuI4nQCncJDbuQG8jGO8mAPeCzbu-bJV0M7E9UZGOo99MweRu6zMT3JWukZ3SXmcLaWvdOJR9rh9ApEaw88A4HwNRmE8nsUxH55_ANKe37aMwZysB1Fb5JVPhF26YbZV6QW7nd8y1fjZKCbF2JECMXaZWiP9VqaditgxCb8Y-_1SybE"
                  className="w-full h-full object-cover mix-blend-multiply opacity-25 dark:opacity-30 p-2 scale-105 filter blur-xs"
                  alt="A high-end, close-up photograph of a gourmet cheeseburger and a vibrant mint mojito."
                />
                <div className={`absolute inset-0 bg-gradient-to-tr ${
                  theme === 'dark' 
                    ? 'from-[#131313] via-[#131313]/90 to-transparent' 
                    : 'from-[#FCFBF7] via-[#FCFBF7]/90 to-transparent'
                }`} />
              </div>

              <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full py-16">
                <div className="max-w-2xl">
                  
                  {/* Small tag */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-full mb-6 relative">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#ff5c00]">
                      Yamuna Vihar's Late-Night Temple of Cravings
                    </span>
                  </div>

                  <h1 className="font-sora font-extrabold text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#ff5c00] via-[#ff5c00] to-red-500 tracking-tighter leading-tight mb-4">
                    Welcome to <span className={theme === 'dark' ? 'text-white' : 'text-[#261d19]'}>Nakul's Restraunt</span>
                  </h1>

                  {/* Typed animated subtitle */}
                  <div className="h-20 mb-6 flex items-center">
                    <p className="font-sora text-2xl md:text-3xl font-extrabold text-[#fabd00] tracking-tight">
                      {typedText}
                      <span className="animate-pulse font-normal ml-0.5">|</span>
                    </p>
                  </div>

                  <p className={`font-plus text-base md:text-lg mb-8 leading-relaxed max-w-xl ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Gourmet burgers stacked tall, blazing flame-baked loaded pizzas, icy crushed fresh mojitos and unstoppable heavy extreme combos. Define your culinary intensity today.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={triggerCheckoutScroll}
                      className="px-8 py-4 bg-gradient-to-r from-[#ff5c00] to-red-600 text-white rounded-2xl font-sora font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25 hover:scale-[1.03] transition-transform active:scale-95"
                    >
                      <span>Order From Hearth</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a 
                      href="#menu"
                      className={`px-8 py-4 rounded-2xl font-plus font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                        theme === 'dark' 
                          ? 'border-white/10 hover:bg-white/5 hover:border-white/25 text-white bg-white/[0.02]' 
                          : 'border-orange-100 hover:bg-orange-50/20 text-[#ff5c00]'
                      }`}
                    >
                      View Live Menu
                    </a>
                  </div>
                </div>
              </div>
            </header>

            {/* INTERACTIVE CATEGORIES FILTER TRACK */}
            <section className={`py-12 border-y ${
              theme === 'dark' ? 'bg-[#0e0e0e] border-white/5' : 'bg-[#FAF9F5] border-orange-50'
            }`}>
              <div className="px-6 md:px-12 max-w-7xl mx-auto">
                <h2 className="font-sora font-extrabold text-2xl md:text-3xl mb-8 text-center tracking-tight">
                  Explore Our <span className="text-[#fabd00]">Cravings</span>
                </h2>

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* ALL CATEGORIES CHIP */}
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className={`p-4 rounded-3xl flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer border ${
                      selectedCategory === 'All'
                        ? 'bg-[#ff5c00] text-white border-[#ff5c00]'
                        : theme === 'dark' 
                          ? 'bg-white/[0.02] border-white/5 hover:bg-white/5' 
                          : 'bg-white border-orange-100 hover:bg-orange-50/50'
                    }`}
                  >
                    <span className="text-xl">🔥</span>
                    <span className="font-sora text-xs font-extrabold uppercase tracking-wider">All Plates</span>
                  </button>

                  {/* CATEGORIES DETAILED DUAL CODES */}
                  {[
                    { name: 'Burgers', emoji: '🍔', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBX0qY3Fyd6Btj-pvsh1_WUvPUiXkMzWJcLDTnytYFpS4RJO4nrTLszABYdDKe2jf61QuK-eh7r2Si7ubPR6DNB_-iy-6Esffd8zglgS1vDWYz10V_jvrAuevCMnRiKgQU6gaBfplfKmgg5xQwJdt0OcoA3FCoKXGcg24IRSJfS_BWd15oOT9UuF8XUTw2gbtkMw5VoWmwrjLH-91_J_AmFN5Aar18BBh0IFWA2bufarlShzcmJpx3KrdqovDfMGWT9dT8nvksE0OA' },
                    { name: 'Pizzas', emoji: '🍕', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXxf6vBVYvSFQIdfMDZJo2SvoKyXqN_I_O178DmrqvcIXMOznEUMKEvTIs3ksC6FyVqwNeUVWtRd2CFKpU1nhaTGuRvl0Kp5scMi3tfrQA-N00JEk0toCs__chhSeeNYj71Gh8LHMUo-8Bkgp-EUbNhM1HXfKNMG9SMhhigdxqrxhiL5YjtwcOjAh1o7to2mxC9COKYNRLfbqB-UyO6h7tT3Mn2uwVQ3cXP1KkR_KJlu5G_Q1yWV7lMCnnfegJh4K3qwaiOKV1oz0' },
                    { name: 'Mojitos', emoji: '🍸', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAQWbls5m5_fPEYldAus2Apo-cLleqP9wuxFj79WFzzan86w0bYbszc25ZBdT3uIhTBGV1DGFPJRyrL5EVwNhpgGV0xFr3Ltztvo7FLxl28l4Vq9xtbj7nG3uzuFSUpqcoWIIj51V3Ai0JNJJFz8xv9iVeUsbwkvSec8Ids9_U9fSk9uR3o2jwDKN0kPQGUbAF6KT7vXjYxeHgwnj0xdzgSV8kD2fHnT7x8-1r_RFWrs9Bgj0Brculb4fppL3BYGCblP1YPJA8LKo' },
                    { name: 'Combos', emoji: '🍱', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvFPcxNKPq0rYnh3PXHShl8b_Gqu1-A7RMuCOeKLhgjxAcD-HJjDGdKEjE9GKzJOEXfE8RuInluOVbWyeWxA2ZNMiyMlwBpGuivlJEh_iOGMydvXbPtk-tIc38XzWvbzDsE-sGbaZ5S3TghGY3dJ0TOvvMdLWokhvZXnbEKOTiTgGV06xU-3i9Lsx7c894V_aRgSOHHAu1ALi9z2XEOj4exDZTNi_dQbfaajvDUvfNsa3SKI87yV3UiCA1lqgxavCi7n4uHoKJI60' },
                    { name: 'Pasta', emoji: '🍝', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHl6XwceBstfqT_c3EwAdv_e9r-ZqVPpjO0zuC_LfgXg-Z3turXOv7O6JqdN9St8al_a6CSXkbg0-RiqPdvqLpGiM5xyMXIKDk75TC4LckrMrHvZu9qg6aV0qTSF4IPRUS1dyOcB6UMNAj1VxUEyzbw2_5y90kXCmyt_wCVF4W_1wcfhHNnqX3GwzPbZDSm8s4AtNu94bjlD84OOi0j53ZSOw7BitLbZGxgrKQKUfsxBvHkjs7gqLbUnnN7aFWsWgzHs2iBvSAZSs' },
                  ].map((categoryItem) => (
                    <button
                      key={categoryItem.name}
                      onClick={() => handleCategoryChange(categoryItem.name as any)}
                      className={`group p-3 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border ${
                        selectedCategory === categoryItem.name
                          ? 'bg-[#ff5c00] text-white border-[#ff5c00]'
                          : theme === 'dark' 
                            ? 'bg-white/[0.02] border-white/5 hover:bg-white/5' 
                            : 'bg-white border-orange-100 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden mb-1">
                        <img 
                          src={categoryItem.img} 
                          alt={categoryItem.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <span className="font-sora text-xs font-extrabold uppercase tracking-wider">{categoryItem.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* DYNAMIC MENU CATALOG / FAN FAVORITES */}
            <section id="menu" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                <div>
                  <h2 className="font-sora font-extrabold text-3xl md:text-4xl tracking-tight">
                    Fan Favorites
                  </h2>
                  <p className={`font-plus text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Our most ordered dishes cooked under premium flame settings in Yamuna Vihar.
                  </p>
                </div>
                
                {/* Active category details tracking */}
                <span className={`text-xxs uppercase tracking-wider font-bold px-3 py-1 rounded-full ${
                  theme === 'dark' ? 'bg-white/5 text-[#fabd00]' : 'bg-[#fabd00]/10 text-[#6a4e00]'
                }`}>
                  Filtered Status: {selectedCategory === 'All' ? 'Complete Selection' : selectedCategory}
                </span>
              </div>

              {/* Grid block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                  {isMenuLoading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={`skeleton-${idx}`}
                        className={`rounded-[2.2rem] overflow-hidden border flex flex-col justify-between h-[420px] ${
                          theme === 'dark' 
                            ? 'bg-[#151414] border-white/5 animate-pulse' 
                            : 'bg-white border-orange-100 animate-pulse'
                        }`}
                      >
                        {/* Top Image Placeholder */}
                        <div className={`h-56 relative overflow-hidden ${
                          theme === 'dark' ? 'bg-white/[0.04]' : 'bg-gray-100'
                        }`} />

                        {/* Text and fields placeholders */}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2.5">
                            {/* Veg/Non-veg line */}
                            <div className={`h-3 w-16 rounded ${
                              theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                            }`} />
                            
                            {/* Title line */}
                            <div className={`h-4.5 w-3/4 rounded ${
                              theme === 'dark' ? 'bg-white/15' : 'bg-gray-300'
                            }`} />

                            {/* Description lines */}
                            <div className="space-y-2 pt-1">
                              <div className={`h-3 w-full rounded ${
                                theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                              }`} />
                              <div className={`h-3 w-5/6 rounded ${
                                theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                              }`} />
                            </div>
                          </div>

                          {/* Footer Price + Button placeholders */}
                          <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <div className={`h-5.5 w-12 rounded ${
                              theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                            }`} />
                            
                            <div className={`h-9 w-24 rounded-xl ${
                              theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                            }`} />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    filteredCatalog.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      key={item.id}
                      className={`group rounded-[2.2rem] overflow-hidden border flex flex-col justify-between transition-shadow hover:shadow-2xl ${
                        theme === 'dark' 
                          ? 'bg-[#151414] border-white/5 shadow-black/40 hover:shadow-[#ff5c00]/5 hover:border-white/10' 
                          : 'bg-white border-orange-100 hover:shadow-orange-100/50 hover:border-orange-200'
                      }`}
                    >
                      {/* Image Block with BestSeller badge */}
                      <div className="h-56 relative overflow-hidden bg-black/10">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                        />
                        {item.bestSeller && (
                          <span className="absolute top-4 right-4 bg-[#ff5c00] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                            Best Seller
                          </span>
                        )}
                        <span className={`absolute bottom-4 left-4 text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.isVeg ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.isVeg ? '💚 Veg' : '🍗 Non-Veg'}
                        </span>
                      </div>

                      {/* Content panel */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="font-sora font-extrabold text-base mb-1 tracking-tight truncate">
                            {item.name}
                          </h3>
                          <p className={`font-plus text-xs line-clamp-2 leading-relaxed ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {item.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="font-sora font-bold text-xl text-[#fabd00]">
                            ₹{item.price}
                          </span>
                          <button 
                            onClick={() => handleAddToCart(item)}
                            className="w-11 h-11 bg-white/5 group-hover:bg-[#ff5c00] text-gray-400 group-hover:text-white rounded-xl transition-all flex items-center justify-center scale-100 active:scale-90 border border-white/10 group-hover:border-transparent cursor-pointer shadow-lg hover:shadow-orange-500/20"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )))}
                </AnimatePresence>
              </div>
            </section>

            {/* EXTREME COMBOS INTEGRATION */}
            <section id="combos" className={`py-20 border-y ${
              theme === 'dark' ? 'bg-[#0f0e0e] border-white/5' : 'bg-[#FAF9F5] border-orange-50'
            }`}>
              <div className="px-6 md:px-12 max-w-7xl mx-auto">
                <h2 className="font-sora font-extrabold text-3xl md:text-4xl mb-12 tracking-tight text-center">
                  Extreme <span className="text-[#ff5c00]">Combos</span>
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* COMBO Card 1 */}
                  <div className="relative rounded-[2.5rem] overflow-hidden group h-[400px] border border-white/5 shadow-2xl">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDi69tx6ZDtv0KLtEXFCjDe3V8eexTpfvkwQveGL32tR7mGRhadIv-c7Ijh-3KcMbX6S0H9YFxpefEugdCyLIrHmKlA_ladOSOtELqPbEoHd1LF7JUwvwbMiUuqoEH_jyTlLcnjWTGakg2hEQT2aO4OyPDWwgFdImS4xSr4h8mCtQZA0G5ViN22HsLz4uFdtTKaaVbQynRvJHVTBB9ZZIJWGD3SK6uN-CC3MiVM3luv5hM95KrRJNd4XxakNwgBD_TplZW2sihI5gk" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-[0.7]"
                      alt="Family Spread Combo"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 flex flex-col justify-end">
                      
                      <span className="bg-[#ff5c00] text-white w-fit px-3 py-1 rounded-full font-sora font-black text-2xs uppercase tracking-widest mb-3">
                        SAVE ₹200
                      </span>
                      
                      <h3 className="font-sora font-extrabold text-2xl md:text-3xl text-white mb-2 leading-tight">
                        Family Cave Combo
                      </h3>
                      
                      <p className="font-plus text-xs text-gray-300 mb-6 max-w-sm leading-relaxed">
                        2 Chicken Burgers + 1 Large Cheese Pizza + Extreme Fries + 4 Carbonated Mocktails. The ultimate Delhi block feast.
                      </p>

                      <div className="flex items-center gap-6">
                        <span className="font-sora font-bold text-2xl text-[#fabd00]">
                          ₹999
                        </span>
                        <button 
                          onClick={() => handleAddToCart(menuItems.find(i => i.id === '5') || menuItems[4])}
                          className="bg-[#ff5c00] hover:bg-[#ff2e00] text-white px-6 py-3 rounded-xl font-sora font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 hover:scale-103 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-orange-500/20"
                        >
                          <Plus className="w-4 h-4" /> Add Combo
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COMBO Card 2 */}
                  <div className="relative rounded-[2.5rem] overflow-hidden group h-[400px] border border-white/5 shadow-2xl">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFJHkp2BGpfGfcHJggGutGrm4ZrjGp5tK2sRL7SZkcfrTxFX_-VRbHtE-f38psQ-Qqx3YweXIr4VZGz_6_GObRbXqL1SdzGSthJotrANunTfjvdz_C223bR3z0beZLCImTy7UB4T-9p-YT_57s5LMnt1jncZKHv5gK5mhXktIr3Gve3Rv3ilj5M67v59cIRp3lHh2VivkNjoGYluCco1ojMz73wCRJEoedn73MNOrws5cfVHZGKiQVT4qjOJ09dIE-NqbTBJ2dfWk" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-[0.7]"
                      alt="Pizza and Mojito Combo Combo"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 flex flex-col justify-end">
                      
                      <span className="bg-[#fabd00] text-black w-fit px-3 py-1 rounded-full font-sora font-black text-2xs uppercase tracking-widest mb-3">
                        POPULAR - SAVE ₹80
                      </span>
                      
                      <h3 className="font-sora font-extrabold text-2xl md:text-3xl text-white mb-2 leading-tight">
                        Pizza + Mojito Combo
                      </h3>
                      
                      <p className="font-plus text-xs text-gray-300 mb-6 max-w-sm leading-relaxed">
                        Your choice of classic Margherita or Veggie garden pizza paired with a refreshingly chilled pressed mint classic mojito.
                      </p>

                      <div className="flex items-center gap-6">
                        <span className="font-sora font-bold text-2xl text-[#fabd00]">
                          ₹449
                        </span>
                        <button 
                          onClick={() => handleAddToCart(menuItems.find(i => i.id === '6') || menuItems[5])}
                          className="bg-[#ff5c00] hover:bg-[#ff2e00] text-white px-6 py-3 rounded-xl font-sora font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 hover:scale-103 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-orange-500/20"
                        >
                          <Plus className="w-4 h-4" /> Add Combo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* INTEGRATED CHECKOUT ORDER FORM */}
            <section id="order-form" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                
                {/* Left informational column */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="font-sora font-extrabold text-4xl leading-tight">
                      Ready to <span className="text-[#ff5c00]">Order?</span>
                    </h2>
                    <p className={`font-plus text-base leading-relaxed ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Get the fastest hot gourmet delivery service in Yamuna Vihar, Delhi. Order now, stoke the fires, and watch our command scouts depart with your package.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#ff5c00]/10 text-[#ff5c00] rounded-2xl flex items-center justify-center shrink-0">
                        <Timer className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-sora font-bold text-sm">30 Minute Delivery Guarantee</h4>
                        <p className={`font-plus text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Sealed hot & fresh in B-block, Yamuna Vihar & surrounding local blocks within Delhi.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#fabd00]/10 text-[#fabd00] rounded-2xl flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-sora font-bold text-sm">Tamper-Proof Seal Protection</h4>
                        <p className={`font-plus text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          All fast-food items wrapped in dual reflective lining and triple-sealed for customer safety.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Form card */}
                <div className={`p-8 md:p-10 rounded-[2.5rem] border relative overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#151414] border-white/5 shadow-2xl' 
                    : 'bg-white border-orange-100 shadow-xl'
                }`}>
                  
                  {isFormSubmitting && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 border-4 border-[#ff5c00] border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-sora font-bold text-sm text-white">Stoking the flames...</p>
                    </div>
                  )}

                  <h3 className="font-sora font-extrabold text-xl mb-6">Dispatch Details</h3>

                  {validationError && (
                    <div className="mb-4 p-3.5 bg-red-500/15 border border-red-500/20 text-red-500 dark:text-red-400 text-xs rounded-xl flex items-center gap-2.5 shadow-lg shadow-red-500/5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold font-plus">{validationError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          placeholder="Your Name"
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none focus:border-transparent ${
                            theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          placeholder="+91 8800640055"
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none focus:border-transparent ${
                            theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-2 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Email Address (to receive secure billing invoice)
                      </label>
                      <input
                        type="email"
                        value={checkoutEmail}
                        onChange={(e) => setCheckoutEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className={`w-full bg-[#1c1a1a]/40 bg-white/5 border rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none focus:border-transparent ${
                          theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Delivery Address
                        </label>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                            isDetectingLocation 
                              ? 'text-gray-500 cursor-not-allowed' 
                              : 'text-[#ff5c00] hover:text-[#ff2e00] active:scale-95 cursor-pointer'
                          }`}
                        >
                          <MapPin className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-pulse' : ''}`} />
                          {isDetectingLocation ? 'Detecting...' : 'Detect My Location'}
                        </button>
                      </div>
                      <textarea
                        value={checkoutAddress}
                        onChange={(e) => setCheckoutAddress(e.target.value)}
                        placeholder="Enter your full location in Yamuna Vihar..."
                        rows={3}
                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none focus:border-transparent resize-none ${
                          theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                        }`}
                      />
                    </div>

                    {/* Basket vs Dropdown item logic */}
                    <div>
                      <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-2 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Items to Dispatch
                      </label>
                      
                      {cartItems.length > 0 ? (
                        <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                          theme === 'dark' ? 'bg-black/15 border-white/5' : 'bg-orange-50/20 border-orange-100'
                        }`}>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[#ff5c00]">Using interactive basket items</span>
                            <span className="text-[10px] opacity-70">({cartItems.length} styles added)</span>
                          </div>
                          <div className="text-xxs opacity-75 max-h-16 overflow-y-auto space-y-1">
                            {cartItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="truncate max-w-[200px]">{item.menuItem.name} <b>x{item.quantity}</b></span>
                                <span>₹{item.menuItem.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <button 
                            type="button"
                            onClick={() => setIsCartOpen(true)}
                            className="text-left text-xxs font-bold text-[#ff5c00] hover:underline"
                          >
                            Modify items in basket Drawer
                          </button>
                        </div>
                      ) : (
                        <select
                          value={formDropdownItem}
                          onChange={(e) => setFormDropdownItem(e.target.value)}
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#ff5c00] focus:outline-none ${
                            theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                          }`}
                        >
                          <option className="bg-[#151414] text-white">Classic Veg Burger - ₹129</option>
                          <option className="bg-[#151414] text-white">Chicken Burger - ₹189</option>
                          <option className="bg-[#151414] text-white">Margherita Pizza - ₹249</option>
                          <option className="bg-[#151414] text-white">Cheese Loaded Fries - ₹179</option>
                          <option className="bg-[#151414] text-white">Family Cave Combo - ₹999</option>
                        </select>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-3 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Payment Method
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setCheckoutPayment('cod')}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            checkoutPayment === 'cod'
                              ? 'border-[#ff5c00] bg-[#ff5c00]/5 text-[#ff5c00]'
                              : theme === 'dark' ? 'border-white/10 bg-white/[0.01]' : 'border-orange-100 bg-white'
                          }`}
                        >
                          <span className="text-xl">💵</span>
                          <span className="font-sora text-[10px] font-bold">Cash on Delivery</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setCheckoutPayment('online')}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            checkoutPayment === 'online'
                              ? 'border-[#ff5c00] bg-[#ff5c00]/5 text-[#ff5c00]'
                              : theme === 'dark' ? 'border-white/10 bg-white/[0.01]' : 'border-orange-100 bg-white'
                          }`}
                        >
                          <span className="text-xl">📱</span>
                          <span className="font-sora text-[10px] font-bold">UPI / scan Online</span>
                        </button>
                      </div>
                    </div>

                    {/* Simulated online payout panel */}
                    <AnimatePresence>
                      {checkoutPayment === 'online' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`p-4 rounded-xl border text-center space-y-3 ${
                            theme === 'dark' ? 'bg-black/10 border-white/5' : 'bg-orange-50/20 border-orange-100'
                          }`}
                        >
                          <p className="text-xxs font-bold text-[#ff5c00] uppercase tracking-widest">
                            Scan to pay securely
                          </p>
                          <div className="bg-white p-3 rounded-lg inline-block shadow-md">
                            {/* Simple simulated QR box representation */}
                            <div className="w-24 h-24 bg-gray-100 border border-gray-300 flex flex-col items-center justify-center p-1.5 shrink-0">
                              <span className="text-2xl">⚡</span>
                              <span className="font-geist text-[8px] font-bold text-black mt-2">@crustcave</span>
                            </div>
                          </div>
                          <p className="text-xxs text-gray-400">
                            UPI ID: <b>crustcave@upi</b>
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-[#ff5c00] to-red-600 hover:from-[#ff2e00] hover:to-red-700 text-white rounded-2xl font-sora font-extrabold text-sm uppercase tracking-wider transition-transform active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                    >
                      <Send className="w-4 h-4" /> Place Order
                    </button>
                  </form>
                </div>
              </div>
            </section>

            {/* THREE COLUMN MOTTO ADVANTAGE */}
            <section className={`py-16 ${
              theme === 'dark' ? 'bg-[#0f0e0e]/80' : 'bg-white'
            }`}>
              <div className="px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-sora font-extrabold text-base">Premium Ingredients</h3>
                  <p className={`font-plus text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    We source organic chicken breasts, San Marzano tomato pastes, and organic basil to formulate unparalleled fast food.
                  </p>
                </div>

                <div className="text-center p-6 space-y-3 border-y md:border-y-0 md:border-x border-white/5">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                    <Timer className="w-6 h-6" />
                  </div>
                  <h3 className="font-sora font-extrabold text-base">Lightning Delivery</h3>
                  <p className={`font-plus text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    All delivery drivers is route-optimized within Yamuna Vihar blocks to drop off fast food under 30 minutes flat.
                  </p>
                </div>

                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h3 className="font-sora font-extrabold text-base">Culinary Master Chefs</h3>
                  <p className={`font-plus text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Fast food gets revolutionized using gourmet culinary approaches designed directly by executive sous chefs.
                  </p>
                </div>
              </div>
            </section>

            {/* CAVE CONFESSIONS TESTIMONIALS SLIDER */}
            <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                <div>
                  <h2 className="font-sora font-extrabold text-3xl md:text-4xl tracking-tight">
                    Cave Confessions
                  </h2>
                  <p className={`font-plus text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Read honest, sizzling fast-food testimonies from our loyal customers in New Delhi blocks.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsReviewOpen(true)}
                  className="px-5 py-3 bg-[#ff5c00] hover:bg-[#ff2e00] text-white rounded-xl font-sora font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  <MessageSquare className="w-4 h-4 fill-current" /> Write Confession
                </button>
              </div>

              {/* Horizontally scrolling track with mouse scroll integration */}
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 no-scrollbar snap-x">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className={`flex-shrink-0 w-80 md:w-96 p-6 rounded-[2rem] border snap-start flex flex-col justify-between space-y-6 ${
                      theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
                    }`}
                  >
                    <div>
                      {/* Interactive star reviews */}
                      <div className="flex text-amber-500 mb-4 items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                        ))}
                      </div>
                      
                      <p className={`font-plus text-xs md:text-sm italic leading-relaxed ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        "{review.text}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                      <div className={`w-9 h-9 rounded-full ${review.avatarColor} flex items-center justify-center font-sora text-sm font-extrabold text-white`}>
                        {review.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-sora text-xs font-bold leading-tight">{review.author}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Submitted: {review.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CONTACT CARD WITH DETAILED GOOGLE MAP WORKFLOWS */}
            <section id="contact" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
              <div className={`rounded-[3rem] overflow-hidden flex flex-col lg:flex-row border shadow-2xl ${
                theme === 'dark' ? 'bg-[#151414] border-white/5' : 'bg-white border-orange-100'
              }`}>
                
                {/* Left textual pane */}
                <div className="lg:w-1/2 p-10 md:p-12 flex flex-col justify-between">
                  <div>
                    <h2 className="font-sora font-extrabold text-3xl md:text-4xl tracking-tight mb-8">
                      Visit the <span className="text-[#ff5c00]">Cave</span>
                    </h2>

                    <div className="space-y-8">
                      <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-[#ff5c00] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-sora font-bold text-sm">Address Details</h4>
                          <p className={`font-plus text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            No. 3 B-1, Shop, Yamuna Vihar,<br />
                            New Delhi, Delhi 110053
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <Phone className="w-5 h-5 text-[#ff5c00] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-sora font-bold text-sm">Phone / WhatsApp Link</h4>
                          <a 
                            href="tel:+918800640055"
                            className={`font-plus text-xs mt-1 hover:text-[#ff5c00] transition-colors block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            +91 8800640055
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <Mail className="w-5 h-5 text-[#ff5c00] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-sora font-bold text-sm">Customer Support Address</h4>
                          <a 
                            href="mailto:hello@crustcave.in"
                            className={`font-plus text-xs mt-1 hover:text-[#ff5c00] transition-colors block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            hello@crustcave.in
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational limits tag */}
                  <div className="pt-8 mt-8 border-t border-white/5 text-xxs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Operational bounds: 11:00 AM - 11:59 PM IST
                  </div>
                </div>

                {/* Right Map/Visual Representation Pane */}
                <div className="lg:w-1/2 h-[350px] lg:h-auto min-h-[400px] relative bg-black/5 flex flex-col items-center justify-center text-center p-8 border-t lg:border-t-0 lg:border-l border-white/5">
                  <div className="absolute inset-0 z-0">
                    <img
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
                      className="w-full h-full object-cover opacity-15 filter blur-xs"
                      alt="Google Map representational background texture"
                    />
                  </div>

                  <div className="relative z-10 space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-[#ff5c00]/10 text-[#ff5c00] rounded-full flex items-center justify-center mx-auto pulsing-glow">
                      <MapPin className="w-8 h-8 fill-current" />
                    </div>
                    
                    <h3 className="font-sora font-extrabold text-2xl text-white">Yamuna Vihar, Delhi</h3>
                    <p className="font-plus text-xs text-gray-400">
                      Located conveniently adjacent to Yamuna Vihar sub-block marketplace with secure private delivery parking.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                      <a 
                        href="https://maps.google.com/?q=Crust+Cave+Yamuna+Vihar"
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-3 bg-[#ff5c00] hover:bg-[#ff2e00] text-white rounded-xl text-xs font-sora font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Get Directions
                      </a>
                      <a 
                        href="https://maps.google.com/?q=Crust+Cave+Yamuna+Vihar"
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-sora font-bold border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                      >
                        Open Website Map
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* BRAND FOOTER PANEL */}
            <footer className={`border-t py-16 ${
              theme === 'dark' ? 'bg-[#0b0b0b] border-white/5 text-gray-400' : 'bg-[#FAF9F5] border-orange-100 text-gray-700'
            }`}>
              <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
                
                <div className="space-y-4">
                  <a 
                    href="#" 
                    className="font-sora font-extrabold text-2xl tracking-tighter text-[#ff5c00] flex items-center gap-1.5"
                  >
                    <Flame className="w-5.5 h-5.5 fill-current" />
                    <span>Nakul's Restraunt</span>
                  </a>
                  <p className="font-plus text-xs leading-relaxed">
                    Sizzling and intense Fast-Food gourmet burgers, pizzas and cocktails formulated in Delhi. Taste the difference today.
                  </p>
                </div>

                <div>
                  <h4 className={`font-sora font-bold text-xs uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#261d19]'}`}>
                    Quick links
                  </h4>
                  <ul className="text-xs space-y-2.5">
                    <li><a href="#menu" className="hover:text-[#ff5c00] transition-colors">Gourmet Selection</a></li>
                    <li><a href="#combos" className="hover:text-[#ff5c00] transition-colors">Extreme Deals</a></li>
                    <li><a href="#about" className="hover:text-[#ff5c00] transition-colors">About Us</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className={`font-sora font-bold text-xs uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#261d19]'}`}>
                    Legal Support
                  </h4>
                  <ul className="text-xs space-y-2.5">
                    <li><a href="#" className="hover:text-[#ff5c00] transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-[#ff5c00] transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-[#ff5c00] transition-colors">Refund system</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className={`font-sora font-bold text-xs uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#261d19]'}`}>
                    Follow the Cave
                  </h4>
                  <div className="flex gap-3 text-xs font-bold text-white uppercase">
                    <span className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#ff5c00] flex items-center justify-center cursor-pointer transition-colors">
                      FB
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#ff5c00] flex items-center justify-center cursor-pointer transition-colors">
                      IG
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#ff5c00] flex items-center justify-center cursor-pointer transition-colors">
                      WA
                    </span>
                  </div>
                </div>

              </div>

              <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-6 border-t border-white/5 text-center text-2xs opacity-80 uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Nakul's Restraunt Delhi, India &middot; culinary intensity defined. All rights reserved.
              </div>
            </footer>
          </>
        )}

        {/* MODAL CART DRAWER */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveFromCart}
          onTriggerCheckout={triggerCheckoutScroll}
          theme={theme}
        />

        {/* MODAL USER AUTH / LOGIN */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
        />

        {/* MODAL ORDER PLACED SUCCESS */}
        {lastCompletedOrder && (
          <SuccessModal
            isOpen={isSuccessOpen}
            onClose={() => setIsSuccessOpen(false)}
            orderId={lastCompletedOrder.orderId}
            customerName={lastCompletedOrder.customerName}
            customerPhone={lastCompletedOrder.customerPhone}
            totalAmount={lastCompletedOrder.totalAmount}
            itemsSummary={lastCompletedOrder.itemsSummary}
            theme={theme}
            orderTime={lastCompletedOrder.time}
          />
        )}

        {/* MODAL USER REVIEWS / CONFESSIONS */}
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onSubmit={handleAddReview}
          theme={theme}
        />

        {/* MODAL USER PROFILE & PASSWORD WORKFLOW */}
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onUpdateUser={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('cc_user', JSON.stringify(updatedUser));
          }}
          theme={theme}
        />

      </div>
    </div>
  );
}
