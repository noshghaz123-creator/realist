import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Star, Shield, Zap, BarChart3, Users, Lock,
  Database, Phone, BadgeCheck, Store, ShoppingCart, CircleCheck,
  Sparkles, TrendingUp, Quote,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import { api } from '../api/client';
import { formatMoney, formatPrice } from '../utils/format';
import {
  MISSION, GEO_FOCUS, HIGH_VALUE_LEADS, PREMIUM_LEAD_TRAITS,
  USP, WORKFLOW_STEPS,
} from '../data/business';
import { FALLBACK_STATS, FALLBACK_LEADS } from '../data/homeShowcase';

const features = [
  { icon: Shield, title: 'Pre-Qualified Leads', desc: USP[0], color: 'bg-emerald-50 text-emerald-600' },
  { icon: Phone, title: 'Real Seller Conversations', desc: USP[1], color: 'bg-blue-50 text-blue-600' },
  { icon: TrendingUp, title: 'ARV + Repair Analysis', desc: USP[2], color: 'bg-teal-50 text-teal-600' },
  { icon: Zap, title: 'Fast Delivery', desc: USP[3], color: 'bg-amber-50 text-amber-600' },
  { icon: Lock, title: 'Exclusive Deals', desc: USP[4], color: 'bg-violet-50 text-violet-600' },
  { icon: BarChart3, title: 'CRM & Pipeline', desc: 'Track every lead from purchase to close in one dashboard.', color: 'bg-rose-50 text-rose-600' },
];

const stepMeta = [
  { tag: 'Data', title: 'Pull Data', icon: Database },
  { tag: 'Skip Trace', title: 'Enrich Contacts', icon: Phone },
  { tag: 'Outreach', title: 'Contact Sellers', icon: BadgeCheck },
  { tag: 'Qualify', title: 'Qualify Motivation', icon: Store },
  { tag: 'Package', title: 'Package Lead', icon: ShoppingCart },
  { tag: 'Sell', title: 'Distribute', icon: CircleCheck },
];
const steps = WORKFLOW_STEPS.map((desc, i) => ({
  n: String(i + 1).padStart(2, '0'),
  ...stepMeta[i],
  desc,
}));

const onDemandPoints = [
  '50 free trial leads on signup — no credit card',
  'Pay only for the leads you need after trial',
  'Admin assigns custom lead limits on demand',
  'Florida PropertyRadar leads with owner phone & email',
  'Contact us anytime for bulk lead packages',
];

const testimonials = [
  { quote: 'REALIST saves me 20+ hours a week. South Florida pre-foreclosures with real seller conversations — not just raw data.', name: 'Marcus T.', role: 'Fix & Flip Investor · Miami, FL', deals: 48, initials: 'MT' },
  { quote: "Premium leads with ARV and repair costs included. I've closed 3 deals in 30 days off REALIST qualified leads.", name: 'Sarah J.', role: 'Wholesaler · Fort Lauderdale, FL', deals: 32, initials: 'SJ' },
  { quote: 'Enterprise plan with exclusive deals transformed our acquisition pipeline. Worth every dollar.', name: 'Kevin M.', role: 'Hedge Fund · Boca Raton, FL', deals: 120, initials: 'KM' },
];

function FeaturedLeadCard({ lead }) {
  return (
    <article className="snap-start shrink-0 w-[min(82vw,300px)] rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 truncate">{lead.city}, {lead.state}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{lead.propertyAddress || lead.street}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {lead.propertyType || 'Property'} · {lead.bedrooms ?? '—'}bd/{lead.bathrooms ?? '—'}ba
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {lead.preForeclosure && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-amber-50 text-amber-700">Pre-Foreclosure</span>
        )}
        {lead.highEquity && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">High Equity</span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. / Equity</p>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {formatPrice(lead.estimatedValue)}
            {lead.equity != null && <span className="text-emerald-600 ml-1">· {formatPrice(lead.equity)}</span>}
          </p>
        </div>
      </div>
    </article>
  );
}

function HeroPreview() {
  return (
    <div className="float-preview relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
      <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-2">Lead Marketplace</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[['18', 'Leads Bought'], ['3', 'Deals Closed'], ['$2.4k', 'Spent']].map(([v, l]) => (
              <div key={l} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-900">{v}</p>
                <p className="text-[10px] text-slate-500 font-medium">{l}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              ['Miami, FL', 'Pre-Foreclosure', 'Premium', '$399', 'bg-amber-50 text-amber-700'],
              ['Fort Lauderdale, FL', 'Tax Delinquent', 'Qualified', '$249', 'bg-blue-50 text-blue-700'],
              ['Boca Raton, FL', 'Absentee Owner', 'Exclusive', '$899', 'bg-emerald-50 text-emerald-700'],
            ].map(([city, type, tier, price, badge]) => (
              <div key={city} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{city}</p>
                  <p className="text-[11px] text-slate-500">{type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{tier}</span>
                  <span className="text-sm font-bold">{price}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <Sparkles size={16} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Lead Unlocked! Boca Raton, FL · Seller Motivated</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(FALLBACK_LEADS);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [featuredSource, setFeaturedSource] = useState('demo');

  useEffect(() => {
    api.getHomeShowcase()
      .then((data) => {
        if (data?.stats) setStats(data.stats);
        if (Array.isArray(data?.featuredLeads) && data.featuredLeads.length) {
          setLeads(data.featuredLeads);
        }
        if (data?.featuredSource) setFeaturedSource(data.featuredSource);
      })
      .catch(() => {
        setStats(FALLBACK_STATS);
        setLeads(FALLBACK_LEADS);
        setFeaturedSource('demo');
      });
  }, []);

  const statCards = [
    [`${stats.leadsDelivered.toLocaleString()}+`, 'Leads Delivered'],
    [`${stats.investorsServed.toLocaleString()}+`, 'Investors Served'],
    [`${stats.leadAccuracy}%`, 'Lead Accuracy'],
    [formatMoney(stats.dealsClosedValue ?? 0), 'Deals Closed'],
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="hero-mesh relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 border border-slate-200/80 shadow-sm text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
                <span className="font-medium">New verified leads added daily</span>
                <ArrowRight size={14} className="text-slate-400" />
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.12] sm:leading-[1.1] tracking-tight text-slate-900">
                Find Premium{' '}
                <span className="text-gradient">Real Estate Leads</span>
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Close More Deals.
              </h1>
              <p className="mt-3 sm:mt-5 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl">
                {MISSION} Based in <strong className="text-slate-700">{GEO_FOCUS.primary}</strong>, expanding across the U.S. — pre-qualified off-market leads, not just raw data.
              </p>
              <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <button onClick={() => navigate('/auth?mode=signup')} className="btn-primary w-full sm:w-auto justify-center">
                  Start Free Trial <ArrowRight size={18} />
                </button>
                <button onClick={() => navigate('/#featured-leads')} className="btn-secondary w-full sm:w-auto justify-center">
                  View Featured Leads
                </button>
              </div>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-x-6 sm:gap-y-2 text-xs sm:text-sm text-slate-500">
                {['No contracts', 'Cancel anytime', 'Verified leads guaranteed'].map((t) => (
                  <span key={t} className="flex items-center gap-2 font-medium">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
                      <Check size={12} className="text-emerald-600" strokeWidth={3} />
                    </span>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-4 sm:-mt-6 z-10 pb-1 sm:pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-5">
            {statCards.map(([v, l]) => (
              <div key={l} className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-3 sm:p-5 lg:p-6 text-center shadow-lg shadow-slate-900/5 card-lift">
                <p className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">{v}</p>
                <p className="text-[11px] sm:text-sm text-slate-500 mt-1 sm:mt-2 font-medium leading-tight">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Leads (MongoDB cache only) */}
      <section id="featured-leads" className="page-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-header">
          <span className="section-badge">Featured Leads</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Featured Properties
          </h2>
          <p>Curated distressed opportunities synced to our database — sign up to unlock full details.</p>
          {featuredSource === 'demo' && (
            <p className="text-xs text-amber-600 font-medium mt-1">Sample Florida properties shown for preview.</p>
          )}
        </div>

        <div className="md:hidden">
          <HorizontalScrollRow className="px-3" trackClassName="pb-1 -mx-1 px-1">
            {leads.map((lead) => (
              <FeaturedLeadCard key={lead._id || lead.radarId} lead={lead} />
            ))}
          </HorizontalScrollRow>
        </div>

        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {leads.slice(0, 8).map((lead) => (
            <div key={lead._id || lead.radarId} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">{lead.city}, {lead.state}</p>
              <p className="text-sm text-slate-500 mt-1 truncate">{lead.propertyAddress || lead.street}</p>
              <p className="text-sm text-slate-500">{lead.propertyType} · {lead.bedrooms ?? '—'}bd/{lead.bathrooms ?? '—'}ba</p>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                {formatPrice(lead.estimatedValue)}
                {lead.equity != null && <span className="text-emerald-600 ml-1">· {formatPrice(lead.equity)} equity</span>}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/auth?mode=signup')}
          className="mt-4 sm:mt-6 w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/30 transition-all"
        >
          Sign up to browse all PropertyRadar leads →
        </button>
      </section>

      {/* Lead Types */}
      <section className="page-section bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-header">
            <span className="section-badge">Lead Types</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Every Category of Motivated Seller
            </h2>
            <p>High-value distressed property leads — what separates us from basic data sellers.</p>
          </div>
          <div className="sm:hidden -mx-4 px-4">
            <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1">
              {HIGH_VALUE_LEADS.map((l) => (
                <div
                  key={l.type}
                  className="snap-start shrink-0 w-[min(70vw,240px)] bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm"
                >
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{l.label}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">{l.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400 font-medium">Swipe to see all lead types</p>
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {HIGH_VALUE_LEADS.map((l) => (
              <div key={l.type} className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 card-lift">
                <h3 className="font-bold text-slate-900">{l.label}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 sm:mt-8 p-4 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
            <h3 className="text-base sm:text-xl font-bold">Premium Leads — Where the Real Money Is Made</h3>
            <ul className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {PREMIUM_LEAD_TRAITS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-teal-50">
                  <Check size={14} className="mt-0.5 shrink-0 sm:w-4 sm:h-4" />{t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-center mt-6">
            <button onClick={() => navigate('/lead-guide')} className="text-sm font-semibold text-teal-600 hover:text-teal-800 hover:underline">
              Read full business & lead guide →
            </button>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="page-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-header">
            <span className="section-badge">The System</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">How REALIST Works</h2>
            <p>From raw data to closed deal — a streamlined 6-step pipeline.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {steps.map((s) => (
              <div key={s.n} className="group bg-white p-5 sm:p-7 rounded-xl sm:rounded-2xl border border-slate-100 card-lift">
                <div className="flex items-center justify-between mb-3 sm:mb-5">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <s.icon size={20} className="text-teal-600" />
                  </div>
                  <span className="text-3xl font-extrabold text-slate-100 group-hover:text-teal-100 transition-colors">{s.n}</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wide">{s.tag}</span>
                <h3 className="font-bold text-lg text-slate-900 mt-3">{s.title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="page-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-header">
          <span className="section-badge">Why REALIST</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Our Unique Selling Proposition
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {features.map((f) => (
            <div key={f.title} className="group p-5 sm:p-7 rounded-xl sm:rounded-2xl border border-slate-100 bg-white card-lift">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-5 ${f.color}`}>
                <f.icon size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* On Demand */}
      <section id="on-demand" className="page-section bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-header">
            <span className="section-badge">On Demand</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Leads When You Need Them
            </h2>
            <p>
              No monthly subscription. Start with 50 free trial leads, then get more on demand from our team.
            </p>
          </div>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 p-6 sm:p-10 shadow-lg shadow-slate-900/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900">On Demand Access</h3>
                <p className="text-sm text-slate-500">Free trial → custom lead packages</p>
              </div>
            </div>
            <ul className="space-y-3">
              {onDemandPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 shrink-0 mt-0.5">
                    <Check size={11} className="text-emerald-600" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
              >
                Start Free Trial — 50 Leads
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Contact for More Leads
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="page-section bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <span className="section-badge">Contact Us</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
                Get On-Demand Leads
              </h2>
              <p className="text-slate-500 mt-3 leading-relaxed">
                Need more than 50 trial leads? Fill out the form and our team will assign a custom lead package to your account.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                <li>hello@realist.com</li>
                <li>+1 (888) 555-1234</li>
                <li>100 SE 3rd Ave, Fort Lauderdale, FL</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-lg shadow-slate-900/5">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="page-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-header">
          <span className="section-badge">Testimonials</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Investors Love REALIST</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl border border-slate-100 shadow-lg shadow-slate-900/5 card-lift">
              <Quote size={28} className="text-teal-100 absolute top-4 right-4 sm:top-6 sm:right-6" />
              <div className="flex gap-1 mb-3 sm:mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 sm:mt-8 flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-100">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                  <p className="text-xs text-teal-600 font-semibold mt-0.5">{t.deals} deals closed</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-gradient text-white py-10 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(13,148,136,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.3) 0%, transparent 50%)' }} />
        <div className="max-w-3xl mx-auto text-center px-4 relative">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Ready to Find Your Next Deal?</h2>
          <p className="mt-3 sm:mt-4 text-slate-300 text-base sm:text-lg">Join 3,800+ investors using REALIST to find motivated sellers and close deals faster.</p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 shadow-xl transition-all hover:-translate-y-0.5"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-white/30 rounded-xl font-bold hover:bg-white/10 transition-all"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
