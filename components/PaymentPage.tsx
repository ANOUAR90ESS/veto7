import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { getCurrentUserProfile } from '../services/authService';
import { updateUserPlan } from '../services/dbService';
import { UserPlan } from '../types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../services/supabase';

// Helper for safe env var access
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  return '';
};

// REPLACE WITH YOUR STRIPE PUBLISHABLE KEY
const STRIPE_KEY = getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY') || 'pk_test_placeholder_key_replace_me';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_KEY);

interface PaymentPageProps {
  plan: string;
  onBack: () => void;
  onComplete: () => void;
}

const CheckoutForm: React.FC<{ 
    plan: string, 
    price: number, 
    onSuccess: () => void, 
    onError: (msg: string) => void 
}> = ({ plan, price, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        // 1. Confirm Payment
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required", // Prevent redirect for SPA experience
            confirmParams: {
                return_url: window.location.href, // Fallback
            },
        });

        if (error) {
            onError(error.message || "Payment failed");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // 2. Update DB (In production, use Webhooks for this!)
            try {
                const user = await getCurrentUserProfile();
                if (user) {
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + 30);
                    const dbPlan: UserPlan = plan === 'Starter' ? 'starter' : 'pro';
                    await updateUserPlan(user.id, dbPlan, expirationDate.toISOString());
                    onSuccess();
                } else {
                    onError("User not found during database update");
                }
            } catch(e: any) {
                onError("Payment succeeded but database update failed: " + e.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement 
                id="payment-element" 
                options={{
                    layout: 'tabs',
                }} 
            />
            
            <button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20 hover:scale-[1.01]"
            >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isProcessing ? 'Processing...' : `Subscribe & Pay ${price.toFixed(2)}€`}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mt-4 bg-zinc-900/30 p-2 rounded">
                <Shield className="w-3 h-3 text-emerald-500" />
                Payments processed securely by Stripe
            </div>
        </form>
    );
}

const PaymentPage: React.FC<PaymentPageProps> = ({ plan, onBack, onComplete }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Determine price based on plan name
  const price = plan === 'Starter' ? 9.99 : 19.99;

  useEffect(() => {
      // Create Subscription as soon as the page loads
      const createSubscription = async () => {
          try {
             const session = await supabase?.auth.getSession();
             const token = session?.data.session?.access_token;
             
             if (!token) throw new Error("Please log in again.");

             const res = await fetch('http://localhost:4000/api/create-subscription', {
                 method: 'POST',
                 headers: { 
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify({ plan })
             });
             
             if (!res.ok) {
                 const d = await res.json();
                 throw new Error(d.error || "Failed to init subscription");
             }

             const data = await res.json();
             setClientSecret(data.clientSecret);

          } catch (e: any) {
              console.error(e);
              setError(e.message || "Failed to initialize payment system.");
          }
      };
      
      createSubscription();
  }, [plan]);

  if (success) {
    return (
      <div className="max-w-xl mx-auto p-6 min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">Subscription Active!</h2>
            <p className="text-zinc-400">
            Thank you for subscribing to the <span className="text-white font-bold">{plan} Plan</span>.
            Your account has been upgraded.
            </p>
        </div>
        <button
          onClick={onComplete}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Form Area */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Checkout</h2>
            <p className="text-zinc-400 text-sm">Complete your subscription.</p>
          </div>
          
          {error && (
             <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                    <p className="font-bold">Setup Error</p>
                    <p>{error}</p>
                    {error.includes('Stripe not configured') && (
                        <p className="mt-2 text-xs opacity-75">Tip: Add STRIPE_SECRET_KEY to server .env</p>
                    )}
                    {error.includes('pk_test') && (
                        <p className="mt-2 text-xs opacity-75">Tip: Add VITE_STRIPE_PUBLISHABLE_KEY to frontend .env</p>
                    )}
                </div>
             </div>
          )}

          {clientSecret && (
              <Elements options={{ 
                  clientSecret, 
                  appearance: { 
                      theme: 'night', 
                      variables: { colorPrimary: '#6366F1' } 
                  } 
              }} stripe={stripePromise}>
                  <CheckoutForm 
                    plan={plan} 
                    price={price} 
                    onSuccess={() => setSuccess(true)} 
                    onError={setError} 
                  />
              </Elements>
          )}

          {!clientSecret && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                  <p>Initializing Secure Subscription...</p>
              </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-6">
           <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-4">Order Summary</h3>
           
           <div className="space-y-4 mb-6">
             <div className="flex justify-between items-center">
                <span className="text-zinc-300">VETORRE {plan} Plan</span>
                <span className="text-white font-medium">{price.toFixed(2)}€</span>
             </div>
             <div className="flex justify-between items-center text-sm text-zinc-500">
                <span>Billing Cycle</span>
                <span>Monthly</span>
             </div>
             <div className="flex justify-between items-center text-sm text-zinc-500">
                <span>Tax</span>
                <span>0.00€</span>
             </div>
           </div>

           <div className="border-t border-zinc-800 pt-4 flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-white">Total</span>
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">{price.toFixed(2)}€</span>
           </div>

           <div className="bg-zinc-950 rounded-lg p-4 text-xs text-zinc-500 leading-relaxed border border-zinc-800/50">
              By confirming your subscription, you allow VETORRE to charge your card for this payment and future payments in accordance with our Terms. You can cancel at any time.
           </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;