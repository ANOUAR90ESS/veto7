
import { Type, Modality } from "@google/genai";
import { Tool, Slide, NewsArticle, TutorialSection, Course } from "../types";

// --- API Proxy Helper ---
// This function handles communication with your Vercel serverless function
const callGeminiAPI = async (payload: any) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini API Call Failed:", error);
    throw error;
  }
};

// Helper to clean and parse JSON from text responses (required when using Search Grounding)
const parseJSONFromText = (text: string | undefined): any => {
  if (!text) return null;
  let cleaned = text.trim();
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from response:", cleaned);
    return null;
  }
};

// Helper for generating AI images
export const generateAIImage = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
    try {
        // We use generateContent with the image model via our proxy
        const response = await callGeminiAPI({
            task: 'generateContent',
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio, imageSize: "1K" } }
        });
        
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if(data) return `data:image/png;base64,${data}`;
    } catch(e) {
        console.warn("Image gen failed", e);
    }
    // Fallback
    return `https://picsum.photos/seed/${Math.random()}/800/400`;
}

// --- Directory Generation (Tools) ---
export const generateDirectoryTools = async (count: number = 3, category?: string): Promise<Tool[]> => {
  const prompt = `Use Google Search to find ${count} REAL, currently trending AI tools${category ? ` specifically for ${category}` : ''}.
  
  Return a raw JSON array (no markdown formatting) of these tools. 
  CRITICAL: Return ONLY valid JSON. Escape all double quotes inside string values (e.g. "term" -> \\"term\\"). Do not add any text before or after the JSON.
  
  Each tool object MUST have:
  - name (The actual name of the tool)
  - description (A concise summary, max 15 words)
  - category (Best fit: Writing, Image, Video, Audio, Coding, Business)
  - tags (3 relevant tags)
  - price (Use one of these EXACT formats: "Free", "Freemium", "Paid ($X/mo)", "Paid (One-time)", or "Free Trial")
  - website (Real URL found in search)
  - features (3 real key features)
  - useCases (2 real-world use cases)
  - pros (2 real pros based on reviews)
  - cons (1 real con based on reviews)
  - howToUse (1-sentence quick start guide)`;

  const response = await callGeminiAPI({
    task: 'generateContent',
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Enable Search Grounding
      // responseMimeType: "application/json" // Disabled to allow tool use
    }
  });

  const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
  const toolsData = parseJSONFromText(rawText) || [];
  
  // Generate Real Images for each candidate in parallel
  const toolsWithImages = await Promise.all(toolsData.map(async (t: any, i: number) => {
      const imgPrompt = `Futuristic 3D icon or interface for the AI tool "${t.name}". ${t.description}. Sleek, modern, tech style.`;
      const imageUrl = await generateAIImage(imgPrompt, "16:9");
      return {
          ...t,
          id: t.id || `gen-${Date.now()}-${i}`,
          imageUrl: imageUrl
      };
  }));

  return toolsWithImages;
};

export const generateToolDetails = async (topic: string): Promise<Partial<Tool>> => {
  const prompt = `Research the AI tool "${topic}" using Google Search to get the latest details. 
  If "${topic}" is a general concept, find the best REAL tool matching it.
  
  Return a raw JSON object (no markdown) with accurate details:
  CRITICAL: Return ONLY valid JSON. Escape all double quotes inside string values (e.g. "term" -> \\"term\\"). Do not add any text before or after the JSON.

  - name
  - description (compelling, 2 sentences)
  - category (one of: Writing, Image, Video, Audio, Coding, Business)
  - price (Use one of these EXACT formats: "Free", "Freemium", "Paid ($X/mo)", "Paid (One-time)", or "Free Trial")
  - website (Real URL)
  - tags (3-5 relevant tags)
  - features (3-5 real key features)
  - useCases (3 real-world use cases)
  - pros (3 real pros)
  - cons (2 real cons)
  - howToUse (A short step-by-step guide)`;

  const response = await callGeminiAPI({
    task: 'generateContent',
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Enable Search Grounding
      // responseMimeType: "application/json" // Disabled to allow tool use
    }
  });

  const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
  const data = parseJSONFromText(rawText) || {};
  
  const imgPrompt = `A futuristic, high-tech abstract representation of the AI tool "${data.name || topic}". Digital art, sleek, modern UI elements, glowing nodes.`;
  const imageUrl = await generateAIImage(imgPrompt, "16:9");

  return {
    ...data,
    imageUrl: imageUrl
  };
};

// --- News Generation (Single & Batch) ---

export const generateNewsDetails = async (topic: string): Promise<Partial<NewsArticle>> => {
    const prompt = `Write a comprehensive, engaging news article about "${topic}".
    Use Google Search to find accurate, up-to-date facts, dates, and sources.
    
    Return raw JSON (no markdown) with:
    CRITICAL: Return ONLY valid JSON. Escape all double quotes inside string values (e.g. "term" -> \\"term\\"). Do not add any text before or after the JSON.

    - title: Catchy headline based on real events
    - description: Short summary (2 sentences)
    - content: Full article body (approx 200 words), use markdown inside the string for formatting.
    - category: e.g. Technology, AI, Business.
    - source: The primary source found (e.g. "TechCrunch", "The Verge", or "VETORRE Reporter")
    `;

    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }], // Enable Search Grounding
            // responseMimeType: "application/json" // Disabled to allow tool use
        }
    });

    const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    const data = parseJSONFromText(rawText) || {};
    
    const imgPrompt = `Editorial news illustration for "${data.title || topic}". Photorealistic, high quality, 4k, cinematic lighting.`;
    const imageUrl = await generateAIImage(imgPrompt, "16:9");

    return {
        ...data,
        imageUrl,
        date: new Date().toISOString()
    };
};

export const generateDirectoryNews = async (count: number = 3): Promise<NewsArticle[]> => {
    const prompt = `Use Google Search to find the top ${count} trending AI news stories from the last 24 hours.
    
    Return raw JSON array (no markdown). 
    CRITICAL: Return ONLY valid JSON. Escape all double quotes inside string values (e.g. "term" -> \\"term\\"). Do not add any text before or after the JSON.

    Each item MUST have:
    - title (Real headline)
    - description (Summary of the event)
    - content (Detailed report, ~150 words)
    - category
    - source (The publication found)
    `;

    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }], // Enable Search Grounding
            // responseMimeType: "application/json" // Disabled to allow tool use
        }
    });

    const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    const newsData = parseJSONFromText(rawText) || [];

    const newsWithImages = await Promise.all(newsData.map(async (n: any, i: number) => {
        const imgPrompt = `News illustration for "${n.title}". ${n.description}. Professional photography style.`;
        const imageUrl = await generateAIImage(imgPrompt, "16:9");
        return {
            ...n,
            id: `news-gen-${Date.now()}-${i}`,
            imageUrl: imageUrl,
            date: new Date().toISOString()
        };
    }));

    return newsWithImages;
};

export const extractNewsFromRSSItem = async (title: string, description: string): Promise<Partial<NewsArticle>> => {
  const prompt = `
    Write a detailed news article based on this topic: "${title} - ${description}".
    Use Google Search to find the latest details and expand on it with real facts.
    
    Return raw JSON object (no markdown) with:
    CRITICAL: Return ONLY valid JSON. Escape all double quotes inside string values (e.g. "term" -> \\"term\\"). Do not add any text before or after the JSON.

    - title: A clean, engaging headline
    - description: A short summary (max 2 sentences)
    - content: A longer, well-formatted blog post body (approx 200 words).
    - category: The best fitting category.
  `;

  const response = await callGeminiAPI({
    task: 'generateContent',
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Enable Search Grounding
      // responseMimeType: "application/json" // Disabled to allow tool use
    }
  });

  const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
  const data = parseJSONFromText(rawText) || {};
  
  const imgPrompt = `Editorial news illustration for "${data.title || title}". Modern, high quality.`;
  const imageUrl = await generateAIImage(imgPrompt, "16:9");

  return {
      ...data,
      imageUrl
  };
}

// --- Intelligent Search ---
export const intelligentSearch = async (query: string, tools: Tool[], news: NewsArticle[]): Promise<{ toolIds: string[], newsIds: string[] }> => {
    // Simplify data for token limit
    const simplifiedTools = tools.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        tags: t.tags
    }));

    const simplifiedNews = news.map(n => ({
        id: n.id,
        title: n.title,
        description: n.description,
        category: n.category
    }));

    const prompt = `
      You are an intelligent search engine for an AI tool directory.
      User Query: "${query}"
      
      Analyze the user's intent. Do they want a tool for a specific task? Are they looking for news about a topic? Or both?
      
      Here is the available data:
      TOOLS: ${JSON.stringify(simplifiedTools)}
      NEWS: ${JSON.stringify(simplifiedNews)}
      
      Return a JSON object with two arrays containing the IDs of relevant items.
      Be permissive but prioritize relevance.
    `;

    try {
        const response = await callGeminiAPI({
            task: 'generateContent',
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        toolIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        newsIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        return JSON.parse(response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '{"toolIds": [], "newsIds": []}');
    } catch (e) {
        console.error("AI Search Failed", e);
        return { toolIds: [], newsIds: [] };
    }
};

// --- Smart Chat (Search & Maps) ---
export const sendChatMessage = async (history: {role: string, parts: any[]}[], message: string, useSearch: boolean, useMaps: boolean) => {
  const tools: any[] = [];
  if (useSearch) tools.push({ googleSearch: {} });
  if (useMaps) tools.push({ googleMaps: {} });

  const model = (useSearch || useMaps) ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';

  const response = await callGeminiAPI({
    task: 'generateContent',
    model: model,
    contents: message,
    config: {
      tools: tools.length > 0 ? tools : undefined,
    }
  });

  // Client adapter to normalize .text property if missing on raw response from server
  if (!response.text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
      response.text = response.candidates[0].content.parts[0].text;
  }

  return response;
};

// --- Veo Video Generation ---
export const generateVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  // Construct input for proxy
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: aspectRatio
  };

  let imageInput = undefined;
  if (imageBase64) {
    imageInput = {
      imageBytes: imageBase64,
      mimeType: 'image/png'
    };
  }

  // Call proxy with specific video task
  const operationName = await callGeminiAPI({
    task: 'generateVideos',
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: imageInput,
    config: config
  });

  // Return the operation NAME object that the client polling function expects
  return operationName; // { name: '...' }
};

export const pollVideoOperation = async (operation: any) => {
  // Proxy the polling call
  return await callGeminiAPI({
      task: 'getVideosOperation',
      operationName: operation.name || operation
  });
};

// --- Image Studio (Gen & Edit) ---
export const generateImage = async (prompt: string, aspectRatio: string, size: string) => {
  // Using gemini-3-pro-image-preview via generateContent on server
  return await callGeminiAPI({
    task: 'generateContent',
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });
};

export const editImage = async (prompt: string, imageBase64: string) => {
  // Using gemini-2.5-flash-image for editing
  return await callGeminiAPI({
    task: 'generateContent',
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: imageBase64 } },
        { text: prompt }
      ]
    }
  });
};

// --- Audio Transcription & TTS ---
export const transcribeAudio = async (audioBase64: string) => {
    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
                { text: "Transcribe this audio exactly." }
            ]
        }
    });
    return response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
};

export const generateSpeech = async (text: string, voice: string = 'Kore') => {
    return await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
            }
        }
    });
}

export const generateConversationScript = async (topic: string, speaker1: string, speaker2: string) => {
    const prompt = `Write a short, engaging podcast dialogue (approx 150 words) between two hosts, ${speaker1} and ${speaker2}, discussing the topic: "${topic}". 
    Format it exactly like this:
    ${speaker1}: [Text]
    ${speaker2}: [Text]
    Keep it natural, conversational, and enthusiastic.`;

    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
};

export const generateMultiSpeakerSpeech = async (script: string, speaker1Config: {name: string, voice: string}, speaker2Config: {name: string, voice: string}) => {
    const prompt = `TTS the following conversation:\n${script}`;
    
    return await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        {
                            speaker: speaker1Config.name,
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Config.voice } }
                        },
                        {
                            speaker: speaker2Config.name,
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker2Config.voice } }
                        }
                    ]
                }
            }
        }
    });
};

// --- Admin & Tool Insights ---

export const extractToolFromRSSItem = async (title: string, description: string): Promise<Partial<Tool>> => {
  const prompt = `
    Analyze this RSS feed item and extract structured data to create an AI Tool listing.
    Title: ${title}
    Description: ${description}
    Use Google Search to confirm details and pricing if the description is sparse.
    
    Return raw JSON object (no markdown) with:
    CRITICAL: Return ONLY valid JSON. Escape all double quotes inside string values (e.g. "term" -> \\"term\\"). Do not add any text before or after the JSON.

    - name: A catchy tool name based on the title
    - description: A concise 1-sentence description
    - category: The best fitting category (e.g., Writing, Image, Video, Coding, Analytics)
    - tags: A list of 3 relevant tags
    - price: Estimated price model (e.g. "Free", "Paid", "Freemium") - guess based on context or default to "Waitlist"
  `;

  const response = await callGeminiAPI({
    task: 'generateContent',
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Enable Search Grounding
      // responseMimeType: "application/json" // Disabled to allow tool use
    }
  });

  const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseJSONFromText(rawText) || {};
}

export const generateToolSlides = async (tool: Tool): Promise<Slide[]> => {
    const prompt = `Create a 4-slide presentation about the AI tool "${tool.name}". 
    Description: ${tool.description}. 
    Category: ${tool.category}.
    
    Return JSON array of slides.`;

    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
}

export const generateToolTutorial = async (tool: Tool): Promise<TutorialSection[]> => {
    const prompt = `
        You are an expert AI instructor. Create a visual mini-course for the AI tool "${tool.name}".
        Target audience: Beginners.
        
        Return a JSON list of 3 educational modules.
        Each module must have:
        - title: Module Title (e.g. "Step 1: Setup")
        - content: 2-3 sentences explaining the concept simply.
        - imageDescription: A detailed visual description to generate an educational illustration for this specific module (e.g. "A minimalist diagram showing data flow...").
    `;
    
    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        imageDescription: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const modules = JSON.parse(response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
    
    const modulesWithImages = await Promise.all(modules.map(async (mod: any) => {
        const imageUrl = await generateAIImage(`Educational illustration: ${mod.imageDescription}`, "16:9");
        return {
            title: mod.title,
            content: mod.content,
            imageUrl
        };
    }));

    return modulesWithImages;
}

export const generateFullCourse = async (tool: Tool): Promise<Course> => {
    const prompt = `
    Create a comprehensive deep-dive educational course about the AI tool "${tool.name}".
    Description: ${tool.description}.
    
    The course must be structured as valid JSON.
    It should have 2 Modules. Each module has 1 Lesson.
    
    Structure:
    - title: Course Title
    - totalDurationHours: Estimated hours
    - suggestedResources: string[] (3 links or books)
    - modules: Array of Modules
      - title
      - overview (short)
      - videoScript: A 30-word script for a video intro to this module.
      - lessons: Array of Lessons
         - title
         - durationMinutes
         - content: A detailed markdown lesson (at least 200 words) with headers and bullet points explaining how to use "${tool.name}".
      - practicalExercises: string[] (2 practical tasks)
      - quiz: Object
         - questions: Array of 2 questions
            - type: "multiple-choice" or "true-false"
            - question: The question text
            - options: string array. For True/False, use ["True", "False"]. For multiple-choice, provide 4 options.
            - correctAnswerIndex: number (0-3 for MC, 0-1 for TF)
            - explanation: A concise, helpful sentence explaining why the correct answer is right.
    `;

    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });
    
    return JSON.parse(response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
}

export const generatePodcastScript = async (tool: Tool): Promise<string> => {
    const prompt = `Write a very short, enthusiastic podcast intro script (approx 50 words) introducing the AI tool "${tool.name}". 
    The host is excited about features: ${tool.description}.`;
    
    const response = await callGeminiAPI({
        task: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// --- Analytics ---

export const analyzeToolTrends = async (tools: Tool[]): Promise<string> => {
  const toolList = tools.map(t => `- ${t.name} (${t.category}): ${t.description}`).join('\n');
  const prompt = `
    You are an expert market analyst for AI technologies.
    Analyze the following list of AI tools currently in our directory:
    
    ${toolList}
    
    Please provide a concise but insightful report covering:
    1. **Current Trend**: What is the dominant theme?
    2. **Market Gap**: What kind of tool is missing or underrepresented?
    3. **Prediction**: What should be the next big tool we build?
    
    Format the response in Markdown with clear headings.
  `;

  // Use Gemini 3 Pro with Thinking Mode
  const response = await callGeminiAPI({
    task: 'generateContent',
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
        thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  
  return response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate analysis.";
}
