import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';

function panelForRole(role) {
  if (role === 'admin') return 'admin';
  return 'buyer';
}

function notificationsPathForRole(role) {
  if (role === 'admin') return '/admin/notifications';
  return '/dashboard/notifications';
}

function actionLink(notification, panel) {
  if (panel === 'admin') {
    if (notification.title === 'New Signup') return '/admin/users';
    if (notification.title === 'New Contact Form') return '/admin/contacts';
    return null;
  }
  if (/Favourites/i.test(notification.title)) return '/dashboard/favourites';
  if (/My Lead|Bulk Save/i.test(notification.title)) return '/dashboard/my-leads';
  if (notification.title === 'My Leads Exported') return '/dashboard/my-leads';
  if (/Extracted|Refreshed|Excel Downloaded/i.test(notification.title)) return '/leads';
  if (notification.title === 'Welcome to REALIST') return '/leads';
  if (notification.title === 'Profile Updated') return '/dashboard/account';
  return null;
}

export default function Notifications() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const panel = panelForRole(user?.role);
  const notificationsPath = notificationsPathForRole(user?.role);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    if (location.pathname !== notificationsPath) {
      navigate(notificationsPath, { replace: true });
    }
  }, [user, location.pathname, notificationsPath, navigate]);

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await api.markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    toast.success('All notifications marked as read');
  };

  const markOne = async (id) => {
    await api.markRead(id);
    setNotifications((n) => n.map((x) => (x._id === id ? { ...x, read: true } : x)));
    toast.info('Notification marked as read');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout title="Notifications" panel={panel}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={22} /> Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            {panel === 'admin'
              ? 'New signups, contact messages, and platform alerts.'
              : 'Stay updated on your leads and account.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {unreadCount > 0 && (
        <p className="mt-4 text-sm text-teal-700 font-medium">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-12">Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No notifications yet.</p>
        ) : (
          notifications.map((n) => {
            const link = actionLink(n, panel);
            return (
              <div
                key={n._id}
                className={`bg-white rounded-xl border p-4 sm:p-5 ${
                  n.read ? 'border-gray-100 opacity-75' : 'border-teal-200 bg-teal-50/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{n.title}</p>
                      {!n.read && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">NEW</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(n.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {link && (
                      <Link to={link} className="inline-block text-sm text-teal-600 font-medium mt-2 hover:underline">
                        View details →
                      </Link>
                    )}
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markOne(n._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-white shrink-0"
                    >
                      <Check size={14} /> Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
