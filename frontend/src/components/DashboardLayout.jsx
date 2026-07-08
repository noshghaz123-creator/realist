import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, BookOpen, Heart, CreditCard, User, Bell, LogOut,
  FileText, Users, Building2, Menu, X, Database, Mail, Inbox as InboxIcon,
} from 'lucide-react';
import Logo from './Logo';
import UserAvatar from './UserAvatar';
import { planLabel } from './PlanBadge';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

const buyerNav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/leads', label: 'Browse Leads', icon: Search },
  { to: '/dashboard/my-leads', label: 'My Leads', icon: BookOpen },
  { to: '/dashboard/favourites', label: 'Favourites', icon: Heart },
  { to: '/dashboard/pricing', label: 'On Demand', icon: CreditCard },
  { to: '/dashboard/contact', label: 'Contact', icon: Mail },
  { to: '/dashboard/inbox', label: 'Inbox', icon: InboxIcon },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/leads', label: 'Manage Leads', icon: FileText },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/contacts', label: 'Contacts', icon: Mail },
  { to: '/admin/plans', label: 'On Demand', icon: CreditCard },
  { to: '/admin/teams', label: 'Teams', icon: Building2 },
  { to: '/admin/sync', label: 'Property Sync', icon: Database },
];

const teamNav = [
  { to: '/team', label: 'Overview', icon: LayoutDashboard },
  { to: '/team/leads', label: 'Manage Leads', icon: FileText },
  { to: '/team/verify', label: 'Verify Leads', icon: Search },
];

const accountNav = [
  { to: '/dashboard/account', label: 'Profile', icon: User },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

function profilePathForPanel(panel) {
  if (panel === 'admin') return '/admin/account';
  if (panel === 'team') return '/team/account';
  return '/dashboard/account';
}

function notificationsPathForPanel(panel) {
  if (panel === 'admin') return '/admin/notifications';
  return '/dashboard/notifications';
}

const adminAccountNav = [
  { to: '/admin/account', label: 'Profile', icon: User },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
];

function roleSubtitle(user, panel) {
  if (panel === 'admin') return 'Administrator';
  if (panel === 'team') return 'Team member';
  return planLabel(user?.plan);
}

function NavLinks({ items, location, onNavigate, badges = {} }) {
  return items.map(({ to, label, icon: Icon }) => {
    const active = location.pathname === to;
    const badge = badges[to] || 0;
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
        {badge > 0 && (
          <span className={`ml-auto text-[10px] w-5 h-5 rounded-full flex items-center justify-center ${
            active ? 'bg-white text-black' : 'bg-teal-600 text-white'
          }`}>
            {badge}
          </span>
        )}
      </Link>
    );
  });
}

export default function DashboardLayout({ children, title, panel = 'buyer' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const mainNav = panel === 'admin' ? adminNav : panel === 'team' ? teamNav : buyerNav;
  const panelLabel = panel === 'admin' ? 'ADMIN PANEL' : panel === 'team' ? 'TEAM PANEL' : 'INVESTOR PANEL';
  const profilePath = profilePathForPanel(panel);
  const notificationsPath = notificationsPathForPanel(panel);
  const profileNav = panel === 'buyer'
    ? accountNav
    : panel === 'admin'
      ? adminAccountNav
      : [{ to: profilePath, label: 'Profile', icon: User }];

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (panel !== 'buyer' && panel !== 'admin') return;
    const loadNotifs = () => {
      api.getNotifications().then((n) => setNotifCount(n.filter((x) => !x.read).length)).catch(() => {});
    };
    loadNotifs();
    window.addEventListener('realist:refresh-notifications', loadNotifs);
    return () => window.removeEventListener('realist:refresh-notifications', loadNotifs);
  }, [location.pathname, panel]);

  useEffect(() => {
    if (panel !== 'buyer') return;
    const loadInbox = () => {
      api
        .getInbox()
        .then((list) => setInboxUnread(list.reduce((sum, t) => sum + (t.unreadReplies || 0), 0)))
        .catch(() => setInboxUnread(0));
    };
    loadInbox();
    window.addEventListener('realist:refresh-notifications', loadInbox);
    return () => window.removeEventListener('realist:refresh-notifications', loadInbox);
  }, [location.pathname, panel]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [profileOpen]);

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
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2 px-3">{panelLabel}</p>
          <div className="space-y-1">
            <NavLinks
              items={mainNav}
              location={location}
              onNavigate={closeMenu}
              badges={panel === 'buyer' ? { '/dashboard/inbox': inboxUnread } : {}}
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2 px-3">ACCOUNT</p>
          <div className="space-y-1">
            {profileNav.map(({ to, label, icon: Icon }) => {
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
                    {(panel === 'buyer' || panel === 'admin') && label === 'Notifications' && notifCount > 0 && (
                      <span className="ml-auto bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                        {notifCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{roleSubtitle(user, panel)}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); closeMenu(); }}
          className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
            {(panel === 'buyer' || panel === 'admin') && (
              <button
                type="button"
                onClick={() => navigate(notificationsPath)}
                className="relative p-2 hover:bg-gray-50 rounded-lg"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>
            )}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <UserAvatar user={user} size="sm" />
                <div className="hidden sm:block text-left min-w-0">
                  <span className="text-sm font-medium block max-w-[120px] truncate">{user?.name?.split(' ')[0]}</span>
                  {panel === 'buyer' && (
                    <span className="text-[11px] text-gray-500 block truncate">{planLabel(user?.plan)}</span>
                  )}
                  {panel === 'admin' && (
                    <span className="text-[11px] text-gray-500 block truncate">Admin</span>
                  )}
                  {panel === 'team' && (
                    <span className="text-[11px] text-gray-500 block truncate">Team</span>
                  )}
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  <button
                    type="button"
                    onClick={() => { navigate(profilePath); setProfileOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User size={16} /> Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { logout(); navigate('/'); setProfileOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 custom-scrollbar">{children}</main>
      </div>
    </div>
  );
}
