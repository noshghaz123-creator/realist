import { CheckCircle, Heart, Trash2 } from 'lucide-react';
import { formatPrice } from '../utils/format';

export const LEAD_FIELD_COLUMNS = [
  { key: 'ownerName', label: 'Owner' },
  { key: 'ownerPhone', label: 'Phone' },
  { key: 'ownerEmail', label: 'Email' },
  { key: 'propertyAddress', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'zip', label: 'Zip' },
  { key: 'county', label: 'County' },
  { key: 'propertyType', label: 'Type' },
  { key: 'bedrooms', label: 'Beds' },
  { key: 'bathrooms', label: 'Baths' },
  { key: 'livingArea', label: 'Sq Ft' },
  { key: 'estimatedValue', label: 'Est. Value' },
  { key: 'mortgageBalance', label: 'Mortgage' },
  { key: 'equity', label: 'Equity' },
  { key: 'preForeclosure', label: 'Pre-FC' },
];

export function cellValue(row, key) {
  const val = row[key];
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  if (['estimatedValue', 'mortgageBalance', 'equity'].includes(key)) return formatPrice(val);
  if (val == null || val === '') return '—';
  return String(val);
}

const CARD_THEMES = [
  { bg: 'bg-teal-50/80', border: 'border-teal-200', badge: 'bg-teal-600' },
  { bg: 'bg-sky-50/80', border: 'border-sky-200', badge: 'bg-sky-600' },
  { bg: 'bg-violet-50/80', border: 'border-violet-200', badge: 'bg-violet-600' },
  { bg: 'bg-amber-50/80', border: 'border-amber-200', badge: 'bg-amber-600' },
  { bg: 'bg-rose-50/80', border: 'border-rose-200', badge: 'bg-rose-600' },
  { bg: 'bg-emerald-50/80', border: 'border-emerald-200', badge: 'bg-emerald-600' },
  { bg: 'bg-indigo-50/80', border: 'border-indigo-200', badge: 'bg-indigo-600' },
  { bg: 'bg-cyan-50/80', border: 'border-cyan-200', badge: 'bg-cyan-600' },
  { bg: 'bg-fuchsia-50/80', border: 'border-fuchsia-200', badge: 'bg-fuchsia-600' },
  { bg: 'bg-lime-50/80', border: 'border-lime-200', badge: 'bg-lime-600' },
];

export default function PropertyLeadCard({
  lead,
  index = 0,
  favourited = false,
  saved = false,
  onFavourite,
  onSave,
  onDelete,
  showSave = true,
  showActions = true,
}) {
  const theme = CARD_THEMES[(index - 1) % CARD_THEMES.length];
  const leadId = lead._id || lead.id;

  return (
    <article
      className={`browse-lead-card ${theme.bg} border ${theme.border} rounded-2xl p-4 sm:p-5 shadow-sm`}
    >
      <div className="flex gap-4">
        <div
          className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${theme.badge} text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-md`}
          aria-label={`Lead number ${index}`}
        >
          {index}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-semibold text-gray-900 text-base sm:text-lg leading-snug">
                {cellValue(lead, 'propertyAddress') !== '—'
                  ? cellValue(lead, 'propertyAddress')
                  : `${cellValue(lead, 'city')}, FL`}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {cellValue(lead, 'city')} · {cellValue(lead, 'county')} · {cellValue(lead, 'propertyType')}
              </p>
            </div>

            {showActions && (
              <div className="flex items-center gap-2 shrink-0">
                {showSave && (
                  <button
                    type="button"
                    onClick={() => onSave?.(lead)}
                    title={saved ? 'Saved in My Leads' : 'Add to My Leads'}
                    className={`lead-action-btn p-2.5 rounded-xl border ${
                      saved
                        ? 'bg-green-500 border-green-500 text-white shadow-md'
                        : 'bg-white/90 border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <CheckCircle size={20} className={saved ? 'fill-white' : ''} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(lead)}
                    title="Delete from My Leads"
                    className="lead-action-btn inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border bg-white/90 border-red-300 text-red-600 hover:bg-red-50 font-semibold text-sm"
                  >
                    <Trash2 size={18} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onFavourite?.(lead)}
                  title={favourited ? 'In Favourites' : 'Add to Favourites'}
                  className={`lead-action-btn p-2.5 rounded-xl border ${
                    favourited
                      ? 'bg-red-500 border-red-500 text-white shadow-md'
                      : 'bg-white/90 border-red-200 text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart size={20} className={favourited ? 'fill-white' : ''} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-3">
            {LEAD_FIELD_COLUMNS.map((col) => (
              <div key={col.key}>
                <p className="data-field-label">{col.label}</p>
                <p className="data-field-value">{cellValue(lead, col.key)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
