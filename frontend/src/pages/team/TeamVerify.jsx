import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';

export default function TeamVerify() {
  const [leads, setLeads] = useState([]);

  const load = () => api.getStaffLeads().then((all) => setLeads(all.filter((l) => l.status === 'inactive')));

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    await api.updateLead(id, { status: 'active' });
    load();
  };

  return (
    <DashboardLayout title="Verify Leads" panel="team">
      <h1 className="text-2xl font-bold">Verify Leads</h1>
      <p className="text-gray-500 mt-1">Review and approve leads before marketplace listing.</p>

      <div className="mt-6 space-y-4">
        {leads.map((l) => (
          <div key={l._id} className="bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{l.city}, {l.state}</p>
              <p className="text-sm text-gray-500">{l.ownerName} · {l.ownerPhone}</p>
              <p className="text-xs text-amber-600 mt-1 capitalize">Pending verification</p>
            </div>
            <button onClick={() => verify(l._id)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 w-full sm:w-auto">
              <CheckCircle size={16} /> Approve
            </button>
          </div>
        ))}
        {leads.length === 0 && (
          <p className="text-center text-gray-400 py-12">No leads pending verification.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
