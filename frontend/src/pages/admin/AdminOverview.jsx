import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, FileText, Mail, UserPlus, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import { api } from '../../api/client';
import { formatMoney } from '../../utils/format';
import { planLabel } from '../../components/PlanBadge';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [signups, setSignups] = useState([]);
  const [leadUsage, setLeadUsage] = useState([]);
  const [revenueInput, setRevenueInput] = useState('0');
  const [revenueSaving, setRevenueSaving] = useState(false);
  const [revenueMsg, setRevenueMsg] = useState('');

  const load = () => {
    Promise.all([
      api.getAdminStats(),
      api.getAdminContacts(),
      api.getUsers(),
      api.getLeadUsage(),
      api.getPlatformSettings(),
    ]).then(([s, c, users, usage, settings]) => {
      setStats(s);
      setContacts(c.slice(0, 5));
      setSignups(users.filter((u) => u.role === 'buyer').slice(0, 8));
      setLeadUsage(usage || []);
      setRevenueInput(String(settings?.manualRevenue ?? s?.totalRevenue ?? 0));
    });
  };

  useEffect(() => { load(); }, []);

  const saveRevenue = async () => {
    setRevenueSaving(true);
    setRevenueMsg('');
    try {
      await api.updatePlatformSettings({ manualRevenue: Number(revenueInput) || 0 });
      setRevenueMsg('Revenue saved.');
      load();
    } catch (err) {
      setRevenueMsg(err.message);
    } finally {
      setRevenueSaving(false);
    }
  };

  return (
    <DashboardLayout title="Admin Overview" panel="admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-gray-500 mt-1">Real platform data only — no demo numbers.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/contacts" className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Contacts</Link>
          <Link to="/admin/users" className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">Manage Users</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          [Users, 'Registered Buyers', stats?.activeBuyers ?? 0, 'Real signup accounts'],
          [FileText, 'PropertyRadar Leads', stats?.propertyLeads ?? 0, `${stats?.totalCachedLeads ?? 0} in active cache`],
          [Mail, 'Contact Messages', stats?.totalContacts ?? 0, `${stats?.unreadContacts ?? 0} unread`],
          [BarChart3, 'API Usage', stats?.apiUsage ?? 0, stats?.lastSync ? `Last sync: ${new Date(stats.lastSync).toLocaleString()}` : 'No sync yet'],
        ].map(([Icon, label, val, sub]) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold mt-2">{val ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">Total Revenue</h2>
            <p className="text-sm text-gray-500 mt-1">Set manually — not calculated from demo purchases.</p>
            <p className="text-3xl font-bold mt-3">{formatMoney(stats?.totalRevenue || 0)}</p>
            <div className="mt-4 flex flex-wrap items-end gap-3 max-w-md">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Update amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <button
                type="button"
                onClick={saveRevenue}
                disabled={revenueSaving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
              >
                {revenueSaving ? 'Saving…' : 'Save Revenue'}
              </button>
            </div>
            {revenueMsg && <p className="text-sm text-teal-700 mt-2">{revenueMsg}</p>}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <BarChart3 size={18} /> Lead Usage by User
          </h2>
          <Link to="/admin/users" className="text-sm text-teal-600 hover:underline">Manage limits</Link>
        </div>
        <DataTable
          columns={[
            { key: 'user', label: 'User' },
            { key: 'email', label: 'Email' },
            { key: 'used', label: 'Leads Used' },
            { key: 'limit', label: 'Limit' },
            { key: 'remaining', label: 'Remaining' },
            { key: 'plan', label: 'Plan' },
          ]}
          empty={leadUsage.length === 0}
          emptyMessage="No buyer activity yet."
        >
          {leadUsage.map((u) => (
            <tr key={u._id}>
              <td className="font-medium">{u.name}</td>
              <td className="text-gray-500">{u.email}</td>
              <td className="font-semibold text-teal-700">{u.leadsUsed ?? 0}</td>
              <td>{u.leadLimit ?? 50}</td>
              <td>{u.leadsRemaining ?? 0}</td>
              <td>{planLabel(u.plan)}</td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <UserPlus size={18} /> Recent Signups
            </h2>
            <Link to="/admin/users" className="text-sm text-teal-600 hover:underline">View all</Link>
          </div>
          {signups.length === 0 ? (
            <p className="text-sm text-gray-400">No buyer signups yet.</p>
          ) : (
            <div className="space-y-3">
              {signups.map((u) => (
                <div key={u._id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="font-medium">{u.name} · {u.email}</span>
                  <span className="text-gray-500">{formatDate(u.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Mail size={18} /> Recent Contact Forms
            </h2>
            <Link to="/admin/contacts" className="text-sm text-teal-600 hover:underline">View all</Link>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-400">No contact messages yet.</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c._id} className="text-sm py-2 border-b border-gray-50">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{c.name}</span>
                    {c.status === 'new' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">NEW</span>
                    )}
                  </div>
                  <p className="text-gray-500 truncate">{c.subject || c.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
