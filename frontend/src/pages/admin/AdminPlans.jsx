import DashboardLayout from '../../components/DashboardLayout';
import { Check } from 'lucide-react';
import { REVENUE_MODEL } from '../../data/business';

export default function AdminPlans() {
  return (
    <DashboardLayout title="Plans" panel="admin">
      <h1 className="text-2xl font-bold">Subscription Plans</h1>
      <p className="text-gray-500 mt-1">REALIST revenue model — per-lead and subscription tiers.</p>

      <div className="grid md:grid-cols-3 gap-4 mt-8 mb-10">
        {Object.entries(REVENUE_MODEL.perLead).map(([key, v]) => (
          <div key={key} className="bg-white p-5 rounded-2xl border border-gray-100 text-center">
            <p className="text-xs font-bold uppercase text-gray-400">{key} leads</p>
            <p className="text-2xl font-bold mt-2">{v.range}</p>
            <p className="text-xs text-gray-500 mt-1">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {REVENUE_MODEL.subscription.map((p) => (
          <div key={p.name} className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-xl">{p.name}</h3>
            <p className="mt-2"><span className="text-3xl font-bold">${p.price.toLocaleString()}</span><span className="text-gray-500">/month</span></p>
            <p className="text-sm text-gray-500">{p.delivery}</p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><Check size={14} className="text-green-500" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
