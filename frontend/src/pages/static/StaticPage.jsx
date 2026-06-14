import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function StaticPage({ title, children }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold">{title}</h1>
        <div className="mt-8 prose prose-gray max-w-none text-gray-600 space-y-4">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
