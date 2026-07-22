# SmartzConnect — App Store Submission Guide

> **App ID:** `com.smartzconnect.app`  
> **App Name:** SmartzConnect  
> **Version:** 1.0.0 (versionCode 1)  
> **Stack:** React + Vite PWA wrapped with Capacitor  
> **Production URL:** `https://smartzconnect.com`

---

## ⚠️ Two Manual Steps Required Before Submitting

These cannot be automated — they require your personal developer credentials.

### Manual Step 1 — Android: Get keystore SHA-256 and update assetlinks.json

After you generate your release keystore (Section 2b), run:

```bash
keytool -list -v \
  -keystore android/release.keystore \
  -alias smartzconnect \
  -storepass YOUR_STORE_PASSWORD
```

Look for this section in the output:

```
Certificate fingerprints:
   SHA1:   AA:BB:CC:...
   SHA256: 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00
```

Copy the **SHA256** line and paste it (replacing the placeholder) into:

**`public/.well-known/assetlinks.json`**

```json
{
  "sha256_cert_fingerprints": [
    "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00"
  ]
}
```

Then redeploy so `https://smartzconnect.com/.well-known/assetlinks.json` returns the updated file.

---

### Manual Step 2 — iOS: Get your Apple Team ID and update AASA

1. Go to [developer.apple.com](https://developer.apple.com/account) → **Membership details**
2. Copy your **Team ID** (a 10-character alphanumeric code, e.g. `AB12CD34EF`)
3. Open **`public/.well-known/apple-app-site-association`** and replace every occurrence of `YOURTEAMID` with your real Team ID:

```json
{
  "applinks": {
    "details": [
      {
        "appID": "AB12CD34EF.com.smartzconnect.app",
        ...
      }
    ]
  },
  "webcredentials": {
    "apps": ["AB12CD34EF.com.smartzconnect.app"]
  }
}
```

Then redeploy so `https://smartzconnect.com/.well-known/apple-app-site-association` is reachable (no `.json` extension, no redirect).

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | `nvm install 20` |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Android Studio | Hedgehog+ | [developer.android.com/studio](https://developer.android.com/studio) |
| Xcode | 15+ | Mac App Store |
| Java (JDK) | 17 | `brew install openjdk@17` |
| Cocoapods | latest | `sudo gem install cocoapods` |
| Apple Developer Program | Active | $99/yr at developer.apple.com |
| Google Play Console | Active | $25 one-time at play.google.com/console |

---

## 1 — Build the web app

```bash
pnpm install
pnpm build          # outputs to dist/
```

Verify `dist/` contains `index.html` and all assets before proceeding.

---

## 2 — Android (AAB for Play Store)

### 2a — First-time setup

```bash
npx cap add android
npx cap sync android
```

Open in Android Studio:

```bash
npx cap open android
```

Wait for Gradle sync to finish (bottom status bar shows "Gradle sync finished").

---

### 2b — Generate release keystore (one-time — keep this file safe forever)

> ⚠️ If you lose your keystore you **cannot** update your Play Store app. Back it up to a secure location (encrypted cloud storage, password manager attachment, etc.).

```bash
keytool -genkey -v \
  -keystore android/release.keystore \
  -alias smartzconnect \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=SmartzConnect, OU=Mobile, O=SmartzConnect Ltd, L=Accra, ST=Greater Accra, C=GH"
```

You will be prompted for:
- **Keystore password** (choose strong, store in password manager)
- **Key password** (can be same as keystore password)

Confirm the keystore was created:

```bash
keytool -list -v -keystore android/release.keystore -alias smartzconnect
```

> **Now do Manual Step 1** — copy the SHA-256 fingerprint into `public/.well-known/assetlinks.json`.

---

### 2c — Configure signing in build.gradle

Create `android/keystore.properties` (add this file to `.gitignore`):

```properties
storeFile=release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=smartzconnect
keyPassword=YOUR_KEY_PASSWORD
```

Edit `android/app/build.gradle` — add the `signingConfigs` block and update `buildTypes`:

```groovy
android {
    signingConfigs {
        release {
            def keystorePropsFile = rootProject.file("keystore.properties")
            def keystoreProps = new Properties()
            keystoreProps.load(new FileInputStream(keystorePropsFile))
            storeFile     file(keystoreProps['storeFile'])
            storePassword keystoreProps['storePassword']
            keyAlias      keystoreProps['keyAlias']
            keyPassword   keystoreProps['keyPassword']
        }
    }

    defaultConfig {
        applicationId "com.smartzconnect.app"
        minSdk        24          // Android 7.0+
        targetSdk     34          // Android 14
        versionCode   1
        versionName   "1.0.0"
    }

    buildTypes {
        release {
            signingConfig   signingConfigs.release
            minifyEnabled   true
            shrinkResources true
            proguardFiles   getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
        }
    }
}
```

---

### 2d — Build AAB via Android Studio (recommended)

1. **Sync first:** `pnpm build && npx cap sync android`
2. In Android Studio menu: **Build → Generate Signed Bundle / APK…**
3. Select **Android App Bundle** → Next
4. Key store path: Browse to `android/release.keystore`
5. Fill in keystore password, key alias (`smartzconnect`), key password → Next
6. Select **release** build variant → **Finish**
7. Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Or via command line:**

```bash
pnpm build && npx cap sync android
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Test the AAB locally with [bundletool](https://github.com/google/bundletool):

```bash
java -jar bundletool.jar build-apks \
  --bundle=app-release.aab \
  --output=app.apks \
  --ks=release.keystore \
  --ks-key-alias=smartzconnect

java -jar bundletool.jar install-apks --apks=app.apks
```

---

### 2e — Play Store upload checklist

- [ ] `app-release.aab` built and signed with release keystore
- [ ] `assetlinks.json` live and verified: `curl https://smartzconnect.com/.well-known/assetlinks.json`
- [ ] Digital Asset Links verified at: https://developers.google.com/digital-asset-links/tools/generator
- [ ] Screenshots: 4× at 1080×1920 px (in `public/screenshots/android-*.png`)
- [ ] Feature graphic: 1024×500 px
- [ ] App icon: 512×512 px (`public/icons/icon-512.png`)
- [ ] Short description ≤ 80 chars (see Section 6)
- [ ] Full description ≤ 4000 chars (see Section 6)
- [ ] Privacy Policy URL: `https://smartzconnect.com/privacy`
- [ ] Content rating questionnaire completed (Social Networking, Dating)
- [ ] Data safety section filled in
- [ ] Target API ≥ 33 (Play policy requirement)
- [ ] App category: Social / Dating

---

## 3 — iOS (IPA for App Store)

> Requires a Mac with Xcode 15+. All steps after 3a must be done on a Mac.

### 3a — First-time setup

```bash
npx cap add ios
npx cap sync ios
cd ios/App && pod install
```

Open in Xcode:

```bash
npx cap open ios
```

---

### 3b — Configure project in Xcode

In the **Project Navigator**, click **App** (the root item) → select the **App** target.

**General tab:**
| Setting | Value |
|---------|-------|
| Bundle Identifier | `com.smartzconnect.app` |
| Version | `1.0.0` |
| Build | `1` |
| Deployment Target | iOS 15.0 |
| Device Orientation | Portrait only |

**Signing & Capabilities tab:**
1. Team: Select your Apple Developer account
2. Signing: ✅ Automatically manage signing
3. Click **+ Capability** and add:
   - **Push Notifications**
   - **Associated Domains** → add: `applinks:smartzconnect.com`, `webcredentials:smartzconnect.com`
   - **Background Modes** → check: Remote notifications, Background fetch

---

### 3c — Info.plist permission strings

In Xcode, select `App/App/Info.plist` → open as source (right-click → Open As → Source Code) and add all keys inside the root `<dict>`:

```xml
<!-- Camera — profile photos, stories, video calls -->
<key>NSCameraUsageDescription</key>
<string>SmartzConnect uses your camera to take profile photos, record stories, and join video calls.</string>

<!-- Photo Library read — sharing images and videos -->
<key>NSPhotoLibraryUsageDescription</key>
<string>SmartzConnect needs access to your photo library to share images and videos in posts, stories, and messages.</string>

<!-- Photo Library write — saving received media -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>SmartzConnect saves photos and videos you receive to your photo library.</string>

<!-- Microphone — voice messages, live audio, calls -->
<key>NSMicrophoneUsageDescription</key>
<string>SmartzConnect uses your microphone for voice messages, live audio streams, and video calls.</string>

<!-- Location (in-use) — nearby matches, marketplace, ride-hailing -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>SmartzConnect uses your location to show nearby people, local marketplace listings, and for ride-hailing requests.</string>

<!-- Location (always) — ride tracking background updates -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>SmartzConnect uses background location to track your ride and show your driver's position in real time.</string>

<!-- Contacts — suggest friends already on SmartzConnect -->
<key>NSContactsUsageDescription</key>
<string>SmartzConnect can suggest friends already on the platform by checking your contacts. No data is stored.</string>

<!-- Face ID — optional biometric unlock -->
<key>NSFaceIDUsageDescription</key>
<string>SmartzConnect uses Face ID so you can log in quickly without typing your password.</string>

<!-- Notifications — push alerts for messages, matches, and live streams -->
<key>NSUserNotificationsUsageDescription</key>
<string>SmartzConnect sends push notifications for new messages, dating matches, live stream alerts, and marketplace activity.</string>

<!-- Local network — LAN-based video call discovery -->
<key>NSLocalNetworkUsageDescription</key>
<string>SmartzConnect uses the local network to improve video call quality on the same Wi-Fi network.</string>

<!-- Encryption export compliance -->
<key>ITSAppUsesNonExemptEncryption</key>
<false/>

<!-- Allow arbitrary loads only if needed for dev; remove for production -->
<!-- <key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict> -->
```

> **Review Note:** App Store reviewers will test every permission you declare. If a feature isn't in v1.0, omit its key — add it in the next version.

---

### 3d — Verify Apple App Site Association (AASA)

> **Do Manual Step 2 now** if you haven't already.

After deploying, verify with:

```bash
curl -I https://smartzconnect.com/.well-known/apple-app-site-association
# Must return: Content-Type: application/json (not application/pkcs7-mime)
# Must NOT redirect (301/302)
```

Apple's validator: https://branch.io/resources/aasa-validator/

---

### 3e — Archive and upload IPA via Xcode

1. Connect to Wi-Fi or ensure Xcode can reach the internet
2. In the menu bar: **Product → Archive** (use **Any iOS Device (arm64)** as destination, not a simulator)
3. Wait for archive to complete — the **Organizer** window opens automatically
4. Select the archive → **Distribute App**
5. Choose **App Store Connect** → **Upload**
6. Select: ✅ Strip Swift symbols, ✅ Upload your app's symbols, ✅ Manage Version and Build Number
7. Click **Upload** — Xcode handles signing and upload
8. After upload (~5 min): go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → your app → **TestFlight** to confirm the build arrived

**Alternative: command-line upload with `altool`**

```bash
# Export IPA from Xcode Organizer → Export → App Store Connect
xcrun altool --upload-app \
  -f SmartzConnect.ipa \
  -t ios \
  -u your@apple.id \
  -p @keychain:APP_PASSWORD   # app-specific password from appleid.apple.com
```

---

### 3f — App Store Connect setup

1. **Create app:** appstoreconnect.apple.com → My Apps → ✚
2. **Platforms:** iOS
3. **Bundle ID:** `com.smartzconnect.app` (must match Xcode)
4. **SKU:** `smartzconnect-ios-v1`

**Metadata to fill in (use copy from Section 6):**
- App name, subtitle, description, keywords
- Support URL, marketing URL, privacy policy URL
- Screenshots for 6.7" (1290×2796), 6.5" (1242×2688), 5.5" (1242×2208)
- App Preview video (optional but recommended)

**Privacy Nutrition Labels** (App Store Connect → App Privacy):
| Data Type | Collected? | Use |
|-----------|-----------|-----|
| Name | Yes | Account creation |
| Email address | Yes | Login, notifications |
| Phone number | Optional | 2FA |
| Photos/videos | Yes | Profile, posts |
| Location | Yes | Ride-hailing, nearby |
| Contacts | Optional | Friend suggestions |
| User content | Yes | Posts, messages |
| Usage data | Yes | Analytics |
| Identifiers (Device ID) | Yes | Push notifications |

**Age Rating:** 17+ (Frequent/Intense: Mature/Suggestive Themes, Dating apps)

---

### 3g — App Store checklist

- [ ] Bundle ID matches `com.smartzconnect.app`
- [ ] Privacy Nutrition Labels completed in App Store Connect
- [ ] AASA live and validated (no redirects, correct content-type)
- [ ] All Info.plist permission strings added
- [ ] Screenshots: 3–10 per device size (6.7", 6.5", 5.5" required)
- [ ] App icon: 1024×1024 px (`public/icons/icon-1024.png`) — no alpha channel
- [ ] Privacy Policy URL: `https://smartzconnect.com/privacy`
- [ ] Terms of Service URL: `https://smartzconnect.com/terms`
- [ ] Support URL: `https://smartzconnect.com/contact`
- [ ] Age rating: 17+ completed
- [ ] Export compliance: answered (ITSAppUsesNonExemptEncryption = NO)
- [ ] TestFlight build approved by internal tester before submitting for review
- [ ] App Review notes added (explain location use, explain dating features)

---

## 4 — TWA (Trusted Web Activity — alternative Android path)

As an alternative to Capacitor for Android, use Bubblewrap to generate a TWA:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://smartzconnect.com/manifest.json
bubblewrap build
```

The `twa-manifest.json` at the project root is pre-configured. After generating your keystore, update `sha256_cert_fingerprints` in `public/.well-known/assetlinks.json`.

---

## 5 — After every web update

```bash
pnpm build
npx cap sync           # syncs both android/ and ios/
# Android: bump versionCode in build.gradle → rebuild AAB → upload to Play Console
# iOS:     bump Build number in Xcode → re-archive → upload to App Store Connect
```

---

## 6 — Store listing copy (ready to paste)

### App Name
```
SmartzConnect
```

### iOS Subtitle (max 30 chars)
```
Africa's Premier Social App
```

### Short Description — Android (max 80 chars)
```
Connect, date, shop, stream & ride across Africa. All in one app.
```

### Keywords — iOS (max 100 chars, comma-separated)
```
social,dating,Africa,live stream,marketplace,ride,community,chat,earn
```

### Keywords — Android (tags/categories)
```
social network, dating app, Africa, live streaming, marketplace, ride hailing, community chat, earn money
```

---

### Full Description (Play Store & App Store)

```
SmartzConnect — Africa's All-in-One Social Platform

Connect with friends, find love, shop local, stream live, and get around — all from one app built for Africa.

🌍 SOCIAL FEED
Share posts, stories, and real-time moments with friends across 195+ countries. Comment, react, and keep up with the people who matter.

💕 SMARTZDATING — Spin & Match
Find meaningful connections through our unique Spin & Chat feature. Match based on shared interests, chat in real time, and meet people worth meeting.

📺 SMARTZTV — Live Streaming
Watch live broadcasts from creators and brands. Launch your own live stream and earn gifts from your audience in real time.

🛒 MARKETPLACE
Buy and sell products across Africa. Post listings, browse local vendors, and shop with confidence.

🎓 LEARNING
Access video courses, pass quizzes, and earn certificates to grow your skills and career.

🚗 RIDE-HAILING
Book rides and courier deliveries safely. Track your driver in real time.

🌐 WORLDCHAT
Join the open global community chat. Meet strangers, share ideas, and make friends around the world.

💰 EARN & REFER
Invite friends and earn rewards. Complete tasks, unlock premium features, and grow your earnings.

---
SmartzConnect is free to download. Premium and VIP membership plans are available for enhanced features.

Privacy Policy: https://smartzconnect.com/privacy
Terms of Service: https://smartzconnect.com/terms
Support: https://smartzconnect.com/contact
```

---

### App Store Review Notes (paste into "Notes for App Reviewer")

```
Test Account:
Email: reviewer@smartzconnect.com
Password: Review2024!

The app is a social platform targeting African users with the following features:
- Social feed, stories, and community chat (no registration required to browse)
- Dating/matching feature (age-gated, users confirm 18+ during signup)
- Live video streaming via LiveKit
- Marketplace for physical and digital goods
- Ride-hailing (currently available in select African cities)

Location permission is used for: (1) ride-hailing — required for driver matching; (2) dating — optional, shows distance only (never exact location).

Push notifications use OneSignal. The app requests notification permission only after the user has completed onboarding.

The app does not use custom encryption beyond HTTPS/TLS.
```

---

## 7 — Assets summary

| Asset | File | Required by |
|-------|------|-------------|
| App icon 192 | `public/icons/icon-192.png` | Android, manifest |
| App icon 512 | `public/icons/icon-512.png` | Play Store, manifest |
| App icon 1024 | `public/icons/icon-1024.png` | App Store (no alpha) |
| Maskable 512 | `public/icons/maskable-512.png` | Android adaptive icon |
| Android screenshots (×4) | `public/screenshots/android-*.png` | Play Store (1080×1920) |
| iOS screenshots (×4) | `public/screenshots/ios-*.png` | App Store (1290×2796) |
| Offline page | `public/offline.html` | Service worker fallback |
| Asset links | `public/.well-known/assetlinks.json` | Android TWA / deep links |
| AASA | `public/.well-known/apple-app-site-association` | iOS Universal Links |
| TWA manifest | `twa-manifest.json` | Bubblewrap (optional) |

---

## 8 — Keystore backup checklist

Before submitting to any store, confirm these are stored securely (outside the repo):

- [ ] `android/release.keystore` — encrypted backup in cloud storage
- [ ] Keystore password — in password manager
- [ ] Key alias: `smartzconnect`
- [ ] Key password — in password manager
- [ ] SHA-256 fingerprint — recorded in your Apple/Google developer dashboards

> Losing the release keystore means you **cannot ship updates** to existing Play Store users. There is no recovery path.
