import { useCallback, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import PropertyLeadCard from '../../components/PropertyLeadCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { usePropertyLeadActions } from '../../hooks/usePropertyLeadActions';
import { useToast } from '../../context/ToastContext';

export default function Favourites() {
  const { user } = useAuth();
  const toast = useToast();
  const [leads, setLeads] = useState([]);

  const load = useCallback(
    () =>
      api
        .getPropertyFavourites()
        .then(setLeads)
        .catch((err) => {
          setLeads([]);
          toast.error(err.message || 'Could not load Favourites');
        }),
    [toast]
  );

  useEffect(() => { load(); }, [user?.favouritePropertyLeads, load]);

  const { myLeadIds, toggleFavourite, toggleMyLead } = usePropertyLeadActions();

  const handleFavourite = (lead) => {
    const idStr = String(lead._id || lead.id || lead.radarId);
    setLeads((prev) => prev.filter((l) => String(l._id || l.id || l.radarId) !== idStr));
    toggleFavourite(lead).catch(() => load());
  };

  const handleSave = (lead) => {
    toggleMyLead(lead).catch(() => {});
  };

  return (
    <DashboardLayout title="Favourites">
      <h1 className="text-2xl font-bold">Favourites</h1>
      <p className="text-gray-500 mt-1">Property leads you saved with the red heart.</p>

      {leads.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart size={48} className="mx-auto text-red-200" />
          <p className="mt-4 text-gray-500">No favourites yet. Browse leads and click the red heart.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {leads.map((lead, idx) => (
            <PropertyLeadCard
              key={lead._id}
              lead={lead}
              index={idx + 1}
              favourited
              saved={myLeadIds.has(String(lead._id || lead.id || lead.radarId))}
              onFavourite={handleFavourite}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
