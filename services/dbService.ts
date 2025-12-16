
import { supabase } from './supabase';
import { Tool, NewsArticle, UserPlan, UserProfile } from '../types';

// Mappers to handle CamelCase (App) <-> SnakeCase (DB)
const mapToolFromDB = (data: any): Tool => ({
  ...data,
  imageUrl: data.image_url || data.imageUrl || '',
  useCases: data.use_cases || data.useCases,
  howToUse: data.how_to_use || data.howToUse,
  // JSON fields typically come back as objects automatically from Supabase JS client
  slides: data.slides,
  tutorial: data.tutorial,
  course: data.course,
});

const mapToolToDB = (tool: Partial<Tool>) => {
  const { imageUrl, useCases, howToUse, slides, tutorial, course, ...rest } = tool;
  return {
    ...rest,
    image_url: imageUrl,
    use_cases: useCases,
    how_to_use: howToUse,
    slides: slides,
    tutorial: tutorial,
    course: course,
  };
};

const mapNewsFromDB = (data: any): NewsArticle => ({
  ...data,
  imageUrl: data.image_url || data.imageUrl || '',
});

const mapNewsToDB = (news: Partial<NewsArticle>) => {
  const { imageUrl, ...rest } = news;
  return {
    ...rest,
    image_url: imageUrl,
  };
};

// --- Usage & Limits ---

export const getPlanLimits = (plan: UserPlan = 'free') => {
    switch (plan) {
        case 'pro': return { generations: 10000, label: 'Unlimited' };
        case 'starter': return { generations: 100, label: '100' };
        case 'free': default: return { generations: 10, label: '10' };
    }
};

export const checkUsageLimit = (user: UserProfile | null): boolean => {
    if (!user) return false;
    const limit = getPlanLimits(user.plan || 'free').generations;
    return (user.generationsCount || 0) < limit;
};

export const incrementUserGenerations = async (userId: string) => {
    if (!supabase) return;

    // Use RPC for atomic increment if available, otherwise fallback to fetch+update
    try {
        const { error } = await supabase.rpc('increment_generations', { user_id: userId });
        if (error) throw error;
    } catch (e) {
        // Fallback: Fetch current, increment, update (less safe for race conditions but works for simple app)
        const { data } = await supabase.from('profiles').select('generations_count').eq('id', userId).single();
        if (data) {
            const newCount = (data.generations_count || 0) + 1;
            await supabase.from('profiles').update({ generations_count: newCount }).eq('id', userId);
        }
    }
};

// --- Tools Operations ---

export const subscribeToTools = (callback: (tools: Tool[]) => void, onError?: (error: any) => void) => {
  if (!supabase) {
    console.warn("Supabase not initialized, skipping tool subscription.");
    if (onError) onError(new Error("Supabase client not initialized"));
    return () => {};
  }

  const fetchTools = async () => {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching tools:", error.message || JSON.stringify(error));
        if (onError) onError(error);
        return;
    }
    
    if (data) callback(data.map(mapToolFromDB));
  };

  // Initial Fetch
  fetchTools();

  // Realtime Subscription
  const channel = supabase.channel('tools_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tools' }, () => {
        fetchTools();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const addToolToDb = async (tool: Partial<Tool>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  
  const dbData = mapToolToDB(tool);
  // Remove ID to let DB generate UUID
  delete (dbData as any).id;
  
  const { error } = await supabase.from('tools').insert(dbData);
  if (error) throw error;
};

export const updateToolInDb = async (id: string, tool: Partial<Tool>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const dbData = mapToolToDB(tool);
  // Remove ID from payload to avoid PK conflict if passed
  delete (dbData as any).id;
  delete (dbData as any).created_at; 
  
  const { error } = await supabase.from('tools').update(dbData).eq('id', id);
  if (error) throw error;
};

export const deleteToolFromDb = async (id: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { error } = await supabase.from('tools').delete().eq('id', id);
  if (error) throw error;
};

// --- News Operations ---

export const subscribeToNews = (callback: (news: NewsArticle[]) => void, onError?: (error: any) => void) => {
  if (!supabase) {
    console.warn("Supabase not initialized, skipping news subscription.");
    if (onError) onError(new Error("Supabase client not initialized"));
    return () => {};
  }

  const fetchNews = async () => {
    const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });
    
    if (error) {
        console.error("Error fetching news:", error.message || JSON.stringify(error));
        if (onError) onError(error);
        return;
    }

    if (data) callback(data.map(mapNewsFromDB));
  };

  // Initial Fetch
  fetchNews();

  // Realtime Subscription
  const channel = supabase.channel('news_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        fetchNews();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const addNewsToDb = async (article: Partial<NewsArticle>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  
  const dbData = mapNewsToDB(article);
  delete (dbData as any).id;

  const { error } = await supabase.from('news').insert({
    ...dbData,
    date: new Date().toISOString()
  });
  if (error) throw error;
};

export const updateNewsInDb = async (id: string, article: Partial<NewsArticle>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const dbData = mapNewsToDB(article);
  delete (dbData as any).id;
  
  const { error } = await supabase.from('news').update(dbData).eq('id', id);
  if (error) throw error;
};

export const deleteNewsFromDb = async (id: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw error;
};

// --- User Operations ---

export const updateUserPlan = async (userId: string, plan: UserPlan, subscriptionEnd: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      plan: plan,
      subscription_end: subscriptionEnd 
    })
    .eq('id', userId);

  if (error) throw error;
};
