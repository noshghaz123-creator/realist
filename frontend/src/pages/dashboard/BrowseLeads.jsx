import { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import SearchableLocationSelect from '../../components/SearchableLocationSelect';
import PropertyLeadCard from '../../components/PropertyLeadCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import PlanBadge from '../../components/PlanBadge';
import { formatPropertyRadarError } from '../../utils/propertyRadarErrors';
import { FL_COUNTIES, FL_CITIES } from '../../data/floridaLocations';
import {
  loadBrowseLeadsSession,
  saveBrowseLeadsSession,
} from '../../utils/browseLeadsStorage';
import { usePropertyLeadActions } from '../../hooks/usePropertyLeadActions';
import { useToast } from '../../context/ToastContext';
import { refreshNotificationBadge } from '../../utils/notifications';

const BATCH_SIZE = 10;

const EMPTY_FILTERS = {
  county: '',
  city: '',
  zipCode: '',
  propertyType: 'both',
  bedrooms: '',
  bathrooms: '',
  priceMin: '',
  priceMax: '',
  estimatedValueMin: '',
  estimatedValueMax: '',
  mortgageBalanceMin: '',
  mortgageBalanceMax: '',
  equityMin: '',
  equityMax: '',
  ownerOccupied: false,
  vacant: false,
  preForeclosure: false,
  bankruptcy: false,
  taxDelinquent: false,
  highEquity: false,
};

function buildPayload(filters) {
  const payload = { ...filters, state: 'FL' };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === '' || payload[k] === 'all') delete payload[k];
  });
  return payload;
}

function readInitialBrowseState() {
  const saved = loadBrowseLeadsSession();
  if (!saved) {
    return {
      filters: EMPTY_FILTERS,
      cacheKey: '',
      leads: [],
      batchNumber: 0,
      hasMore: false,
      message: '',
    };
  }
  return {
    filters: { ...EMPTY_FILTERS, ...saved.filters },
    cacheKey: saved.cacheKey || '',
    leads: saved.leads || [],
    batchNumber: saved.batchNumber || 1,
    hasMore: Boolean(saved.hasMore),
    message: saved.message || '',
  };
}

export default function BrowseLeads() {
  const initial = useRef(readInitialBrowseState()).current;
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useState(initial.filters);
  const [cacheKey, setCacheKey] = useState(initial.cacheKey);
  const [leads, setLeads] = useState(initial.leads);
  const [batchNumber, setBatchNumber] = useState(initial.batchNumber);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addingAll, setAddingAll] = useState(false);

  const { favouriteIds, myLeadIds, toggleFavourite, toggleMyLead, addAllMyLeads } =
    usePropertyLeadActions();

  useEffect(() => {
    if (!leads.length) return;
    saveBrowseLeadsSession({
      filters,
      cacheKey,
      leads,
      batchNumber,
      hasMore,
    });
  }, [filters, cacheKey, leads, batchNumber, hasMore]);

  const persistBrowseResult = (data) => {
    const nextLeads = data.records || [];
    const nextBatch = data.batchNumber || 1;
    const nextHasMore = Boolean(data.hasMore);
    const nextCacheKey = data.cacheKey || '';

    setCacheKey(nextCacheKey);
    setLeads(nextLeads);
    setBatchNumber(nextBatch);
    setHasMore(nextHasMore);

    saveBrowseLeadsSession({
      filters,
      cacheKey: nextCacheKey,
      leads: nextLeads,
      batchNumber: nextBatch,
      hasMore: nextHasMore,
    });

    return nextLeads.length;
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const data = await api.searchPropertyLeads(buildPayload(filters));
      const count = persistBrowseResult(data);
      toast.success(`Leads loaded successfully — ${count} properties showing`);
      refreshNotificationBadge();
      await refreshUser();
    } catch (err) {
      toast.error(formatPropertyRadarError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.refreshPropertyLeads(buildPayload(filters));
      const count = persistBrowseResult(data);
      toast.success(`Leads refreshed successfully — ${count} new properties`);
      refreshNotificationBadge();
      setShowRefreshModal(false);
      await refreshUser();
    } catch (err) {
      toast.error(formatPropertyRadarError(err.message));
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!cacheKey || !leads.length) {
      toast.error('Search first — Excel exports the properties currently shown.');
      return;
    }
    try {
      const radarIds = leads.map((l) => l.radarId).filter(Boolean);
      const blob = await api.exportPropertyLeads(cacheKey, radarIds);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `realist-fl-leads-batch-${batchNumber || 1}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Excel downloaded successfully — ${leads.length} leads`);
      refreshNotificationBadge();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFavourite = (lead) => {
    toggleFavourite(lead).catch(() => {});
  };

  const handleSaveMyLead = (lead) => {
    toggleMyLead(lead).catch(() => {});
  };

  const allSavedToMyLeads =
    leads.length > 0 &&
    leads.every((lead) => myLeadIds.has(String(lead._id || lead.id || lead.radarId)));

  const handleAddAll = async () => {
    if (!leads.length || addingAll) return;
    setAddingAll(true);
    try {
      await addAllMyLeads(leads);
    } finally {
      setAddingAll(false);
    }
  };

  const setFlag = (key) => (e) => setFilters({ ...filters, [key]: e.target.checked });

  return (
    <DashboardLayout title="Browse Leads">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Browse Leads</h1>
            <PlanBadge plan={user?.plan} />
          </div>
          <p className="text-gray-500 mt-1">
            Florida only · 10 leads per search · numbered list · heart = Favourites · tick = My Leads
          </p>
          <p className="text-sm font-medium text-teal-700 mt-2">
            {user?.leadsRemaining ?? 0} of {user?.leadLimit ?? 50} leads remaining
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowRefreshModal(true)}
            disabled={!cacheKey || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <RefreshCw size={16} /> Refresh Leads
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!leads.length || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40"
          >
            <Download size={16} /> Download Excel
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              State: Florida (FL) — fixed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableLocationSelect
              label="County"
              options={FL_COUNTIES}
              value={filters.county}
              onChange={(county) => setFilters({ ...filters, county })}
              emptyLabel="All Counties"
            />
            <SearchableLocationSelect
              label="City"
              options={FL_CITIES}
              value={filters.city}
              onChange={(city) => setFilters({ ...filters, city })}
              emptyLabel="All Cities"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              ['zipCode', 'Zip Code', 'text'],
              ['bedrooms', 'Bedrooms', 'number'],
              ['bathrooms', 'Bathrooms', 'number'],
              ['priceMin', 'Price Min ($)', 'number'],
              ['priceMax', 'Price Max ($)', 'number'],
              ['estimatedValueMin', 'Est. Value Min ($)', 'number'],
              ['estimatedValueMax', 'Est. Value Max ($)', 'number'],
              ['mortgageBalanceMin', 'Mortgage Min ($)', 'number'],
              ['mortgageBalanceMax', 'Mortgage Max ($)', 'number'],
              ['equityMin', 'Equity Min ($)', 'number'],
              ['equityMax', 'Equity Max ($)', 'number'],
            ].map(([key, label, type]) => (
              <div key={key}>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={filters[key]}
                  onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="both">Single + Multi Family</option>
                <option value="SFR">Single Family Only</option>
                <option value="MFR">Multi Family Only</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {[
              ['ownerOccupied', 'Owner Occupied'],
              ['vacant', 'Vacant'],
              ['preForeclosure', 'Pre Foreclosure'],
              ['bankruptcy', 'Bankruptcy'],
              ['taxDelinquent', 'Tax Delinquent'],
              ['highEquity', 'High Equity'],
            ].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-gray-600">
                <input type="checkbox" checked={filters[key]} onChange={setFlag(key)} className="rounded border-gray-300" />
                {label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              <Search size={16} /> Search
            </button>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Clear filters
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="data-card-shell">
            <p className="text-center text-gray-400 text-sm py-12">Searching PropertyRadar...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="data-card-shell">
            <p className="text-center text-gray-400 text-sm py-12">Set filters and click Search to load Florida leads.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-600">
                {leads.length} leads loaded · save all to My Leads with one click
              </p>
              <button
                type="button"
                onClick={handleAddAll}
                disabled={addingAll || allSavedToMyLeads}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <CheckCircle2 size={18} />
                {addingAll ? 'Adding...' : allSavedToMyLeads ? 'All Added to My Leads' : 'Add All Leads'}
              </button>
            </div>
            <div className="space-y-4">
              {leads.map((lead, idx) => {
                const leadKey = String(lead._id || lead.id || lead.radarId);
                return (
                  <PropertyLeadCard
                    key={leadKey}
                    lead={lead}
                    index={idx + 1}
                    favourited={favouriteIds.has(leadKey)}
                    saved={myLeadIds.has(leadKey)}
                    onFavourite={handleFavourite}
                    onSave={handleSaveMyLead}
                  />
                );
              })}
            </div>
            <div className="mt-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/80 text-sm text-gray-500">
              Batch {batchNumber} · {leads.length} properties shown (1–{leads.length})
              {hasMore ? ' · Refresh for next 10' : ' · End of results'}
            </div>
          </>
        )}
      </div>

      {showRefreshModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900">Refresh Leads</h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Are you sure you want to refresh the leads? This will fetch the next {BATCH_SIZE} Florida properties for your current filters.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowRefreshModal(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={handleRefresh} disabled={refreshing}
                className="px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
