import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, ShieldCheck, Mail, Lock, Sparkles } from 'lucide-react';
import { hashPassword, isHashed } from '../utils/security';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; isAdmin: boolean; password?: string }) => void;
  theme: 'dark' | 'light';
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, theme }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Admin field
  const [adminUsername, setAdminUsername] = useState('');
  const [adminKey, setAdminKey] = useState('');
  
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && !name.trim()) {
      setError('Please provide your name.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    const registeredStr = localStorage.getItem('cc_registered_users');
    let registeredUsers: Array<{ name: string; email: string; password?: string }> = [];
    if (registeredStr) {
      try {
        registeredUsers = JSON.parse(registeredStr);
      } catch (e) {
        registeredUsers = [];
      }
    }

    const emailLower = email.toLowerCase().trim();
    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === emailLower);
    const hashed = hashPassword(password, emailLower);

    if (isRegistering) {
      if (existingUser) {
        setError('An account with this email address already exists. Please login instead.');
        return;
      }

      const finalName = name.trim();
      const newUser = {
        name: finalName,
        email: emailLower,
        password: hashed
      };

      registeredUsers.push(newUser);
      localStorage.setItem('cc_registered_users', JSON.stringify(registeredUsers));

      onLoginSuccess({
        name: finalName.charAt(0).toUpperCase() + finalName.slice(1),
        email: emailLower,
        isAdmin: false,
        password: hashed
      });
    } else {
      // Login flow
      if (existingUser) {
        const storedPass = existingUser.password || '';
        const isValid = isHashed(storedPass) ? (storedPass === hashed) : (storedPass === password);

        if (!isValid) {
          setError('Incorrect password. Please try again.');
          return;
        }

        // Migrate plaintext to secure hash on successful login
        if (storedPass && !isHashed(storedPass)) {
          existingUser.password = hashed;
          localStorage.setItem('cc_registered_users', JSON.stringify(registeredUsers));
        }

        onLoginSuccess({
          name: existingUser.name,
          email: existingUser.email,
          isAdmin: false,
          password: hashed
        });
      } else {
        // Frictionless automatic signup if user is first-time logging in without previous registration
        const autoName = emailLower.split('@')[0];
        const formattedName = autoName.charAt(0).toUpperCase() + autoName.slice(1);
        const newUser = {
          name: formattedName,
          email: emailLower,
          password: hashed
        };

        registeredUsers.push(newUser);
        localStorage.setItem('cc_registered_users', JSON.stringify(registeredUsers));

        onLoginSuccess({
          name: formattedName,
          email: emailLower,
          isAdmin: false,
          password: hashed
        });
      }
    }
    
    // Reset state
    setName('');
    setEmail('');
    setPassword('');
    onClose();
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const storedAdminKey = localStorage.getItem('cc_admin_key') || 'admin';
    const inputHashed = hashPassword(adminKey, 'admin');

    const isValid = isHashed(storedAdminKey)
      ? (storedAdminKey === inputHashed)
      : (storedAdminKey === adminKey);

    if (adminUsername.toLowerCase() === 'admin' && isValid) {
      // Upgrade stored admin key if it was legacy plaintext
      let activeAdminKey = storedAdminKey;
      if (!isHashed(storedAdminKey)) {
        activeAdminKey = inputHashed;
        localStorage.setItem('cc_admin_key', inputHashed);
      }

      onLoginSuccess({
        name: 'Cave Commander',
        email: 'commander@crustcave.in',
        isAdmin: true,
        password: activeAdminKey
      });
      setAdminUsername('');
      setAdminKey('');
      onClose();
    } else {
      setError(`Invalid admin credentials. (Hint: Use user "admin" & your current security key)`);
    }
  };

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
          className={`relative z-10 max-w-sm md:max-w-md w-full rounded-[2.5rem] overflow-hidden shadow-2xl border ${
            theme === 'dark' 
              ? 'bg-[#1a1919] border-white/10 text-white' 
              : 'bg-white border-orange-100 text-[#261d19]'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-20 ${
              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Tabs */}
          <div className="flex border-b border-white/5 bg-black/10">
            <button
              onClick={() => {
                setActiveTab('customer');
                setError('');
              }}
              className={`flex-1 py-4 font-sora font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'customer'
                  ? 'text-[#ff5c00] border-[#ff5c00]'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              <User className="w-4 h-4" />
              Customer Access
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`flex-1 py-4 font-sora font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'text-[#fabd00] border-[#fabd00]'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Cave Command
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 text-center animate-shake">
                {error}
              </div>
            )}

            {activeTab === 'customer' ? (
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="font-sora font-extrabold text-2xl mb-1">
                    {isRegistering ? 'Unlock the Cave' : 'Welcome Back'}
                  </h3>
                  <p className={`font-plus text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isRegistering 
                      ? 'Join the family for exclusive Delhi combo privileges' 
                      : 'Step in for gourmet intensity'}
                  </p>
                </div>

                <AnimatePresence mode="popLayout">
                  {isRegistering && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-1.5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Rohan Gupta"
                          required={isRegistering}
                          className={`w-full pl-11 bg-white/5 border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5c00] transition-colors ${
                            theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                          }`}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-1.5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rohan@example.com"
                      required
                      className={`w-full pl-11 bg-white/5 border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5c00] transition-colors ${
                        theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-1.5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full pl-11 bg-white/5 border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5c00] transition-colors ${
                        theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#ff5c00] hover:bg-[#ff2e00] text-white rounded-xl font-sora font-extrabold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isRegistering ? 'Register & Enter' : 'Gourmet Login'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="w-full text-center text-xs text-[#ff5c00] font-semibold hover:underline"
                  >
                    {isRegistering ? 'Already have an account? Login' : 'New to Nakul\'s Restraunt? Create account'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="font-sora font-extrabold text-2xl mb-1 text-[#fabd00]">
                    Cave Command
                  </h3>
                  <p className={`font-plus text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Control the hearth & evaluate dynamic incoming orders
                  </p>
                </div>

                <div>
                  <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-1.5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Admin Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      required
                      className={`w-full pl-11 bg-white/5 border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#fabd00] transition-colors ${
                        theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block font-sora font-bold text-[10px] uppercase tracking-wider mb-1.5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Security Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="password"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      placeholder="admin"
                      required
                      className={`w-full pl-11 bg-white/5 border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#fabd00] transition-colors ${
                        theme === 'dark' ? 'border-white/10 text-white' : 'border-orange-100 text-[#261d19]'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#fabd00] hover:bg-[#e0a900] text-black rounded-xl font-sora font-extrabold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Authenticate Command Center
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
