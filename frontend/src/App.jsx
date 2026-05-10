import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Upload from './pages/Upload'
import AIAdvisor from './pages/AIAdvisor'
import News from './pages/News'
import Settings from './pages/Settings'

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0B1120', color: '#F8FAFC',
          border: '1px solid rgba(148,163,184,0.15)',
          borderRadius: '10px', fontSize: '13px',
          backdropFilter: 'blur(16px)',
        },
        success: { iconTheme: { primary: '#34D399', secondary: '#0B1120' } },
        error:   { iconTheme: { primary: '#F87171', secondary: '#0B1120' } },
      }} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="upload"    element={<Upload />} />
          <Route path="advisor"   element={<AIAdvisor />} />
          <Route path="news"      element={<News />} />
          <Route path="settings"  element={<Settings />} />
        </Route>
      </Routes>
    </>
  )
}
