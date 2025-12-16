import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { signIn, signUp, resetPasswordForEmail } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'login' | 'signup' | 'reset';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess();
        onClose();
      } else if (mode === 'signup') {
        await signUp(email, password);
        alert("Registration successful! You may need to verify your email depending on Supabase settings.");
        onSuccess();
        onClose();
      } else if (mode === 'reset') {
        await resetPasswordForEmail(email);
        setSuccessMessage("Password reset link sent to your email!");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError('');
    setSuccessMessage('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
             <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                {mode === 'login' && <LogIn className="w-6 h-6 text-indigo-500" />}
                {mode === 'signup' && <UserPlus className="w-6 h-6 text-purple-500" />}
                {mode === 'reset' && <KeyRound className="w-6 h-6 text-emerald-500" />}
             </div>
             <h2 className="text-2xl font-bold text-white">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'reset' && 'Reset Password'}
             </h2>
             <p className="text-zinc-400 text-sm mt-1">
               {mode === 'login' && 'Enter your credentials to access your account'}
               {mode === 'signup' && 'Sign up to start creating with VETORRE'}
               {mode === 'reset' && 'Enter your email to receive a reset link'}
             </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-emerald-900/20 border border-emerald-900/50 text-emerald-200 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" /> {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="block text-xs font-semibold text-zinc-500 uppercase">Password</label>
                   {mode === 'login' && (
                      <button 
                         type="button"
                         onClick={() => { setMode('reset'); resetState(); }}
                         className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                      >
                         Forgot Password?
                      </button>
                   )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${
                mode === 'login' ? 'bg-indigo-600 hover:bg-indigo-500' : 
                mode === 'signup' ? 'bg-purple-600 hover:bg-purple-500' :
                'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                mode === 'login' ? <LogIn className="w-4 h-4" /> : 
                mode === 'signup' ? <UserPlus className="w-4 h-4" /> : 
                <Mail className="w-4 h-4" />
              )}
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Send Reset Link'}
            </button>
          </form>

          {mode === 'reset' && (
             <div className="mt-4">
                <button 
                   onClick={() => { setMode('login'); resetState(); }}
                   className="w-full py-2.5 rounded-lg font-medium text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-zinc-700 hover:bg-zinc-800"
                >
                   <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>
             </div>
          )}

          {mode !== 'reset' && (
            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-sm">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetState(); }}
                  className={`ml-1 font-semibold hover:underline ${mode === 'login' ? 'text-indigo-400' : 'text-purple-400'}`}
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;