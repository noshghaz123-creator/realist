import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { formatMoney, statusLabel, statusColors } from '../../utils/format';
import { REVENUE_MODEL } from '../../data/business';

const planMap = { basic: 'Starter', pro: 'Growth', enterprise: 'Enterprise' };

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    Promise.all([api.getPurchaseStats(), api.getMyPurchases(), api.getLeads({})])
      .then(([s, p, l]) => { setStats(s); setPurchases(p.slice(0, 3)); setLeads(l.filter((x) => !x.purchased).slice(0, 3)); })
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const currentPlan = REVENUE_MODEL.subscription.find((p) => p.name === planMap[user?.plan]);

  return (
    <DashboardLayout title="Overview">
      <h1 className="text-xl sm:text-2xl font-bold">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-gray-500 mt-1">Here's your lead activity overview.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          ['Leads Bought', stats?.totalPurchased ?? '—'],
          ['Deals Closed', stats?.dealsClosed ?? '—'],
          ['In Progress', stats?.inProgress ?? '—'],
          ['Spent', stats ? formatMoney(stats.totalSpent) : '—'],
        ].map(([label, val]) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">My Leads</h2>
            <Link to="/dashboard/my-leads" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {purchases.map((p) => (
              <div key={p._id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.lead?.city}, {p.lead?.state}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[p.dealStatus]}`}>
                    {statusLabel[p.dealStatus]}
                  </span>
                </div>
                {p.privateNotes && <p className="text-sm text-gray-500 mt-2 italic">"{p.privateNotes}"</p>}
                <Link to={`/dashboard/my-leads`} className="text-xs text-teal-600 mt-2 inline-block hover:underline">Update</Link>
              </div>
            ))}
            {purchases.length === 0 && <p className="text-sm text-gray-400">No purchased leads yet.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold">Your Plan</h3>
            <p className="text-2xl font-bold mt-2">{currentPlan?.name || user?.plan} Plan</p>
            <p className="text-sm text-gray-500">{user?.leadsRemaining} leads remaining</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {(currentPlan?.features || []).slice(0, 3).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link to="/dashboard/pricing" className="mt-4 inline-block text-sm font-medium hover:underline">Upgrade Plan →</Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">New Leads</h3>
            <div className="space-y-3">
              {leads.map((l) => (
                <Link key={l._id} to="/leads" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                  <span className="text-sm font-medium">{l.city}, {l.state}</span>
                  <span className="text-sm text-gray-500 capitalize">{l.leadType} · ${l.price}</span>
                </Link>
              ))}
            </div>
            <Link to="/leads" className="mt-4 flex items-center gap-2 w-full justify-center py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
              Browse Leads <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
