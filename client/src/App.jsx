import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import AccountPage from './pages/AccountPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import SessionBoardPage from './pages/SessionBoardPage'
import SessionsPage from './pages/SessionsPage'

function Layout() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/sessions" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionBoardPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
