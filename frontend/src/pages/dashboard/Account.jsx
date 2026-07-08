import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import UserAvatar from '../../components/UserAvatar';
import PlanBadge, { planLabel } from '../../components/PlanBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { refreshNotificationBadge } from '../../utils/notifications';

function panelForRole(role) {
  if (role === 'admin') return 'admin';
  if (role === 'team') return 'team';
  return 'buyer';
}

function profilePathForRole(role) {
  if (role === 'admin') return '/admin/account';
  if (role === 'team') return '/team/account';
  return '/dashboard/account';
}

function compressImage(file, maxSize = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Account() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const panel = panelForRole(user?.role);
  const profilePath = profilePathForRole(user?.role);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    location: '',
    avatar: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (location.pathname !== profilePath) {
      navigate(profilePath, { replace: true });
    }
  }, [user, location.pathname, profilePath, navigate]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      company: user.company || '',
      location: user.location || '',
      avatar: user.avatar || '',
    });
  }, [user]);

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a PNG or JPG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2MB or smaller.');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setForm((prev) => ({ ...prev, avatar: dataUrl }));
      setError('');
      toast.success('Photo updated — click Save Changes to keep it.');
    } catch {
      toast.error('Could not process image. Try another file.');
    }
    e.target.value = '';
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.updateProfile(form);
      await refreshUser();
      toast.success('Profile updated successfully!');
      refreshNotificationBadge();
    } catch (err) {
      const msg = err.message || 'Could not save profile.';
      setError(msg);
      toast.error(msg);
    }
  };

  const previewUser = { ...user, ...form, name: form.name || user?.name };

  return (
    <DashboardLayout title="Profile" panel={panel}>
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <p className="text-gray-500 mt-1">Update your name, contact info, and profile photo.</p>

      {error && (
        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {user?.role === 'buyer' ? (
            <>
              <h2 className="font-semibold text-lg mb-4">Your Plan</h2>
              <PlanBadge plan={user?.plan} className="text-sm px-3 py-1.5" />
              <p className="text-2xl font-bold mt-4">{planLabel(user?.plan)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {user?.leadsRemaining ?? 0} of {user?.leadLimit ?? 50} leads remaining
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Need more leads? Contact admin for on-demand access.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-lg mb-4">Account</h2>
              <p className="text-sm font-semibold text-teal-700 uppercase tracking-wide">
                {user?.role === 'admin' ? 'Platform Administrator' : 'Team Member'}
              </p>
              <p className="text-sm text-gray-500 mt-3">
                {user?.role === 'admin'
                  ? 'Full admin access to REALIST. Plans and lead limits apply to buyers only.'
                  : 'Team access for lead management and verification.'}
              </p>
            </>
          )}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-sm font-medium mt-1 break-all">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={save} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-lg">Personal Information</h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <UserAvatar user={previewUser} size="lg" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 shadow-md"
                aria-label="Change profile photo"
              >
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPhotoChange} />
            </div>
            <div>
              <p className="font-medium">Profile Photo</p>
              <p className="text-sm text-gray-500 mt-1">PNG or JPG, up to 2MB. Shows in dashboard header.</p>
              {form.avatar && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, avatar: '' }))}
                  className="text-xs text-red-600 mt-2 hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {[
            ['Full Name', 'name', 'Your name'],
            ['Phone Number', 'phone', '+1 (555) 000-0000'],
            ['Company / Business', 'company', 'Your company name'],
            ['Location', 'location', 'City, State'],
          ].map(([label, key, ph]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          ))}

          <button type="submit" className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Save Changes
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
