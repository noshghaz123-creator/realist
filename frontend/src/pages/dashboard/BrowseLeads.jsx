import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import AttomPropertyFeed from '../../components/AttomPropertyFeed';
import LeadRow from '../../components/LeadRow';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function BrowseLeads() {
  const { user, refreshUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: 'all', tier: 'all', state: 'all', sort: 'newest' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getLeads(filters).then(setLeads).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters.type, filters.tier, filters.state, filters.sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const purchase = async (id) => {
    if (!confirm('Purchase this lead?')) return;
    try {
      await api.purchaseLead(id);
      await refreshUser();
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const favourite = async (id) => {
    await api.toggleFavourite(id);
    refreshUser();
  };

  return (
    <DashboardLayout title="Browse Leads">
      <h1 className="text-2xl font-bold">Browse Leads</h1>
      <p className="text-gray-500 mt-1">{leads.length} leads available — purchase to unlock full contact details.</p>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search city, state, type..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          {[
            ['type', 'All Types', ['all', 'pre-foreclosure', 'foreclosure', 'probate', 'tax-delinquent', 'absentee-owner', 'vacant', 'abandoned', 'bankruptcy', 'medical', 'distressed']],
            ['tier', 'All Tiers', ['all', 'basic', 'qualified', 'premium']],
            ['state', 'All States', ['all', 'FL', 'TX', 'GA', 'AZ', 'NV', 'CO']],
            ['sort', 'Newest First', [['newest', 'Newest First'], ['price_asc', 'Price: Low'], ['price_desc', 'Price: High']]],
          ].map(([key, label, opts]) => (
            <select key={key} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
              {key === 'sort'
                ? opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)
                : opts.map((o) => <option key={o} value={o}>{o === 'all' ? label : o}</option>)}
            </select>
          ))}
        </form>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_7rem_6rem_5rem_5rem_5rem_auto] gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
          <span>Property</span><span>Type</span><span>Tier</span><span>Est. Value</span><span>ARV</span><span>Price</span><span />
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No leads found.</div>
        ) : (
          leads.map((lead) => (
            <LeadRow key={lead._id} lead={lead} onPurchase={purchase} onFavourite={favourite}
              favourited={user?.favourites?.includes(lead._id)} />
          ))
        )}
      </div>

      <AttomPropertyFeed
        variant="dashboard"
        limit={3}
        className="mt-8"
        title="Market Intelligence"
        description="Compare marketplace leads with live BatchData property records in your target areas."
      />
    </DashboardLayout>
  );
}
