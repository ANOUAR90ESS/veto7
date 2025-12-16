import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMetadata {
  title: string;
  description: string;
}

const routeTitles: Record<string, PageMetadata> = {
  '/': {
    title: 'VETORRE - AI Tool Directory & Studio',
    description: 'Discover next-gen AI tools, generate cinematic videos with Veo, and create instant visual courses.'
  },
  '/admin': {
    title: 'Admin Dashboard - VETORRE',
    description: 'Manage AI tools and content'
  },
  '/pricing': {
    title: 'Pricing - VETORRE',
    description: 'Choose your plan and unlock AI features'
  },
  '/payment-success': {
    title: 'Payment Successful - VETORRE',
    description: 'Thank you for your purchase'
  }
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    
    // Check for news route
    if (pathname.startsWith('/news/')) {
      document.title = 'News - VETORRE';
      return;
    }

    // Get metadata for current route
    const metadata = routeTitles[pathname] || routeTitles['/'];
    document.title = metadata.title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', metadata.description);
    }

    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://www.vetorre.com${pathname}`);
    }

    // Update OG URL
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', `https://www.vetorre.com${pathname}`);
    }
  }, [location.pathname]);
};
