import { Cookie } from 'lucide-react'

const cookieTypes = [
  {
    name: 'Strictly Necessary Cookies',
    always: true,
    examples: ['Session cookies', 'Authentication cookies', 'Security cookies'],
    purpose: 'These cookies are essential for the website to function. They enable core features such as login, account security, and navigation. The site cannot function without these cookies.',
  },
  {
    name: 'Functional Cookies',
    always: false,
    examples: ['Language preference', 'Theme (dark/light)', 'Chat session data'],
    purpose: 'These cookies allow us to remember your preferences and provide enhanced functionality and personalisation, such as your theme preference and local settings.',
  },
  {
    name: 'Analytics Cookies',
    always: false,
    examples: ['Page view tracking', 'Feature usage statistics', 'Error reporting'],
    purpose: 'These cookies help us understand how visitors interact with SmartzConnect by collecting and reporting anonymised information. This helps us improve the platform.',
  },
  {
    name: 'Marketing Cookies',
    always: false,
    examples: ['Ad personalisation', 'Campaign tracking', 'Retargeting'],
    purpose: 'These cookies are used to deliver advertisements relevant to your interests and track the performance of ad campaigns on and off our platform.',
  },
]

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Cookie className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-3xl dark:text-white text-gray-900">Cookie Policy</h1>
            <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Last updated: June 19, 2026</p>
          </div>
        </div>

        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-200 mb-6">
          <p className="dark:text-gray-300 text-gray-700 leading-relaxed text-sm">
            SmartzConnect uses cookies and similar tracking technologies on our platform. This Cookie Policy explains what cookies are, how we use them, and how you can control your cookie preferences.
          </p>
        </div>

        <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-200 mb-4">
          <h2 className="font-bold dark:text-white text-gray-900 mb-2">What are cookies?</h2>
          <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and collect analytics data. Cookies can be session cookies (deleted when you close your browser) or persistent cookies (stored for a defined period).
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {cookieTypes.map((c, i) => (
            <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-bold dark:text-white text-gray-900">{c.name}</h2>
                {c.always && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Always Active</span>
                )}
              </div>
              <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-3">{c.purpose}</p>
              <div>
                <p className="text-xs font-semibold dark:text-gray-500 text-gray-400 mb-2">Examples:</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.examples.map(e => (
                    <span key={e} className="px-2.5 py-1 rounded-lg dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-xs dark:text-gray-300 text-gray-600">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {[
            { title: 'How to manage cookies', body: 'You can manage your cookie preferences through the cookie banner on our website or via your browser settings. Note that disabling certain cookies may affect the functionality of the platform. You can also clear cookies stored by your browser at any time.' },
            { title: 'Third-party cookies', body: 'Some cookies are set by third-party services (such as analytics providers and payment processors). These are governed by the privacy policies of those third parties. We only work with trusted partners who meet our privacy standards.' },
            { title: 'Updates to this policy', body: 'We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. We will notify you of significant changes.' },
            { title: 'Contact us', body: 'If you have questions about our use of cookies, please contact us at privacy@smartzconnect.com.' },
          ].map((s, i) => (
            <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-200">
              <h2 className="font-bold dark:text-white text-gray-900 mb-2">{s.title}</h2>
              <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
