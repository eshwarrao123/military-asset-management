import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import './index.css';

function AppRoutes() {
  const { role } = useAuth();

  return (
    <div className="app-container">
      <Navigation />
      <main className="main-content">
        <Routes>
          {role !== 'Logistics' && <Route path="/" element={<Dashboard />} />}
          {role !== 'Commander' && <Route path="/purchases" element={<Purchases />} />}
          {role !== 'Commander' && <Route path="/transfers" element={<Transfers />} />}
          {role !== 'Logistics' && <Route path="/assignments" element={<Assignments />} />}

          <Route path="*" element={<Navigate to={role === 'Logistics' ? "/purchases" : "/"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
