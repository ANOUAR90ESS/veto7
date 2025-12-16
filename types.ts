
import { LiveServerMessage, Modality } from "@google/genai";

export type UserPlan = 'free' | 'starter' | 'pro';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  imageUrl: string;
  website: string;
  // Detailed Information
  features?: string[];
  useCases?: string[];
  pros?: string[];
  cons?: string[];
  howToUse?: string;
  // Premium Content
  slides?: Slide[];
  tutorial?: TutorialSection[];
  course?: Course;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  content: string;
  source: string;
  date: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  plan?: UserPlan;
  subscriptionEnd?: string;
  generationsCount?: number;
}

export enum AppView {
  HOME = 'HOME',
  TOP_TOOLS = 'TOP_TOOLS',
  FREE_TOOLS = 'FREE_TOOLS',
  PAID_TOOLS = 'PAID_TOOLS',
  LIVE_CHAT = 'LIVE_CHAT',
  VEO_STUDIO = 'VEO_STUDIO',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  SMART_CHAT = 'SMART_CHAT',
  AUDIO_LAB = 'AUDIO_LAB',
  LATEST_NEWS = 'LATEST_NEWS',
  ADMIN = 'ADMIN',
  PAGES = 'PAGES',
  PRICING = 'PRICING',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  PROFILE = 'PROFILE'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingUrls?: Array<{ uri: string; title: string }>;
}

export interface Slide {
  title: string;
  content: string[];
}

export interface TutorialSection {
  title: string;
  content: string;
  imageUrl: string;
}

// Course Types
export interface QuizQuestion {
  type?: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string; // Reasoning for the correct answer
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface Lesson {
  title: string;
  durationMinutes: number;
  content: string; // Markdown
}

export interface Module {
  title: string;
  overview: string;
  videoScript?: string;
  lessons: Lesson[];
  practicalExercises: string[];
  quiz: Quiz;
}

export interface Course {
  title: string;
  totalDurationHours: number;
  modules: Module[];
  suggestedResources: string[];
}

// Global window extension for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    aistudio?: AIStudio;
  }
}
