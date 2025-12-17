# SOLTAG Publishing & Grant Playbook

This is your complete end-to-end command-level playbook to take Soltag from "working dApp" → **production-ready** → **published on Solana dApp Store** → **grant-ready**.

---

## Part A — Publish to Solana dApp Store (Saga / Solana Mobile)

### 1️⃣ One-Time Environment Setup

Install Solana, Anchor, and dApp Store CLI (if not already installed).

```bash
# Install Solana Tool Suite
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
anchor --version

# Install Solana Mobile dApp Store CLI
npm install -g @solana-mobile/dapp-store-cli
dapp-store --version

# Set Network (Start with Devnet, switch to Mainnet for release)
solana config set --url https://api.devnet.solana.com

# Create Publisher Wallet (Secure this keypair!)
solana-keygen new --outfile publisher-keypair.json
solana address -k publisher-keypair.json
```

---

### 2️⃣ Solana Program (Smart Contract) — Production Ready

Before publishing the app, your on-chain program must be deployed and stable.

```bash
# 1. Build & Test
anchor build
anchor test

# 2. Audit & Lint (Recommended)
cargo clippy --all-targets -- -D warnings
cargo audit

# 3. Deploy to Mainnet (When ready)
solana config set --url https://api.mainnet-beta.solana.com
anchor deploy --provider.cluster mainnet

# 4. Fetch IDL & Save Program ID
anchor idl fetch <YOUR_PROGRAM_ID> > idl.json
```

**Optimization Tip:**
```bash
# Dump and rebuild optimized binary for lower deploy cost
solana program dump <PROGRAM_ID> program.so
RUSTFLAGS="-C opt-level=3" anchor build
```

---

### 3️⃣ Mobile App Hardening (Android / SMS)

Ensure your Android build is secure and compliant.

**Security Checklist:**
- [ ] ❌ No private keys stored in app code
- [ ] ❌ No hardcoded RPC keys (use proxy or env vars)
- [ ] ✅ HTTPS only for RPC endpoints
- [ ] ✅ Transaction simulation implemented

**Build Release APK:**

```bash
cd android

# Generate Signing Key (One time only - keep safe!)
keytool -genkey -v -keystore soltag.keystore -alias soltag -keyalg RSA -keysize 2048 -validity 10000

# Build Signed Release APK
./gradlew assembleRelease
```
*Output: `android/app/build/outputs/apk/release/app-release.apk`*

**Sign & Align APK:**
```bash
# Sign
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore soltag.keystore app-release.apk soltag

# Align (Optimizes RAM usage)
zipalign -v 4 app-release.apk soltag-release.apk
```

---

### 4️⃣ Publish to dApp Store (Command Flow)

**Step 1: Initialize Project**
```bash
dapp-store init
# Creates config.yaml, assets/ folder
```

**Step 2: Edit `config.yaml`**
Update this file with your explicit details.

```yaml
publisher:
  name: "Soltag Labs"
  website: "https://soltag.app"
  email: "team@soltag.app"
  keypair: "./publisher-keypair.json"

app:
  name: "Soltag"
  slug: "soltag"
  description: "Proof of Presence on Solana. Privacy-first attendance tracking."
  long_description: "Soltag is a mobile-first dApp that enables users to tag, discover, and verify on-chain assets..."
  logo: "./assets/icon.png"
  screenshots:
    - "./assets/screen1.png"
    - "./assets/screen2.png"
  privacy_policy: "https://soltag.app/privacy"
  website: "https://soltag.app"

release:
  version: "1.0.0"
  apk: "./soltag-release.apk"
  
solana:
  network: "mainnet-beta"
  program_ids:
    - "<YOUR_PROGRAM_ID>"
```

**Step 3: Validate Config**
```bash
dapp-store validate
# Must pass with 0 errors
```

**Step 4: Mint On-Chain NFTs**
This establishes your identity and app provenance on-chain. **(Costs ~0.01 SOL)**

```bash
# 1. Mint Publisher NFT
dapp-store publisher create

# 2. Mint App NFT
dapp-store app create

# 3. Mint Release NFT (Links specific APK version)
dapp-store release create
```

**Step 5: Submit for Review**
```bash
dapp-store submit
```
*🎉 Success! Your app is now in the Solana Mobile review queue.*

---

## Part B — Get a Grant (Solana Mobile / Foundation)

### 💰 Types of Grants
1. **Solana Mobile Builder Grants:** Best for SOLTAG. Focus on mobile-first, Seeker, and Saga features.
2. **Solana Foundation Grants:** General ecosystem public goods.

### ✅ Grant Application Skeleton (Copy & Edit)

**Title:** Soltag — Mobile-First Proof of Presence & Discovery Layer
**Requested:** $20,000 USD (USDC)

**Summary:**
Soltag is a privacy-first mobile dApp enabling users to verify real-world attendance (Proof of Presence) via non-transferable credentials on Solana. Optimized for Solana Seeker with hardware attestation.

**Problem:**
Current attendance tools (POAP) are expensive, lack privacy (public GPS), and have poor mobile UX. Builders lack lightweight, verifiable on-chain reputation tools for IRL events.

**Solution:**
Soltag provides:
1. **Privacy:** Geo-hashing + ZK-style proofs (no raw GPS).
2. **Security:** Hardware-backed attestation (Seeker ID).
3. **UX:** Tap-to-verify mobile flow via Solana Mobile Stack.

**Milestones & Budget:**

| Milestone | Deliverable | Timeline | Budget |
|-----------|-------------|----------|--------|
| **M1: Mobile Core** | v1 APK, Wallet Connect, On-chain Program (Devnet) | Weeks 0-6 | $5,000 |
| **M2: Security** | Mainnet Deploy, Security Audit, Hardware Attestation | Weeks 6-12 | $8,000 |
| **M3: Growth** | dApp Store Listing, Leaderboard, Analytics | Weeks 12-18 | $5,000 |
| **M4: API** | Public Verification API, Documentation | Weeks 18-24 | $2,000 |

**Team:**
- [Your Name] - Lead Dev (GitHub: ...)
- [Teammate] - Product/Design

**Links:**
- **Repo:** https://github.com/yourusername/soltag (Public)
- **Demo Mode:** https://soltag.app
- **Program ID:** <YOUR_PROGRAM_ID>

---

## 💸 Cost Analysis (Real World)

**Do you have to pay fees?**
**Short Answer: NO listing fees.**

| Item | Cost | Notes |
|------|------|-------|
| **dApp Store Listing** | **$0** | Free forever. No annual fees. |
| **On-Chain Minting** | **~$1** | One-time gas fees for Publisher/App NFTs. |
| **APK Signing** | **$0** | Self-signed. No Apple/Google tax. |
| **RPC Node** | **$0 - $50/mo** | Free tiers (Helius/QuickNode) work for MVP. |
| **Domain** | **~$15/yr** | Your branding. |

**Total Launch Cost:** **~$20** (mostly domain & gas).

---

## 🏆 Final "Perfect DApp" Checklist

**UX / Product:**
- [ ] Wallet connect in < 2 taps (SMS)
- [ ] Transaction simulation shows clear changes
- [ ] Loading skeletons (no blank screens)
- [ ] Offline support (queue system working)

**Security:**
- [ ] Rate limiting on API/Minting
- [ ] Program Upgrade Authority managed (Multisig recommended)
- [ ] External Audit plan (budgeted in grant)

**Trust:**
- [ ] Public GitHub Repo with clear README
- [ ] Verified Domain (DNS linked to Publisher)
- [ ] Privacy Policy & ToS pages live

**Grant Strategy:**
1. **Publish to dApp Store FIRST.**
2. Then apply for grant saying: *"We are live on the dApp Store."*
3. This creates **massive credibility** and increases acceptance chance.
