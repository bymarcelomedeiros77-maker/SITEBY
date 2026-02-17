import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastNotification } from './components/ToastNotification';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Faccoes } from './pages/Faccoes';
import { Cortes } from './pages/Cortes';
import { Performance } from './pages/Performance';
import { Settings } from './pages/Settings';
import { ModuleSelection } from './pages/ModuleSelection';
import { TechPacks } from './pages/TechPacks';
import { Clients } from './pages/Clients';
import { StockControl } from './pages/StockControl';

import { CuttingOrders } from './pages/CuttingOrders';

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
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/modules"
        element={
          <ProtectedRoute>
            <ModuleSelection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <Layout>
              <StockControl />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faccoes"
        element={
          <ProtectedRoute>
            <Layout>
              <Faccoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cortes"
        element={
          <ProtectedRoute>
            <Layout>
              <Cortes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <Layout>
              <Performance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tech-packs"
        element={
          <ProtectedRoute>
            <Layout>
              <TechPacks />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <Layout>
              <Clients />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cutting-orders"
        element={
          <ProtectedRoute>
            <Layout>
              <CuttingOrders />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const AppContent = () => {
  const { toasts, removeToast } = useApp();

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