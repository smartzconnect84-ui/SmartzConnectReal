import { Shield } from 'lucide-react'

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, including name, email address, date of birth, profile information, and content you create. We also collect usage data, device information, location data (with your permission), and communications metadata.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your information to provide, maintain, and improve our services; facilitate connections between users; process payments; send notifications; personalise your experience; ensure safety and security; comply with legal obligations; and for analytics to improve the platform.`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell your personal data. We share information with other users as part of the platform's core functionality (e.g. your profile is visible to other users). We may share data with trusted service providers who assist in operating our platform, subject to confidentiality agreements.`,
  },
  {
    title: '4. Data Retention',
    content: `We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time. Some data may be retained for legal, safety, or fraud prevention purposes.`,
  },
  {
    title: '5. Your Rights (GDPR & CCPA)',
    content: `Depending on your location, you may have rights to: access your personal data; correct inaccurate data; request deletion; object to processing; request restriction of processing; data portability; and withdraw consent. Contact us at privacy@smartzconnect.com to exercise these rights.`,
  },
  {
    title: '6. Cookies',
    content: `We use cookies and similar tracking technologies. See our Cookie Policy for details. You can manage your cookie preferences through our cookie banner or your browser settings.`,
  },
  {
    title: '7. Security',
    content: `We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security assessments. However, no method of transmission over the internet is 100% secure.`,
  },
  {
    title: '8. Children',
    content: `SmartzConnect is not intended for users under 18 years of age. We do not knowingly collect personal data from minors. If we become aware that we have collected data from a minor, we will promptly delete it.`,
  },
  {
    title: '9. International Transfers',
    content: `Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses where required.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Your continued use of the platform constitutes acceptance of the updated policy.`,
  },
  {
    title: '11. Contact Us',
    content: `For privacy questions or to exercise your rights, contact our Data Protection Officer at: privacy@smartzconnect.com or write to: SmartzConnect Privacy Team, Monrovia, Liberia.`,
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-3xl dark:text-white text-gray-900">Privacy Policy</h1>
            <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Last updated: June 19, 2026</p>
          </div>
        </div>

        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-200 mb-6">
          <p className="dark:text-gray-300 text-gray-700 leading-relaxed text-sm">
            SmartzConnect ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-200">
              <h2 className="font-bold text-base dark:text-white text-gray-900 mb-3">{s.title}</h2>
              <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
