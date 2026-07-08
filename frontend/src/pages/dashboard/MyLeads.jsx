import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Download } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import PropertyLeadCard from '../../components/PropertyLeadCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { usePropertyLeadActions } from '../../hooks/usePropertyLeadActions';
import { useToast } from '../../context/ToastContext';
import { refreshNotificationBadge } from '../../utils/notifications';

export default function MyLeads() {
  const { user } = useAuth();
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(
    () =>
      api
        .getPropertyMyLeads()
        .then(setLeads)
        .catch((err) => {
          setLeads([]);
          toast.error(err.message || 'Could not load My Leads');
        }),
    [toast]
  );

  useEffect(() => { load(); }, [user?.myPropertyLeads, load]);

  const { favouriteIds, toggleFavourite, toggleMyLead } = usePropertyLeadActions();

  const handleDelete = (lead) => {
    const idStr = String(lead._id || lead.id || lead.radarId);
    setLeads((prev) => prev.filter((l) => String(l._id || l.id || l.radarId) !== idStr));
    toggleMyLead(lead).catch(() => load());
  };

  const handleFavourite = (lead) => {
    toggleFavourite(lead).catch(() => {});
  };

  const handleExport = async () => {
    if (!leads.length) return;
    setExporting(true);
    try {
      const blob = await api.exportMyPropertyLeads();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'realist-my-leads.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Excel downloaded successfully — ${leads.length} leads`);
      refreshNotificationBadge();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="My Leads">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Leads</h1>
          <p className="text-gray-500 mt-1">Properties you marked with the green tick from Browse Leads.</p>
        </div>
        {leads.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
          >
            <Download size={16} /> Download Excel
          </button>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="mt-12 text-center">
          <BookOpen size={48} className="mx-auto text-green-200" />
          <p className="mt-4 text-gray-500">No saved leads yet. Browse leads and click the green tick.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {leads.map((lead, idx) => (
            <PropertyLeadCard
              key={lead._id}
              lead={lead}
              index={idx + 1}
              saved
              showSave={false}
              favourited={favouriteIds.has(String(lead._id || lead.id || lead.radarId))}
              onDelete={handleDelete}
              onFavourite={handleFavourite}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
