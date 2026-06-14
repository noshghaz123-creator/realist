import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const demos = [
  { label: 'Buyer Demo', email: 'alex@realist.com', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Admin Demo', email: 'admin@realist.com', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Team Demo', email: 'team@realist.com', color: 'bg-green-50 text-green-700 border-green-200' },
];

export default function Auth() {
  const [params] = useSearchParams();
  const isSignup = params.get('mode') === 'signup';
  const [signup, setSignup] = useState(isSignup);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const fillDemo = (email) => {
    setForm({ ...form, email, password: 'demo123' });
    setSignup(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let user;
      if (signup) {
        user = await register(form);
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
            {signup ? 'Start finding real estate leads today.' : 'Sign in to access your leads dashboard.'}
          </p>

          <div className="mt-6 p-4 border border-gray-100 rounded-xl bg-gray-50">
            <p className="text-xs text-gray-500 mb-3">Demo accounts (click to fill):</p>
            <div className="flex flex-wrap gap-2">
              {demos.map((d) => (
                <button key={d.email} type="button" onClick={() => fillDemo(d.email)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${d.color}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {signup && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {signup && (
              <div>
                <label className="block text-sm font-medium mb-2">I am a...</label>
                <div className="flex gap-2">
                  {[{ v: 'buyer', l: 'Investor / Buyer' }, { v: 'team', l: 'Internal Team' }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, role: v })}
                      className={`flex-1 py-2.5 text-sm rounded-xl border font-medium ${form.role === v ? 'bg-black text-white border-black' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">
              {loading ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}
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
