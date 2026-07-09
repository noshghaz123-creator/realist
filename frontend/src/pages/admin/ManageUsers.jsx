import { useEffect, useState } from 'react';
import { Ban, ShieldCheck, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable, { DataCardGrid } from '../../components/DataTable';
import UserAvatar from '../../components/UserAvatar';
import PlanBadge from '../../components/PlanBadge';
import { api } from '../../api/client';

function ConfirmModal({ open, title, message, confirmLabel, confirmClass, loading, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold pr-8">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ open, title, message, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
          <ShieldCheck size={24} />
        </div>
        <h3 className="text-lg font-bold mt-4">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}

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
  const [blockAction, setBlockAction] = useState(null);
  const [blockSaving, setBlockSaving] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);

  const load = () => api.getUsers().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateUser = async (id, changes) => {
    try {
      const updated = await api.updateUser(id, changes);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...updated } : u)));
      if (changes.blocked === undefined) {
        setMessage('User updated.');
      }
      return updated;
    } catch (err) {
      setMessage(err.message || 'Update failed.');
      throw err;
    }
  };

  const openBlockConfirm = (user) => {
    setBlockAction({ user, block: !user.blocked });
  };

  const confirmBlockAction = async () => {
    if (!blockAction) return;
    const { user, block } = blockAction;
    setBlockSaving(true);
    try {
      await updateUser(user._id, { blocked: block });
      setBlockAction(null);
      setSuccessPopup({
        title: block ? 'User Blocked' : 'User Unblocked',
        message: block
          ? `${user.name} has been blocked. They cannot log in until you unblock them.`
          : `${user.name} can log in again.`,
      });
    } catch {
      // error shown via message state
    } finally {
      setBlockSaving(false);
    }
  };

  const buyers = users.filter((u) => u.role === 'buyer');
  const staff = users.filter((u) => u.role !== 'buyer');

  return (
    <DashboardLayout title="Users" panel="admin">
      <ConfirmModal
        open={Boolean(blockAction)}
        title={blockAction?.block ? 'Block this user?' : 'Unblock this user?'}
        message={
          blockAction?.block
            ? `${blockAction.user.name} (${blockAction.user.email}) will lose access immediately. You can unblock them anytime.`
            : `${blockAction?.user.name} will be able to sign in and use the platform again.`
        }
        confirmLabel={blockAction?.block ? 'Block User' : 'Unblock User'}
        confirmClass={blockAction?.block ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
        loading={blockSaving}
        onConfirm={confirmBlockAction}
        onCancel={() => !blockSaving && setBlockAction(null)}
      />

      <SuccessModal
        open={Boolean(successPopup)}
        title={successPopup?.title}
        message={successPopup?.message}
        onClose={() => setSuccessPopup(null)}
      />

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
            <div key={u._id} className={`data-card ${u.blocked ? 'bg-red-50/40' : ''}`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <UserAvatar user={u} size="lg" className="!w-12 !h-12 !text-sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-base">{u.name}</p>
                        {u.blocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 break-all">{u.email}</p>
                      <p className="text-xs text-gray-400 mt-1">Signed up {formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start">
                    <PlanBadge plan={u.plan} />
                    <button
                      type="button"
                      onClick={() => openBlockConfirm(u)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        u.blocked
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {u.blocked ? (
                        <><ShieldCheck size={14} /> Unblock</>
                      ) : (
                        <><Ban size={14} /> Block</>
                      )}
                    </button>
                  </div>
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
