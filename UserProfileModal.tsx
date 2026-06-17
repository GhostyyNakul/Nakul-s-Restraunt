import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, ShoppingCart, ArrowRight, Flame } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemove: (menuItemId: string) => void;
  onTriggerCheckout: () => void;
  theme: 'dark' | 'light';
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemove,
  onTriggerCheckout,
  theme,
}: CartDrawerProps) {
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const deliveryCharge = subtotal > 500 ? 0 : subtotal > 0 ? 35 : 0;
  const total = subtotal + deliveryCharge;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`w-screen max-w-md border-l flex flex-col justify-between shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[#151414] border-white/10 text-white'
                  : 'bg-white border-orange-100 text-[#261d19]'
              }`}
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#ff5c00]" />
                  <h2 className="font-sora font-extrabold text-lg">Your Feast Basket</h2>
                  {cartItems.length > 0 && (
                    <span className="bg-[#ff5c00] text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {cartItems.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-sora font-bold text-base mb-1">Your basket is empty</h4>
                      <p className="font-plus text-xs text-gray-400">
                        Explore our extreme burgers or Margherita pizzas to stoke the flames!
                      </p>
                    </div>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                        theme === 'dark'
                          ? 'bg-white/[0.02] border-white/5'
                          : 'bg-orange-50/[0.2] border-orange-100/50'
                      }`}
                    >
                      {/* Left: Image / Details */}
                      <div className="flex items-center gap-3">
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          className="w-14 h-14 object-cover rounded-xl bg-orange-100 flex-shrink-0"
                        />
                        <div>
                          <p className="font-sora text-sm font-bold tracking-tight line-clamp-1">
                            {item.menuItem.name}
                          </p>
                          <p className="font-geist text-xs text-[#ff5c00] font-semibold">
                            ₹{item.menuItem.price} <span className="text-gray-400">each</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Quantity modifiers */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-black/10 rounded-lg p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, -1)}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-geist text-sm font-bold px-1.5">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, 1)}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemove(item.menuItem.id)}
                          className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer Receipts */}
              {cartItems.length > 0 && (
                <div className={`p-6 border-t ${
                  theme === 'dark' ? 'border-white/5 bg-black/10' : 'border-orange-100 bg-orange-50/[0.1]'
                }`}>
                  {/* Delivery notification indicator */}
                  {subtotal < 500 ? (
                    <p className="text-xxs font-bold text-amber-500 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-current animate-pulse" /> Add <b>₹{500 - subtotal}</b> more for FREE Shipping!
                    </p>
                  ) : (
                    <p className="text-xxs font-bold text-green-500 mb-4 bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      🔥 You qualify for <b>FREE Delivery</b> under Cave Scout services!
                    </p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-75">Subtotal</span>
                      <span className="font-geist font-semibold">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Delivery Scouts</span>
                      <span className="font-geist font-semibold">
                        {deliveryCharge === 0 ? <span className="text-green-500">FREE</span> : `₹${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/5 text-base font-bold">
                      <span>Total Invoice</span>
                      <span className="font-sora text-[#ff5c00]">₹{total}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onTriggerCheckout();
                      onClose();
                    }}
                    className="w-full py-4 bg-[#ff5c00] hover:bg-[#ff2e00] text-white rounded-2xl font-sora font-extrabold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    Proceed to Delivery
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
