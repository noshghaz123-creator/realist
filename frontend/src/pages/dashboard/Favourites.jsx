import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import AttomPropertyFeed from '../../components/AttomPropertyFeed';
import LeadRow from '../../components/LeadRow';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function Favourites() {
  const { user, refreshUser } = useAuth();
  const [leads, setLeads] = useState([]);

  const load = () => api.getFavouriteLeads().then(setLeads).catch(() => setLeads([]));

  useEffect(() => { load(); }, [user?.favourites]);

  const purchase = async (id) => {
    await api.purchaseLead(id);
    await refreshUser();
    load();
  };

  const favourite = async (id) => {
    await api.toggleFavourite(id);
    await refreshUser();
    load();
  };

  return (
    <DashboardLayout title="Favourites">
      <h1 className="text-2xl font-bold">Favourites</h1>
      <p className="text-gray-500 mt-1">Leads you've saved for later.</p>

      {leads.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart size={48} className="mx-auto text-gray-200" />
          <p className="mt-4 text-gray-500">No favourites yet. Browse leads and click the heart icon.</p>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {leads.map((lead) => (
            <LeadRow key={lead._id} lead={lead} onPurchase={purchase} onFavourite={favourite} favourited />
          ))}
        </div>
      )}

      <AttomPropertyFeed
        variant="dashboard"
        limit={3}
        className="mt-8"
        title="Market Context"
        description="Review live ATTOM records while evaluating your saved leads."
      />
    </DashboardLayout>
  );
}
