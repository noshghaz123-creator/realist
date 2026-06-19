import { Link } from 'react-router-dom';
import { Heart, Lock, Eye, Zap } from 'lucide-react';
import { formatPrice, typeLabel, tierLabel } from '../utils/format';

export default function LeadRow({ lead, onFavourite, onPurchase, favourited }) {
  const tierColors = {
    basic: 'bg-gray-100 text-gray-600',
    qualified: 'bg-blue-50 text-blue-700',
    premium: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{lead.city}, {lead.state}</span>
          {lead.exclusive && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Exclusive</span>
          )}
          {lead.purchased && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Purchased</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {lead.propertyType} · {lead.beds}bd/{lead.baths}ba
          {lead.sqft ? ` · ${lead.sqft.toLocaleString()} sqft` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{typeLabel(lead.leadType)}</span>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tierColors[lead.tier]}`}>{tierLabel(lead.tier)}</span>
          <span className="text-sm font-bold ml-auto">${lead.price}</span>
        </div>
        {lead.urgent && (
          <p className="text-xs text-orange-600 flex items-center gap-1 mt-1"><Zap size={12} /> Immediate Sale</p>
        )}
      </div>
      <div className="hidden md:block w-28 shrink-0">
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{typeLabel(lead.leadType)}</span>
      </div>
      <div className="hidden md:block w-24 shrink-0">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tierColors[lead.tier]}`}>{tierLabel(lead.tier)}</span>
      </div>
      <div className="hidden lg:block w-20 text-sm shrink-0">{formatPrice(lead.estValue)}</div>
      <div className="hidden lg:block w-20 text-sm text-green-600 font-medium shrink-0">{formatPrice(lead.arv)} ARV</div>
      <div className="hidden sm:block w-16 text-sm font-bold shrink-0">${lead.price}</div>
      <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
        {onFavourite && (
          <button onClick={() => onFavourite(lead._id)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Heart size={18} className={favourited ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
        )}
        {lead.purchased ? (
          <Link to={`/leads/${lead._id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Eye size={14} /> View
          </Link>
        ) : (
          <button onClick={() => onPurchase?.(lead._id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            <Lock size={14} /> Unlock
          </button>
        )}
      </div>
    </div>
  );
}
