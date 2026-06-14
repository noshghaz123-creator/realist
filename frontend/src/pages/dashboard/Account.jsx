import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function Account() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });
  const [saved, setSaved] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    await api.updateProfile(form);
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <DashboardLayout title="Account">
      <h1 className="text-2xl font-bold">Account</h1>
      <p className="text-gray-500 mt-1">Manage your profile, settings, and notifications.</p>

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold mx-auto">
            {initials}
          </div>
          <h2 className="font-semibold mt-4">{user?.name}</h2>
          <p className="text-sm text-gray-500 capitalize">{user?.role} · {user?.plan} plan</p>
          <p className="text-xs text-gray-400 mt-4">PNG, JPG up to 2MB</p>
        </div>

        <form onSubmit={save} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Personal Information</h2>
          {[
            ['Full Name', 'name'],
            ['Phone Number', 'phone', '+1 (555) 000-0000'],
            ['Company / Business', 'company', 'Your company name'],
            ['Location', 'location', 'City, State'],
          ].map(([label, key, ph]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself..." rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">Email: {user?.email}</p>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
