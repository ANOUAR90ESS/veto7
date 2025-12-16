
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // CORS headers for handling cross-origin requests if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
