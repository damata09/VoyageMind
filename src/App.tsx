import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Explore } from './pages/Explore';
import { Passport } from './pages/Passport';
import { ProfileAuth } from './pages/ProfileAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1, paddingBottom: 'var(--spacing-2xl)' }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/passport" element={<Passport />} />
              <Route path="/profile" element={<ProfileAuth />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
