import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Decks from "./pages/Decks";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/decks"
        element={
          <ProtectedRoute>
            <Decks />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
