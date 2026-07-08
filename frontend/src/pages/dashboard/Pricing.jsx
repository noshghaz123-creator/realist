import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, Zap } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import PlanBadge, { planLabel, isOnDemandPlan } from '../../components/PlanBadge';

export default function Pricing() {
  const { user } = useAuth();
  const used = user?.leadsUsed ?? 0;
  const limit = user?.leadLimit ?? 50;
  const remaining = user?.leadsRemaining ?? 0;
  const onDemand = isOnDemandPlan(user?.plan);

  return (
    <DashboardLayout title="On Demand">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Your Plan</h1>
        <PlanBadge plan={user?.plan} />
      </div>
      <p className="text-gray-500 mt-1">
        Current plan: <strong>{planLabel(user?.plan)}</strong>
        {onDemand
          ? ' — custom lead limit assigned by admin.'
          : ' — 50 leads included for new signups.'}
      </p>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            onDemand ? 'bg-violet-600' : 'bg-teal-600'
          }`}>
            <Zap size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl">{planLabel(user?.plan)}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {onDemand
                ? 'Admin assigned your on-demand lead package. Use Browse Leads within your limit.'
                : 'Every new signup gets 50 leads to start. Each property in Browse Leads counts toward your limit.'}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 max-w-md">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 uppercase">Limit</p>
                <p className="text-2xl font-bold mt-1">{limit}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 uppercase">Used</p>
                <p className="text-2xl font-bold mt-1">{used}</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                <p className="text-xs text-teal-700 uppercase">Remaining</p>
                <p className="text-2xl font-bold mt-1 text-teal-700">{remaining}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-lg">Need More Leads?</h3>
        <p className="text-sm text-gray-500 mt-2">
          REALIST runs on an <strong>on-demand</strong> model. When your trial runs out, contact us and admin will assign more leads to your account — no fixed monthly plan required.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-gray-600">
          <li className="flex items-center gap-2"><Mail size={16} className="text-teal-600" /> hello@realist.com</li>
          <li className="flex items-center gap-2"><Phone size={16} className="text-teal-600" /> +1 (888) 555-1234</li>
        </ul>
        <Link
          to="/dashboard/contact"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800"
        >
          Contact for More Leads <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
        {remaining > 0
          ? `You can pull ${remaining} more lead${remaining === 1 ? '' : 's'} from PropertyRadar.`
          : 'Your lead limit is used up. Contact admin to get more leads on demand.'}
      </div>
    </DashboardLayout>
  );
}
