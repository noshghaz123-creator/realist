import { useEffect, useState } from 'react';
import { Database, Plug, RefreshCw, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../api/client';
import { formatPropertyRadarError } from '../../utils/propertyRadarErrors';

export default function AdminSync() {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [prStatus, setPrStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => api.getAdminStats().then(setStats).catch(() => {});

  useEffect(() => {
    load();
    api.getPropertyRadarStatus().then(setPrStatus).catch((err) => {
      setPrStatus({ ok: false, message: err.message });
    });
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api.getPropertyRadarStatus();
      setPrStatus(data);
      setMessage(
        data.ok
          ? `PropertyRadar connected (${data.keyHint}). FL properties available: ${data.sampleCount ?? 0}`
          : formatPropertyRadarError(data.message) || 'PropertyRadar connection failed.'
      );
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const run = async (action) => {
    setLoading(true);
    setMessage('');
    try {
      if (action === 'clear') {
        const data = await api.clearPropertyCache();
        setMessage(data.message || 'Cache cleared.');
      } else {
        const data = await api.adminSync({ action });
        setMessage(data.message || 'Sync complete.');
      }
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Property Sync" panel="admin">
      <h1 className="text-2xl font-bold">PropertyRadar Sync</h1>
      <p className="text-gray-500 mt-1">Manage cached PropertyRadar leads and featured sync.</p>

      {prStatus && (
        <p className={`mt-4 text-sm font-medium rounded-lg px-4 py-2.5 border ${
          prStatus.ok
            ? 'text-teal-700 bg-teal-50 border-teal-100'
            : 'text-red-700 bg-red-50 border-red-100'
        }`}>
          PropertyRadar: {prStatus.ok ? 'Connected' : 'Not connected'}
          {prStatus.keyHint ? ` (${prStatus.keyHint})` : ''}
          {!prStatus.ok && prStatus.message ? ` — ${formatPropertyRadarError(prStatus.message)}` : ''}
        </p>
      )}

      {message && (
        <p className="mt-4 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5">
          {message}
        </p>
      )}

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Total Cached Leads', stats?.totalCachedLeads ?? '—'],
          ['API Usage', stats?.apiUsage ?? '—'],
          ['Cache Entries', stats?.cacheEntries ?? '—'],
          ['Last Sync', stats?.lastSync ? new Date(stats.lastSync).toLocaleString() : '—'],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase">{label}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={testConnection}
          className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 hover:border-teal-200 text-left disabled:opacity-50"
        >
          <Plug size={20} className="text-teal-600" />
          <div>
            <p className="font-semibold text-gray-900">Test PropertyRadar</p>
            <p className="text-sm text-gray-500 mt-1">Verify API key and subscription (no export charge).</p>
          </div>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run('featured')}
          className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 hover:border-teal-200 text-left disabled:opacity-50"
        >
          <RefreshCw size={20} className="text-teal-600" />
          <div>
            <p className="font-semibold text-gray-900">Refresh Featured Leads</p>
            <p className="text-sm text-gray-500 mt-1">Sync 8–10 featured properties for landing page.</p>
          </div>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run('cache')}
          className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 hover:border-teal-200 text-left disabled:opacity-50"
        >
          <Database size={20} className="text-teal-600" />
          <div>
            <p className="font-semibold text-gray-900">Refresh Cache</p>
            <p className="text-sm text-gray-500 mt-1">Fetch latest FL leads into MongoDB cache.</p>
          </div>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run('clear')}
          className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 hover:border-red-200 text-left disabled:opacity-50"
        >
          <Trash2 size={20} className="text-red-500" />
          <div>
            <p className="font-semibold text-gray-900">Clear Cache</p>
            <p className="text-sm text-gray-500 mt-1">Remove all cached PropertyRadar records.</p>
          </div>
        </button>
      </div>
    </DashboardLayout>
  );
}
