import { useCallback, useEffect, useState } from 'react';
import { Inbox as InboxIcon, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { refreshNotificationBadge } from '../../utils/notifications';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageBubble({ from, body, time }) {
  const isAdmin = from === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isAdmin
            ? 'bg-teal-50 border border-teal-100 text-gray-800'
            : 'bg-gray-900 text-white'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-70">
          {isAdmin ? 'REALIST Admin' : 'You'}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        <p className={`text-[10px] mt-2 ${isAdmin ? 'text-gray-400' : 'text-gray-300'}`}>{formatDate(time)}</p>
      </div>
    </div>
  );
}

export default function UserInbox() {
  const toast = useToast();
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(() => {
    setLoading(true);
    return api
      .getInbox()
      .then(setThreads)
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const openThread = async (thread) => {
    try {
      const full = await api.getInboxThread(thread._id);
      setSelected(full);
      setThreads((prev) =>
        prev.map((t) =>
          t._id === full._id ? { ...t, unreadReplies: 0, replies: full.replies } : t
        )
      );
      refreshNotificationBadge();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      const data = await api.replyInbox(selected._id, reply.trim());
      setSelected(data.contact);
      setReply('');
      toast.success('Message sent');
      loadThreads();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = threads.reduce((sum, t) => sum + (t.unreadReplies || 0), 0);

  return (
    <DashboardLayout title="Inbox">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <InboxIcon size={24} /> Inbox
          </h1>
          <p className="text-gray-500 mt-1">
            Admin replies to your contact messages appear here.
            {unreadTotal > 0 && (
              <span className="ml-2 text-teal-700 font-semibold">{unreadTotal} unread</span>
            )}
          </p>
        </div>
        <Link
          to="/dashboard/contact"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50"
        >
          New message
        </Link>
      </div>

      <div className="mt-8 grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden max-h-[70vh] flex flex-col">
          <div className="px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            Conversations ({threads.length})
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <p className="p-6 text-center text-gray-400 text-sm">Loading…</p>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                <p>No messages yet.</p>
                <Link to="/dashboard/contact" className="text-teal-600 font-medium mt-2 inline-block hover:underline">
                  Contact us for more leads →
                </Link>
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => openThread(t)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selected?._id === t._id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm truncate">{t.subject || 'General inquiry'}</p>
                    {(t.unreadReplies || 0) > 0 && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                        {t.unreadReplies}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{t.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(t.updatedAt || t.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 min-h-[420px] flex flex-col">
          {!selected ? (
            <p className="text-gray-400 text-sm">Select a conversation to read messages.</p>
          ) : (
            <>
              <div className="border-b pb-4 mb-4">
                <h2 className="font-bold text-lg">{selected.subject || 'General inquiry'}</h2>
                <p className="text-xs text-gray-400 mt-1">Started {formatDate(selected.createdAt)}</p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto max-h-[45vh] pr-1">
                <MessageBubble from="user" body={selected.message} time={selected.createdAt} />
                {(selected.replies || []).map((r) => (
                  <MessageBubble
                    key={r._id}
                    from={r.from}
                    body={r.body}
                    time={r.createdAt}
                  />
                ))}
              </div>

              <form onSubmit={sendReply} className="mt-4 pt-4 border-t flex gap-2">
                <textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
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
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
