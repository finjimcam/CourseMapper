import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Flowbite } from 'flowbite-react'
import Layout from './Layout'
import './App.css'

function App() {
  return (
    <Flowbite>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
          </Route>
        </Routes>
      </BrowserRouter>
    </Flowbite>
  )
}

export default App
