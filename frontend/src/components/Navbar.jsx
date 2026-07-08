import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const navLink = 'text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-teal-600 after:transition-all hover:after:w-full';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashPath = user?.role === 'admin' ? '/admin' : user?.role === 'team' ? '/team' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.25rem]">
          <Logo />
          <nav className="hidden md:flex items-center gap-9">
            <a href="/#features" className={navLink}>Features</a>
            <a href="/#how-it-works" className={navLink}>How it Works</a>
            <a href="/#on-demand" className={navLink}>On Demand</a>
            <a href="/#contact" className={navLink}>Contact</a>
            <Link to="/about" className={navLink}>About</Link>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button onClick={() => navigate(dashPath)} className="text-sm font-semibold px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors">
                  Dashboard
                </button>
                <button onClick={logout} className="text-sm font-semibold px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                  Log out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/auth')} className="text-sm font-semibold px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors">
                  Log in
                </button>
                <button onClick={() => navigate('/auth?mode=signup')} className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20 transition-all hover:-translate-y-0.5">
                  Get Started
                </button>
              </>
            )}
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg px-4 py-5 space-y-1">
          <a href="/#features" className="block text-sm font-medium py-3 px-2 rounded-lg hover:bg-slate-50" onClick={() => setOpen(false)}>Features</a>
          <a href="/#how-it-works" className="block text-sm font-medium py-3 px-2 rounded-lg hover:bg-slate-50" onClick={() => setOpen(false)}>How it Works</a>
          <a href="/#on-demand" className="block text-sm font-medium py-3 px-2 rounded-lg hover:bg-slate-50" onClick={() => setOpen(false)}>On Demand</a>
          <a href="/#contact" className="block text-sm font-medium py-3 px-2 rounded-lg hover:bg-slate-50" onClick={() => setOpen(false)}>Contact</a>
          <Link to="/about" className="block text-sm font-medium py-3 px-2 rounded-lg hover:bg-slate-50" onClick={() => setOpen(false)}>About</Link>
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <button onClick={() => { navigate(dashPath); setOpen(false); }} className="block w-full text-left text-sm font-medium py-3 px-2">Dashboard</button>
                <button onClick={() => { logout(); setOpen(false); }} className="block w-full text-left text-sm font-medium py-3 px-2 text-red-600 hover:bg-red-50 rounded-lg">Log out</button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/auth'); setOpen(false); }} className="block w-full text-left text-sm font-medium py-3 px-2">Log in</button>
                <button onClick={() => { navigate('/auth?mode=signup'); setOpen(false); }} className="block w-full py-3 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold">Get Started</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
