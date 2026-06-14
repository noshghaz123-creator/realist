import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ArvCalculator() {
  const [comps, setComps] = useState([0, 0, 0]);
  const [sqft, setSqft] = useState(1500);
  const [repairs, setRepairs] = useState(30000);

  const avgComp = comps.reduce((a, b) => a + b, 0) / (comps.filter(Boolean).length || 1);
  const arv = Math.round(avgComp);
  const maxOffer = Math.round(arv * 0.7 - repairs);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold">ARV Calculator</h1>
        <p className="text-gray-500 mt-2">Calculate After Repair Value and max offer for investment properties.</p>

        <div className="mt-8 bg-gray-50 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Comparable Sales ($)</label>
            <div className="grid grid-cols-3 gap-3">
              {comps.map((c, i) => (
                <input key={i} type="number" value={c || ''} placeholder={`Comp ${i + 1}`}
                  onChange={(e) => { const n = [...comps]; n[i] = +e.target.value; setComps(n); }}
                  className="px-4 py-3 border rounded-xl text-sm" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Square Footage</label>
              <input type="number" value={sqft} onChange={(e) => setSqft(+e.target.value)}
                className="w-full px-4 py-3 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estimated Repairs ($)</label>
              <input type="number" value={repairs} onChange={(e) => setRepairs(+e.target.value)}
                className="w-full px-4 py-3 border rounded-xl text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="bg-white p-5 rounded-xl border">
              <p className="text-sm text-gray-500">After Repair Value</p>
              <p className="text-3xl font-bold text-green-600 mt-1">${arv.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border">
              <p className="text-sm text-gray-500">Max Offer (70% Rule)</p>
              <p className="text-3xl font-bold mt-1">${maxOffer.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
