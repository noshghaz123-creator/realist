import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import AttomPropertyFeed from '../../components/AttomPropertyFeed';
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
          <div key={l._id} className="bg-white rounded-2xl border p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold">{l.city}, {l.state}</p>
              <p className="text-sm text-gray-500">{l.ownerName} · {l.ownerPhone}</p>
              <p className="text-xs text-amber-600 mt-1 capitalize">Pending verification</p>
            </div>
            <button onClick={() => verify(l._id)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <CheckCircle size={16} /> Approve
            </button>
          </div>
        ))}
        {leads.length === 0 && (
          <p className="text-center text-gray-400 py-12">No leads pending verification.</p>
        )}
      </div>

      <AttomPropertyFeed
        variant="dashboard"
        limit={3}
        className="mt-8"
        title="Verification Reference"
        description="Compare pending leads against live ATTOM foreclosure, ownership, and mortgage data."
      />
    </DashboardLayout>
  );
}
