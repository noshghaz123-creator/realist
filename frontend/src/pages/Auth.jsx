import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [params] = useSearchParams();
  const isSignup = params.get('mode') === 'signup';
  const [signup, setSignup] = useState(isSignup);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', company: '', location: '',
  });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (signup && form.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      let user;
      if (signup) {
        user = await register({ ...form, role: 'buyer' });
      } else {
        user = await login(form.email, form.password);
      }
      const path = user.role === 'admin' ? '/admin' : user.role === 'team' ? '/team' : '/dashboard';
      navigate(path);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-blue-700 text-white p-12 flex-col justify-between">
        <div />
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Premium Real Estate<br />Leads. Verified.<br />Ready to Close.
          </h2>
          <p className="mt-4 text-teal-100 max-w-md">
            Join 3,800+ investors buying verified leads from foreclosures, probate, vacant properties, and more — all in one platform.
          </p>
        </div>
        <p className="text-sm text-teal-200">© 2026 REALIST. All rights reserved.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <h1 className="text-3xl font-bold">{signup ? 'Create account' : 'Welcome back'}</h1>
          <p className="text-gray-500 mt-2">
            {signup ? 'Register as a buyer to browse Florida property leads.' : 'Sign in to access your leads dashboard.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {signup && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone (optional)</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (305) 555-0000" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={signup ? 8 : undefined}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signup && (
                <p className="text-xs text-gray-500 mt-1.5">Minimum 8 characters</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">
              {loading ? 'Please wait...' : signup ? 'Create buyer account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {signup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setSignup(!signup)} className="font-semibold text-black hover:underline">
              {signup ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
