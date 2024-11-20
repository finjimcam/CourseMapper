import {
  createBrowserRouter, 
  Route, 
  createRoutesFromElements,
  RouterProvider} from 'react-router-dom'

// Do we need the import below?
import { Flowbite } from 'flowbite-react'

// Layout
import Layout from './Layout'

// Pages
import Home from './pages/Home'
import About from './pages/About'

// Do we need the import below?
import './App.css'
import MyWorkbooks from './pages/MyWorkbooks'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="home" element={<Home />} />
      <Route path="MyWorkbooks" element={<MyWorkbooks />} />
      <Route path="about" element={<About />} />
    </Route>
  )
)

function App() {
  return (
    <RouterProvider router = {router}/>
  );
}

export default App
