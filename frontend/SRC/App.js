import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SecurityProvider } from './contexts/SecurityContext';
import { ComplianceProvider } from './contexts/ComplianceContext';
import { AIProvider } from './contexts/AIContext';

// Components
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import AIAgents from './pages/AIAgents';
import GraphicsStudio from './pages/GraphicsStudio';
import ContentCreator from './pages/ContentCreator';
import OwnerDashboard from './pages/OwnerDashboard';
import CustomerSupport from './pages/CustomerSupport';
import ComplianceCenter from './pages/ComplianceCenter';

function App() {
  return (
    <SecurityProvider>
      <ComplianceProvider>
        <AIProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/ai-agents" element={<AIAgents />} />
                  <Route path="/graphics-studio" element={<GraphicsStudio />} />
                  <Route path="/content-creator" element={<ContentCreator />} />
                  <Route path="/owner-dashboard" element={<OwnerDashboard />} />
                  <Route path="/support" element={<CustomerSupport />} />
                  <Route path="/compliance" element={<ComplianceCenter />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AIProvider>
      </ComplianceProvider>
    </SecurityProvider>
  );
}

export default App;
