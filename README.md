# offby — Nearby Shops & Best Offers Platform

Complete full-stack **Customer Application**, **Vendor Portal**, **Web Admin Panel**, and **REST API + SQLite Database** (AWS/Docker-ready) built according to the `offby` UI reference and CODTECH Scope of Work.

## Architecture

- **`backend/`**: Node.js 24 + Express + built-in `node:sqlite` (`DatabaseSync`), JWT auth, role-based access control (`customer`, `vendor`, `admin`), Haversine distance calculation, OTP & Email login, Vendor approval workflow, Admin moderation, Categories, Subscriptions, Locations, and Reports.
- **`frontend/`**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide icons, mobile-first responsive UI with fixed bottom navigation, safe-area support, and dedicated portals:
  - **Customer App**: `/`, `/explore`, `/offers`, `/saved`, `/profile`, `/categories`, `/shop/:id`, `/login`
  - **Vendor Application**: `/vendor` (Registration, Pending/Approved status gate, Shop & Gallery editor, Services, Offers, Real-time Updates, Subscription view)
  - **Admin Panel**: `/admin` (Overview & Reports, Vendor Approvals/Blocking, User Management, Dynamic Categories, Offer Moderation, Subscription Plans & Assignments, Locations)

## Quick Start

### 1. Start Backend API
```bash
cd backend
npm install
npm run dev
```
The server automatically initializes and seeds the SQLite database on first run (`http://localhost:5000`).

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Demo Credentials
- **Customer**: `rohit@offby.in` / `User@123` (or Mobile OTP `+919876543210`, OTP `1234`)
- **Vendor (Approved)**: `beanbrew@offby.in` / `Vendor@123`
- **Admin**: `admin@offby.in` / `Admin@123`
