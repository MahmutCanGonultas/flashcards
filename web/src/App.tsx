import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Decks from "./pages/Decks";
import DeckDetail from "./pages/DeckDetail";
import Study from "./pages/Study";
import Dialogue from "./pages/Dialogue";
import UnitTest from "./pages/UnitTest";
import Placement from "./pages/Placement";
import Grammar from "./pages/Grammar";
import ProtectedRoute from "./components/ProtectedRoute";
import { getToken } from "./lib/api";
import { playTap } from "./lib/sound";

/** Signed in? Go to the decks. Otherwise, go sign in. */
function RootRedirect() {
  return <Navigate to={getToken() ? "/decks" : "/login"} replace />;
}

/**
 * A quiet tick under every button and link, so the whole app feels
 * physical. Installed once, on pointerdown, which also happens to be the
 * earliest user gesture that can unlock audio on iOS.
 */
function useTapSounds() {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const control = target?.closest("button, a, [role=button]");
      if (!control || control.hasAttribute("disabled") || control.hasAttribute("data-silent")) return;
      playTap();
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
}

function App() {
  useTapSounds();
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
      <Route
        path="/decks/:deckId/units/:unitId/grammar"
        element={
          <ProtectedRoute>
            <Grammar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/decks/:deckId/units/:unitId/dialogue"
        element={
          <ProtectedRoute>
            <Dialogue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/decks/:deckId/units/:unitId/test"
        element={
          <ProtectedRoute>
            <UnitTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/decks/:deckId/placement"
        element={
          <ProtectedRoute>
            <Placement />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
