import { useEffect, useState } from 'react';
import { Home, CheckCircle, Clock, DollarSign, User, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';
import { formatMoney, formatPrice, statusLabel, statusColors } from '../../utils/format';

export default function MyLeads() {
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  const load = () => {
    api.getMyPurchases(filters).then(setPurchases);
    api.getPurchaseStats().then(setStats);
  };

  useEffect(() => { load(); }, [filters.status]);

  const updateStatus = async (id, dealStatus) => {
    const notes = prompt('Add a note (optional):');
    await api.updatePurchase(id, { dealStatus, privateNotes: notes ?? undefined });
    load();
  };

  return (
    <DashboardLayout title="My Leads">
      <h1 className="text-2xl font-bold">My Leads</h1>
      <p className="text-gray-500 mt-1">All leads you've purchased, with full contact details.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          [Home, 'Total Purchased', stats?.totalPurchased],
          [CheckCircle, 'Deals Closed', stats?.dealsClosed, 'text-green-600'],
          [Clock, 'In Progress', stats?.inProgress, 'text-amber-600'],
          [DollarSign, 'Total Spent', stats ? formatMoney(stats.totalSpent) : '—'],
        ].map(([Icon, label, val, color]) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color || ''}`}>{val ?? '—'}</p>
            </div>
            <Icon size={20} className="text-gray-300" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search by city, state, owner..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">All Status</option>
          <option value="contacted">Contacted</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {purchases.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg">{p.lead?.city}, {p.lead?.state}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[p.dealStatus]}`}>
                    {statusLabel[p.dealStatus]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {p.lead?.propertyType} · {p.lead?.beds}bd/{p.lead?.baths}ba · {formatPrice(p.lead?.estValue)} est. · ARV {formatPrice(p.lead?.arv)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-lg">${p.amount}</p>
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
              <p className="flex items-center gap-2"><User size={14} className="text-gray-400" />{p.lead?.ownerName}</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{p.lead?.ownerPhone}</p>
              <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{p.lead?.address}</p>
            </div>

            {p.privateNotes && (
              <p className="mt-3 text-sm text-gray-500 italic flex items-start gap-2">
                <MessageSquare size={14} className="mt-0.5 shrink-0" />"{p.privateNotes}"
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => {
                const s = prompt('New status (contacted, in_progress, closed):', p.dealStatus);
                if (s) updateStatus(p._id, s);
              }} className="text-sm text-gray-600 hover:text-gray-900">Update Status</button>
              <Link to={`/leads/${p.lead?._id}`} className="text-sm font-medium hover:underline">View Lead →</Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
