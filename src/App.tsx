import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { Navbar } from './components/Navbar';

const Landing = lazy(() => import("./pages/Landing").then(m => ({ default: m.Landing })));
const Explore = lazy(() => import("./pages/Explore").then(m => ({ default: m.Explore })));
const Passport = lazy(() => import("./pages/Passport").then(m => ({ default: m.Passport })));
const ProfileAuth = lazy(() => import("./pages/ProfileAuth").then(m => ({ default: m.ProfileAuth })));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <a
            href="#main-content"
            style={{ position: "absolute", left: "-9999px", top: "auto", zIndex: 1000, background: "var(--color-primary)", color: "white", padding: "1rem" }}
            onFocus={e => (e.currentTarget.style.left = "0")}
            onBlur={e => (e.currentTarget.style.left = "-9999px")}
          >
            Pular para o conteúdo principal
          </a>
          <Navbar />
          <main id="main-content" style={{ flex: 1, paddingBottom: 'var(--spacing-2xl)' }}>
            <Suspense fallback={
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <span>Carregando...</span>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/passport" element={<Passport />} />
                <Route path="/profile" element={<ProfileAuth />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
