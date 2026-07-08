import DashboardLayout from '../../components/DashboardLayout';
import { Link } from 'react-router-dom';

export default function AdminPlans() {
  return (
    <DashboardLayout title="On Demand" panel="admin">
      <h1 className="text-2xl font-bold">On Demand Model</h1>
      <p className="text-gray-500 mt-1">
        No fixed subscription tiers. New signups get a 50-lead free trial; assign more leads per user from Users.
      </p>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <h3 className="font-bold text-lg">Free Trial</h3>
          <p className="text-3xl font-bold mt-2">50 leads</p>
          <p className="text-sm text-gray-500 mt-2">Automatically applied on every new buyer signup.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <h3 className="font-bold text-lg">On Demand</h3>
          <p className="text-3xl font-bold mt-2">Custom</p>
          <p className="text-sm text-gray-500 mt-2">Set each user&apos;s lead limit in Admin → Users after trial or for larger orders.</p>
        </div>
      </div>

      <Link
        to="/admin/users"
        className="mt-8 inline-block px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800"
      >
        Manage User Lead Limits →
      </Link>
    </DashboardLayout>
  );
}
