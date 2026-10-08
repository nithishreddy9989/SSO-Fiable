import React, { useState } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { createMsalConfig } from "./msalConfig";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { ConfigGuideModal } from "./components/ConfigGuideModal";

// Initialize MSAL Instance
const msalInstance = new PublicClientApplication(createMsalConfig());

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Initializing Microsoft Entra SSO Service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Navbar rendered only when authenticated */}
      {isAuthenticated && <Navbar onOpenGuide={() => setIsGuideOpen(true)} />}
      
      <main className="flex-1 flex flex-col">
        {isAuthenticated ? (
          <Dashboard />
        ) : (
          <LoginPage onOpenGuide={() => setIsGuideOpen(true)} />
        )}
      </main>

      <ConfigGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

export const App = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MsalProvider>
  );
};

export default App;
