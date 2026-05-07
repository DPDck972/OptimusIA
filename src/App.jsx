import LoginPage from "./pages/LoginPage.jsx";
import RecoverPage from "./pages/PassRecoverPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import "./index.css";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/recuperacao" element={<RecoverPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>
  );
}

export default App;
