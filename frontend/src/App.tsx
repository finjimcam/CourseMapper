import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Button, Flowbite, DarkThemeToggle } from 'flowbite-react'
import Layout from './Layout'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Flowbite>
      <BrowserRouter>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl">Testing Flowbite Button</h1>
            <DarkThemeToggle />
          </div>
          <div className="space-y-4">
            <Button gradientDuoTone="purpleToBlue" onClick={() => setCount(count + 1)}>
              Count is: {count}
            </Button>
            <Button color="gray">
              Sample Button to Test Dark Mode
            </Button>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<Layout />}>
          </Route>
        </Routes>
      </BrowserRouter>
    </Flowbite>
  )
}

export default App
