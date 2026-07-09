import { useCallback, useEffect, useState } from 'react';
import { Mail, Phone, User, Send, MessageSquare, Inbox, ChevronLeft } from 'lucide-react';
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

function formatListDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MessageBubble({ from, body, time }) {
  const isAdmin = from === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[min(100%,28rem)] ${isAdmin ? 'pl-4 sm:pl-8' : 'pr-4 sm:pr-8'}`}>
        <p className={`text-[11px] font-semibold mb-1.5 ${isAdmin ? 'text-teal-700 text-right' : 'text-gray-600'}`}>
          {isAdmin ? 'You (Admin)' : 'User'}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isAdmin
              ? 'bg-teal-600 text-white rounded-tr-md'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        </div>
        <p className={`text-[10px] text-gray-400 mt-1.5 ${isAdmin ? 'text-right' : ''}`}>{formatDate(time)}</p>
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
  const [loading, setLoading] = useState(true);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .getAdminContacts()
      .then(setContacts)
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = contacts.filter((c) => c.status === 'new').length;

  const closeThread = () => {
    setSelected(null);
    setMobileThreadOpen(false);
    setReply('');
  };

  const selectContact = async (c) => {
    setSelected(c);
    setMobileThreadOpen(true);
    if (c.status === 'new') {
      try {
        const updated = await api.markContactRead(c._id);
        setSelected(updated);
        setContacts((prev) =>
          prev.map((item) => (item._id === updated._id ? { ...item, status: 'read' } : item))
        );
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
    <DashboardLayout title="Contacts">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
            <Inbox size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-sm text-gray-500">Review submissions and reply to users</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
            {contacts.length} total
          </span>
          {unread > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-100">
              {unread} unread
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row lg:min-h-[560px] lg:max-h-[calc(100vh-11rem)]">
        {/* Message list — hidden on mobile when viewing thread */}
        <div
          className={`lg:w-[320px] xl:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col max-h-[45vh] lg:max-h-none lg:min-h-0 ${
            mobileThreadOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inbox</p>
            <span className="text-xs font-medium text-gray-400">{contacts.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar min-h-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-400 mt-3">Loading messages…</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">No contact messages yet</p>
                <p className="text-xs text-gray-400 mt-1">User submissions will appear here</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {contacts.map((c) => {
                  const active = selected?._id === c._id;
                  const isNew = c.status === 'new';
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => selectContact(c)}
                        className={`w-full text-left px-4 py-3.5 transition-colors ${
                          active ? 'bg-teal-50/80 border-l-2 border-l-teal-600' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${isNew ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                            {c.name}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0 pt-0.5">
                            {formatListDate(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{c.subject || 'General inquiry'}</p>
                        <p className="text-xs text-gray-400 truncate mt-1 leading-relaxed">{c.message}</p>
                        {isNew && (
                          <span className="inline-flex mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                            NEW
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Thread detail — full screen on mobile */}
        <div
          className={`flex-1 flex flex-col min-h-0 bg-gray-50/30 ${
            mobileThreadOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Mail size={22} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">Select a message</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Choose a contact submission from the list to view details and reply
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white shrink-0">
                <button
                  type="button"
                  onClick={closeThread}
                  className="lg:hidden inline-flex items-center gap-1 text-sm font-medium text-teal-700 mb-2 -ml-1 px-1 py-1"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                      {selected.subject || 'General inquiry'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Received {formatDate(selected.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${
                    selected.status === 'new' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selected.status}
                  </span>
                </div>

                <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm min-w-0">
                    <User size={16} className="text-teal-600 shrink-0" />
                    <span className="font-medium truncate">{selected.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm min-w-0 sm:col-span-2">
                    <Mail size={16} className="text-teal-600 shrink-0" />
                    <a href={`mailto:${selected.email}`} className="truncate hover:text-teal-700 hover:underline">
                      {selected.email}
                    </a>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm sm:col-span-3">
                      <Phone size={16} className="text-teal-600 shrink-0" />
                      <a href={`tel:${selected.phone}`} className="hover:text-teal-700 hover:underline">
                        {selected.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 custom-scrollbar min-h-0">
                <MessageBubble from="user" body={selected.message} time={selected.createdAt} />
                {(selected.replies || []).map((r) => (
                  <MessageBubble key={r._id} from={r.from} body={r.body} time={r.createdAt} />
                ))}
              </div>

              <form onSubmit={sendReply} className="p-3 sm:p-5 border-t border-gray-100 bg-white shrink-0">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">
                  Reply to user
                </label>
                <p className="text-xs text-gray-400 mb-2 sm:mb-3 hidden sm:block">
                  Your reply appears in the user&apos;s Inbox
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end">
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 focus:bg-white min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 w-full sm:w-auto shrink-0"
                  >
                    <Send size={16} />
                    {sending ? 'Sending…' : 'Send'}
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
