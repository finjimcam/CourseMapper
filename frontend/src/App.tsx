import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Button, Flowbite, DarkThemeToggle } from 'flowbite-react'
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
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <DarkThemeToggle />
          </div>
        </div>
      </BrowserRouter>
    </Flowbite>
  )
}

export default App
