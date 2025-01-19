import {
  createBrowserRouter, 
  Route, 
  createRoutesFromElements,
  RouterProvider
} from 'react-router-dom';

// Layout
import Layout from './Layout';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import MyWorkbooks from './pages/MyWorkbooks';
import Workbook from './pages/Workbook'; // Import the Workbook component

import './App.css';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="my-workbooks" element={<MyWorkbooks />} />
      <Route path="about" element={<About />} />
      <Route path="workbook/:workbook_id" element={<Workbook />} /> {/* Add this route */}
    </Route>
  )
);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
