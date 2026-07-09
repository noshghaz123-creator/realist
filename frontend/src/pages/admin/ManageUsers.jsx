import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable, { DataCardGrid } from '../../components/DataTable';
import UserAvatar from '../../components/UserAvatar';
import { api } from '../../api/client';
import { planLabel } from '../../components/PlanBadge';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LeadLimitCell({ user, onSave }) {
  const [value, setValue] = useState(String(user.leadLimit ?? user.leadsRemaining ?? 50));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(user.leadLimit ?? user.leadsRemaining ?? 50));
  }, [user.leadLimit, user.leadsRemaining, user._id]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(user._id, Number(value) || 0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1.5"
        aria-label={`Lead limit for ${user.name}`}
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? '…' : 'Save'}
      </button>
    </div>
  );
}

function Field({ label, value, highlight }) {
  return (
    <div>
      <p className="data-field-label">{label}</p>
      <p className={`data-field-value ${highlight ? 'font-semibold text-teal-700' : ''}`}>{value}</p>
    </div>
  );
}

const STAFF_COLUMNS = [
  { key: 'avatar', label: '' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'plan', label: 'Plan' },
];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  const load = () => api.getUsers().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateUser = async (id, changes) => {
    await api.updateUser(id, changes);
    setMessage('User updated.');
    load();
  };

  const buyers = users.filter((u) => u.role === 'buyer');
  const staff = users.filter((u) => u.role !== 'buyer');

  return (
    <DashboardLayout title="Users" panel="admin">
      <h1 className="text-2xl font-bold">Registered Users</h1>
      <p className="text-gray-500 mt-1">
        {buyers.length} buyer signups · new users get 50-lead free trial · assign lead limits on demand
      </p>

      {message && (
        <p className="mt-4 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5">
          {message}
        </p>
      )}

      <h2 className="mt-8 text-lg font-bold">New Signups (Buyers)</h2>
      <div className="mt-4">
        <DataCardGrid
          items={buyers}
          emptyMessage="No buyer signups yet."
          renderItem={(u) => (
            <div key={u._id} className="data-card">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <UserAvatar user={u} size="lg" className="!w-12 !h-12 !text-sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-base">{u.name}</p>
                      <p className="text-sm text-gray-500 break-all">{u.email}</p>
                      <p className="text-xs text-gray-400 mt-1">Signed up {formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                  <span className="self-start text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                    {planLabel(u.plan)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Field label="Phone" value={u.phone || '—'} />
                  <Field label="Company" value={u.company || '—'} />
                  <Field label="Location" value={u.location || '—'} />
                  <Field label="Leads Used" value={u.leadsUsed ?? 0} highlight />
                  <Field label="Remaining" value={u.leadsRemaining ?? 0} highlight />
                  <div>
                    <p className="data-field-label">Lead Limit</p>
                    <LeadLimitCell user={u} onSave={(id, leadLimit) => updateUser(id, { leadLimit })} />
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      <h2 className="mt-10 text-lg font-bold">Staff Accounts</h2>
      <div className="mt-4">
        <DataTable columns={STAFF_COLUMNS} empty={staff.length === 0} emptyMessage="No staff accounts.">
          {staff.map((u) => (
            <tr key={u._id}>
              <td><UserAvatar user={u} size="sm" /></td>
              <td className="font-medium cell-nowrap">{u.name}</td>
              <td className="text-gray-500 cell-email">{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => updateUser(u._id, { role: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 capitalize bg-white w-full max-w-[120px]"
                >
                  {['buyer', 'admin', 'team'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td className="capitalize text-gray-600">{u.plan}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </DashboardLayout>
  );
}
