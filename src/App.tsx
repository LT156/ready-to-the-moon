import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Lianliankan } from './modules/match-3game'
import { RubiksCube } from './modules/rubiks-cube'
import { Decrypt } from './modules/decrypt'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/match-3game" element={<Lianliankan />} />
      <Route path="/rubiks-cube" element={<RubiksCube />} />
      <Route path="/decrypt" element={<Decrypt />} />
    </Routes>
  )
}

export default App
