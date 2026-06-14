import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  const load = () => api.getUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  const updateUser = async (id, changes) => {
    await api.updateUser(id, changes);
    load();
  };

  return (
    <DashboardLayout title="Users" panel="admin">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="text-gray-500 mt-1">{users.length} registered users.</p>

      <div className="mt-6 bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Leads Left</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-gray-50">
                <td className="px-6 py-4 font-medium">{u.name}</td>
                <td className="px-6 py-4 text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <select value={u.role} onChange={(e) => updateUser(u._id, { role: e.target.value })}
                    className="text-sm border rounded px-2 py-1 capitalize">
                    {['buyer', 'admin', 'team'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select value={u.plan} onChange={(e) => updateUser(u._id, { plan: e.target.value })}
                    className="text-sm border rounded px-2 py-1 capitalize">
                    {['none', 'basic', 'pro', 'enterprise'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    defaultValue={u.leadsRemaining}
                    onBlur={(e) => updateUser(u._id, { leadsRemaining: +e.target.value })}
                    className="w-20 text-sm border rounded px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
