import React from "react";
import { KeyRound, HelpCircle, LogOut, Cpu, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar = ({ onOpenGuide }) => {
  const { isAuthenticated, user, logout, isMockMode, toggleMockMode } = useAuth();

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">Fiable SSO</span>
              <span className="badge badge-azure text-[10px]">Microsoft Entra ID</span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Enterprise Single Sign-On Portal</p>
          </div>
        </div>

        {/* Status Badges & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Mode Badge */}
          <button 
            onClick={toggleMockMode}
            title="Click to toggle between Real Entra ID and Demo Mock Mode"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border ${
              isMockMode 
                ? "bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900/60" 
                : "bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60"
            }`}
          >
            {isMockMode ? (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Demo / Mock Mode</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Entra Connected</span>
              </>
            )}
          </button>

          {/* Setup Guide Button */}
          <button
            onClick={onOpenGuide}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-slate-200"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Azure App Setup Guide</span>
          </button>

          {/* User Profile / Logout */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-slate-400 max-w-[140px] truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out of SSO"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
