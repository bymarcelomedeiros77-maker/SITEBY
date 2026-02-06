import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastNotification } from './components/ToastNotification';
import { useToast } from './hooks/useToast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Faccoes } from './pages/Faccoes';
import { Cortes } from './pages/Cortes';
import { Performance } from './pages/Performance';
import { Settings } from './pages/Settings';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center">
        <div className="text-nexus-cyan animate-pulse font-mono tracking-widest text-xs uppercase">Carregando Sistema...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faccoes"
        element={
          <ProtectedRoute>
            <Faccoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cortes"
        element={
          <ProtectedRoute>
            <Cortes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <Performance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const AppContent = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Router>
        <AppRoutes />
      </Router>
      <ToastNotification toasts={toasts} onDismiss={removeToast} />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}