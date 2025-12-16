
import React, { useState } from 'react';
import { Check, X, CreditCard, Shield, Crown, Zap, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';

interface PricingPageProps {
  user: UserProfile | null;
  onLoginRequest: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ user, onLoginRequest }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      onLoginRequest();
      return;
    }

    setLoadingPlan(plan);

    try {
      // Call our backend API to generate the Stripe Checkout URL
      const response = await fetch('http://localhost:4000/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: user.id, 
            plan: plan 
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect user to Stripe Hosted Checkout
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initiate checkout');
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error(error);
      alert('Network error initializing payment. Ensure server is running on port 4000.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 relative">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 hover:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800/50 hover:border-zinc-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center space-y-4 pt-2">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          One-Time Payment, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Lifetime Access</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          No subscriptions. Pay once and unlock Pro AI generation capabilities forever.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Gratis Tier */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-zinc-700"></div>
           <h3 className="text-xl font-bold text-white mb-2">Gratis (Free)</h3>
           <div className="text-3xl font-bold text-white mb-6">0€ <span className="text-sm font-normal text-zinc-500">/ forever</span></div>
           <p className="text-zinc-400 text-sm mb-6">Basic directory access with ads.</p>
           
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-emerald-500" /> Full Directory Navigation
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-emerald-500" /> Basic Search
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-500">
               <AlertCircle className="w-4 h-4 text-amber-500" /> <strong>Contains Ads</strong>
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-500 opacity-60">
               <X className="w-4 h-4" /> No AI Courses/Slides
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-500 opacity-60">
               <X className="w-4 h-4" /> No AI Tutorials
             </li>
           </ul>

           <button 
             disabled
             className="w-full py-3 rounded-lg border border-zinc-700 text-zinc-500 font-bold bg-zinc-900/50 cursor-default"
           >
             Current Plan
           </button>
        </div>

        {/* Starter Tier */}
        <div className="bg-zinc-900 border border-indigo-500 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-900/20">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
           
           <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
             <Zap className="w-5 h-5 text-indigo-400" /> Starter
           </h3>
           <div className="text-3xl font-bold text-white mb-6">9.99€ <span className="text-sm font-normal text-zinc-500">/ one-time</span></div>
           <p className="text-zinc-400 text-sm mb-6">Remove ads and start generating.</p>
           
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> <strong>No Ads</strong>
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> Generate AI Tutorials
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> Generate Slides & Courses
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> <strong>Lifetime Access</strong>
             </li>
           </ul>

           <button 
             onClick={() => handleSubscribe('Starter')}
             disabled={loadingPlan === 'Starter'}
             className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2"
           >
             {loadingPlan === 'Starter' && <Loader2 className="w-4 h-4 animate-spin" />}
             Get Lifetime Access
           </button>
        </div>

        {/* Pro Tier */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col relative overflow-hidden transform md:-translate-y-4 shadow-xl border-t-purple-500">
           <div className="absolute top-0 left-0 w-full h-1 bg-purple-600"></div>
           <div className="absolute top-4 right-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Best Value</div>

           <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
             <Crown className="w-5 h-5 text-purple-400" /> Pro Full
           </h3>
           <div className="text-3xl font-bold text-white mb-6">19.99€ <span className="text-sm font-normal text-zinc-500">/ one-time</span></div>
           <p className="text-zinc-400 text-sm mb-6">Maximum power for power users.</p>
           
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> <strong>Everything in Starter</strong>
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> Full Veo Video Access
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> Priority Generation Speed
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> <strong>Lifetime Updates</strong>
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> Advanced Support
             </li>
           </ul>

           <button 
             onClick={() => handleSubscribe('Pro')}
             disabled={loadingPlan === 'Pro'}
             className="w-full py-3 rounded-lg border border-zinc-700 hover:border-purple-500 text-white font-bold hover:bg-purple-900/20 transition-all flex items-center justify-center gap-2"
           >
             {loadingPlan === 'Pro' && <Loader2 className="w-4 h-4 animate-spin" />}
             Go Pro Forever
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg">
                  <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                  <h4 className="text-white font-bold">Secure One-Time Payment</h4>
                  <p className="text-sm text-zinc-400">Processed by Stripe. No hidden fees.</p>
              </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg">
                  <CreditCard className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                  <h4 className="text-white font-bold">Money Back Guarantee</h4>
                  <p className="text-sm text-zinc-400">If you're not satisfied in 7 days, let us know.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PricingPage;
