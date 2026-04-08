import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../components/MainLayout/MainLayout'
import AboutPage from '../pages/About/AboutPage'
import HomePage from '../pages/Home/HomePage'
import { ENVIRONMENT_URLS } from '../shared/config/environments'

const environmentUrls = ENVIRONMENT_URLS as Record<string, string | undefined>

const App = () => {
  const environmentOptions = useMemo(() => Object.keys(environmentUrls), [])

  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(
    '',
  )

  const selectedBaseUrl = selectedEnvironment
    ? environmentUrls[selectedEnvironment] ?? ''
    : ''

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          index
          element={
            <HomePage
              environmentOptions={environmentOptions}
              selectedEnvironment={selectedEnvironment}
              selectedBaseUrl={selectedBaseUrl}
              onEnvironmentChange={setSelectedEnvironment}
            />
          }
        />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
