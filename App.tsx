
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
const ClientLayout = lazy(() => import('./components/ClientLayout'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess'));
import { AppView, Tool, NewsArticle, UserProfile } from './types';
import { generateDirectoryTools } from './services/geminiService';
import { 
  useTools,
  useNews,
  useAddTool,
  useUpdateTool,
  useDeleteTool,
  useAddNews,
  useUpdateNews,
  useDeleteNews
} from './services/queryHooks';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { getCurrentUserProfile, signOut } from './services/authService';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // React Query Hooks para data con cache
  const { data: tools = [], isError: toolsError } = useTools();
  const { data: news = [], isError: newsError } = useNews();
  
  // Mutations
  const addToolMutation = useAddTool();
  const updateToolMutation = useUpdateTool();
  const deleteToolMutation = useDeleteTool();
  const addNewsMutation = useAddNews();
  const updateNewsMutation = useUpdateNews();
  const deleteNewsMutation = useDeleteNews();

  // Local state for fallback
  const [localTools, setLocalTools] = useState<Tool[]>([]);
  const [localNews, setLocalNews] = useState<NewsArticle[]>([]);
  const [dbError, setDbError] = useState(false);

  // Check for API Key (AI Studio environment)
  const [hasApiKey, setHasApiKey] = useState(false);

  // Use Supabase data if available, otherwise fallback to local
  const displayTools = isSupabaseConfigured ? tools : localTools;
  const displayNews = Array.isArray(isSupabaseConfigured ? news : localNews) 
    ? (isSupabaseConfigured ? news : localNews) 
    : [];

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
       setDbError(true);
       checkApiKeyAndLoadLocal();
       return;
    }

    // Auth Subscription
    const checkUser = async () => {
        const profile = await getCurrentUserProfile();
        setUser(profile);
    };
    checkUser();

    // Listen for Auth changes (Login/Logout)
    const { data: authListener } = supabase?.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const profile = await getCurrentUserProfile();
            setUser(profile);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
        }
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    // Check API Key for AI Studio features
    checkApiKeyAndLoadLocal();

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle errors from React Query
  useEffect(() => {
    if (toolsError && isSupabaseConfigured) {
      console.error("Error fetching tools");
      setDbError(true);
      loadToolsLocally();
    }
  }, [toolsError]);

  const checkApiKeyAndLoadLocal = async () => {
      // Logic for AI Studio Env
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
          if (hasKey && !isSupabaseConfigured) {
              loadToolsLocally();
          }
      } else {
          // Normal env or fallback
          setHasApiKey(true); 
          if (!isSupabaseConfigured) loadToolsLocally();
      }
  };

  const loadToolsLocally = async () => {
    // Used for demo mode when DB is not connected
    try {
      const newTools = await generateDirectoryTools();
      // Ensure we don't duplicate if called multiple times or on top of existing data if needed
      setLocalTools(prev => {
          if (prev.length > 0) return prev; // Don't overwrite if we have data
          return newTools;
      });
    } catch (e) {
      console.error("Failed to load tools", e);
    }
  };

  const handleAuthSuccess = async () => {
      const profile = await getCurrentUserProfile();
      setUser(profile);
  };

  const handleLogout = async () => {
      try {
          await signOut();
          setUser(null); // Explicitly clear user state for demo users
      } catch (e) {
          console.error("Logout failed", e);
      }
  };

  const handleAddTool = async (tool: Tool) => {
    try {
        if (isSupabaseConfigured) {
            await addToolMutation.mutateAsync(tool);
        } else {
            setLocalTools(prev => [tool, ...prev]);
        }
    } catch (e: any) {
        console.error("Error adding tool", e);
        alert(`Failed to save tool: ${e.message}`);
    }
  };

  const handleUpdateTool = async (id: string, tool: Tool) => {
    try {
        if (isSupabaseConfigured) {
            await updateToolMutation.mutateAsync({ id, tool });
        } else {
            setLocalTools(prev => prev.map(t => t.id === id ? { ...tool, id } : t));
        }
    } catch (e: any) {
        console.error("Error updating tool", e);
        // Silent fail for UX in modal, or log to console
    }
  };

  const handleAddNews = async (article: NewsArticle) => {
    try {
        if (isSupabaseConfigured) {
            await addNewsMutation.mutateAsync(article);
        } else {
            setLocalNews(prev => [article, ...prev]);
        }
    } catch (e: any) {
        console.error("Error adding news", e);
        alert(`Failed to save news: ${e.message}`);
    }
  };

  const handleUpdateNews = async (id: string, article: NewsArticle) => {
    try {
        if (isSupabaseConfigured) {
            await updateNewsMutation.mutateAsync({ id, article });
        } else {
            setLocalNews(prev => prev.map(n => n.id === id ? { ...article, id } : n));
        }
    } catch (e: any) {
        console.error("Error updating news", e);
        alert(`Failed to update news: ${e.message}`);
    }
  };
  
  const handleDeleteTool = async (id: string) => {
    console.log("Deleting tool:", id);
    
    if (isSupabaseConfigured) {
        try {
            await deleteToolMutation.mutateAsync(id);
        } catch (error: any) {
            console.error("Delete failed:", error);
            alert(`Failed to delete tool from database: ${error.message}.`);
        }
    } else {
        setLocalTools(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDeleteNews = async (id: string) => {
    console.log("Deleting news:", id);
    
    if (isSupabaseConfigured) {
        try {
            await deleteNewsMutation.mutateAsync(id);
        } catch (error: any) {
            console.error("Delete failed:", error);
            alert(`Failed to delete article from database: ${error.message}.`);
        }
    } else {
        setLocalNews(prev => prev.filter(n => n.id !== id));
    }
  };

  // Reusable Main App Layout to avoid duplication in routes
  const mainApp = (
    <ClientLayout
         user={user}
         tools={displayTools}
         news={displayNews}
         hasApiKey={hasApiKey}
         setHasApiKey={setHasApiKey}
         isAuthModalOpen={isAuthModalOpen}
         setIsAuthModalOpen={setIsAuthModalOpen}
         onLogoutClick={handleLogout}
         dbError={dbError}
         onUpdateNews={handleUpdateNews}
         onUpdateTool={handleUpdateTool}
    />
  );

  return (
    <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center h-screen text-white">Loading…</div>}>
                <Routes>
                    <Route path="/admin" element={
            user?.role === 'admin' ? (
               <AdminDashboard 
                  tools={displayTools} 
                  news={displayNews}
                  user={user}
                  onAddTool={handleAddTool} 
                  onUpdateTool={handleUpdateTool}
                  onAddNews={handleAddNews} 
                  onUpdateNews={handleUpdateNews}
                  onDeleteTool={handleDeleteTool}
                  onDeleteNews={handleDeleteNews}
                  onBack={() => {}} 
               />
            ) : (
                <div className="flex items-center justify-center h-screen bg-black text-white">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
                    <p className="mb-4 text-zinc-400">Please log in as an administrator to access this page.</p>
                    <a href="/" className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-500">Go to Home</a>
                  </div>
                </div>
            )
                    } />
        
                    {/* Payment Success Route */}
                    <Route path="/payment-success" element={<PaymentSuccess />} />

                    {/* Pricing Route */}
                    <Route path="/pricing" element={<PricingPage user={user} onLoginRequest={() => setIsAuthModalOpen(true)} />} />

                    {/* Main App Routes */}
                    <Route path="/" element={
                            <>
                                 {mainApp}
                                 <AuthModal 
                                     isOpen={isAuthModalOpen} 
                                     onClose={() => setIsAuthModalOpen(false)} 
                                     onSuccess={handleAuthSuccess}
                                 />
                            </>
                    } />
                        <Route path="/free-tools" element={
                                <>
                                     {mainApp}
                                     <AuthModal 
                                         isOpen={isAuthModalOpen} 
                                         onClose={() => setIsAuthModalOpen(false)} 
                                         onSuccess={handleAuthSuccess}
                                     />
                                </>
                        } />
                        <Route path="/paid-tools" element={
                                <>
                                     {mainApp}
                                     <AuthModal 
                                         isOpen={isAuthModalOpen} 
                                         onClose={() => setIsAuthModalOpen(false)} 
                                         onSuccess={handleAuthSuccess}
                                     />
                                </>
                        } />
                        <Route path="/top-tools" element={
                                <>
                                     {mainApp}
                                     <AuthModal 
                                         isOpen={isAuthModalOpen} 
                                         onClose={() => setIsAuthModalOpen(false)} 
                                         onSuccess={handleAuthSuccess}
                                     />
                                </>
                        } />
                    <Route path="/news/*" element={
                            <>
                                 {mainApp}
                                 <AuthModal 
                                     isOpen={isAuthModalOpen} 
                                     onClose={() => setIsAuthModalOpen(false)} 
                                     onSuccess={handleAuthSuccess}
                                 />
                            </>
                    } />
                        <Route path="/profile" element={
                                <>
                                     {mainApp}
                                     <AuthModal 
                                         isOpen={isAuthModalOpen} 
                                         onClose={() => setIsAuthModalOpen(false)} 
                                         onSuccess={handleAuthSuccess}
                                     />
                                </>
                        } />
        
                    {/* 404 Catch-All */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
    </BrowserRouter>
  );
};

export default App;
