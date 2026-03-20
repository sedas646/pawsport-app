import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import EditPoster from "./pages/EditPoster";
import ThemeDesignerPage from "./pages/ThemeDesignerPage";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="poster/:dogIndex" element={<EditPoster />} />
        <Route path="themes" element={<ThemeDesignerPage />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
