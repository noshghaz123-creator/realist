import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

const PREFS = [
  ['emailNotifications', 'Email Notifications', 'Receive updates about new leads and purchases'],
  ['smsAlerts', 'SMS Alerts', 'Get text alerts for premium lead listings'],
  ['weeklyDigest', 'Weekly Digest', 'Summary of market activity and new leads'],
];

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [prefs, setPrefs] = useState(user?.preferences || {});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.preferences) setPrefs(user.preferences);
  }, [user?.preferences]);

  const toggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await api.updateProfile({ preferences: next });
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout title="Settings">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-gray-500 mt-1">Manage your account preferences.</p>
      {saved && <p className="text-sm text-green-600 mt-2">Preferences saved.</p>}

      <div className="mt-8 space-y-6 max-w-xl">
        {PREFS.map(([key, title, desc]) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!prefs[key]}
                onChange={() => toggle(key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
