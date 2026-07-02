import { FileText } from 'lucide-react'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using SmartzConnect, you agree to be bound by these Terms of Service. If you do not agree, you may not use our platform. We reserve the right to modify these terms at any time, with notice to users.',
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 18 years of age to use SmartzConnect. By creating an account, you confirm that you are 18 or older and have the legal capacity to enter into these terms.',
  },
  {
    title: '3. Account Responsibilities',
    content: 'You are responsible for maintaining the security of your account credentials. You must not share your password or allow others to access your account. You are responsible for all activities that occur under your account.',
  },
  {
    title: '4. Acceptable Use',
    content: 'You agree not to: post illegal, harmful, threatening, or harassing content; impersonate others; engage in spam or unsolicited messaging; scrape or harvest data; attempt to hack or disrupt the platform; use the platform for commercial purposes without our consent; or violate any applicable laws.',
  },
  {
    title: '5. Content Ownership',
    content: 'You retain ownership of content you post on SmartzConnect. By posting content, you grant us a worldwide, non-exclusive, royalty-free licence to use, display, and distribute your content in connection with the platform. You represent that you have the rights to post such content.',
  },
  {
    title: '6. Prohibited Content',
    content: 'The following content is strictly prohibited: nudity or sexually explicit material; violence, gore, or graphic content; hate speech based on race, ethnicity, religion, gender, sexual orientation, or disability; content that exploits or harms minors; misinformation intended to deceive; and illegal content of any kind.',
  },
  {
    title: '7. Marketplace Rules',
    content: 'When using SmartzMarket, you agree to: provide accurate product descriptions; honour agreed prices; complete transactions in good faith; not list counterfeit or illegal goods; and resolve disputes respectfully. SmartzConnect is not a party to transactions between users and does not guarantee their completion.',
  },
  {
    title: '8. Ride Services',
    content: 'SmartzRide connects riders with drivers. SmartzConnect is not responsible for the conduct of drivers or riders, accidents, or losses arising from ride services. Users must comply with all applicable transportation laws and regulations.',
  },
  {
    title: '9. Subscriptions and Payments',
    content: 'Subscription fees are charged in advance. Subscriptions auto-renew unless cancelled before the renewal date. Refunds are issued at our discretion and in accordance with applicable consumer protection laws. Mobile money payments are processed through third-party providers.',
  },
  {
    title: '10. Privacy',
    content: 'Our Privacy Policy governs how we collect, use, and protect your personal information. By using SmartzConnect, you consent to our data practices as described in the Privacy Policy.',
  },
  {
    title: '11. Intellectual Property',
    content: 'All platform elements — including design, logos, trademarks, software, and content not provided by users — are owned by SmartzConnect and protected by intellectual property law. You may not copy, modify, or distribute these without written permission.',
  },
  {
    title: '12. Limitation of Liability',
    content: 'To the fullest extent permitted by law, SmartzConnect is not liable for indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability for any claim shall not exceed the amount you paid us in the preceding 12 months.',
  },
  {
    title: '13. Termination',
    content: 'We may suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion, with or without notice. You may delete your account at any time through account settings.',
  },
  {
    title: '14. Governing Law',
    content: 'These terms are governed by the laws of Liberia. Any disputes shall be resolved through binding arbitration in Monrovia, Liberia, except where prohibited by applicable law.',
  },
  {
    title: '15. Contact',
    content: 'For questions about these Terms of Service, contact us at: legal@smartzconnect.com',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center shadow-lg shadow-pink-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-3xl dark:text-white text-gray-900">Terms of Service</h1>
            <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Last updated: June 19, 2026</p>
          </div>
        </div>

        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-200 mb-6">
          <p className="dark:text-gray-300 text-gray-700 leading-relaxed text-sm">
            Welcome to SmartzConnect. These Terms of Service govern your use of our platform and constitute a legally binding agreement between you and SmartzConnect. Please read them carefully.
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
