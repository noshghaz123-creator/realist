import { useEffect, useState } from 'react';
import {
  Building2, Gavel, FileText, Landmark, Users, TrendingUp,
  AlertTriangle, MapPin, ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';
import { getSampleForCategory } from '../data/sampleProperties';
import { formatPrice } from '../utils/format';

const FILTER_ICONS = {
  all: Building2,
  foreclosure: Gavel,
  bankruptcy: AlertTriangle,
  records: FileText,
  mortgage: Landmark,
  ownership: Users,
  equity: TrendingUp,
};

const badgeClass = {
  foreclosure: 'bg-red-50 text-red-700 border-red-100',
  bankruptcy: 'bg-orange-50 text-orange-700 border-orange-100',
  records: 'bg-slate-50 text-slate-600 border-slate-100',
  mortgage: 'bg-blue-50 text-blue-700 border-blue-100',
  ownership: 'bg-violet-50 text-violet-700 border-violet-100',
  equity: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function formatLocation(city, state, zip) {
  const formattedCity = city
    ? city.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : null;
  return [formattedCity, state, zip].filter(Boolean).join(', ');
}

function DataCell({ label, value, highlight }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-sm font-semibold truncate ${highlight ? 'text-teal-700' : 'text-slate-800'}`}>
        {value ?? '—'}
      </p>
    </div>
  );
}

export default function AttomPropertyFeed({
  variant = 'landing',
  limit: limitProp,
  className = '',
  title,
  description,
}) {
  const isDashboard = variant === 'dashboard';
  const [viewportLimit, setViewportLimit] = useState(limitProp ?? (isDashboard ? 4 : 8));
  const limit = limitProp ?? viewportLimit;

  useEffect(() => {
    if (limitProp != null) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => setViewportLimit(isDashboard ? 4 : mq.matches ? 4 : 8);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [limitProp, isDashboard]);

  const [category, setCategory] = useState('all');
  const [filters, setFilters] = useState([{ id: 'all', label: 'All Properties', icon: Building2 }]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('batchdata');
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getAttomCategories().then((cats) => {
      if (!cats || typeof cats !== 'object' || Array.isArray(cats)) return;
      const dynamic = Object.entries(cats).map(([id, label]) => ({
        id,
        label,
        icon: FILTER_ICONS[id] || FileText,
      }));
      setFilters([{ id: 'all', label: 'All Properties', icon: Building2 }, ...dynamic]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getAttomProperties(category, limit)
      .then((data) => {
        const props = data.properties || [];
        if (props.length > 0) {
          setProperties(props);
          setSource(data.source || 'batchdata');
          setLive(Boolean(data.live));
          setMessage(data.message || null);
        } else {
          setProperties(getSampleForCategory(category, limit));
          setSource('sample');
          setLive(false);
          setMessage('Live BatchData unavailable — showing sample properties.');
        }
      })
      .catch(() => {
        setProperties(getSampleForCategory(category, limit));
        setSource('sample');
        setLive(false);
        setMessage('Unable to reach API — showing sample properties.');
      })
      .finally(() => setLoading(false));
  }, [category, limit]);

  const Wrapper = isDashboard ? 'div' : 'section';
  const wrapperClass = isDashboard
    ? `bg-white rounded-2xl border border-gray-100 p-6 ${className}`
    : `page-section bg-slate-50/80 ${className}`;

  const content = (
    <>
        <div className={isDashboard ? 'mb-5' : 'section-header max-w-3xl'}>
          {isDashboard ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg text-slate-900">
                  {title || 'BatchData Property Intelligence'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {description || 'Live property records — foreclosure, mortgage, ownership & equity.'}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  live && properties.length
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : properties.length
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-slate-50 text-slate-600 border-slate-100'
                }`}
              >
                {live && properties.length
                  ? 'Live BatchData'
                  : properties.length
                    ? 'Sample Data'
                    : 'BatchData'}
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <span className="section-badge">BatchData Property Data</span>
                {live && properties.length ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
                    Live
                  </span>
                ) : properties.length ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-100">
                    Sample Data
                  </span>
                ) : null}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Distressed Property Records
              </h2>
              <p>
                South Florida properties with{' '}
                <strong className="text-slate-700">foreclosure, bankruptcy, mortgage, ownership & equity</strong>{' '}
                data — powered by{' '}
                <a
                  href="https://batchdata.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  BatchData API <ExternalLink size={14} />
                </a>
              </p>
            </>
          )}
        </div>

        <div className={`flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 ${isDashboard ? '' : 'justify-center px-0 sm:px-1'}`}>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategory(f.id)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                category === f.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <f.icon size={14} className="sm:w-[15px] sm:h-[15px]" />
              <span className="whitespace-nowrap">{f.label}</span>
            </button>
          ))}
        </div>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-xl border text-sm text-center bg-amber-50 border-amber-100 text-amber-800">
            {message}
          </div>
        )}

        {loading ? (
          <div className={`grid gap-5 ${isDashboard ? 'md:grid-cols-2' : 'md:grid-cols-2'}`}>
            {Array.from({ length: isDashboard ? 2 : 4 }, (_, n) => (
              <div
                key={n}
                className={`h-64 rounded-2xl animate-pulse ${isDashboard ? 'bg-gray-50 border border-gray-100' : 'bg-white border border-slate-100'}`}
              />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No properties found for this filter.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3 sm:gap-5">
            {properties.map((p) => (
              <article
                key={p.id}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-900/5 overflow-hidden card-lift min-w-0"
              >
                <div className="px-4 py-3 sm:px-6 sm:py-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                        {p.address}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">
                          {formatLocation(p.city, p.state, p.zip)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {p.propertyType}
                        {p.beds != null && ` · ${p.beds}bd/${p.baths}ba`}
                        {p.sqft != null && ` · ${p.sqft.toLocaleString()} sqft`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400 font-medium">AVM Value</p>
                      <p className="text-xl font-extrabold text-slate-900">
                        {p.avmValue ? formatPrice(p.avmValue) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.categories?.map((c) => (
                      <span
                        key={c}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${badgeClass[c] || badgeClass.records}`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 sm:px-6 sm:py-5 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <DataCell label="Owner" value={p.owner?.name} />
                  <DataCell label="Mortgage Lender" value={p.mortgage?.lender} />
                  <DataCell
                    label="Loan Balance"
                    value={p.mortgage?.balance ? formatPrice(p.mortgage.balance) : null}
                  />
                  <DataCell
                    label="Home Equity"
                    value={p.equity?.amount ? formatPrice(p.equity.amount) : null}
                    highlight
                  />
                  <DataCell
                    label="Foreclosure Status"
                    value={p.foreclosure?.status || (p.bankruptcy ? 'Bankruptcy Filing' : 'None')}
                  />
                  <DataCell
                    label="Assessed Value"
                    value={p.assessedValue ? formatPrice(p.assessedValue) : null}
                  />
                </div>

                {(p.foreclosure?.auctionDate || p.foreclosure?.defaultAmount) && (
                  <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-red-50/60 border-t border-red-100 text-xs text-red-700 font-medium">
                    {p.foreclosure.auctionDate && <>Auction: {p.foreclosure.auctionDate}</>}
                    {p.foreclosure.defaultAmount && (
                      <span className={p.foreclosure.auctionDate ? ' · ' : ''}>
                        Default: {formatPrice(p.foreclosure.defaultAmount)}
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {!isDashboard && (
          <p className="text-center text-xs text-slate-400 mt-6">
            {live && properties.length
              ? 'Live property data from BatchData API'
              : properties.length
                ? 'Sample property data — live BatchData unavailable'
                : 'Property data via BatchData — Florida markets'}
          </p>
        )}
    </>
  );

  if (isDashboard) {
    return <Wrapper className={wrapperClass}>{content}</Wrapper>;
  }

  return (
    <Wrapper id="property-data" className={wrapperClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{content}</div>
    </Wrapper>
  );
}
