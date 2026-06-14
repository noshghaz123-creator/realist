import { Link } from 'react-router-dom';
import { ArrowRight, Check, Zap } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { REVENUE_MODEL } from '../../data/business';

const planMap = { basic: 'Starter', pro: 'Growth', enterprise: 'Enterprise' };

export default function Pricing() {
  const { user, refreshUser } = useAuth();
  const current = REVENUE_MODEL.subscription.find((p) => p.name === planMap[user?.plan]) || REVENUE_MODEL.subscription[1];

  const planKey = { Starter: 'basic', Growth: 'pro', Enterprise: 'enterprise' };

  const upgrade = async (planName) => {
    const key = planKey[planName];
    if (!key || planMap[user?.plan] === planName) return;
    if (!confirm(`Switch to ${planName} plan?`)) return;
    await api.updateProfile({ plan: key });
    await refreshUser();
  };

  return (
    <DashboardLayout title="Pricing">
      <h1 className="text-2xl font-bold">Plans & Pricing</h1>
      <p className="text-gray-500 mt-1">Subscription model built for scale — bulk leads delivered weekly or daily.</p>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl capitalize">{current.name} Plan</h2>
          <p className="text-gray-500 text-sm mt-1">
            ${current.price.toLocaleString()} /month · {current.delivery} · {user?.leadsRemaining} leads left
          </p>
        </div>
        <Link to="/leads" className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Browse Leads</Link>
      </div>

      <h2 className="font-semibold text-lg mt-10 mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {REVENUE_MODEL.subscription.map((p) => (
          <div key={p.name} className={`bg-white p-6 rounded-2xl border ${user?.plan && planMap[user.plan] === p.name ? 'border-black ring-2 ring-black' : 'border-gray-100'}`}>
            <h3 className="font-bold text-lg">{p.name}</h3>
            <p className="mt-2"><span className="text-3xl font-bold">${p.price.toLocaleString()}</span><span className="text-gray-500">/month</span></p>
            <p className="text-sm text-gray-500 mt-1">{p.delivery}</p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><Check size={14} className="text-green-500" />{f}</li>
              ))}
            </ul>
            <button
              disabled={planMap[user?.plan] === p.name}
              onClick={() => upgrade(p.name)}
              className={`mt-6 w-full py-2.5 rounded-lg text-sm font-medium ${planMap[user?.plan] === p.name ? 'bg-gray-100 text-gray-400' : 'border border-gray-200 hover:bg-gray-50'}`}
            >
              {planMap[user?.plan] === p.name ? 'Current Plan' : 'Switch Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold">Pay Per Lead</h3>
            <p className="text-sm text-gray-500">No subscription needed — buy only what you need.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['Basic Leads', REVENUE_MODEL.perLead.basic.range, REVENUE_MODEL.perLead.basic.desc, 'border-gray-200'],
            ['Qualified Leads', REVENUE_MODEL.perLead.qualified.range, REVENUE_MODEL.perLead.qualified.desc, 'border-blue-200'],
            ['Exclusive Leads', REVENUE_MODEL.perLead.exclusive.range, REVENUE_MODEL.perLead.exclusive.desc, 'border-amber-200'],
          ].map(([t, p, d, b]) => (
            <div key={t} className={`p-4 rounded-xl border ${b}`}>
              <p className="font-semibold">{t}</p>
              <p className="text-lg font-bold mt-1">{p}</p>
              <p className="text-xs text-gray-500 mt-1">{d}</p>
            </div>
          ))}
        </div>
        <Link to="/leads" className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
          Browse Available Leads <ArrowRight size={14} />
        </Link>
      </div>
    </DashboardLayout>
  );
}
