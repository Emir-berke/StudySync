import { lazy, Suspense } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import Footer from './components/Footer'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'

// Signed-in pages load on demand, so visitors to the landing and sign-in pages
// download less JavaScript up front.
const AccountPage = lazy(() => import('./pages/AccountPage'))
const SessionBoardPage = lazy(() => import('./pages/SessionBoardPage'))
const SessionsPage = lazy(() => import('./pages/SessionsPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))

function Layout() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Suspense fallback={<p className="status">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionBoardPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
