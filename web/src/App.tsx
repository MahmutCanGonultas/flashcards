import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Kartlar from "./pages/Kartlar";
import Kurs from "./pages/Kurs";
import DeckDetail from "./pages/DeckDetail";
import Study from "./pages/Study";
import Dialogue from "./pages/Dialogue";
import UnitTest from "./pages/UnitTest";
import Placement from "./pages/Placement";
import Grammar from "./pages/Grammar";
import Flashcards from "./pages/Flashcards";
import WordPage from "./pages/WordPage";
import Kelimelerim from "./pages/Kelimelerim";
import TontonPopups from "./components/TontonPopups";
import ProtectedRoute from "./components/ProtectedRoute";
import { getToken } from "./lib/api";
import { playTap } from "./lib/sound";

// Grammar ships its topics as their own chunk: the home page only needs the catalog.
const GrammarHub = lazy(() => import("./pages/GrammarHub"));
const GrammarTopic = lazy(() => import("./pages/GrammarTopic"));
const GrammarQuiz = lazy(() => import("./pages/GrammarQuiz"));

/** Signed in? Go to the decks. Otherwise, go sign in. */
function RootRedirect() {
  return <Navigate to={getToken() ? "/kartlar" : "/login"} replace />;
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

/**
 * A new page opens at its top; going back returns to where the last one
 * was left. A replace (the word list's search and filters) keeps the
 * scroll where it is.
 */
function useScrollMemory() {
  const location = useLocation();
  const type = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const current = useRef(location.key);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => positions.current.set(current.current, window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    current.current = location.key;
    if (type === "PUSH") window.scrollTo(0, 0);
    else if (type === "POP") window.scrollTo(0, positions.current.get(location.key) ?? 0);
  }, [location.key, type]);
}

function App() {
  useTapSounds();
  useScrollMemory();
  return (
    <>
      <TontonPopups />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/decks" element={<Navigate to="/kartlar" replace />} />
      <Route
        path="/kartlar"
        element={
          <ProtectedRoute>
            <Kartlar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kelimelerim"
        element={
          <ProtectedRoute>
            <Kelimelerim />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gramer"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <GrammarHub />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gramer/:slug"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <GrammarTopic />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gramer/:slug/alistirma"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <GrammarQuiz />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kurs"
        element={
          <ProtectedRoute>
            <Kurs />
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
        path="/decks/:deckId/words/:cardId"
        element={
          <ProtectedRoute>
            <WordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/decks/:deckId/flashcards"
        element={
          <ProtectedRoute>
            <Flashcards />
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
    </>
  );
}

export default App;
