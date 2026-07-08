import { useEffect, useState } from 'react';
import { Mail, Phone, User } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = () => api.getAdminContacts().then(setContacts).catch(() => {});
  useEffect(() => { load(); }, []);

  const unread = contacts.filter((c) => c.status === 'new').length;

  return (
    <DashboardLayout title="Contact Messages" panel="admin">
      <h1 className="text-2xl font-bold">Contact Form Submissions</h1>
      <p className="text-gray-500 mt-1">
        Messages from the home page contact form · {unread} unread
      </p>

      <div className="mt-8 grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden max-h-[70vh] flex flex-col">
          <div className="px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            Inbox ({contacts.length})
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {contacts.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">No contact messages yet.</p>
            ) : (
              contacts.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={async () => {
                    setSelected(c);
                    if (c.status === 'new') {
                      const updated = await api.markContactRead(c._id);
                      setSelected(updated);
                      load();
                    }
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selected?._id === c._id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    {c.status === 'new' && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.subject || 'General inquiry'}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(c.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border p-6 min-h-[320px]">
          {!selected ? (
            <p className="text-gray-400 text-sm">Select a message to view full details.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-lg">{selected.subject || 'General inquiry'}</h2>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(selected.createdAt)}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                  selected.status === 'new' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selected.status}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-center gap-2 text-gray-700">
                  <User size={16} className="text-teal-600 shrink-0" />
                  <span className="font-medium">{selected.name}</span>
                </p>
                <p className="flex items-center gap-2 text-gray-700 break-all">
                  <Mail size={16} className="text-teal-600 shrink-0" />
                  <a href={`mailto:${selected.email}`} className="hover:underline">{selected.email}</a>
                </p>
                {selected.phone && (
                  <p className="flex items-center gap-2 text-gray-700">
                    <Phone size={16} className="text-teal-600 shrink-0" />
                    <a href={`tel:${selected.phone}`} className="hover:underline">{selected.phone}</a>
                  </p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
