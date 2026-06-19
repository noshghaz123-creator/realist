import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Lock, MapPin, Phone, User } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import AttomPropertyFeed from '../../components/AttomPropertyFeed';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { formatPrice, tierLabel, typeLabel } from '../../utils/format';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .getLead(id)
      .then(setLead)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const purchase = async () => {
    if (!confirm('Purchase this lead?')) return;
    try {
      await api.purchaseLead(id);
      await refreshUser();
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const favourite = async () => {
    await api.toggleFavourite(id);
    await refreshUser();
  };

  const favourited = user?.favourites?.map(String).includes(String(id));

  if (loading) {
    return (
      <DashboardLayout title="Lead Details">
        <div className="py-16 text-center text-gray-400">Loading lead...</div>
      </DashboardLayout>
    );
  }

  if (error || !lead) {
    return (
      <DashboardLayout title="Lead Details">
        <p className="text-red-600">{error || 'Lead not found'}</p>
        <Link to="/leads" className="text-sm text-teal-600 mt-4 inline-block hover:underline">← Back to leads</Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Lead Details">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lead.city}, {lead.state}</h1>
            <p className="text-gray-500 mt-1">
              {lead.propertyType} · {lead.beds}bd/{lead.baths}ba
              {lead.sqft ? ` · ${lead.sqft.toLocaleString()} sqft` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 capitalize">{typeLabel(lead.leadType)}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">{tierLabel(lead.tier)}</span>
              {lead.exclusive && <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-bold">Exclusive</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">${lead.price}</p>
            <p className="text-sm text-gray-500">Est. {formatPrice(lead.estValue)} · ARV {formatPrice(lead.arv)}</p>
          </div>
        </div>

        {lead.purchased ? (
          <div className="mt-6 p-5 bg-gray-50 rounded-xl space-y-3 text-sm">
            <p className="flex items-center gap-2"><User size={16} className="text-gray-400" />{lead.ownerName}</p>
            <p className="flex items-center gap-2"><Phone size={16} className="text-gray-400" />{lead.ownerPhone}</p>
            <p className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" />{lead.address}</p>
            {lead.notes && <p className="text-gray-600 italic mt-2">{lead.notes}</p>}
          </div>
        ) : (
          <div className="mt-6 p-5 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
            Contact details are locked. Purchase this lead to unlock seller name, phone, and address.
          </div>
        )}

        {user?.role === 'buyer' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={favourite} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Heart size={16} className={favourited ? 'fill-red-500 text-red-500' : ''} />
              {favourited ? 'Saved' : 'Save'}
            </button>
            {!lead.purchased && (
              <button onClick={purchase} className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                <Lock size={16} /> Unlock Lead · ${lead.price}
              </button>
            )}
            {lead.purchased && (
              <Link to="/dashboard/my-leads" className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                Manage in My Leads
              </Link>
            )}
          </div>
        )}
      </div>

      <AttomPropertyFeed
        variant="dashboard"
        limit={3}
        className="mt-8"
        title="Market Comparison"
        description="Live BatchData records for similar distressed properties in South Florida."
      />
    </DashboardLayout>
  );
}
