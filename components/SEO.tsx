
import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string[];
  topics?: string[];
  structuredData?: any | any[];
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  // Professional Abstract AI Network Image (Dark Blue/Purple Theme)
  image = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop", 
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  keywords = [],
  topics = [],
  structuredData
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // 2. Helper to update or create meta tags
    const updateMeta = (selector: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        
        // Parse attribute from selector (e.g. meta[property="og:title"])
        if (selector.includes('property=')) {
           const match = selector.match(/property="([^"]+)"/);
           if (match) element.setAttribute('property', match[1]);
        } else if (selector.includes('name=')) {
           const match = selector.match(/name="([^"]+)"/);
           if (match) element.setAttribute('name', match[1]);
        }
        
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const removeNodeById = (id: string) => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    };

    const updateStructuredData = (data: any | any[]) => {
      removeNodeById('seo-structured-data');
      if (!data) return;
      const script = document.createElement('script');
      script.id = 'seo-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
    };

    // 3. Update Standard Meta
    updateMeta('meta[name="description"]', description);

    // 3b. Keywords & Topics (helps with intent-based discovery)
    const keywordList = Array.from(new Set([...(keywords || []), ...(topics || [])])).filter(Boolean);
    if (keywordList.length) {
      updateMeta('meta[name="keywords"]', keywordList.join(', '));
    }

    // 4. Update Open Graph
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:image"]', image);
    updateMeta('meta[property="og:url"]', url);
    updateMeta('meta[property="og:type"]', type);

    // 5. Update Twitter Card
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);
    updateMeta('meta[name="twitter:image"]', image);
    updateMeta('meta[name="twitter:card"]', 'summary_large_image');

    // 6. Structured Data (JSON-LD)
    updateStructuredData(structuredData);

  }, [title, description, image, url, type, keywords, topics, structuredData]);

  return null;
};

export default SEO;
