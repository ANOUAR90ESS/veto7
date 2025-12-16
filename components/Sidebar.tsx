import React from 'react';
import { LayoutGrid, LogIn, ShieldAlert, Newspaper, LogOut, User, Gift, DollarSign, Trophy } from 'lucide-react';
import { AppView, UserProfile } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const NavGroup = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="mb-6">
    <div className="px-4 mb-2">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</h3>
    </div>
    <ul className="space-y-1">
      {children}
    </ul>
  </div>
);

interface NavItemProps {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  delay?: number;
  isOpen?: boolean;
}

const NavItem = ({ label, icon: Icon, isActive, onClick, delay = 0, isOpen = true }: NavItemProps) => (
  <li
    className={`transform transition-all duration-500 ease-out ${
      isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
    } lg:translate-x-0 lg:opacity-100`}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <button
      onClick={onClick}
      className={`relative w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden ${
        isActive 
          ? 'bg-zinc-900 text-white shadow-lg shadow-black/20 ring-1 ring-zinc-800' 
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Hover Gradient Effect */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-zinc-800/80 via-zinc-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none ${isActive ? 'hidden' : ''}`} 
      />

      {/* Active Gradient Background Animation */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent opacity-100 animate-in fade-in duration-300" />
      )}

      <div className="flex items-center gap-3 relative z-10">
        <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
        <span className={`font-medium text-sm transition-transform duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>{label}</span>
      </div>
      
      {/* Active Indicator - Glowing Dot */}
      {isActive && (
        <div className="relative z-10 flex items-center justify-center transition-all duration-300 scale-100 opacity-100">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
        </div>
      )}
    </button>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, isOpen, toggleSidebar, 
  user, onLoginClick, onLogoutClick 
}) => {

  const handleNavClick = (view: AppView) => {
    setView(view);
    if (window.innerWidth < 1024) toggleSidebar();
  };

  // Fixed sidebar classes
  const sidebarClasses = `fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-zinc-800/50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
    isOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'
  }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-800/50 bg-black/50 backdrop-blur-xl">
             <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavClick(AppView.HOME)}>
               <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Logo className="w-7 h-7 relative z-10" />
               </div>
               <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-purple-500">
                 VETORRE
               </span>
             </div>
          </div>

          {/* Navigation Scroll Area */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            
            <NavGroup title="Discover">
              <NavItem 
                label="All Tools" 
                icon={LayoutGrid} 
                isActive={currentView === AppView.HOME} 
                onClick={() => handleNavClick(AppView.HOME)} 
                delay={100}
                isOpen={isOpen}
              />
              <NavItem 
                label="Top Rated" 
                icon={Trophy} 
                isActive={currentView === AppView.TOP_TOOLS} 
                onClick={() => handleNavClick(AppView.TOP_TOOLS)} 
                delay={150}
                isOpen={isOpen}
              />
              <NavItem 
                label="Free Tools" 
                icon={Gift} 
                isActive={currentView === AppView.FREE_TOOLS} 
                onClick={() => handleNavClick(AppView.FREE_TOOLS)} 
                delay={200}
                isOpen={isOpen}
              />
              <NavItem 
                label="Paid Tools" 
                icon={DollarSign} 
                isActive={currentView === AppView.PAID_TOOLS} 
                onClick={() => handleNavClick(AppView.PAID_TOOLS)} 
                delay={250}
                isOpen={isOpen}
              />
            </NavGroup>

            <NavGroup title="Studio">
              <NavItem 
                label="Latest News" 
                icon={Newspaper} 
                isActive={currentView === AppView.LATEST_NEWS} 
                onClick={() => handleNavClick(AppView.LATEST_NEWS)} 
                delay={300}
                isOpen={isOpen}
              />
            </NavGroup>

            {user?.role === 'admin' && (
              <NavGroup title="System">
                <NavItem 
                  label="Admin Dashboard" 
                  icon={ShieldAlert} 
                  isActive={currentView === AppView.ADMIN} 
                  onClick={() => handleNavClick(AppView.ADMIN)} 
                  delay={350}
                  isOpen={isOpen}
                />
              </NavGroup>
            )}
            
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/20">
             {user ? (
               <div 
                 className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 group cursor-pointer hover:bg-zinc-900 transition-colors ${currentView === AppView.PROFILE ? 'ring-1 ring-indigo-500/50' : ''}`}
                 onClick={() => handleNavClick(AppView.PROFILE)}
                 title="View Profile"
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 relative">
                      <User className="w-4 h-4" />
                      {user.plan === 'pro' && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 border-2 border-zinc-900 rounded-full"></div>
                      )}
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-medium text-white truncate">{user.email.split('@')[0]}</div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1">
                        {user.plan || 'Free'} Plan
                      </div>
                   </div>
                 </div>
                 
                 <button 
                  onClick={(e) => { e.stopPropagation(); onLogoutClick(); }}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 py-2 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                 >
                   <LogOut className="w-3 h-3" /> Sign Out
                 </button>
               </div>
             ) : (
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-4 text-center">
                  <h4 className="text-white font-bold text-sm mb-1">Join VETORRE</h4>
                  <p className="text-zinc-500 text-xs mb-3">Save tools & generate content.</p>
                  <button 
                    onClick={onLoginClick}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black py-2.5 rounded-lg text-sm font-bold transition-colors"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                </div>
             )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;