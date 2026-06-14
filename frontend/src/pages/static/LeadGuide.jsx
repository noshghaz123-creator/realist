import { Link } from 'react-router-dom';
import { Check, MapPin, Target, DollarSign, Shield } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  MISSION, GEO_FOCUS, TARGET_CUSTOMERS, HIGH_VALUE_LEADS,
  PREMIUM_LEAD_TRAITS, USP, REVENUE_MODEL, WORKFLOW_STEPS,
} from '../../data/business';

export default function LeadGuide() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="hero-mesh border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <span className="section-badge">Lead Guide</span>
          <h1 className="text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">REALIST Business Overview</h1>
          <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">{MISSION}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-teal-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">Target Market</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3">Primary Customers</h3>
              <ul className="space-y-2">
                {TARGET_CUSTOMERS.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check size={14} className="text-emerald-500" />{c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin size={16} /> Geographic Focus
              </h3>
              <p className="text-sm text-slate-600"><strong>Primary:</strong> {GEO_FOCUS.primary}</p>
              <p className="text-sm text-slate-600 mt-2"><strong>Expansion:</strong> {GEO_FOCUS.expansion}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">High-Value Lead Types</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {HIGH_VALUE_LEADS.map((l) => (
              <div key={l.type} className="p-5 rounded-xl border border-slate-100 card-lift">
                <h3 className="font-semibold text-slate-900">{l.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{l.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Premium Leads (Higher Price)</h2>
          <p className="text-slate-600 mb-4">These are where the real money is made:</p>
          <ul className="space-y-3">
            {PREMIUM_LEAD_TRAITS.map((t) => (
              <li key={t} className="flex items-center gap-3 text-slate-700 font-medium">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="text-teal-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">Revenue Model</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {Object.entries(REVENUE_MODEL.perLead).map(([key, v]) => (
              <div key={key} className="p-5 rounded-xl border border-slate-100 text-center">
                <p className="text-xs font-bold uppercase text-slate-400">{key}</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">{v.range}</p>
                <p className="text-xs text-slate-500 mt-2">{v.desc}</p>
              </div>
            ))}
          </div>
          <h3 className="font-semibold text-slate-900 mb-4">Subscription Plans (Best for Scale)</h3>
          <div className="space-y-3">
            {REVENUE_MODEL.subscription.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="font-semibold">{p.name} — ${p.price.toLocaleString()}/mo</p>
                  <p className="text-sm text-slate-500">{p.delivery}</p>
                </div>
                {p.popular && <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded-full">Popular</span>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-teal-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">Our USP</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {USP.map((u) => (
              <li key={u} className="flex items-center gap-2 p-4 rounded-xl bg-slate-50 text-sm font-medium text-slate-700">
                <Check size={16} className="text-emerald-500 shrink-0" />{u}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Daily Operations Workflow</h2>
          <ol className="space-y-3">
            {WORKFLOW_STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100">
                <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                <span className="text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="text-center pt-8">
          <Link to="/auth?mode=signup" className="btn-primary">Start Free Trial</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
