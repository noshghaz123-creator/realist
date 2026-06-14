import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, FileText, Shield } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import AttomPropertyFeed from '../../components/AttomPropertyFeed';
import { api } from '../../api/client';
import { formatMoney } from '../../utils/format';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    Promise.all([api.getAdminStats(), api.getAllPurchases(), api.getAdminLeads()])
      .then(([s, p, l]) => { setStats(s); setPurchases(p.slice(0, 5)); setLeads(l.slice(0, 5)); });
  }, []);

  return (
    <DashboardLayout title="Admin Overview" panel="admin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-gray-500 mt-1">Platform performance at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/leads" className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Manage Leads</Link>
          <Link to="/admin/users" className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">Manage Users</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          [DollarSign, 'Total Revenue', formatMoney(stats?.totalRevenue || 0), 'From all purchases'],
          [Users, 'Active Buyers', stats?.activeBuyers, 'Paying subscribers'],
          [FileText, 'Active Leads', stats?.activeLeads, `${stats?.totalLeads || 0} total listed`],
          [Shield, 'Deals Closed', stats?.dealsClosed, `${stats?.totalPurchases || 0} total purchases`],
        ].map(([Icon, label, val, sub]) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold mt-2">{val ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-lg mb-4">Recent Leads</h2>
          <div className="space-y-3">
            {leads.map((l) => (
              <div key={l._id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="font-medium">{l.city}, {l.state}</span>
                <span className="text-gray-500 capitalize">{l.leadType} · ${l.price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-lg mb-4">Recent Purchases</h2>
          <div className="space-y-3">
            {purchases.map((p) => (
              <div key={p._id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span>{p.user?.name} · {p.lead?.city}</span>
                <span className="font-medium">${p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AttomPropertyFeed variant="dashboard" className="mt-8" />
    </DashboardLayout>
  );
}
