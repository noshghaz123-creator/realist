import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';

export default function TeamOverview() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    api.getStaffLeads().then(setLeads);
  }, []);

  const pending = leads.filter((l) => l.status === 'inactive').length;

  return (
    <DashboardLayout title="Team Overview" panel="team">
      <h1 className="text-2xl font-bold">Team Dashboard</h1>
      <p className="text-gray-500 mt-1">Verify leads and manage data collection.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[
          ['Active Leads', pending],
          ['Total Listed', leads.length],
          ['To Verify', pending],
        ].map(([label, val]) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{val}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link to="/team/leads" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Manage Leads</Link>
        <Link to="/team/verify" className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-center">Verify Leads</Link>
      </div>
    </DashboardLayout>
  );
}
