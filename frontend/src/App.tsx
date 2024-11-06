import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Button } from 'flowbite-react'
import Layout from './Layout'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <div className="p-4">
          <h1 className="text-2xl mb-4">Testing Flowbite Button</h1>
          <Button gradientDuoTone="purpleToBlue" onClick={() => setCount(count + 1)}>
            Count is: {count}
          </Button>
        </div>
        <Routes>
          <Route path="/" element={<Layout />}>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
