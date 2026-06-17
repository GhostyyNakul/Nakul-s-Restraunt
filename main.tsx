import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Flame, Clock, ShoppingBag, Send, MessageSquare, AlertCircle, Loader2, Copy } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  itemsSummary: string;
  theme: 'dark' | 'light';
  orderTime?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  orderId,
  customerName,
  customerPhone,
  totalAmount,
  itemsSummary,
  theme,
  orderTime,
}: SuccessModalProps) {
  const [smsStatus, setSmsStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Prepare fallback WhatsApp wa.me deep-link
  const messageText = `🍔 *NAKUL'S RESTRAUNT - ORDER CONFIRMED* 🍟\n\n` +
    `Hello, *${customerName}*!\n` +
    `We have received your order at Nakul's Restraunt. Your premium gourmet treats are being processed!\n\n` +
    `*Order Ticket:*\n` +
    `• *Order ID:* ${orderId}\n` +
    `• *Items:* ${itemsSummary}\n` +
    `• *Total:* ₹${totalAmount}\n\n` +
    `📱 *Preparation & Delivery Info:*\n` +
    `Our kitchen is firing up! Estimated response and dispatch time is 5–10 minutes.\n\n` +
    `Join the Feast! Standard Delivery at Yamuna Vihar, Delhi. Thank you for choosing us!`;

  // Filter phone inputs correctly by removing duplicate country code and local spaces
  let cleanPhone = customerPhone.replace(/\D/g, '').trim();
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const whatsappDeepLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  useEffect(() => {
    if (!isOpen) {
      setSmsStatus('idle');
      setStatusMessage('');
      return;
    }

    setSmsStatus('sending');
    setStatusMessage('Triggering automated Telnyx SMS order dispatcher...');

    fetch('/api/send-sms', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId,
        customerName,
        customerPhone,
        itemsSummary,
        totalAmount
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setSmsStatus('sent');
          setStatusMessage('Automated order confirmation SMS dispatched to customer!');
        } else {
          setSmsStatus('failed');
          if (data.reason === 'credentials_missing') {
            setStatusMessage('Telnyx credentials missing. Use the direct manual WhatsApp trigger below to forward details.');
          } else {
            setStatusMessage(data.message || 'Telnyx dispatcher rejected the request.');
          }
        }
      })
      .catch((err) => {
        console.error('Error in automated SMS dispatch:', err);
        setSmsStatus('failed');
        setStatusMessage('Network timeout. Please use the direct WhatsApp link as a backup.');
      });
  }, [isOpen, orderId, customerName, customerPhone, itemsSummary, totalAmount]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal container */}
        <motion.div
          initial={{ scale: 0.92, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 15, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className={`relative z-10 max-w-lg w-full p-6 md:p-8 rounded-[2.5rem] shadow-2xl border text-center ${
            theme === 'dark' 
              ? 'bg-[#151414] border-white/10 text-[#e5e2e1]' 
              : 'bg-white border-orange-100 text-[#261d19]'
          }`}
        >
          {/* Close corner button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={`absolute top-6 right-6 p-2 rounded-full transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Animated Circle and Checkmark */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            {/* Pulsing ring */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 bg-emerald-500/20 rounded-full"
            />
            {/* Dynamic checkmark bubble */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              className="relative w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/35"
            >
              <Check className="w-8 h-8 text-white stroke-[3.5]" />
            </motion.div>
          </div>

          {/* Specific Title & Order Status Texts */}
          <h2 className="font-sora font-black text-3xl mb-1 tracking-tight">
            Order Confirmed
          </h2>
          
          <div className="space-y-1.5 mb-6">
            <p className={`font-plus text-sm font-semibold text-wrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Thank you for ordering from Nakul's Restraunt, {customerName || 'customer'}.
            </p>
            <p className={`font-plus text-xs leading-relaxed ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Your order has been received successfully.
            </p>
          </div>

          {/* Elegant Receipt / Ticket Card */}
          <div className={`rounded-3xl p-5 mb-6 border text-left ${
            theme === 'dark' 
              ? 'bg-black/40 border-white/5' 
              : 'bg-orange-50/20 border-orange-100'
          }`}>
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3.5">
              <span className="text-xxs uppercase tracking-wider text-[#ff5c00] font-black">
                Order Ticket
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                UTC Verified
              </span>
            </div>

            <div className="space-y-3">
              {/* Order ID & Time */}
              <div className="flex justify-between items-center gap-4">
                <div>
                  <dt className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Order ID</dt>
                  <dd className="font-sora text-lg font-black tracking-widest text-[#ff5c00]">
                    {orderId}
                  </dd>
                </div>
                {orderTime && (
                  <div className="text-right">
                    <dt className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-400" /> Time Placed
                    </dt>
                    <dd className={`text-xs mt-0.5 font-semibold font-mono ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      {orderTime}
                    </dd>
                  </div>
                )}
              </div>

              {/* Items Summary */}
              <div>
                <dt className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3 h-3 text-orange-400" /> Items Dispatched
                </dt>
                <dd className={`text-xs mt-0.5 leading-relaxed font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  {itemsSummary}
                </dd>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
                <span className="text-xxs uppercase font-bold text-gray-500 tracking-wider">Total Amount</span>
                <span className="font-sora text-base font-extrabold text-[#fabd00] flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-current text-orange-500" />
                  ₹{totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time automated Telnyx SMS Dispatch Status indicator */}
          <div className={`p-4 rounded-2xl mb-4 border text-left flex flex-col gap-2.5 ${
            smsStatus === 'sending' 
              ? (theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50/50 border-blue-100')
              : smsStatus === 'sent'
                ? (theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100')
                : (theme === 'dark' ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50/70 border-amber-100')
          }`}>
            <div className="flex items-center gap-2.5 justify-between">
              <div className="flex items-center gap-2.5">
                {smsStatus === 'sending' && (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                )}
                {smsStatus === 'sent' && (
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                )}
                {smsStatus === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                
                <span className={`text-[11px] font-black uppercase tracking-wider ${
                  smsStatus === 'sending' ? 'text-blue-500' : smsStatus === 'sent' ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {smsStatus === 'sending' ? 'Automated SMS Dispatching' : smsStatus === 'sent' ? 'SMS Dispatched' : 'SMS Backup Active'}
                </span>
              </div>

              {/* Status Pill Indicator */}
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                smsStatus === 'sent' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {smsStatus === 'sent' ? 'Cloud' : 'Direct Link'}
              </span>
            </div>
            
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {statusMessage || 'Initializing automated contact routine.'}
            </p>

            {smsStatus === 'failed' && (
              <div className={`p-2.5 rounded-xl text-[10px] space-y-1 ${
                theme === 'dark' ? 'bg-white/[0.02] text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
                <p className="font-bold text-gray-400">💡 How to enable automatic background sending:</p>
                <p>Register a Telnyx portal account, obtain your API Key, and configure <strong>TELNYX_API_KEY</strong> and <strong>TELNYX_PHONE_NUMBER</strong> inside your AI Studio Secrets settings.</p>
              </div>
            )}

            {/* Manual deep-link CTA option with genuine WhatsApp style design */}
            <div className="mt-1 pt-2.5 border-t border-dashed border-gray-400/15 flex flex-col sm:flex-row gap-2 items-center justify-between">
              <span className={`text-[10px] font-medium self-start sm:self-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                To: <span className="font-mono font-bold text-[#ff5c00]">{customerPhone}</span>
              </span>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {/* Copy ticket message button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : (theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Ticket'}
                </button>

                {/* Direct Link button */}
                <a
                  href={whatsappDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Send directly using WhatsApp web or app link"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba56] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Direct WhatsApp Link
                </a>
              </div>
            </div>
          </div>

          {/* Follow-up info & Estimated Response Time */}
          <div className={`p-4 rounded-2xl mb-8 space-y-1 ${
            theme === 'dark' ? 'bg-[#ff5c00]/5 text-orange-200' : 'bg-orange-50/60 text-orange-800'
          }`}>
            <p className="font-plus text-xs leading-relaxed font-bold">
              We will contact you shortly regarding your order.
            </p>
            <p className="font-plus text-xs leading-relaxed font-black text-[#ff5c00] flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4" /> Estimated response time: 5–10 minutes.
            </p>
          </div>

          {/* Interactive CTA buttons inside the same screen context */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className={`py-3.5 px-4 rounded-2xl font-sora font-extrabold text-xs uppercase tracking-wider transition-all scale-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center bg-gradient-to-r from-[#ff5c00] to-red-600 text-white shadow-lg hover:shadow-orange-500/10`}
            >
              Place Another Order
            </button>
            <button
              onClick={onClose}
              className={`py-3.5 px-4 rounded-2xl font-plus font-bold text-xs uppercase tracking-wider transition-all border cursor-pointer text-center ${
                theme === 'dark' 
                  ? 'border-white/10 text-gray-300 hover:bg-white/5' 
                  : 'border-orange-200 text-[#ff5c00] hover:bg-orange-50/20'
              }`}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
