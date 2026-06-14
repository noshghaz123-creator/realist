import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Overview from './pages/dashboard/Overview';
import BrowseLeads from './pages/dashboard/BrowseLeads';
import LeadDetail from './pages/dashboard/LeadDetail';
import MyLeads from './pages/dashboard/MyLeads';
import Favourites from './pages/dashboard/Favourites';
import Pricing from './pages/dashboard/Pricing';
import Account from './pages/dashboard/Account';
import Settings from './pages/dashboard/Settings';
import Notifications from './pages/dashboard/Notifications';
import AdminOverview from './pages/admin/AdminOverview';
import ManageLeads from './pages/admin/ManageLeads';
import ManageUsers from './pages/admin/ManageUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminTeams from './pages/admin/AdminTeams';
import TeamOverview from './pages/team/TeamOverview';
import TeamLeads from './pages/team/TeamLeads';
import TeamVerify from './pages/team/TeamVerify';
import StaticPage from './pages/static/StaticPage';
import ArvCalculator from './pages/static/ArvCalculator';
import LeadGuide from './pages/static/LeadGuide';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />

      <Route path="/dashboard" element={<ProtectedRoute roles={['buyer']}><Overview /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute roles={['buyer']}><BrowseLeads /></ProtectedRoute>} />
      <Route path="/leads/:id" element={<ProtectedRoute roles={['buyer', 'admin', 'team']}><LeadDetail /></ProtectedRoute>} />
      <Route path="/dashboard/my-leads" element={<ProtectedRoute roles={['buyer']}><MyLeads /></ProtectedRoute>} />
      <Route path="/dashboard/favourites" element={<ProtectedRoute roles={['buyer']}><Favourites /></ProtectedRoute>} />
      <Route path="/dashboard/pricing" element={<ProtectedRoute roles={['buyer']}><Pricing /></ProtectedRoute>} />
      <Route path="/dashboard/account" element={<ProtectedRoute roles={['buyer']}><Account /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute roles={['buyer']}><Settings /></ProtectedRoute>} />
      <Route path="/dashboard/notifications" element={<ProtectedRoute roles={['buyer']}><Notifications /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminOverview /></ProtectedRoute>} />
      <Route path="/admin/leads" element={<ProtectedRoute roles={['admin']}><ManageLeads /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
      <Route path="/admin/plans" element={<ProtectedRoute roles={['admin']}><AdminPlans /></ProtectedRoute>} />
      <Route path="/admin/teams" element={<ProtectedRoute roles={['admin']}><AdminTeams /></ProtectedRoute>} />

      <Route path="/team" element={<ProtectedRoute roles={['team', 'admin']}><TeamOverview /></ProtectedRoute>} />
      <Route path="/team/leads" element={<ProtectedRoute roles={['team', 'admin']}><TeamLeads /></ProtectedRoute>} />
      <Route path="/team/verify" element={<ProtectedRoute roles={['team', 'admin']}><TeamVerify /></ProtectedRoute>} />

      <Route path="/about" element={
        <StaticPage title="About REALIST">
          <p><strong>REALIST</strong> generates and sells high-quality distressed property leads to real estate investors, wholesalers, hedge funds, and acquisition firms. We focus on accuracy, exclusivity, and speed.</p>
          <p><strong>Mission:</strong> Provide real estate investors with consistent, high-converting off-market opportunities.</p>
          <p><strong>Geographic Focus:</strong> South Florida (primary), expanding into all U.S. states.</p>
          <p>We are not a basic data seller — every premium lead includes real seller conversations, ARV analysis, and repair cost estimates.</p>
        </StaticPage>
      } />
      <Route path="/lead-guide" element={<LeadGuide />} />
      <Route path="/contact" element={
        <StaticPage title="Contact Us">
          <p>Email: hello@realist.com</p>
          <p>Phone: +1 (888) 555-1234</p>
          <p>Address: 100 SE 3rd Ave, Fort Lauderdale, FL 33394</p>
          <p>Serving investors across South Florida and nationwide.</p>
        </StaticPage>
      } />
      <Route path="/privacy" element={
        <StaticPage title="Privacy Policy">
          <p>We respect your privacy. REALIST collects only the data necessary to provide our lead marketplace services. We never sell your personal information to third parties.</p>
        </StaticPage>
      } />
      <Route path="/terms" element={
        <StaticPage title="Terms of Service">
          <p>By using REALIST, you agree to our terms. Leads purchased are for your exclusive use. Redistribution of lead data is prohibited.</p>
        </StaticPage>
      } />
      <Route path="/help" element={
        <StaticPage title="Help Center">
          <p>Need help? Browse our guides or contact support at hello@realist.com. We offer 24/7 support for Enterprise customers.</p>
        </StaticPage>
      } />
      <Route path="/roadmap" element={
        <StaticPage title="Product Roadmap">
          <p>Q2 2026: API access for Enterprise plans. Q3 2026: Mobile app. Q4 2026: AI-powered lead scoring.</p>
        </StaticPage>
      } />
      <Route path="/arv-calculator" element={<ArvCalculator />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
