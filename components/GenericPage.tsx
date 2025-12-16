import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Users, Mail, Terminal, FileText, Lock, Cookie } from 'lucide-react';
import AdUnit from './AdUnit';

interface GenericPageProps {
  pageId: string;
  onBack: () => void;
}

const GenericPage: React.FC<GenericPageProps> = ({ pageId, onBack }) => {
  const getPageContent = () => {
    switch (pageId) {
      case 'about':
        return {
          title: 'About VETORRE',
          icon: Users,
          content: (
            <>
              <p>Welcome to VETORRE, the premier destination for discovering and creating with the next generation of artificial intelligence.</p>
              <p>Founded in 2024, our mission is to democratize access to advanced AI models like Gemini 2.5 Flash, Pro Vision, and Veo. We believe that the future of creativity and productivity lies in the seamless integration of human intent and machine intelligence.</p>
              <h3>Our Vision</h3>
              <p>We envision a world where anyone can turn an idea into reality in seconds—whether that's generating a high-definition video, analyzing complex data trends, or having a natural conversation with a digital assistant.</p>
              <h3>The Technology</h3>
              <p>VETORRE is built on top of the Google GenAI SDK, leveraging the latest breakthroughs in multimodal processing. Our platform demonstrates the capabilities of low-latency audio processing, high-fidelity image generation, and semantic understanding.</p>
            </>
          )
        };
      case 'careers':
        return {
          title: 'Join Our Team',
          icon: Users,
          content: (
            <>
              <p>We are always looking for visionary engineers, designers, and AI researchers to join our remote-first team.</p>
              <h3>Open Positions</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Senior Frontend Engineer (React/TypeScript)</strong> - Build the interfaces of the future.</li>
                <li><strong>AI Research Scientist</strong> - Push the boundaries of what Gemini can do.</li>
                <li><strong>Product Designer</strong> - Craft intuitive experiences for complex AI tools.</li>
              </ul>
              <p className="mt-6">Send your resume and portfolio to <a href="#" className="text-indigo-400">careers@vetorre.com</a>.</p>
            </>
          )
        };
      case 'contact':
        return {
          title: 'Contact Us',
          icon: Mail,
          content: (
            <>
              <p>Have questions about our platform or enterprise solutions? We'd love to hear from you.</p>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mt-6">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                   <div>
                      <label className="block text-sm text-zinc-400 mb-1">Name</label>
                      <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" />
                   </div>
                   <div>
                      <label className="block text-sm text-zinc-400 mb-1">Email</label>
                      <input type="email" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" />
                   </div>
                   <div>
                      <label className="block text-sm text-zinc-400 mb-1">Message</label>
                      <textarea className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-32" />
                   </div>
                   <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500">Send Message</button>
                </form>
              </div>
            </>
          )
        };
      case 'api':
        return {
          title: 'Developer API',
          icon: Terminal,
          content: (
            <>
              <p>Integrate VETORRE capabilities directly into your applications.</p>
              <h3>Authentication</h3>
              <p>All API requests require a valid API key passed in the header.</p>
              <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm text-emerald-400 font-mono my-4">
                Authorization: Bearer YOUR_API_KEY
              </pre>
              <h3>Endpoints</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><code>GET /v1/tools</code> - Retrieve list of AI tools</li>
                <li><code>POST /v1/generate/image</code> - Generate images</li>
                <li><code>POST /v1/generate/video</code> - Create Veo videos</li>
              </ul>
              <p className="mt-4">Read the full <a href="#" className="text-indigo-400">API Documentation</a>.</p>
            </>
          )
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: Shield,
          content: (
            <>
              <p><strong>Last Updated: October 2025</strong></p>
              <p>At VETORRE, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p>
              <h3>Data Collection</h3>
              <p>We collect information you provide directly to us, such as when you create an account, update your profile, or use our AI tools. This may include your name, email address, and generated content.</p>
              <h3>AI Data Usage</h3>
              <p>Content generated through our tools is processed by Google's Gemini models. We do not use your personal data to train public models without your explicit consent.</p>
              <h3>Your Rights</h3>
              <p>You have the right to access, correct, or delete your personal data at any time. Contact privacy@vetorre.com for assistance.</p>
            </>
          )
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          icon: FileText,
          content: (
            <>
              <p>By accessing or using VETORRE, you agree to be bound by these Terms of Service.</p>
              <h3>Usage Restrictions</h3>
              <p>You agree not to use the platform for any illegal purpose or to generate content that violates our Content Policy (e.g., hate speech, explicit content).</p>
              <h3>Intellectual Property</h3>
              <p>You retain ownership of the content you generate using our tools, subject to the terms of the underlying AI models.</p>
              <h3>Termination</h3>
              <p>We reserve the right to suspend or terminate your access to the platform at our sole discretion, without notice, for conduct that we believe violates these Terms.</p>
            </>
          )
        };
      case 'cookies':
        return {
          title: 'Cookie Policy',
          icon: Cookie,
          content: (
            <>
              <p>We use cookies and similar technologies to enhance your experience, analyze site traffic, and personalize content.</p>
              <h3>Types of Cookies We Use</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Essential Cookies:</strong> Necessary for the website to function.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the site.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings.</li>
              </ul>
              <p>You can manage your cookie preferences in your browser settings.</p>
            </>
          )
        };
      case 'security':
        return {
          title: 'Security',
          icon: Lock,
          content: (
            <>
              <p>Security is at the core of our infrastructure.</p>
              <h3>Encryption</h3>
              <p>All data transmitted between your browser and our servers is encrypted using TLS 1.3. Data at rest is encrypted using industry-standard AES-256.</p>
              <h3>Compliance</h3>
              <p>We adhere to SOC 2 Type II standards and conduct regular security audits to ensure your data remains safe.</p>
              <h3>Reporting Vulnerabilities</h3>
              <p>If you discover a security vulnerability, please report it to security@vetorre.com. We offer a bug bounty program for valid reports.</p>
            </>
          )
        };
      default:
        return {
          title: 'Page Not Found',
          icon: FileText,
          content: <p>The page you are looking for does not exist.</p>
        };
    }
  };

  const { title, icon: Icon, content } = getPageContent();

  useEffect(() => {
      document.title = `${title} - VETORRE`;
  }, [title]);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[60vh]">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-12 mb-8">
        <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
             <Icon className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
        </div>

        <div className="prose prose-invert prose-lg max-w-none text-zinc-300">
          {content}
        </div>
      </div>
      
      {/* Content specific Ad */}
      <AdUnit format="horizontal" />
    </div>
  );
};

export default GenericPage;