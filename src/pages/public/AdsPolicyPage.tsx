import { Link } from 'react-router-dom'
import { Megaphone, ShieldCheck, Ban, CreditCard, Ruler, Eye, Flag, Scale } from 'lucide-react'

const card = 'dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5 sm:p-6'

function Section({ icon: Icon, title, children }: { icon: typeof Ban; title: string; children: React.ReactNode }) {
  return (
    <section className={card}>
      <h2 className="font-display font-bold text-lg dark:text-white text-gray-900 flex items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-white" /></span>{title}
      </h2>
      <div className="text-sm dark:text-gray-300 text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  )
}

export default function AdsPolicyPage() {
  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 pt-[72px] sm:pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-500">SmartzAds</p>
          <h1 className="font-display font-black text-3xl dark:text-white text-gray-900">Advertising Policies</h1>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-2">The rules that keep SmartzConnect advertising honest, safe, and effective for everyone.</p>
        </div>

        <Section icon={Scale} title="Advertising terms">
          <p>By submitting a campaign you agree: your ads must be truthful; you must own or license all creative; pricing and offers must be honoured as stated; and SmartzConnect may reject, pause, or remove any ad that breaches these policies. Approval is required before delivery unless an administrator explicitly configures otherwise.</p>
        </Section>

        <Section icon={ShieldCheck} title="Acceptable content">
          <ul className="list-disc pl-5 space-y-1">
            <li>Real products, services, events, jobs, and businesses you are authorised to promote.</li>
            <li>Clear, honest copy — claims a reasonable customer would understand.</li>
            <li>Working destination URLs using http(s); landing pages must match the ad.</li>
            <li>Respectful creative suitable for a general audience.</li>
          </ul>
        </Section>

        <Section icon={Ban} title="Prohibited advertisements">
          <ul className="list-disc pl-5 space-y-1">
            <li>Scams, deceptive offers, fake earnings claims, phishing or malicious links.</li>
            <li>Counterfeit goods, impersonation, or intellectual-property infringement.</li>
            <li>Adult sexual content, dating-scam lures, or exploitation of SmartzDating users.</li>
            <li>Illegal products, unlicensed financial or health schemes, misinformation.</li>
            <li>Spam, sensationalist clickbait, or misleading pricing ("free" that isn't).</li>
            <li>Ads that purchase access to private user information — never permitted.</li>
          </ul>
        </Section>

        <Section icon={Eye} title="Review & approval">
          <p>Every ad is reviewed within 24–48 hours for prohibited content, unsafe links, disallowed targeting, and placement fit. Decisions: <strong>Approved</strong>, <strong>Rejected</strong> (with reason), or <strong>Changes requested</strong> (revise and resubmit). Editing creative, destination, or targeting after approval triggers re-review. Payment never overrides moderation.</p>
        </Section>

        <Section icon={CreditCard} title="Payments, cancellation & refunds">
          <p>Fixed, daily, and package campaigns require verified payment before delivery; CPM/CPC campaigns spend against your authorised budget and can never exceed it. Cancel anytime from My Campaigns — unspent verified amounts follow the disclosed refund policy. Rejected campaigns are refunded or credited per the administrator's decision, visible under Invoices &amp; Receipts. We never store card details; only provider-confirmed transactions activate campaigns.</p>
        </Section>

        <Section icon={Ruler} title="Creative specifications">
          <ul className="list-disc pl-5 space-y-1">
            <li>Images: JPG/PNG/WebP up to 8MB; landscape 1200×628, square 1080×1080, portrait 1080×1350 recommended.</li>
            <li>Video: MP4/WebM up to 100MB, up to 60s, landscape or square.</li>
            <li>Carousel: 2–5 cards, each with headline and destination.</li>
            <li>All paid placements carry a clear <strong>Sponsored</strong> label — never presented as independent recommendations.</li>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="Privacy & targeting">
          <p>Targeting uses only broad categories you choose: country, city, language, age band, interests. We never target religion, ethnicity, health, or sexual orientation; never use private dating messages or confidential profile data; and advertisers never see individual user identities. Measurement counts only visible, eligible impressions — duplicates, bots, and automated traffic are filtered.</p>
          <p>Formulas: CTR = Clicks ÷ Impressions × 100 · CPM = Spend ÷ Impressions × 1,000 · CPC = Spend ÷ Clicks.</p>
        </Section>

        <Section icon={Flag} title="Appeals & reporting">
          <p>Disagree with a decision? Reply in My Campaigns with your campaign name — every appeal is re-reviewed. To report a suspicious ad, use the <strong>Report</strong> link on any sponsored unit. Ads never appear inside private messages or sensitive contexts.</p>
        </Section>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Link to="/app/ads" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/25"><Megaphone className="w-4 h-4" /> Create Advertisement</Link>
          <Link to="/smartzads" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl dark:bg-white/8 bg-white border dark:border-white/10 border-gray-200 text-sm font-bold dark:text-gray-200 text-gray-700">Back to SmartzAds</Link>
        </div>
      </div>
    </div>
  )
}
