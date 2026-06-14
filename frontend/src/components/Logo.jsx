import { Link } from 'react-router-dom';

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-shadow">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
          <path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 2.5L17 11h-2v6h-2v-5H9v5H7v-6H5l7-5.5z" />
        </svg>
      </div>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">REALIST</span>
    </Link>
  );
}
