import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Zap } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ContactForm from '../../components/ContactForm';
import PlanBadge, { planLabel } from '../../components/PlanBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { refreshNotificationBadge } from '../../utils/notifications';

export default function Contact() {
  const { user } = useAuth();
  const toast = useToast();

  const remaining = user?.leadsRemaining ?? 0;
  const limit = user?.leadLimit ?? 50;
  const used = user?.leadsUsed ?? 0;

  const formDefaults = useMemo(
    () => ({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      subject: 'Request More Leads — On Demand',
      message:
        `Hi REALIST team,\n\nI would like to buy more leads for my account.\n\n` +
        `Account: ${user?.email || ''}\n` +
        `Plan: ${planLabel(user?.plan)}\n` +
        `Leads used: ${used} · Remaining: ${remaining} of ${limit}\n\n` +
        `Please contact me with pricing and how to add more leads to my account.\n\nThank you!`,
    }),
    [user?.name, user?.email, user?.phone, user?.plan, used, remaining, limit]
  );

  return (
    <DashboardLayout title="Contact">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Contact Us</h1>
        <PlanBadge plan={user?.plan} />
      </div>
      <p className="text-gray-500 mt-1">
        Need more leads? Send a message and our team will upgrade your on-demand limit.
      </p>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-lg mb-1">Request More Leads</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your details are pre-filled from your profile. Edit the message if you need a custom lead package.
          </p>
          <ContactForm
            compact
            defaults={formDefaults}
            onSuccess={(msg) => {
              toast.success(msg);
              refreshNotificationBadge();
            }}
          />
          <Link to="/dashboard/inbox" className="inline-block mt-4 text-sm text-teal-600 font-medium hover:underline">
            View your Inbox for admin replies →
          </Link>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold">Your usage</p>
                <p className="text-xs text-gray-500">{planLabel(user?.plan)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Limit</span>
                <span className="font-semibold">{limit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Used</span>
                <span className="font-semibold">{used}</span>
              </div>
              <div className="flex justify-between text-teal-700">
                <span>Remaining</span>
                <span className="font-bold">{remaining}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Direct contact</p>
            <p className="flex items-center gap-2">
              <Mail size={16} className="text-teal-600 shrink-0" /> hello@realist.com
            </p>
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-teal-600 shrink-0" /> +1 (888) 555-1234
            </p>
            <p className="flex items-start gap-2">
              <MapPin size={16} className="text-teal-600 shrink-0 mt-0.5" />
              100 SE 3rd Ave, Fort Lauderdale, FL 33394
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
            {remaining > 0
              ? `You still have ${remaining} lead${remaining === 1 ? '' : 's'} left. Contact us anytime for a bigger package.`
              : 'Your limit is used up. Submit the form and admin will assign more leads to your account.'}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
