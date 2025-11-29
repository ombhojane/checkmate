import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ClaimAnalysis from './pages/ClaimAnalysis.tsx'
import Timeline from './pages/Timeline.tsx'
import Pricing from './pages/Pricing'
import Resources from './pages/Resources'
import Careers from './pages/Careers'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/careers" element={<Careers />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claims/:claimId" element={<ClaimAnalysis />} />
        <Route path="/claim/:claimId" element={<ClaimAnalysis />} />
        <Route path="/claims" element={<Dashboard />} />
        <Route path="/timeline" element={<Timeline />} />
      </Route>
    </Routes>
  )
}

export default App