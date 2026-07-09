import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import { api } from '../../api/client';
import { formatPrice, typeLabel } from '../../utils/format';

const emptyLead = {
  city: '', state: '', propertyType: 'Single Family', beds: 3, baths: 2, sqft: 1500,
  leadType: 'foreclosure', tier: 'premium', estValue: 300000, arv: 380000, price: 299,
  ownerName: '', ownerPhone: '', address: '', exclusive: false, urgent: false,
};

export default function ManageLeads({ panel = 'admin' }) {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyLead);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.getStaffLeads().then(setLeads);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      estValue: +form.estValue,
      arv: +form.arv,
      price: +form.price,
      beds: +form.beds,
      baths: +form.baths,
      sqft: +form.sqft,
    };
    if (editingId) {
      await api.updateLead(editingId, payload);
    } else {
      await api.createLead(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyLead);
    load();
  };

  const startEdit = (lead) => {
    setForm({ ...emptyLead, ...lead });
    setEditingId(lead._id);
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await api.deleteLead(id);
    load();
  };

  return (
    <DashboardLayout title="Manage Leads" panel={panel}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Leads</h1>
          <p className="text-gray-500 mt-1">{leads.length} leads in the system.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyLead); }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm"
        >
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mt-6 bg-white rounded-2xl border p-6 grid md:grid-cols-3 gap-4">
          {['city', 'state', 'propertyType', 'ownerName', 'ownerPhone', 'address'].map((f) => (
            <input key={f} required={['city', 'state'].includes(f)} placeholder={f} value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm" />
          ))}
          {['beds', 'baths', 'sqft', 'estValue', 'arv', 'price'].map((f) => (
            <input key={f} type="number" placeholder={f} value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm" />
          ))}
          <select value={form.leadType} onChange={(e) => setForm({ ...form, leadType: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            {['pre-foreclosure', 'foreclosure', 'probate', 'tax-delinquent', 'absentee-owner', 'vacant', 'abandoned', 'bankruptcy', 'medical', 'distressed'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            {['basic', 'qualified', 'premium'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {panel === 'admin' && (
            <select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
              {['active', 'inactive', 'sold'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button type="submit" className="md:col-span-3 py-2.5 bg-black text-white rounded-lg text-sm font-medium">
            {editingId ? 'Update Lead' : 'Create Lead'}
          </button>
        </form>
      )}

      <div className="mt-6">
        <DataTable
          columns={[
            { key: 'location', label: 'Location' },
            { key: 'type', label: 'Type' },
            { key: 'tier', label: 'Tier' },
            { key: 'value', label: 'Value' },
            { key: 'price', label: 'Price' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: '' },
          ]}
          empty={leads.length === 0}
          emptyMessage="No leads yet."
        >
          {leads.map((l) => (
            <tr key={l._id}>
              <td className="font-medium cell-nowrap">{l.city}, {l.state}</td>
              <td className="capitalize cell-nowrap">{typeLabel(l.leadType)}</td>
              <td className="uppercase text-xs font-bold cell-nowrap">{l.tier}</td>
              <td className="cell-nowrap">{formatPrice(l.estValue)}</td>
              <td className="font-bold cell-nowrap">${l.price}</td>
              <td className="capitalize cell-nowrap">{l.status}</td>
              <td>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(l)} className="text-gray-500 hover:text-gray-900">
                    <Pencil size={16} />
                  </button>
                  {panel === 'admin' && (
                    <button type="button" onClick={() => remove(l._id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </DashboardLayout>
  );
}
