# SOLTAG - Proof of Presence on Solana

**Your on-chain proof of real-world attendance**

SOLTAG is a privacy-first mobile dApp that mints non-transferable NFT credentials (SBTs) to prove you attended real-world events—without revealing your GPS coordinates or personal data.

Built for conferences, meetups, gyms, and DAOs on Solana.

---

## 🎯 Core Concept

**Problem:** Traditional attendance tracking requires personal data (sign-in sheets, GPS logging) and can be faked.

**SOLTAG Solution:**
- Scan event QR code → Verify time + privacy-safe zone → Mint soulbound credential
- **No GPS on-chain** (uses geohash + SHA-256 hashing)
- **No personal data** (wallet = identity)
- **Hardware-backed verification** (Solana Seeker ID support)

---

## ✨ Key Features

### 📱 Mobile Experience
- **Privacy-First Onboarding:** No email or phone number required. Just connect wallet.
- **Hardware Integration:** Optimized for **Solana Seeker** with hardware attestation to prevent bot farming.
- **Offline Support:** Scan now, mint later if network is spotty.
- **Dark Mode:** Sleek, glassmorphism UI built for modern devices.

### 🏆 Leaderboard & Reputation
- **Global Rankings:** Compete for top spots based on attendance.
- **Seeker Verification:** Exclusive shield badges for hardware-verified users.
- **Profile Customization:** update avatar and username (stored locally).

### 🛡️ Security Modules
- **QR Validator:** cryptographic signature validation to prevent spoofing.
- **Secure Storage:** AES-GCM encryption for all local data.
- **Zone Privacy:** Geohash precision verification (~5km radius) without storing raw GPS.

---

## 🆚 Why Soltag?

| Feature | **SOLTAG** |
|---------|-----------|
| **Blockchain** | **Solana** |
| **Fees** | **Ultra-low (~$0.00001)** |
| **Mobile-First** | **✅ Native** |
| **GPS Privacy** | **✅ Hashed** |
| **Hardware Attestation** | **✅ Seeker ID** |
| **Offline Support** | **✅ Queue** |
| **Soulbound** | **✅ Enforced** |
| **Compressed NFTs** | **✅ Bubblegum** |
| **Open Source** | **✅ MIT** |

---

## 📱 Solana Mobile Stack Alignment

**Built for Saga & Seeker:**

✅ **Mobile Wallet Adapter (MWA)**
- Native signing UX (no browser redirects)
- Seamless Phantom/Solflare integration

✅ **Seeker Hardware-Ready**
- Device attestation service integrated
- Hardware-backed anti-fraud
- Future: Seeker-exclusive features (priority minting)

---

## 🛠️ Tech Stack

**Frontend:**
- ⚛️ React 18 + TypeScript
- 🚀 Vite + Capacitor (Android Hybrid)
- 🎨 Custom CSS Variables System

**Solana:**
- 🔗 @solana/web3.js
- 📱 @solana-mobile/mobile-wallet-adapter-protocol
- ⚓ Anchor (On-Chain Logic)

---

## 📦 Installation

**Prerequisites:** Node.js 18+, Android Studio.

```bash
# 1. Clone & Install
git clone https://github.com/soltag/soltag.git
cd soltag-app
npm install

# 2. Run Web Dev Server
npm run dev

# 3. Build for Android
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## 🎯 Usage Model

**For Event Attendees:**
1. **Connect Wallet:** Tap "Connect Wallet" → Approve in Phantom.
2. **Scan:** Point camera at event QR code.
3. **Verify:** App validates location (locally) and signature.
4. **Mint:** Confirm transaction to receive Soulbound Token.

**For Organizers:**
- Create tamper-proof QR codes.
- Gate DAO voting or discord channels based on real-world attendance.

---

## 🗺️ Roadmap

- **Phase 1 (Complete):** Mobile App, Offline Queue, Basic Security.
- **Phase 2 (Current):** Seeker Hardware Integration, Leaderboards.
- **Phase 3 (Next):** On-Chain Anchor Program Deployment, Mainnet Launch.

---

## 📄 License & Support
**License:** MIT
**Support:** [Open an Issue](https://github.com/soltag/soltag/issues)

**Built with ❤️ on Solana**
*Proving real-world presence, preserving privacy.*
