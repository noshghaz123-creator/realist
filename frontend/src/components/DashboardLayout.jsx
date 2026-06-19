import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, BookOpen, Heart, CreditCard, User, Settings, Bell, LogOut,
  FileText, Users, Building2, Menu, X,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

const buyerNav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/leads', label: 'Browse Leads', icon: Search },
  { to: '/dashboard/my-leads', label: 'My Leads', icon: BookOpen },
  { to: '/dashboard/favourites', label: 'Favourites', icon: Heart },
  { to: '/dashboard/pricing', label: 'Pricing', icon: CreditCard },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/leads', label: 'Manage Leads', icon: FileText },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/plans', label: 'Plans', icon: CreditCard },
  { to: '/admin/teams', label: 'Teams', icon: Building2 },
];

const teamNav = [
  { to: '/team', label: 'Overview', icon: LayoutDashboard },
  { to: '/team/leads', label: 'Manage Leads', icon: FileText },
  { to: '/team/verify', label: 'Verify Leads', icon: Search },
];

const accountNav = [
  { to: '/dashboard/account', label: 'Profile', icon: User },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

function NavLinks({ items, location, onNavigate }) {
  return items.map(({ to, label, icon: Icon }) => {
    const active = location.pathname === to;
    return (
      <Link
        key={to}
        to={to}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  });
}

export default function DashboardLayout({ children, title, panel = 'buyer' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const mainNav = panel === 'admin' ? adminNav : panel === 'team' ? teamNav : buyerNav;
  const panelLabel = panel === 'admin' ? 'ADMIN PANEL' : panel === 'team' ? 'TEAM PANEL' : 'INVESTOR PANEL';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (panel !== 'buyer') return;
    api.getNotifications().then((n) => setNotifCount(n.filter((x) => !x.read).length)).catch(() => {});
  }, [location.pathname, panel]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const closeMenu = () => setMenuOpen(false);

  const sidebar = (
    <>
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
        <Logo />
        <button
          type="button"
          onClick={closeMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2 px-3">{panelLabel}</p>
          <div className="space-y-1">
            <NavLinks items={mainNav} location={location} onNavigate={closeMenu} />
          </div>
        </div>
        {panel === 'buyer' && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2 px-3">ACCOUNT</p>
            <div className="space-y-1">
              {accountNav.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                    {label === 'Notifications' && notifCount > 0 && (
                      <span className="ml-auto bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                        {notifCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{user?.role} · {user?.plan}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); closeMenu(); }}
          className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeMenu}
          aria-label="Close menu overlay"
        />
      )}

      <aside
        className={`w-64 max-w-[85vw] bg-white border-r border-gray-100 flex flex-col fixed h-full z-50 transition-transform duration-200 ease-out lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      <div className="flex-1 w-full lg:ml-64 min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-50 text-gray-700 shrink-0"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-sm text-gray-500 truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {panel === 'buyer' && (
              <button onClick={() => navigate('/dashboard/notifications')} className="relative p-2 hover:bg-gray-50 rounded-lg">
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
