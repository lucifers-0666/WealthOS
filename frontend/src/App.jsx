import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Upload from './pages/Upload'
import AIAdvisor from './pages/AIAdvisor'
import News from './pages/News'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="upload"    element={<Upload />} />
        <Route path="advisor"   element={<AIAdvisor />} />
        <Route path="news"      element={<News />} />
        <Route path="settings"  element={<Settings />} />
      </Route>
    </Routes>
  )
}
