import {
  createBrowserRouter,
  Route,
  createRoutesFromElements,
  RouterProvider
} from "react-router-dom";

// Layout
import Layout from "./Layout";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import MyWorkbooks from "./pages/MyWorkbooks";
import WorkbookPage from "./pages/Workbook";
import CreateWorkbook from "./pages/CreateWorkbook";
import EditWorkbook from "./pages/EditWorkbook";
import SearchResults from "./pages/SearchResults";
import Login from "./pages/Login";

import "./App.css";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public route for logging in */}
      <Route path="/login" element={<Login />} />

      {/* Everything else inside Layout can be “protected.” */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="my-workbooks" element={<MyWorkbooks />} />
        <Route path="about" element={<About />} />
        <Route path="workbooks/create" element={<CreateWorkbook />} />
        <Route path="workbook/:workbook_id" element={<WorkbookPage />} />
        <Route path="workbook/edit/:workbook_id" element={<EditWorkbook />} />
        <Route path="results" element={<SearchResults />} />
      </Route>
    </>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
