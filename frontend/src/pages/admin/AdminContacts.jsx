import { useEffect, useState } from 'react';
import { Mail, Phone, User, Send } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

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

function MessageBubble({ from, body, time }) {
  const isAdmin = from === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isAdmin
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 border border-gray-200 text-gray-800'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-70">
          {isAdmin ? 'You (Admin)' : 'User'}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        <p className={`text-[10px] mt-2 ${isAdmin ? 'text-teal-100' : 'text-gray-400'}`}>{formatDate(time)}</p>
      </div>
    </div>
  );
}

export default function AdminContacts() {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => api.getAdminContacts().then(setContacts).catch(() => {});
  useEffect(() => { load(); }, []);

  const unread = contacts.filter((c) => c.status === 'new').length;

  const selectContact = async (c) => {
    setSelected(c);
    if (c.status === 'new') {
      try {
        const updated = await api.markContactRead(c._id);
        setSelected(updated);
        load();
      } catch {
        /* ignore */
      }
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      const data = await api.adminReplyContact(selected._id, reply.trim());
      setSelected(data.contact);
      setReply('');
      toast.success('Reply sent to user inbox');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title="Contact Messages" panel="admin">
      <h1 className="text-2xl font-bold">Contact Form Submissions</h1>
      <p className="text-gray-500 mt-1">
        Reply to users — your message appears in their Inbox · {unread} unread
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
                  onClick={() => selectContact(c)}
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

        <div className="lg:col-span-3 bg-white rounded-2xl border p-6 min-h-[420px] flex flex-col">
          {!selected ? (
            <p className="text-gray-400 text-sm">Select a message to view and reply.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b pb-4">
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

              <div className="mt-4 space-y-3 text-sm">
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

              <div className="mt-4 flex-1 space-y-4 overflow-y-auto max-h-[40vh] pr-1">
                <MessageBubble from="user" body={selected.message} time={selected.createdAt} />
                {(selected.replies || []).map((r) => (
                  <MessageBubble key={r._id} from={r.from} body={r.body} time={r.createdAt} />
                ))}
              </div>

              <form onSubmit={sendReply} className="mt-4 pt-4 border-t">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Reply to user</label>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply — user will see this in their Inbox…"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="self-end inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
