
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createClient, User } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Import Payment Handlers
import createCheckoutHandler from '../api/create-checkout';
import verifyPaymentHandler from '../api/verify-payment';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing in .env');
}

// Client with SERVICE ROLE - ONLY for backend use
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const app = express();
app.use(cors() as any);
app.use(express.json() as any);

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware: Extracts Bearer token and validates with Supabase
 */
const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = (req as any).headers['authorization'];
    if (!authHeader) {
      (res as any).status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    
    // Verify token against Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      (res as any).status(401).json({ error: 'Invalid token' });
      return;
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = data.user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    (res as any).status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Serverless Backend Endpoint: Generate AI Content
 */
app.post('/api/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, model = 'gemini-2.5-flash', config } = (req as any).body;

    if (!GEMINI_API_KEY) {
      (res as any).status(500).json({ error: 'Server API Key not configured' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // Call Gemini
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config
    });

    (res as any).json({ 
      text: response.text, 
      raw: response 
    });

  } catch (err: any) {
    console.error("AI Generation Error:", err);
    (res as any).status(500).json({ error: err.message || 'Failed to generate content' });
  }
});

// --- Payment Routes ---
app.post('/api/create-checkout', (req, res) => createCheckoutHandler(req, res));
app.post('/api/verify-payment', (req, res) => verifyPaymentHandler(req, res));

/**
 * Health Check for Serverless Deployment
 */
app.get('/api/health', (req, res) => {
  (res as any).status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
