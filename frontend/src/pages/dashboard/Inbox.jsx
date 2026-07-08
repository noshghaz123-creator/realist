import { useCallback, useEffect, useState } from 'react';
import { Inbox as InboxIcon, Send, Mail, MessageSquare, PenLine } from 'lucide-react';
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
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[min(100%,28rem)] ${isAdmin ? 'pr-8' : 'pl-8'}`}>
        <p className={`text-[11px] font-semibold mb-1.5 ${isAdmin ? 'text-teal-700' : 'text-gray-500 text-right'}`}>
          {isAdmin ? 'REALIST Support' : 'You'}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isAdmin
              ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-md'
              : 'bg-gray-900 text-white rounded-tr-md'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        </div>
        <p className={`text-[10px] text-gray-400 mt-1.5 ${isAdmin ? '' : 'text-right'}`}>{formatDate(time)}</p>
      </div>
    </div>
  );
}

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
        <Mail size={26} className="text-teal-600" />
      </div>
      <p className="font-semibold text-gray-900">No conversations yet</p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">
        Send a message from Contact and admin replies will show up here.
      </p>
      <Link
        to="/dashboard/contact"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800"
      >
        <PenLine size={16} /> New message
      </Link>
    </div>
  );
}

export default function Inbox() {
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
              <InboxIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
              <p className="text-sm text-gray-500">Messages with the REALIST team</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadTotal > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-100">
              {unreadTotal} unread
            </span>
          )}
          <Link
            to="/dashboard/contact"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <PenLine size={16} /> Compose
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-13rem)] lg:min-h-[560px] max-h-[calc(100vh-10rem)]">
        {/* Thread list */}
        <div className="lg:w-[320px] xl:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col min-h-[240px] lg:min-h-0">
          <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations</p>
            <span className="text-xs font-medium text-gray-400">{threads.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-400 mt-3">Loading…</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No messages yet</p>
                <Link to="/dashboard/contact" className="text-sm text-teal-600 font-medium mt-2 inline-block hover:underline">
                  Start a conversation
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {threads.map((t) => {
                  const active = selected?._id === t._id;
                  const unread = t.unreadReplies || 0;
                  return (
                    <li key={t._id}>
                      <button
                        type="button"
                        onClick={() => openThread(t)}
                        className={`w-full text-left px-4 py-3.5 transition-colors ${
                          active ? 'bg-teal-50/80 border-l-2 border-l-teal-600' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                            {t.subject || 'General inquiry'}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0 pt-0.5">
                            {formatListDate(t.updatedAt || t.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1 leading-relaxed">{t.message}</p>
                        {unread > 0 && (
                          <span className="inline-flex mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                            {unread} new
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

        {/* Thread detail */}
        <div className="flex-1 flex flex-col min-h-[360px] lg:min-h-0 bg-gray-50/30">
          {!selected ? (
            threads.length === 0 && !loading ? (
              <EmptyInbox />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <MessageSquare size={22} className="text-gray-400" />
                </div>
                <p className="font-medium text-gray-700">Select a conversation</p>
                <p className="text-sm text-gray-400 mt-1">Choose a thread from the list to read messages</p>
              </div>
            )
          ) : (
            <>
              <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-white">
                <h2 className="font-bold text-gray-900">{selected.subject || 'General inquiry'}</h2>
                <p className="text-xs text-gray-400 mt-1">Started {formatDate(selected.createdAt)}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 custom-scrollbar">
                <MessageBubble from="user" body={selected.message} time={selected.createdAt} />
                {(selected.replies || []).map((r) => (
                  <MessageBubble key={r._id} from={r.from} body={r.body} time={r.createdAt} />
                ))}
              </div>

              <form onSubmit={sendReply} className="p-4 sm:p-5 border-t border-gray-100 bg-white">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Reply
                </label>
                <div className="flex gap-3 items-end">
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your message…"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 shrink-0"
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
