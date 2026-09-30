import { Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from './contexts/GameContext'
import Home from './pages/Home'
import Hub from './pages/Hub'
import Universe from './pages/Universe'
import Challenge from './pages/Challenge'
import Portal from './pages/Portal'
import FinalBoss from './pages/FinalBoss'
import Scoreboard from './pages/Scoreboard'
import Admin from './pages/Admin'
import Nav from './components/Nav'
import BattleworldOS from './components/BattleworldOS'
import DoomCursor from './components/DoomCursor'
import OverseerHUD from './components/OverseerHUD'
import BroadcastBanner from './components/BroadcastBanner'

export default function App() {
  return (
    <GameProvider>
      <DoomCursor />
      <OverseerHUD />
      <BroadcastBanner />
      <Nav />
      <BattleworldOS />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/universe/:universeId" element={<Universe />} />
        <Route path="/challenge/:challengeId" element={<Challenge />} />
        <Route path="/portal/:portalId" element={<Portal />} />
        <Route path="/final-boss" element={<FinalBoss />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  )
}
