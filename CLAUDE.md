# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Frontend Development:**
```bash
npm run dev        # Start Vite development server (port 5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

**Firebase Functions (in /functions directory):**
```bash
npm run serve      # Start Firebase emulators
npm run deploy     # Deploy functions only
npm run logs       # View function logs
```

**Firebase Deployment:**
```bash
firebase deploy           # Deploy entire project
firebase deploy --only hosting  # Deploy frontend only
firebase deploy --only functions  # Deploy functions only
```

## Architecture Overview

SimpleLister is a Product Hunt-style React/Firebase application with the following architecture:

### Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS + React Router DOM
- **Backend**: Firebase (Firestore, Auth, Storage, Analytics, Functions)
- **Payment**: Stripe integration via Firebase Functions
- **Charts**: ApexCharts for data visualization

### Application Structure

**Entry Points:**
- `/src/main.jsx` - Router setup with all application routes
- `/src/App.jsx` - Main layout (Header + Sidebar + Content + Footer)
- `/functions/index.js` - Firebase Cloud Functions entry point

**Key Features:**
- Weekly product launch cycles (Monday-Sunday)
- User voting system with streak tracking
- Multi-step product submission form (6 steps)
- Real-time leaderboards and user profiles
- Protected routes requiring authentication

### Firebase Integration

**Authentication:**
- Google OAuth only
- Protected routes use ProtectedRoute component
- User onboarding flow for new accounts

**Firestore Collections:**
- `users` - User profiles with streaks, bookmarks, voting history
- `products` - Product listings with voting data and launch dates
- `sponsors` - Homepage sponsor content

**Storage Structure:**
- `/products/{productSlug}/` - Product images
- `/users/{userId}/` - User profile images
- `/badges/` - Public badge images

### Routing Patterns

**Public Routes:**
- `/` - Homepage with product listings
- `/categories/:categoryName` - Category-filtered products
- `/product/:slug` - Individual product pages
- `/profile/:username` - Public user profiles
- `/leaderboard` - User rankings

**Protected Routes:**
- `/submit` - 6-step product submission form
- `/admin` - Admin panel
- `/onboarding` - New user setup

### Development Notes

**Component Organization:**
- Layout components: Header, Footer, Sidebar
- Product displays: ProductList, CategoryProductList, MyProductsList
- Form components: Multi-step submission process in `/submit/`
- Utility components: ProtectedRoute, SearchPopup, EditProfilePopup

**State Management:**
- React state with useEffect/useState
- Firebase Auth state for authentication
- Real-time Firestore listeners for data sync
- Optimistic updates for voting system

**Styling:**
- Tailwind CSS with custom SF Compact Display font family
- Mobile-first responsive design
- No dark mode configuration

**Security:**
- Firestore security rules prevent vote manipulation
- Storage rules allow authenticated uploads with public read
- Environment variables for API keys in Functions

### Common Patterns

**Product Voting:**
- Client-side optimistic updates with server validation
- User vote tracking in Firestore user documents
- Weekly launch windows with countdown timers

**Data Fetching:**
- Real-time Firestore listeners for live updates
- Loading states with skeleton screens
- Error handling for network issues