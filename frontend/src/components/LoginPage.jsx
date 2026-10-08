import React, { useState } from "react";
import {
  Cpu,
  Building2,
  X,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage = ({ onOpenGuide }) => {
  const {
    loginWithEntra,
    loginWithEmailPassword,
    loginWithMock,
    isMockMode,
    toggleMockMode
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Direct Email & Password login state
  const [email, setEmail] = useState("superadmin@platform.com");
  const [password, setPassword] = useState("SuperAdmin123!");

  // SSO Email Lookup Modal state
  const [isSsoModalOpen, setIsSsoModalOpen] = useState(false);
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState(null);
  const [resolvedOrg, setResolvedOrg] = useState(null);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithEmailPassword(email, password);
    } catch (err) {
      setError(err.message || "Invalid email address or password");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSsoModal = () => {
    setSsoEmail("");
    setSsoError(null);
    setResolvedOrg(null);
    setIsSsoModalOpen(true);
  };

  const handleSsoSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = ssoEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setSsoError("Please enter a valid work email address (e.g., user@acme.com)");
      return;
    }

    setSsoLoading(true);
    setSsoError(null);
    setResolvedOrg(null);

    try {
      const res = await fetch(`/api/auth/clients/resolve?domain=${encodeURIComponent(trimmedEmail)}`);
      const data = await res.json();

      if (data && data.resolved) {
        setResolvedOrg({
          client_name: data.client_name,
          domain_suffix: data.domain_suffix,
          azure_client_id: data.azure_client_id,
          azure_tenant_id: data.azure_tenant_id
        });

        // Trigger SSO redirect/login after smooth visual indication
        setTimeout(async () => {
          try {
            if (isMockMode) {
              await loginWithMock(trimmedEmail, `${data.client_name} User`, "User");
            } else {
              await loginWithEntra(data.azure_client_id, data.azure_tenant_id);
            }
            setIsSsoModalOpen(false);
          } catch (loginErr) {
            setSsoError(loginErr.message || "Failed to launch SSO login window.");
            setResolvedOrg(null);
          }
        }, 800);
      } else {
        const domain = trimmedEmail.includes("@") ? trimmedEmail.split("@")[1] : trimmedEmail;
        setSsoError(`No organization registered for domain "${domain}". Please contact your administrator.`);
      }
    } catch (err) {
      setSsoError(err.message || "Failed to connect to organization lookup service.");
    } finally {
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans relative">

      {/* LEFT COLUMN: Dark Navy Branding & Graphics (50% Width) */}
      <div className="lg:w-1/2 bg-[#0c1737] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-left min-h-[400px] lg:min-h-screen">

        {/* Circular Background Rings Art */}
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] border border-slate-800/40 rounded-full pointer-events-none" />
        <div className="absolute -bottom-36 -left-36 w-[700px] h-[700px] border border-slate-800/30 rounded-full pointer-events-none" />
        <div className="absolute -bottom-48 -left-48 w-[900px] h-[900px] border border-slate-800/20 rounded-full pointer-events-none" />

        {/* Hero Copy */}
        <div className="my-auto py-12 max-w-lg z-10 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Secure access, made simple.
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            One sign-in for every tenant, powered by Microsoft Entra ID.
          </p>
        </div>

        {/* Bottom Footer Text */}
        <div className="text-xs text-slate-500 font-medium z-10">
          Enterprise single sign-on portal
        </div>

      </div>

      {/* RIGHT COLUMN: Clean White Login Form (50% Width) */}
      <div className="lg:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative text-left text-slate-900 min-h-screen">

        {/* Top Right Actions */}
        <div className="flex items-center justify-end gap-4 z-10">
          <button
            onClick={toggleMockMode}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${isMockMode
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isMockMode ? "Demo mode" : "Live mode"}</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Azure setup guide
          </button>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8 max-w-md w-full mx-auto space-y-6">

          {/* Welcome Text */}
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-500">Sign in to continue to your workspace.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Email</label>
              <input
                type="email"
                required
                placeholder="superadmin@platform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-sm"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button type="button" className="text-xs font-semibold text-blue-600 hover:underline">
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-sm"
              />
            </div>

            {/* Sign In Primary Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Sign in</span>
              )}
            </button>

          </form>

          {/* OR Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 absolute">or</span>
          </div>

          {/* Microsoft Entra SSO Action (Triggers Pop-up Card) */}
          <div>
            <button
              onClick={handleOpenSsoModal}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2.5 shadow-sm"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H1z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H1z" />
              </svg>
              <span>Continue with SSO</span>
            </button>
          </div>

          {/* Preset Demo Account Links */}
          <div className="pt-4 text-center text-xs space-y-2">
            <p className="text-slate-400 font-medium">Try a demo account:</p>
            <div className="flex items-center justify-center gap-3 text-slate-600 font-semibold">
              <button
                onClick={() => { setEmail("superadmin@platform.com"); setPassword("SuperAdmin123!"); }}
                className="hover:text-blue-600 transition-colors"
              >
                SuperAdmin
              </button>
              <span>•</span>
              <button
                onClick={() => { setEmail("admin@acme.com"); setPassword("Admin123!"); }}
                className="hover:text-blue-600 transition-colors"
              >
                Tenant Admin
              </button>
              <span>•</span>
              <button
                onClick={() => { setEmail("user@acme.com"); setPassword("User123!"); }}
                className="hover:text-blue-600 transition-colors"
              >
                User
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Spacing */}
        <div />

      </div>

      {/* POP-UP MODAL CARD FOR WORK EMAIL SSO LOOKUP */}
      {isSsoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-left relative space-y-5 animate-in fade-in zoom-in-95 duration-150">

            {/* Close Button */}
            <button
              onClick={() => setIsSsoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Sign in with SSO</h3>
              
            </div>

            {/* Error Message */}
            {ssoError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{ssoError}</span>
              </div>
            )}

            {/* Success State Notification */}
            {resolvedOrg && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Organization Found: {resolvedOrg.client_name}</span>
                </div>
                <p className="text-[11px] text-emerald-700 pl-5">
                  Redirecting to {resolvedOrg.client_name} Microsoft Entra ID portal...
                </p>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSsoSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                Enter your email address.
              </p>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="e.g. user@acme.com"
                  value={ssoEmail}
                  onChange={(e) => setSsoEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSsoModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={ssoLoading || !!resolvedOrg}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs py-2.5 px-5 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {ssoLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching database...</span>
                    </>
                  ) : resolvedOrg ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to SSO</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>


          </div>
        </div>
      )}

    </div>
  );
};

