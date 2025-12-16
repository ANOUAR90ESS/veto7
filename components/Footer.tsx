import React from 'react';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';
import { AppView } from '../types';
import Logo from './Logo';

interface FooterProps {
  onNavigate: (view: AppView, pageId?: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-800 mt-auto pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-purple-500">
                VETORRE
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              Your gateway to the next generation of AI tools. Powered by Gemini 2.5 Flash, Pro Vision, and Veo.
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><button onClick={() => onNavigate(AppView.HOME)} className="hover:text-indigo-400 transition-colors text-left">Tool Directory</button></li>
              <li><button onClick={() => onNavigate(AppView.PAGES, 'api')} className="hover:text-indigo-400 transition-colors text-left">Developer API</button></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><button onClick={() => onNavigate(AppView.PAGES, 'about')} className="hover:text-indigo-400 transition-colors text-left">About Us</button></li>
              <li><button onClick={() => onNavigate(AppView.PAGES, 'careers')} className="hover:text-indigo-400 transition-colors text-left">Careers</button></li>
              <li><button onClick={() => onNavigate(AppView.LATEST_NEWS)} className="hover:text-indigo-400 transition-colors text-left">Blog & News</button></li>
              <li><button onClick={() => onNavigate(AppView.PAGES, 'contact')} className="hover:text-indigo-400 transition-colors text-left">Contact</button></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><button onClick={() => onNavigate(AppView.PAGES, 'privacy')} className="hover:text-indigo-400 transition-colors text-left">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate(AppView.PAGES, 'terms')} className="hover:text-indigo-400 transition-colors text-left">Terms of Service</button></li>
              <li><button onClick={() => onNavigate(AppView.PAGES, 'cookies')} className="hover:text-indigo-400 transition-colors text-left">Cookie Settings</button></li>
              <li><button onClick={() => onNavigate(AppView.PAGES, 'security')} className="hover:text-indigo-400 transition-colors text-left">Security</button></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm flex items-center gap-1 text-center md:text-left font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-purple-500">
            © {new Date().getFullYear()} VETORRE. Made with <Heart className="w-3 h-3 text-red-500 fill-current" /> using Gemini.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"><Github className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"><Linkedin className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"><Mail className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;