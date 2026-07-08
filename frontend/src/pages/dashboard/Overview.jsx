import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, BookOpen, Search, Gauge } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import PlanBadge, { planLabel, isOnDemandPlan } from '../../components/PlanBadge';
import { api } from '../../api/client';
import { cellValue } from '../../components/PropertyLeadCard';

const STAT_CARDS = [
  {
    key: 'favourites',
    label: 'Favourites',
    icon: Heart,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    link: '/dashboard/favourites',
  },
  {
    key: 'myLeads',
    label: 'My Leads',
    icon: BookOpen,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    link: '/dashboard/my-leads',
  },
  {
    key: 'extracted',
    label: 'Leads Extracted',
    icon: Search,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    link: '/leads',
  },
  {
    key: 'remaining',
    label: 'Leads Remaining',
    icon: Gauge,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    link: '/dashboard/pricing',
  },
];

export default function Overview() {
  const { user, refreshUser } = useAuth();
  const [savedLeads, setSavedLeads] = useState([]);

  useEffect(() => {
    refreshUser().catch(() => {});
    api.getPropertyMyLeads().then((leads) => setSavedLeads(leads.slice(0, 3))).catch(() => setSavedLeads([]));
  }, []);

  const stats = {
    favourites: user?.favouritePropertyLeads?.length ?? 0,
    myLeads: user?.myPropertyLeads?.length ?? 0,
    extracted: user?.leadsUsed ?? 0,
    remaining: user?.leadsRemaining ?? 0,
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout title="Overview">
      <h1 className="text-xl sm:text-2xl font-bold">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-gray-500 mt-1">Here's your lead activity overview.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, border, link }) => (
          <Link
            key={key}
            to={link}
            className={`block bg-white p-5 rounded-2xl border ${border} hover:shadow-md transition-shadow`}
          >
            <div className={`inline-flex p-2 rounded-xl ${bg} ${color} mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{stats[key]}</p>
          </Link>
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
            {savedLeads.map((lead) => (
              <div key={lead._id} className="p-4 bg-gray-50 rounded-xl">
                <p className="font-medium">
                  {cellValue(lead, 'propertyAddress') !== '—'
                    ? cellValue(lead, 'propertyAddress')
                    : `${cellValue(lead, 'city')}, FL`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {cellValue(lead, 'city')} · {cellValue(lead, 'county')} · {cellValue(lead, 'propertyType')}
                </p>
              </div>
            ))}
            {savedLeads.length === 0 && (
              <p className="text-sm text-gray-400">No saved leads yet. Browse leads and click the green tick or Add All.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold">Your Plan</h3>
            <div className="mt-3">
              <PlanBadge plan={user?.plan} />
            </div>
            <p className="text-xl font-bold mt-3">{planLabel(user?.plan)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {user?.leadsRemaining ?? 0} of {user?.leadLimit ?? 50} leads remaining
            </p>
            <p className="text-sm text-gray-500 mt-3">
              {isOnDemandPlan(user?.plan)
                ? 'On-demand lead access — admin assigned your custom limit.'
                : 'Free trial — 50 leads included for new accounts.'}
            </p>
            <Link to="/dashboard/pricing" className="mt-4 inline-block text-sm font-medium hover:underline">On Demand Info →</Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold mb-2">Browse Florida Leads</h3>
            <p className="text-sm text-gray-500">
              Search PropertyRadar for verified owner contact leads. Each search uses up to 10 leads from your quota.
            </p>
            <Link to="/leads" className="mt-4 flex items-center gap-2 w-full justify-center py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
              Browse Leads <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
