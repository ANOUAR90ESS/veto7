
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // CORS headers for handling cross-origin requests
  const origin = req.headers.origin || '';
  // Verify origin matches our domain or localhost in dev
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://www.vetorre.com', 'https://vetorre.com'];
  if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://www.vetorre.com');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate Auth Header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { task, model, contents, config, prompt, image, operationName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server API Key configuration missing' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let response;

    switch (task) {
      case 'generateContent':
        response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: config
        });
        // Return text directly or full response based on client need
        // We return the raw object so client helper can parse it
        return res.status(200).json(response);

      case 'generateImages':
        // Note: SDK structure might differ for pure Imagen, but here we proxy whatever the client sends
        // Ideally we wrap specific calls. Assuming the client sends proper params for the chosen model.
        // For gemini-pro-image-preview it uses generateContent (handled above).
        // If specific imagen model:
        response = await ai.models.generateImages({
            model: model,
            prompt: prompt,
            config: config
        });
        return res.status(200).json(response);

      case 'generateVideos':
        // returns an operation object
        const videoOp = await ai.models.generateVideos({
          model: model,
          prompt: prompt,
          image: image, // Optional input image
          config: config
        });
        // We return the operation name so client can poll
        return res.status(200).json({ name: videoOp.name });

      case 'getVideosOperation':
        // Polling status
        const operation = await ai.operations.getVideosOperation({ operation: operationName });
        return res.status(200).json(operation);

      default:
        return res.status(400).json({ error: 'Invalid task specified' });
    }

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
        error: error.message || 'Internal Server Error',
        details: error.toString()
    });
  }
}
