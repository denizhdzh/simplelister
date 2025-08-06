import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import SubmitProductPage from './pages/SubmitProductPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/categories" element={<Navigate to="/categories/advertising" replace />} />
        <Route path="/categories/:categoryName" element={<CategoryPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminPage />} />
          <Route path="/submit" element={<SubmitProductPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
