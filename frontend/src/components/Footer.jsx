import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Mail } from 'lucide-react';
import Logo from './Logo';
import { api } from '../api/client';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const subscribe = async (e) => {
    e.preventDefault();
    try {
      const data = await api.subscribe(email);
      setMsg(data.message);
      setEmail('');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-gray-500 max-w-sm">
              The B2B real estate lead generation platform trusted by investors, wholesalers, and property companies across the US.
            </p>
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              <a href="mailto:hello@realist.com" className="block hover:text-gray-900">hello@realist.com</a>
              <a href="tel:+18885551234" className="block hover:text-gray-900">+1 (888) 555-1234</a>
              <a href="https://www.realist.com" className="block hover:text-gray-900">www.realist.com</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="/#features" className="hover:text-gray-900">Features</a></li>
              <li><a href="/#pricing" className="hover:text-gray-900">Pricing</a></li>
              <li><a href="/#how-it-works" className="hover:text-gray-900">How It Works</a></li>
              <li><Link to="/roadmap" className="hover:text-gray-900">Roadmap</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/lead-guide" className="hover:text-gray-900">Lead Guide</Link></li>
              <li><Link to="/arv-calculator" className="hover:text-gray-900">ARV Calculator</Link></li>
              <li><Link to="/help" className="hover:text-gray-900">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-gray-900">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/about" className="hover:text-gray-900">About</Link></li>
              <li><Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 lg:p-7 bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-900/5">
          <h4 className="font-semibold">Stay ahead of the market</h4>
          <p className="text-sm text-gray-500 mt-1">Get new leads and market insights delivered weekly.</p>
          <form onSubmit={subscribe} className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
            <button type="submit" className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800">
              Subscribe
            </button>
          </form>
          {msg && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><Check size={14} />{msg}</p>}
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          {[
            ['24/7 Support', 'Always here to help'],
            ['Verified Leads', '100% manually checked'],
            ['Instant Delivery', 'Unlock in seconds'],
            ['Lead Guides', 'Free investor resources'],
          ].map(([t, d]) => (
            <div key={t} className="p-4">
              <p className="font-medium">{t}</p>
              <p className="text-gray-500 text-xs mt-1">{d}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © 2026 REALIST Inc. All rights reserved. Real Estate Lead Generation Platform.
        </p>
      </div>
    </footer>
  );
}
