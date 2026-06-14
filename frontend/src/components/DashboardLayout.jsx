import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, BookOpen, Heart, CreditCard, User, Settings, Bell, LogOut,
  FileText, Users, Building2,
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

export default function DashboardLayout({ children, title, panel = 'buyer' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  const mainNav = panel === 'admin' ? adminNav : panel === 'team' ? teamNav : buyerNav;
  const panelLabel = panel === 'admin' ? 'ADMIN PANEL' : panel === 'team' ? 'TEAM PANEL' : 'INVESTOR PANEL';

  useEffect(() => {
    if (panel !== 'buyer') return;
    api.getNotifications().then((n) => setNotifCount(n.filter((x) => !x.read).length)).catch(() => {});
  }, [location.pathname, panel]);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-40">
        <div className="p-5 border-b border-gray-100">
          <Logo />
        </div>
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2 px-3">{panelLabel}</p>
            <div className="space-y-1">
              {mainNav.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
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
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role} · {user?.plan}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <h2 className="text-sm text-gray-500">{title}</h2>
          <div className="flex items-center gap-4">
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
              <span className="text-sm font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
