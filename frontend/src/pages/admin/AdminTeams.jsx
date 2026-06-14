import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';

export default function AdminTeams() {
  const [team, setTeam] = useState([]);

  useEffect(() => {
    api.getUsers().then((u) => setTeam(u.filter((x) => x.role === 'team')));
  }, []);

  return (
    <DashboardLayout title="Teams" panel="admin">
      <h1 className="text-2xl font-bold">Internal Teams</h1>
      <p className="text-gray-500 mt-1">Manage verification and data collection team members.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {team.map((m) => (
          <div key={m._id} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
              {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-gray-500">{m.email}</p>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">Team Member</span>
            </div>
          </div>
        ))}
        {team.length === 0 && <p className="text-gray-400">No team members yet.</p>}
      </div>
    </DashboardLayout>
  );
}
