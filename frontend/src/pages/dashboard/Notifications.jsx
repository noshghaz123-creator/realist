import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.getNotifications().then(setNotifications);
  }, []);

  const markAll = async () => {
    await api.markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const markOne = async (id) => {
    await api.markRead(id);
    setNotifications((n) => n.map((x) => (x._id === id ? { ...x, read: true } : x)));
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated on your leads and account.</p>
        </div>
        <button onClick={markAll} className="text-sm text-teal-600 hover:underline">Mark all as read</button>
      </div>

      <div className="mt-6 space-y-3">
        {notifications.map((n) => (
          <button
            key={n._id}
            type="button"
            onClick={() => !n.read && markOne(n._id)}
            className={`w-full text-left bg-white rounded-xl border p-4 ${n.read ? 'border-gray-100 opacity-60' : 'border-teal-200 bg-teal-50/30'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
        {notifications.length === 0 && <p className="text-gray-400 text-center py-12">No notifications.</p>}
      </div>
    </DashboardLayout>
  );
}
