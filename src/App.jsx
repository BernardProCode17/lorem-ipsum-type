import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Rank from './pages/Rank'

export default function App() {
  return (
    <>
      <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rank" element={<Rank />} />
        </Routes>
    </>
  )
}

