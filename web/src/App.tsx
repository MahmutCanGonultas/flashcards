import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Decks from "./pages/Decks";
import DeckDetail from "./pages/DeckDetail";
import Study from "./pages/Study";
import ProtectedRoute from "./components/ProtectedRoute";
import { getToken } from "./lib/api";

/** Signed in? Go to the decks. Otherwise, go sign in. */
function RootRedirect() {
  return <Navigate to={getToken() ? "/decks" : "/login"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/decks"
        element={
          <ProtectedRoute>
            <Decks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/decks/:deckId"
        element={
          <ProtectedRoute>
            <DeckDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/decks/:deckId/study"
        element={
          <ProtectedRoute>
            <Study />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
