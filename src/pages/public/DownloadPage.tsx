import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone, Monitor, Download, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, Terminal, ShieldCheck, Zap, Package, Apple, Play,
  AlertTriangle, Info, ArrowRight,
} from 'lucide-react'

/* ── animation helpers ─────────────────────────────────────────────────── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { type: 'spring' as const, stiffness: 160, damping: 22, delay },
})

/* ── FAQ accordion ─────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left dark:hover:bg-white/5 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium dark:text-white text-gray-900">{q}</span>
        {open ? <ChevronUp className="shrink-0 w-4 h-4 text-pink-400" /> : <ChevronDown className="shrink-0 w-4 h-4 dark:text-white/40 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm dark:text-white/60 text-gray-600 leading-relaxed border-t dark:border-white/10 border-gray-200 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

/* ── step card ─────────────────────────────────────────────────────────── */
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 text-sm font-bold">
        {n}
      </div>
      <div>
        <p className="text-sm font-semibold dark:text-white text-gray-900 mb-0.5">{title}</p>
        <p className="text-sm dark:text-white/55 text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ── badge pill ────────────────────────────────────────────────────────── */
function Badge({ icon: Icon, label, color = 'pink' }: { icon: React.ElementType; label: string; color?: string }) {
  const cls = color === 'purple'
    ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
    : 'bg-pink-500/15 border-pink-500/30 text-pink-300'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

/* ── main component ────────────────────────────────────────────────────── */
export default function DownloadPage() {
  const androidFeatures = [
    'Trusted Web Activity (TWA) — zero code duplication',
    'Push notifications via native Android channels',
    'Camera, microphone & file access',
    'Location services for ride-hailing & matching',
    'Offline support via Service Worker',
    'Digital Asset Links — removes browser URL bar',
    'Signed AAB ready for Google Play submission',
  ]

  const iosFeatures = [
    'Native WKWebView shell — all PWA features preserved',
    'APNS push notification registration',
    'Native camera, microphone & photo library prompts',
    'Face ID-ready authentication hooks',
    'Universal Links (deep linking into app routes)',
    'Associated Domains for seamless web↔app handoff',
    'Archive-ready for App Store submission',
  ]

  const faqs = [
    {
      q: 'What is a TWA (Trusted Web Activity)?',
      a: 'A TWA is the official Google-recommended way to publish a PWA as a Play Store app. It wraps your existing website in a native Android shell — no duplicate codebase. Chrome handles all rendering, and your Service Worker, push notifications, and offline features all continue to work exactly as they do on the web.',
    },
    {
      q: 'Why can\'t I get a compiled .apk or .ipa file directly?',
      a: 'Android APKs require a Java JDK + Android SDK build environment. iOS IPAs require macOS + Xcode — this is enforced by Apple at a hardware level and cannot be done on any Linux server. This is the same reason PWABuilder gives you a project ZIP rather than a compiled binary. Open in Android Studio or Xcode and build with one click.',
    },
    {
      q: 'Do I need coding experience to build the apps?',
      a: 'No. Both projects open in their IDEs (Android Studio / Xcode) with a single click. Building is a button press — "Build APK" on Android and "Product → Archive" on iOS. The READMEs inside each ZIP walk you through every step.',
    },
    {
      q: 'Will my app update automatically when I update the website?',
      a: 'Yes — that is the key advantage of TWA and WKWebView. The native shell loads your live website. Deploy new features to your server and all users see them instantly, no app store update required.',
    },
    {
      q: 'Where do I get the iarc_rating_id for my manifest?',
      a: 'During Google Play Console submission, complete the Content Ratings questionnaire. Google issues a certificate UUID — paste that into your manifest.json as the iarc_rating_id value. This links your web manifest rating to the Play Store rating.',
    },
    {
      q: 'What is Digital Asset Links and why does it matter?',
      a: 'Digital Asset Links is a JSON file you host at /.well-known/assetlinks.json. It proves to Android that your website owns the TWA app. Without it, your app displays a browser URL bar — with it, it looks fully native. The README inside the Android ZIP walks you through the exact steps.',
    },
  ]

  return (
    <div className="min-h-screen dark:bg-[#0D0A14] bg-white dark:text-white text-gray-900">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-pink-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/10 blur-[100px]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div {...up()} className="flex justify-center gap-3 mb-6">
            <Badge icon={Zap}         label="PWA → Native"    color="pink" />
            <Badge icon={ShieldCheck} label="Production Ready" color="purple" />
          </motion.div>

          <motion.h1 {...up(0.05)} className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
            Download SmartzConnect
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              for Android &amp; iOS
            </span>
          </motion.h1>

          <motion.p {...up(0.1)} className="text-lg dark:text-white/60 text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Ready-to-build native app packages. Open in Android Studio or Xcode,
            click Build — and you have a store-ready binary. No code changes required.
          </motion.p>

          {/* Download cards */}
          <motion.div {...up(0.15)} className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">

            {/* Android */}
            <div className="relative group rounded-2xl dark:border-white/10 border-gray-200 dark:bg-white/[0.03] bg-white backdrop-blur p-6 text-left hover:border-pink-500/40 transition-all duration-300">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                    <Play className="w-6 h-6 text-green-400" fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-white text-gray-900">Android</p>
                    <p className="text-xs dark:text-white/50 text-gray-500">Trusted Web Activity (TWA)</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-5">
                  {['Android Studio project', 'Signed AAB for Google Play', 'Keystore generator script', 'Digital Asset Links template'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs dark:text-white/65 text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/downloads/SmartzConnect-Android-TWA.zip"
                  download
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Android Package
                </a>
                <p className="text-center text-xs dark:text-white/35 text-gray-400 mt-2">
                  ZIP · Android Studio · API 21+
                </p>
              </div>
            </div>

            {/* iOS */}
            <div className="relative group rounded-2xl dark:border-white/10 border-gray-200 dark:bg-white/[0.03] bg-white backdrop-blur p-6 text-left hover:border-purple-500/40 transition-all duration-300">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                    <Apple className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-white text-gray-900">iOS</p>
                    <p className="text-xs dark:text-white/50 text-gray-500">WKWebView · Swift 5</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-5">
                  {['Complete Xcode project', 'Universal Links configured', 'APNS push notification hooks', 'Associated Domains ready'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs dark:text-white/65 text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/downloads/SmartzConnect-iOS-Xcode.zip"
                  download
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download iOS Package
                </a>
                <p className="text-center text-xs dark:text-white/35 text-gray-400 mt-2">
                  ZIP · Xcode 15+ · iOS 15+ · macOS required
                </p>
              </div>
            </div>
          </motion.div>

          {/* iOS hardware notice */}
          <motion.div {...up(0.2)} className="mt-5 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                <strong className="text-amber-300">iOS requires macOS + Xcode.</strong>{' '}
                Apple enforces this at a hardware level — no Linux or Windows tool can produce a signed IPA.
                If you don't have a Mac, use a cloud Mac service such as{' '}
                <a href="https://www.macstadium.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-amber-100">MacStadium</a>{' '}
                or{' '}
                <a href="https://aws.amazon.com/ec2/instance-types/mac/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-amber-100">AWS EC2 Mac</a>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── What's inside ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t dark:border-white/5 border-gray-100">
        <div className="max-w-5xl mx-auto">
          <motion.div {...up()} className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">What's inside each package</h2>
            <p className="dark:text-white/55 text-gray-600 max-w-xl mx-auto">
              Production-grade project files configured for SmartzConnect — open, build, ship.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Android features */}
            <motion.div {...up(0.05)} className="rounded-2xl border border-green-500/20 bg-green-500/5 p-7">
              <div className="flex items-center gap-3 mb-6">
                <Play className="w-5 h-5 text-green-400" fill="currentColor" />
                <h3 className="font-bold text-lg">Android TWA Package</h3>
              </div>
              <ul className="space-y-3">
                {androidFeatures.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm dark:text-white/70 text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 rounded-xl dark:bg-black/30 bg-gray-100 dark:border-white/10 border-gray-200">
                <p className="text-xs dark:text-white/50 text-gray-600 font-mono">
                  📁 SmartzConnect-Android-TWA/<br />
                  ├── app/src/main/<br />
                  │   ├── AndroidManifest.xml<br />
                  │   └── java/…/SmartzApplication.kt<br />
                  ├── .well-known/assetlinks.json<br />
                  ├── generate-keystore.sh<br />
                  └── README.md
                </p>
              </div>
            </motion.div>

            {/* iOS features */}
            <motion.div {...up(0.1)} className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-7">
              <div className="flex items-center gap-3 mb-6">
                <Apple className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-lg">iOS Xcode Package</h3>
              </div>
              <ul className="space-y-3">
                {iosFeatures.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm dark:text-white/70 text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 rounded-xl dark:bg-black/30 bg-gray-100 dark:border-white/10 border-gray-200">
                <p className="text-xs dark:text-white/50 text-gray-600 font-mono">
                  📁 SmartzConnect-iOS/<br />
                  ├── SmartzConnect.xcodeproj/<br />
                  │   └── project.pbxproj<br />
                  ├── SmartzConnect/<br />
                  │   ├── AppDelegate.swift<br />
                  │   ├── ViewController.swift<br />
                  │   ├── Info.plist<br />
                  │   └── Assets.xcassets/<br />
                  └── README.md
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Build steps ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t dark:border-white/5 border-gray-100">
        <div className="max-w-5xl mx-auto">
          <motion.div {...up()} className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">From ZIP to store in minutes</h2>
            <p className="dark:text-white/55 text-gray-600 max-w-xl mx-auto">
              Both packages are designed for non-developers. If you can click a button, you can build an app.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Android steps */}
            <motion.div {...up(0.05)}>
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-4 h-4 text-green-400" fill="currentColor" />
                <h3 className="font-semibold text-green-400">Android — Google Play</h3>
              </div>
              <div className="space-y-5">
                <Step n={1} title="Install Android Studio" desc="Free download from developer.android.com/studio — includes everything: Java JDK, emulator, and SDK." />
                <Step n={2} title="Open the project" desc='File → Open → select the SmartzConnect-Android-TWA folder. Gradle syncs automatically.' />
                <Step n={3} title="Generate your keystore" desc="Run generate-keystore.sh once. This creates your signing key and prints your SHA-256 fingerprint." />
                <Step n={4} title="Deploy Digital Asset Links" desc="Put .well-known/assetlinks.json on your server with the SHA-256 fingerprint. This removes the URL bar." />
                <Step n={5} title="Build & submit" desc='Build → Generate Signed Bundle → upload the .aab to Google Play Console. Complete the IARC rating questionnaire there to get your iarc_rating_id.' />
              </div>
            </motion.div>

            {/* iOS steps */}
            <motion.div {...up(0.1)}>
              <div className="flex items-center gap-2 mb-6">
                <Apple className="w-4 h-4 text-purple-300" />
                <h3 className="font-semibold text-purple-300">iOS — App Store</h3>
              </div>
              <div className="space-y-5">
                <Step n={1} title="Open on a Mac" desc="Double-click SmartzConnect.xcodeproj. Xcode opens it instantly." />
                <Step n={2} title="Set your Team" desc='In Signing & Capabilities, select your Apple Developer account (free for testing, $99/yr for App Store).' />
                <Step n={3} title="Add Associated Domains" desc="Add applinks:smartzconnect.com in Signing & Capabilities, and deploy the apple-app-site-association file to your server." />
                <Step n={4} title="Test on a device" desc="Select your iPhone as destination and press ⌘R. App installs directly via USB." />
                <Step n={5} title="Archive & submit" desc='Product → Archive → Distribute App → App Store Connect. Upload to App Store Connect and submit for review.' />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Useful links ───────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t dark:border-white/5 border-gray-100">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...up()} className="text-2xl font-bold text-center mb-10">
            Tools &amp; resources
          </motion.h2>
          <motion.div {...up(0.05)} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Android Studio',       href: 'https://developer.android.com/studio',                      desc: 'Free IDE to build Android apps'      },
              { label: 'Google Play Console',  href: 'https://play.google.com/console',                           desc: 'Submit and manage your Android app'  },
              { label: 'Digital Asset Links',  href: 'https://developers.google.com/digital-asset-links/v1/getting-started', desc: 'Link your domain to your Android app' },
              { label: 'App Store Connect',    href: 'https://appstoreconnect.apple.com',                         desc: 'Submit and manage your iOS app'      },
              { label: 'Apple Developer',      href: 'https://developer.apple.com/programs/',                     desc: '$99/yr program for App Store publishing' },
              { label: 'IARC Rating Portal',   href: 'https://play.google.com/console',                           desc: 'Get your iarc_rating_id via Play Console' },
            ].map(({ label, href, desc }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-4 rounded-xl border dark:border-white/10 border-gray-200 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all"
              >
                <ExternalLink className="w-4 h-4 text-pink-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm font-medium dark:text-white text-gray-900 group-hover:text-pink-400 transition-colors">{label}</p>
                  <p className="text-xs dark:text-white/45 text-gray-500 mt-0.5">{desc}</p>
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t dark:border-white/5 border-gray-100">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...up()} className="text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </motion.h2>
          <motion.div {...up(0.05)} className="space-y-3">
            {faqs.map(({ q, a }) => <FAQ key={q} q={q} a={a} />)}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t dark:border-white/5 border-gray-100">
        <motion.div {...up()} className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 mb-6 shadow-lg shadow-pink-500/25">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to go native?</h2>
          <p className="dark:text-white/55 text-gray-600 mb-8 leading-relaxed">
            Download both packages below. Full build instructions are included
            as a README inside each ZIP.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/downloads/SmartzConnect-Android-TWA.zip"
              download
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors shadow-lg shadow-green-500/20"
            >
              <Download className="w-4 h-4" />
              Android Package
            </a>
            <a
              href="/downloads/SmartzConnect-iOS-Xcode.zip"
              download
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors shadow-lg shadow-purple-500/20"
            >
              <Download className="w-4 h-4" />
              iOS Package
            </a>
          </div>
          <p className="mt-5 text-xs dark:text-white/35 text-gray-400">
            Both ZIPs are generated fresh from your live manifest — no external service dependency.
          </p>
        </motion.div>
      </section>
    </div>
  )
}
