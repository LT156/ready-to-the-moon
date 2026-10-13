import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Lianliankan } from './modules/match-3game'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/match-3game" element={<Lianliankan />} />
    </Routes>
  )
}

export default App
