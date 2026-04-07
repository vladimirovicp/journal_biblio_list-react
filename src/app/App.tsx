import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../components/MainLayout/MainLayout'
import AboutPage from '../pages/About/AboutPage'
import HomePage from '../pages/Home/HomePage'

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
