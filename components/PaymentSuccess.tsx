
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Home } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment with Stripe...');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID found.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          // Reload window after a short delay to refresh user state in App.tsx
          setTimeout(() => {
             window.location.href = '/'; 
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message || 'Network error verifying payment.');
      }
    };

    verify();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
            <p className="text-zinc-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-zinc-400 mb-6">Your account has been upgraded. Redirecting you home...</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Home Now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-red-300 mb-6">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> Go Home
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentSuccess;
