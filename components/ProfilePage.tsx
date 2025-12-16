
import React from 'react';
import { UserProfile, AppView } from '../types';
import { User, CreditCard, Shield, Zap, Crown, LogOut, Calendar, Settings, ChevronRight } from 'lucide-react';
import { getPlanLimits } from '../services/dbService';

interface ProfilePageProps {
  user: UserProfile | null;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onNavigate, onLogout }) => {
  if (!user) return (
    <div className="flex items-center justify-center h-full text-zinc-500">
        Please log in to view your profile.
    </div>
  );

  const planColors = {
    free: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    starter: 'bg-indigo-900/30 text-indigo-400 border-indigo-500/50',
    pro: 'bg-purple-900/30 text-purple-400 border-purple-500/50'
  };

  const userPlan = user.plan || 'free';
  const currentPlanColor = planColors[userPlan];
  const PlanIcon = userPlan === 'pro' ? Crown : userPlan === 'starter' ? Zap : Shield;
  
  // Usage calculation
  const limits = getPlanLimits(userPlan);
  const used = user.generationsCount || 0;
  const total = limits.generations;
  const percentUsed = Math.min(100, Math.round((used / total) * 100));

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-zinc-500" />
            Account Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Identity Card */}
        <div className="md:col-span-1 space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              
              <div className="relative mb-6">
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-900/30 ring-4 ring-zinc-900">
                    <span className="text-4xl font-bold text-white select-none">{user.email[0].toUpperCase()}</span>
                  </div>
                  {userPlan === 'pro' && (
                      <div className="absolute bottom-0 right-1/2 translate-x-10 translate-y-1 bg-purple-600 border-2 border-zinc-900 p-1.5 rounded-full text-white" title="Pro User">
                          <Crown className="w-4 h-4 fill-current" />
                      </div>
                  )}
              </div>

              <h2 className="text-xl font-bold text-white truncate mb-1">{user.email.split('@')[0]}</h2>
              <p className="text-sm text-zinc-500 mb-6 font-mono text-xs">{user.email}</p>
              
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-lg ${currentPlanColor}`}>
                 <PlanIcon className="w-3.5 h-3.5" />
                 {userPlan} Plan
              </div>
           </div>

           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-900/10 hover:border-red-900/30 transition-all font-medium"
           >
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>

        {/* Right Column: Details & Subscription */}
        <div className="md:col-span-2 space-y-6">
           
           {/* Subscription Card */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-40 bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" /> Subscription & Billing
                  </h3>
                  {userPlan !== 'free' && (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                  )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 relative z-10">
                 <div className="p-5 bg-black/40 rounded-xl border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Current Plan</p>
                    <p className="text-2xl font-bold text-white capitalize">{userPlan}</p>
                 </div>
                 <div className="p-5 bg-black/40 rounded-xl border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Expiration</p>
                    {user.subscriptionEnd ? (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-zinc-400" />
                            <span className="text-xl text-zinc-200">{new Date(user.subscriptionEnd).toLocaleDateString()}</span>
                        </div>
                    ) : (
                        <span className="text-xl text-zinc-500">No Expiration</span>
                    )}
                 </div>
              </div>

              {userPlan !== 'pro' ? (
                  <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                     <div className="flex items-start gap-4">
                        <div className="bg-indigo-600 rounded-lg p-2 mt-1 hidden sm:block">
                            <Zap className="w-5 h-5 text-white fill-current" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base">Upgrade to Pro</h4>
                            <p className="text-xs text-indigo-200/70 mt-1 max-w-xs">Unlock Veo Video Studio, 4K Image Generation, and Priority Processing.</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => onNavigate(AppView.PRICING)}
                       className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 bg-white hover:bg-zinc-100 text-black rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                     >
                       Change Plan <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
              ) : (
                  <div className="text-sm text-zinc-500 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 border-dashed text-center">
                     You are on the highest tier. Enjoy unlimited creativity!
                  </div>
              )}
           </div>

           {/* Usage Statistics */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white mb-6">Usage Statistics</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                       <span className="text-zinc-400">Monthly Generations</span>
                       <span className="text-white">
                           {used} / {limits.label}
                       </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div 
                           className={`h-full rounded-full transition-all duration-1000 ${percentUsed > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                           style={{ width: `${percentUsed}%` }}
                       ></div>
                    </div>
                    {percentUsed >= 100 && userPlan !== 'pro' && (
                        <p className="text-xs text-red-400 mt-2">
                            Limit reached. Please upgrade to continue generating.
                        </p>
                    )}
                 </div>
                 {/* Cloud storage mock remains static for now as it's not implemented yet */}
                 <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                       <span className="text-zinc-400">Cloud Storage</span>
                       <span className="text-white">0MB / 1GB</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-500 rounded-full w-[0%]"></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
