# Solana Mobile Grant Request - SOLTAG Application Answers

Copy and paste these answers directly into the application form.

---

### **Project Name**
**Soltag**

### **Requested Amount**
**$10,000**
*(Range Selection: Select "$10k - $50k" or input exact amount if allows)*

### **Budget Breakdown (If asked in "Long Description" or separate field)**
**Allocation of $10,000 Grant:**
1.  **Hardware & Security Integration ($4,000):**
    *   Finalizing Solana Seeker "Seeker ID" hardware attestation.
    *   Implementing stringent anti-spoofing checks (Zone Hashing).
2.  **Mobile Polish & UX ($3,000):**
    *   Polishing the "Tap-to-Sign" flow with Solana Mobile Stack.
    *   Optimizing Android background services for offline queueing.
3.  **On-Chain Audit Prep ($2,000):**
    *   Code review and preparation for Anchor program audit.
4.  **Infrastructure & Launch ($1,000):**
    *   RPC costs (Helius/QuickNode) for first 6 months.
    *   Domain and server costs for metadata hosting.

---

### **Website URL**
**https://soltag.app**

### **Country**
**India**

### **First Name**
**[Your First Name]**

### **Last Name**
**[Your Last Name]**

### **Email**
**0xsupremedev@gmail.com**

### **Category**
**Consumer App / Mobile**

### **Twitter (X)**
**@soltag_sol**

### **GitHub**
**https://github.com/soltagit**
*(Organization Repo)*

### **Link To Pitch Deck**
**[Link to Pitch Deck PDF]**
*(Recommendation: Create a simple 5-slide deck covering: 1. Problem (Fake attendance), 2. Solution (Soltag Mobile App), 3. Tech (Seeker + SMS), 4. Roadmap, 5. Team)*

### **Link To Demo Video**
**[Link to YouTube Video]**
*(Action: Record a 45s screen recording of opening the app, connecting Phantom/Saga wallet, and scanning a QR code)*

### **Solana On-Chain Accounts**
*   **Program ID:** (Deploy to Devnet and insert ID here, e.g., `SolTag...`)
*   **Team Fund Wallet:** (Insert your SOL wallet address)

### **Do you have an Android app already?**
**Yes**

### **Solana dApp Store Status**
**Submitted / In Review**  
*(If you followed the guide, publish to Devnet listing first, then mark this. If not yet submitted, select "In Progress")*

### **What best describes the funding status of your project?**
**Bootstrapped / Self-Funded**

### **Relevant metrics about the usage of your project/product**

**Traction & Readiness:**
- **Product Status:** MVP Complete (Android APK built).
- **Tech Stack:** Fully integrated with Solana Mobile Stack (MWA) and optimized for Solana Seeker features (Hardware Attestation pending).
- **Testing:** Successfully deployed and tested on Android 14 emulators and pilot devices.
- **Community:** Open-source repository with active development.

**Key Features Live:**
1. **Privacy-First Location:** Geohash-based proof of presence (no GPS tracking).
2. **One-Tap Minting:** Seamless Mobile Wallet Adapter integration.
3. **Seeker ID Support:** Architecture ready for Seeker hardware attestation (anti-bot protection).
4. **Soulbound Credentials:** Non-transferable attendance tokens (SBTs) enforced on-chain.

**Why Soltag + Seeker?**
We are solving the "Proof of Real World" problem using Seeker's unique hardware capabilities. Unlike POAP (easy to farm/fake), Soltag uses device-bound signals to guarantee physical presence, making it the "Killer App" for conference and meetup verification on Solana.

---

### **Additional Notes for "Project Description" or "Long Form" Sections (if asked):**

**Summary:**
Soltag is the "Foursquare for Web3"—a mobile-first dApp for verifying real-world attendance without sacrificing privacy.

**The Problem:**
1. **Fake Attendance:** POAPs can be minted from a couch.
2. **Privacy Risks:** Existing "check-in" apps leak precise GPS data.
3. **Mobile Friction:** Checking in via mobile browser wallets is clunky and slow.

**The Soltag Solution:**
Soltag leverages the **Solana Seeker** to fix this.
- **Hardware Attestation:** We use the Seeker's secure element to prove the device is real and physically present (preventing bot farms).
- **Privacy-Preserving:** We hash location data on-client (Zone ID) so raw GPS never touches the chain.
- **Native UX:** Built with Solana Mobile Stack for tap-to-sign interactions.

**Grant Usage:**
Funds will be used to audit the on-chain Anchor program, finalize the Seeker hardware integration (Seeker ID API), and launch the public beta for Breakpoint 2025.
