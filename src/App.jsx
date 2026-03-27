import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Aside from './components/Aside'
import Header from './components/Header'
import './App.css'
import OverviewView from './views/Overview'
import MapView from './views/Map'
import RankingsView from './views/Rankings'
import DistrictControllerView from './views/DistrictController'
import AiPredictiveView from './views/AiPredictive'
import DistrictDetailView from './views/DistrictDetail'
import LandingPage from './views/LandingPage'
import LoginPage from './views/LoginPage'

function RequireAuth({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('sjs_token')
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

function DashboardShell() {
  return (
    <div className="app-shell">
      <Aside />
      <div className="main-content">
        <Header />
        <div className="view-area">
          <Routes>
            <Route index element={<OverviewView />} />
            <Route path="map" element={<MapView />} />
            <Route path="rankings" element={<RankingsView />} />
            <Route path="ai" element={<AiPredictiveView />} />
            <Route path="district-detail/:districtId" element={<DistrictDetailView />} />
            <Route path="district/:districtId" element={<DistrictControllerView />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/*" element={<RequireAuth><DashboardShell /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}