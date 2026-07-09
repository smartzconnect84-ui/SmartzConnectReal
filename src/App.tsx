import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Clock } from 'lucide-react'

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-5 shadow-lg">
        <Clock className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">This feature is coming soon. Stay tuned for updates!</p>
    </div>
  )
}
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { StreamProvider } from '@/contexts/StreamContext'
import { LiveChatProvider } from '@/contexts/LiveChatContext'
import { LiveKitCallProvider } from '@/contexts/LiveKitCallContext'
import { initOneSignal } from '@/lib/onesignal'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LiveChat from '@/components/LiveChat'
import LiveKitCall from '@/components/LiveKitCall'
import CookieBanner from '@/components/CookieBanner'
import { AnnouncementProvider } from '@/contexts/AnnouncementContext'
import AppShell from '@/layouts/AppShell'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import NotificationPrompt from '@/components/NotificationPrompt'
import NetworkStatusToast from '@/components/NetworkStatusToast'

import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'

import PricingPage          from '@/pages/public/PricingPage'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import LoginPage           from '@/pages/LoginPage'
import RegisterPage        from '@/pages/RegisterPage'
import AdminLoginPage      from '@/pages/AdminLoginPage'
import ForgotPasswordPage  from '@/pages/ForgotPasswordPage'
import ResetPasswordPage   from '@/pages/ResetPasswordPage'
import VerifyEmailPage     from '@/pages/VerifyEmailPage'
import AuthCallbackPage    from '@/pages/AuthCallbackPage'
import OnboardingPage      from '@/pages/OnboardingPage'
import PrivacyPolicyPage   from '@/pages/PrivacyPolicyPage'
import CookiePolicyPage    from '@/pages/CookiePolicyPage'
import TermsPage           from '@/pages/TermsPage'

import ProfilePage         from '@/pages/ProfilePage'
import UserProfilePage     from '@/pages/UserProfilePage'
import DiscoverPage        from '@/pages/DiscoverPage'
import MatchesPage         from '@/pages/MatchesPage'
import ChatPage            from '@/pages/ChatPage'
import GroupChatPage       from '@/pages/GroupChatPage'
import WorldChatPage       from '@/pages/WorldChatPage'
import SpinChatPage        from '@/pages/SpinChatPage'
import FeedPage            from '@/pages/FeedPage'
import NotificationsPage   from '@/pages/NotificationsPage'
import MarketplacePage     from '@/pages/MarketplacePage'
import SmartzTVPage        from '@/pages/SmartzTVPage'
import RidePage            from '@/pages/RidePage'
import SubscriptionsPage   from '@/pages/SubscriptionsPage'
import FriendsPage         from '@/pages/FriendsPage'
import CallsPage           from '@/pages/CallsPage'
import SettingsPage        from '@/pages/SettingsPage'
import HelpSupportPage     from '@/pages/HelpSupportPage'
import SavedPostsPage      from '@/pages/SavedPostsPage'
import ReferralsPage       from '@/pages/ReferralsPage'
import WorldStageVotePage  from '@/pages/WorldStageVotePage'

import SmartzTVPublicPage  from '@/pages/public/SmartzTVPage'
import SmartzRidePage      from '@/pages/public/SmartzRidePage'
import SmartzMarketPage    from '@/pages/public/SmartzMarketPage'
import SmartzDeliveryPage  from '@/pages/public/SmartzDeliveryPage'
import SmartzAdsPage       from '@/pages/public/SmartzAdsPage'
import SmartzSocialPage    from '@/pages/public/SmartzSocialPage'
import SmartzDatingPage    from '@/pages/public/SmartzDatingPage'
import TeamPage            from '@/pages/public/TeamPage'
import BlogPage            from '@/pages/public/BlogPage'
import BlogPostPage        from '@/pages/public/BlogPostPage'
import WorldStagePage      from '@/pages/public/WorldStagePage'
import CmsPage             from '@/pages/public/CmsPage'

import AdminDashboard      from '@/pages/admin/AdminDashboard'
import AdminUsers          from '@/pages/admin/AdminUsers'
import AdminSubscriptions  from '@/pages/admin/AdminSubscriptions'
import AdminReports        from '@/pages/admin/AdminReports'
import AdminAnalytics      from '@/pages/admin/AdminAnalytics'
import AdminBroadcasts     from '@/pages/admin/AdminBroadcasts'
import AdminMarketplace    from '@/pages/admin/AdminMarketplace'
import AdminSmartzTV       from '@/pages/admin/AdminSmartzTV'
import AdminRides          from '@/pages/admin/AdminRides'
import AdminContent        from '@/pages/admin/AdminContent'
import AdminCMS            from '@/pages/admin/AdminCMS'
import AdminSafety         from '@/pages/admin/AdminSafety'
import AdminAds            from '@/pages/admin/AdminAds'
import AdminSettings       from '@/pages/admin/AdminSettings'
import AdminTeam           from '@/pages/admin/AdminTeam'
import AdminBlog           from '@/pages/admin/AdminBlog'
import AdminAuditLogs      from '@/pages/admin/AdminAuditLogs'
import AdminCEO            from '@/pages/admin/AdminCEO'
import AdminTour           from '@/pages/admin/AdminTour'
import AdminWorldStage      from '@/pages/admin/AdminWorldStage'

function PublicLayout({ children, showFooter = true }: { children: React.ReactNode; showFooter?: boolean }) {
  return (
    <>
      <Navbar />
      <div className="public-site">
        {children}
        {showFooter && <Footer />}
      </div>
    </>
  )
}

function AppInit() {
  useEffect(() => {
    initOneSignal()
  }, [])
  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <AnnouncementProvider>
      <AuthProvider>
        <StreamProvider>
          <LiveChatProvider>
          <LiveKitCallProvider>
          <BrowserRouter>
            <AppInit />
            <NetworkStatusToast />
            <LiveChat />
            <LiveKitCall />
            <CookieBanner />
            <PWAInstallPrompt />
            <NotificationPrompt />
            <Routes>
              {/* Public */}
              <Route path="/"            element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/pricing"      element={<PublicLayout><PricingPage /></PublicLayout>} />
              <Route path="/subscription" element={<PublicLayout><PricingPage /></PublicLayout>} />
              <Route path="/about"       element={<PublicLayout><AboutPage /></PublicLayout>} />
              <Route path="/privacy"     element={<PublicLayout><PrivacyPolicyPage /></PublicLayout>} />
              <Route path="/cookie-policy" element={<PublicLayout><CookiePolicyPage /></PublicLayout>} />
              <Route path="/terms"       element={<PublicLayout><TermsPage /></PublicLayout>} />

              {/* Auth */}
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/auth"            element={<LoginPage />} />
              <Route path="/register"        element={<RegisterPage />} />
              <Route path="/admin/login"     element={<AdminLoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password"  element={<ResetPasswordPage />} />
              <Route path="/verify-email"    element={<VerifyEmailPage />} />
              <Route path="/auth/callback"   element={<AuthCallbackPage />} />
              <Route path="/onboarding"      element={<OnboardingPage />} />

              {/* Public service pages */}
              <Route path="/smartztv"       element={<PublicLayout><SmartzTVPublicPage /></PublicLayout>} />
              <Route path="/smartzride"     element={<PublicLayout><SmartzRidePage /></PublicLayout>} />
              <Route path="/smartzmarket"   element={<PublicLayout><SmartzMarketPage /></PublicLayout>} />
              <Route path="/smartzdelivery" element={<PublicLayout><SmartzDeliveryPage /></PublicLayout>} />
              <Route path="/smartzads"      element={<PublicLayout><SmartzAdsPage /></PublicLayout>} />
              <Route path="/smartzsocial"   element={<PublicLayout><SmartzSocialPage /></PublicLayout>} />
              <Route path="/smartzdating"   element={<PublicLayout><SmartzDatingPage /></PublicLayout>} />
              <Route path="/team"           element={<PublicLayout><TeamPage /></PublicLayout>} />
              <Route path="/blog"           element={<PublicLayout><BlogPage /></PublicLayout>} />
              <Route path="/blog/:slug"     element={<PublicLayout><BlogPostPage /></PublicLayout>} />
              <Route path="/world-stage"    element={<PublicLayout><WorldStagePage /></PublicLayout>} />
              <Route path="/pages/:slug"    element={<PublicLayout><CmsPage /></PublicLayout>} />

              {/* App — protected */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/app/feed" replace />} />
                <Route path="feed"          element={<FeedPage />} />
                <Route path="discover"      element={<DiscoverPage />} />
                <Route path="matches"       element={<MatchesPage />} />
                <Route path="chat/:id"      element={<ChatPage />} />
                <Route path="groups"        element={<GroupChatPage />} />
                <Route path="worldchat"     element={<WorldChatPage />} />
                <Route path="spin"          element={<SpinChatPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="marketplace"   element={<MarketplacePage />} />
                <Route path="smartztv"      element={<SmartzTVPage />} />
                <Route path="ride"          element={<RidePage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="profile"       element={<ProfilePage />} />
                <Route path="profile/:userId" element={<UserProfilePage />} />
                <Route path="settings"      element={<SettingsPage />} />
                <Route path="friends"       element={<FriendsPage />} />
                <Route path="calls"         element={<CallsPage />} />
                <Route path="calls/video"   element={<CallsPage defaultMode="video" />} />
                <Route path="calls/audio"   element={<CallsPage defaultMode="audio" />} />
                <Route path="help"          element={<HelpSupportPage />} />
                <Route path="saved"         element={<SavedPostsPage />} />
                <Route path="referrals"     element={<ReferralsPage />} />
                <Route path="worldstage"    element={<WorldStageVotePage />} />
                <Route path="pages"         element={<ComingSoon title="Pages" />} />
                <Route path="events"        element={<ComingSoon title="Events" />} />
                <Route path="jobs"          element={<ComingSoon title="Jobs" />} />
                <Route path="learning"      element={<ComingSoon title="Learning" />} />
              </Route>

              {/* Admin Panel — role-gated: only admin/superadmin/ceo/moderator/support */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index                element={<AdminDashboard />} />
                <Route path="users"         element={<AdminUsers />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="reports"       element={<AdminReports />} />
                <Route path="analytics"     element={<AdminAnalytics />} />
                <Route path="broadcasts"    element={<AdminBroadcasts />} />
                <Route path="marketplace"   element={<AdminMarketplace />} />
                <Route path="smartztv"      element={<AdminSmartzTV />} />
                <Route path="rides"         element={<AdminRides />} />
                <Route path="content"       element={<AdminContent />} />
                <Route path="cms"           element={<AdminCMS />} />
                <Route path="safety"        element={<AdminSafety />} />
                <Route path="ads"           element={<AdminAds />} />
                <Route path="settings"      element={<AdminSettings />} />
                <Route path="team"          element={<AdminTeam />} />
                <Route path="blog"          element={<AdminBlog />} />
                <Route path="audit"         element={<AdminAuditLogs />} />
                <Route path="ceo"           element={<AdminCEO />} />
                <Route path="tour"          element={<AdminTour />} />
                <Route path="worldstage"    element={<AdminWorldStage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </LiveKitCallProvider>
          </LiveChatProvider>
        </StreamProvider>
      </AuthProvider>
      </AnnouncementProvider>
    </ThemeProvider>
  )
}
