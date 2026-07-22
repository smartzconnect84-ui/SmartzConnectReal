import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'

/** Redirects /app/user/:userId → /app/profile/:userId (legacy push-notification links) */
function UserProfileRedirect() {
  const { userId } = useParams<{ userId: string }>()
  return <Navigate to={`/app/profile/${userId}`} replace />
}

// ── Core providers & layouts (always needed immediately — static imports) ──
import { ThemeProvider }         from '@/contexts/ThemeContext'
import { AuthProvider }          from '@/contexts/AuthContext'
import { StreamProvider }        from '@/contexts/StreamContext'
import { LiveKitCallProvider }   from '@/contexts/LiveKitCallContext'
import { AnnouncementProvider }  from '@/contexts/AnnouncementContext'
import { SiteConfigProvider }    from '@/contexts/SiteConfigContext'
import { TourProvider }          from '@/contexts/TourContext'
import { NotificationProvider }  from '@/contexts/NotificationContext'
import { initOneSignal }         from '@/lib/onesignal'
import { useEffect }             from 'react'

import Navbar            from '@/components/Navbar'
import Footer            from '@/components/Footer'
import ScrollToTop       from '@/components/ScrollToTop'
import LiveKitCall       from '@/components/LiveKitCall'
import CookieBanner      from '@/components/CookieBanner'
import AppShell          from '@/layouts/AppShell'
import AdminLayout       from '@/layouts/AdminLayout'
import ProtectedRoute    from '@/components/ProtectedRoute'
import AdminRoute        from '@/components/AdminRoute'
import PWAInstallPrompt  from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt   from '@/components/PWAUpdatePrompt'
import NotificationPrompt from '@/components/NotificationPrompt'
import NetworkStatusToast from '@/components/NetworkStatusToast'
import TawkController    from '@/components/TawkController'
import TourOverlay       from '@/components/tour/TourOverlay'

// ── Page-level code splitting — each group loads as its own async chunk ──────
// Public / auth pages
const HomePage            = lazy(() => import('@/pages/HomePage'))
const AboutPage           = lazy(() => import('@/pages/AboutPage'))
const LoginPage           = lazy(() => import('@/pages/LoginPage'))
const RegisterPage        = lazy(() => import('@/pages/RegisterPage'))
const AdminLoginPage      = lazy(() => import('@/pages/AdminLoginPage'))
const ForgotPasswordPage  = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage   = lazy(() => import('@/pages/ResetPasswordPage'))
const VerifyEmailPage     = lazy(() => import('@/pages/VerifyEmailPage'))
const AuthCallbackPage    = lazy(() => import('@/pages/AuthCallbackPage'))
const OnboardingPage      = lazy(() => import('@/pages/OnboardingPage'))
const PrivacyPolicyPage   = lazy(() => import('@/pages/PrivacyPolicyPage'))
const CookiePolicyPage    = lazy(() => import('@/pages/CookiePolicyPage'))
const TermsPage           = lazy(() => import('@/pages/TermsPage'))
const PricingPage         = lazy(() => import('@/pages/public/PricingPage'))

// Public service/marketing pages
const SmartzTVPublicPage   = lazy(() => import('@/pages/public/SmartzTVPage'))
const SmartzRidePage       = lazy(() => import('@/pages/public/SmartzRidePage'))
const SmartzMarketPage     = lazy(() => import('@/pages/public/SmartzMarketPage'))
const SmartzDeliveryPage   = lazy(() => import('@/pages/public/SmartzDeliveryPage'))
const SmartzAdsPage        = lazy(() => import('@/pages/public/SmartzAdsPage'))
const SmartzSocialPage     = lazy(() => import('@/pages/public/SmartzSocialPage'))
const SmartzDatingPage     = lazy(() => import('@/pages/public/SmartzDatingPage'))
const SmartzLearningPage   = lazy(() => import('@/pages/public/SmartzLearningPage'))
const TeamPage             = lazy(() => import('@/pages/public/TeamPage'))
const BlogPage             = lazy(() => import('@/pages/public/BlogPage'))
const BlogPostPage         = lazy(() => import('@/pages/public/BlogPostPage'))
const WorldStagePage       = lazy(() => import('@/pages/public/WorldStagePage'))
const CmsPage              = lazy(() => import('@/pages/public/CmsPage'))
const HelpSupportPage      = lazy(() => import('@/pages/public/HelpSupportPage'))
const EmailSubscriptionPage = lazy(() => import('@/pages/public/EmailSubscriptionPage'))
const DownloadPage         = lazy(() => import('@/pages/public/DownloadPage'))

// App pages (protected)
const ProfilePage          = lazy(() => import('@/pages/ProfilePage'))
const UserProfilePage      = lazy(() => import('@/pages/UserProfilePage'))
const DiscoverPage         = lazy(() => import('@/pages/DiscoverPage'))
const MatchesPage          = lazy(() => import('@/pages/MatchesPage'))
const ChatPage             = lazy(() => import('@/pages/ChatPage'))
const GroupChatPage        = lazy(() => import('@/pages/GroupChatPage'))
const WorldChatPage        = lazy(() => import('@/pages/WorldChatPage'))
const SpinChatPage         = lazy(() => import('@/pages/SpinChatPage'))
const FeedPage             = lazy(() => import('@/pages/FeedPage'))
const NotificationsPage    = lazy(() => import('@/pages/NotificationsPage'))
const MarketplacePage      = lazy(() => import('@/pages/MarketplacePage'))
const CommunityPagesPage   = lazy(() => import('@/pages/CommunityPagesPage'))
const EventsPage           = lazy(() => import('@/pages/EventsPage'))
const JobsPage              = lazy(() => import('@/pages/JobsPage'))
const LearningPage          = lazy(() => import('@/pages/LearningPage'))
const SmartzTVPage         = lazy(() => import('@/pages/SmartzTVPage'))
const RidePage             = lazy(() => import('@/pages/RidePage'))
const SubscriptionsPage    = lazy(() => import('@/pages/SubscriptionsPage'))
const FriendsPage          = lazy(() => import('@/pages/FriendsPage'))
const CallsPage            = lazy(() => import('@/pages/CallsPage'))
const SettingsPage         = lazy(() => import('@/pages/SettingsPage'))
const SavedPostsPage       = lazy(() => import('@/pages/SavedPostsPage'))
const ReferralsPage        = lazy(() => import('@/pages/ReferralsPage'))
const InvoiceGeneratorPage = lazy(() => import('@/pages/InvoiceGeneratorPage'))
const WorldStageVotePage   = lazy(() => import('@/pages/WorldStageVotePage'))

// Admin pages — only loaded when the user navigates to /admin/*
const AdminDashboard       = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers           = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminSubscriptions   = lazy(() => import('@/pages/admin/AdminSubscriptions'))
const AdminReports         = lazy(() => import('@/pages/admin/AdminReports'))
const AdminAnalytics       = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminBroadcasts      = lazy(() => import('@/pages/admin/AdminBroadcasts'))
const AdminMarketplace     = lazy(() => import('@/pages/admin/AdminMarketplace'))
const AdminSmartzTV        = lazy(() => import('@/pages/admin/AdminSmartzTV'))
const AdminRides           = lazy(() => import('@/pages/admin/AdminRides'))
const AdminContent         = lazy(() => import('@/pages/admin/AdminContent'))
const AdminCMS             = lazy(() => import('@/pages/admin/AdminCMS'))
const AdminSafety          = lazy(() => import('@/pages/admin/AdminSafety'))
const AdminAds             = lazy(() => import('@/pages/admin/AdminAds'))
const AdminSettings        = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminTeam            = lazy(() => import('@/pages/admin/AdminTeam'))
const AdminBlog            = lazy(() => import('@/pages/admin/AdminBlog'))
const AdminAuditLogs       = lazy(() => import('@/pages/admin/AdminAuditLogs'))
const AdminCEO             = lazy(() => import('@/pages/admin/AdminCEO'))
const AdminServices        = lazy(() => import('@/pages/admin/AdminServices'))
const AdminTour            = lazy(() => import('@/pages/admin/AdminTour'))
const AdminWorldStage      = lazy(() => import('@/pages/admin/AdminWorldStage'))
const AdminEmail           = lazy(() => import('@/pages/admin/AdminEmail'))
const AdminLearning        = lazy(() => import('@/pages/admin/AdminLearning'))
const AdminWorldChat       = lazy(() => import('@/pages/admin/AdminWorldChat'))
const CoursePlayerPage          = lazy(() => import('@/pages/CoursePlayerPage'))
const LearningApplicationPage   = lazy(() => import('@/pages/LearningApplicationPage'))

// ── Suspense fallback: thin progress bar only — never blocks the whole screen.
// The native-splash already handles first-paint. A full-screen overlay here
// would make the ring appear to "restart" on every lazy navigation.
function PageLoader() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9990, height: 3 }}>
      <div style={{
        height: '100%',
        background: 'linear-gradient(90deg, #EC4899, #A855F7)',
        animation: 'sc-progress 1.8s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes sc-progress {
          0%   { width: 0%;   opacity: 1; }
          70%  { width: 85%;  opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

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
      <SiteConfigProvider>
      <AnnouncementProvider>
      <AuthProvider>
        <StreamProvider>
          <LiveKitCallProvider>
          <BrowserRouter>
          <NotificationProvider>
          <TourProvider>
            <ScrollToTop />
            <AppInit />
            <NetworkStatusToast />
            <TawkController />
            <LiveKitCall />
            <CookieBanner />
            <PWAInstallPrompt />
            <PWAUpdatePrompt />
            <NotificationPrompt />
            <TourOverlay />
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/smartzlearning" element={<PublicLayout><SmartzLearningPage /></PublicLayout>} />
                <Route path="/team"           element={<PublicLayout><TeamPage /></PublicLayout>} />
                <Route path="/blog"           element={<PublicLayout><BlogPage /></PublicLayout>} />
                <Route path="/blog/:slug"     element={<PublicLayout><BlogPostPage /></PublicLayout>} />
                <Route path="/world-stage"    element={<PublicLayout><WorldStagePage /></PublicLayout>} />
                <Route path="/pages/:slug"    element={<PublicLayout><CmsPage /></PublicLayout>} />
                <Route path="/help"           element={<PublicLayout><HelpSupportPage /></PublicLayout>} />
                <Route path="/subscribe"      element={<PublicLayout><EmailSubscriptionPage /></PublicLayout>} />
                <Route path="/download"       element={<PublicLayout><DownloadPage /></PublicLayout>} />
                <Route path="/learning/apply/:courseId" element={<LearningApplicationPage />} />

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
                  {/* Legacy redirect — old push notifications stored /app/user/:id */}
                  <Route path="user/:userId" element={<UserProfileRedirect />} />
                  <Route path="settings"      element={<SettingsPage />} />
                  <Route path="friends"       element={<FriendsPage />} />
                  <Route path="calls"         element={<CallsPage />} />
                  <Route path="calls/video"   element={<CallsPage defaultMode="video" />} />
                  <Route path="calls/audio"   element={<CallsPage defaultMode="audio" />} />
                  <Route path="saved"         element={<SavedPostsPage />} />
                  <Route path="referrals"     element={<ReferralsPage />} />
                  <Route path="invoice-generator" element={<InvoiceGeneratorPage />} />
                  <Route path="worldstage"    element={<WorldStageVotePage />} />
                  <Route path="help"          element={<Navigate to="/help" replace />} />
                  <Route path="pages"         element={<CommunityPagesPage />} />
                  <Route path="events"        element={<EventsPage />} />
                  <Route path="jobs"          element={<JobsPage />} />
                  <Route path="learning"      element={<LearningPage />} />
                  <Route path="course/:courseId" element={<CoursePlayerPage />} />
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
                  <Route path="ceo"           element={<AdminRoute requireRole="ceo"><AdminCEO /></AdminRoute>} />
                  <Route path="services"      element={<AdminServices />} />
                  <Route path="tour"          element={<AdminTour />} />
                  <Route path="worldstage"    element={<AdminWorldStage />} />
                  <Route path="email"         element={<AdminEmail />} />
                  <Route path="learning"      element={<AdminLearning />} />
                  <Route path="worldchat"     element={<AdminWorldChat />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </TourProvider>
          </NotificationProvider>
          </BrowserRouter>
          </LiveKitCallProvider>
        </StreamProvider>
      </AuthProvider>
      </AnnouncementProvider>
      </SiteConfigProvider>
    </ThemeProvider>
  )
}
