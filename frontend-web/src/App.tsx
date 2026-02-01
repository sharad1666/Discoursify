import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import BannedPage from './pages/BannedPage';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import CreateSession from './pages/CreateSession';
import JoinByCode from './pages/JoinByCode';
import WaitingRoom from './pages/WaitingRoom';
import LiveGD from './pages/LiveGD';
import ContentHub from './pages/ContentHub';
import AdminPanel from './pages/AdminPanel';
import Recordings from './pages/Recordings';
import RecordingDetails from './pages/RecordingDetails';
import Performance from './pages/Performance';
import './App.css';

import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <SessionProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/banned" element={<BannedPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="join" element={<Sessions />} />
                  <Route path="create-session" element={<CreateSession />} />
                  <Route path="join-code" element={<JoinByCode />} />
                  <Route path="waiting/:id" element={<WaitingRoom />} />
                  <Route path="session/:id" element={<LiveGD />} />
                  <Route path="content" element={<ContentHub />} />

                  {/* Protected Admin Route */}
                  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="admin" element={<AdminPanel />} />
                  </Route>

                  <Route path="reports" element={<Recordings />} />
                  <Route path="reports/:id" element={<RecordingDetails />} />
                  <Route path="performance" element={<Performance />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
