import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tool, NewsArticle } from '../types';
import { 
  addToolToDb, 
  updateToolInDb, 
  deleteToolFromDb,
  addNewsToDb,
  updateNewsInDb,
  deleteNewsFromDb
} from './dbService';
import { supabase, isSupabaseConfigured } from './supabase';

// Fetch Tools
const fetchTools = async (): Promise<Tool[]> => {
  if (!supabase || !isSupabaseConfigured) return [];
  
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map((item: any) => ({
    ...item,
    imageUrl: item.image_url || item.imageUrl || '',
    useCases: item.use_cases || item.useCases,
    howToUse: item.how_to_use || item.howToUse,
    slides: item.slides,
    tutorial: item.tutorial,
    course: item.course,
  }));
};

// Fetch News
const fetchNews = async (): Promise<NewsArticle[]> => {
  if (!supabase || !isSupabaseConfigured) return [];
  
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  
  return data.map((item: any) => ({
    ...item,
    imageUrl: item.image_url || item.imageUrl || '',
  }));
};

// Hook: Use Tools with React Query
export const useTools = () => {
  return useQuery({
    queryKey: ['tools'],
    queryFn: fetchTools,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
    refetchOnWindowFocus: false,
    enabled: isSupabaseConfigured,
  });
};

// Hook: Use News with React Query
export const useNews = () => {
  return useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isSupabaseConfigured,
  });
};

// Mutation: Add Tool
export const useAddTool = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tool: Tool) => addToolToDb(tool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
};

// Mutation: Update Tool
export const useUpdateTool = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, tool }: { id: string; tool: Tool }) => updateToolInDb(id, tool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
};

// Mutation: Delete Tool
export const useDeleteTool = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteToolFromDb(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tools'] });
      const previousTools = queryClient.getQueryData<Tool[]>(['tools']);
      
      queryClient.setQueryData<Tool[]>(['tools'], (old) => 
        old ? old.filter(t => t.id !== id) : []
      );
      
      return { previousTools };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTools) {
        queryClient.setQueryData(['tools'], context.previousTools);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
};

// Mutation: Add News
export const useAddNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (article: NewsArticle) => addNewsToDb(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });
};

// Mutation: Update News
export const useUpdateNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, article }: { id: string; article: NewsArticle }) => updateNewsInDb(id, article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });
};

// Mutation: Delete News
export const useDeleteNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteNewsFromDb(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['news'] });
      const previousNews = queryClient.getQueryData<NewsArticle[]>(['news']);
      
      queryClient.setQueryData<NewsArticle[]>(['news'], (old) => 
        old ? old.filter(n => n.id !== id) : []
      );
      
      return { previousNews };
    },
    onError: (err, id, context) => {
      if (context?.previousNews) {
        queryClient.setQueryData(['news'], context.previousNews);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });
};
