# Soltag — Verified Attendance on Solana

Soltag is a mobile-first application designed to record and verify event attendance using the Solana blockchain. By combining **Solana Mobile Stack (SMS)**, **Program Derived Addresses (PDAs)**, and **Supabase**, Soltag provides an immutable, privacy-preserving, and high-performance attendance ledger.

## 📦 Latest Release

Stay up to date with the latest production-ready builds:
- **Current Version**: `v1.0.0-beta-2`
- **Asset**: [Download solgot.apk](https://github.com/soltag/soltag/releases/tag/v1.0.0-beta-2) (Signed Production Build)
- **Status**: Hardened Supabase Backend + Ed25519 QR Validation.

## 🚀 Features

- **Verified Check-ins**: Deterministically track attendance via on-chain PDAs.
- **Mobile-First UX**: Deep-linked signing with **Mobile Wallet Adapter (MWA)**.
- **Hardware Trust**: Integrated **Solana Seeker ID** for device-level identity attestation.
- **Privacy-First**: Zero tracking of exact GPS locations; used-scoped hashed zones only.
- **Real-Time discovery**: Fast event discovery and profile indexing via Supabase.

## 🛠 Technical Architecture

Soltag follows a "Blockchain as Truth" model:

1. **On-Chain State**: The final authority for all attendance records.
2. **Supabase Indexer**: A high-speed mirror for discovery, notifications, and social metadata.
3. **MWA Signing**: Seamless transaction approval on mobile devices.

### Documentation
- [SOLANA_INTEGRATION.md](./SOLANA_INTEGRATION.md): Deep dive into PDAs, Seeker ID, and transaction flows.
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md): Supabase table structures, RLS policies, and sync reliability.
- [RECOVERY_STRATEGY.md](./RECOVERY_STRATEGY.md): Guide on data resilience and manual verification.


## 🛡 Security & Trust

- **Nonce-Based Auth**: Wallet-only authentication with no passwords.
- **Replay Protection**: Strict TTL and duplicate nonce checking for QR codes.
- **Data Integrity**: Attendance records are immutable once verified on-chain.

## 📈 Roadmap

We are currently in **Phase 3: Public Launch & Visibility**.
- [x] Phase 1: Hardening & Readiness
- [x] Phase 2: Product Integrity
- [/] Phase 3: Public Launch (In Progress)
- [ ] Phase 4: Growth & Ecosystem Integration
- [ ] Phase 5: Long-Term Evolution (Compressed NFTs)

## 📄 License
MIT License - Developed for the Solana Mobile Ecosystem.
