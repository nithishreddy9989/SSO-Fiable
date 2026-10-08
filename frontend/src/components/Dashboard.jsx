import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  Globe,
  Building2,
  Crown,
  Users,
  CheckCircle2,
  Activity,
  UserPlus,
  PlusCircle,
  Shield
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Dashboard = () => {
  const { user, rawToken, tokenClaims, verifyBackendToken, isMockMode } = useAuth();

  const [copied, setCopied] = useState(false);
  const [activeTokenTab, setActiveTokenTab] = useState("decoded");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // SuperAdmin Control States
  const [superadminSummary, setSuperadminSummary] = useState(null);
  const [activeSuperadminTab, setActiveSuperadminTab] = useState("Organizationss");
  const [superadminSuccess, setSuperadminSuccess] = useState(null);
  const [superadminError, setSuperadminError] = useState(null);

  // Form states for SuperAdmin Organizations Creation
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newOrganizationsId, setNewOrganizationsId] = useState("");
  const [newClientId, setNewClientId] = useState("");

  // Form states for SuperAdmin User Creation
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("User");
  const [newUserClientSlug, setNewUserClientSlug] = useState("acme-corp");

  const fetchSuperadminSummary = async () => {
    if (user?.role === "SuperAdmin") {
      try {
        const res = await fetch("/api/auth/superadmin/summary");
        if (res.ok) {
          const data = await res.json();
          setSuperadminSummary(data);
        }
      } catch (err) {
        console.warn("Failed to fetch superadmin summary:", err);
      }
    }
  };

  useEffect(() => {
    fetchSuperadminSummary();
  }, [user]);

  const handleCopyToken = () => {
    if (rawToken) {
      navigator.clipboard.writeText(rawToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunBackendVerify = async () => {
    setVerifying(true);
    const res = await verifyBackendToken();
    setVerifyResult(res);
    setVerifying(false);
  };

  // SuperAdmin Handler: Add New Organizations Client
  const handleSuperadminAddOrganizations = async (e) => {
    e.preventDefault();
    setSuperadminSuccess(null); setSuperadminError(null);
    try {
      const res = await fetch("/api/auth/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug || newName.toLowerCase().replace(/\s+/g, "-"),
          client_name: newName,
          domain_suffix: newDomain,
          azure_Organizations_id: newOrganizationsId,
          azure_client_id: newClientId
        })
      });
      if (res.ok) {
        setSuperadminSuccess(`Organizations Organization '${newName}' registered successfully!`);
        await fetchSuperadminSummary();
        setActiveSuperadminTab("Organizationss");
        setNewName(""); setNewDomain(""); setNewOrganizationsId(""); setNewClientId("");
      } else {
        const data = await res.json();
        setSuperadminError(data.detail || "Failed to add Organizations");
      }
    } catch (err) {
      setSuperadminError(err.message || "Failed to reach backend");
    }
  };

  // SuperAdmin Handler: Create New Admin or User
  const handleSuperadminCreateUser = async (e) => {
    e.preventDefault();
    setSuperadminSuccess(null); setSuperadminError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserName,
          role: newUserRole,
          client_slug: newUserRole === "SuperAdmin" ? null : newUserClientSlug
        })
      });
      if (res.ok) {
        setSuperadminSuccess(`User '${newUserEmail}' created successfully as ${newUserRole}!`);
        await fetchSuperadminSummary();
        setActiveSuperadminTab("Organizationss");
        setNewUserEmail(""); setNewUserPassword(""); setNewUserName("");
      } else {
        const data = await res.json();
        setSuperadminError(data.detail || "Failed to create user");
      }
    } catch (err) {
      setSuperadminError(err.message || "Failed to reach backend");
    }
  };

  if (!user) return null;

  const isSuperAdmin = user.role === "SuperAdmin";
  const isAdmin = user.role === "Admin" || isSuperAdmin;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-left">

      {/* Top Welcome Banner */}
      <div className={`glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 ${isSuperAdmin ? "border-l-amber-500" : (isAdmin ? "border-l-blue-500" : "border-l-emerald-500")
        }`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xl text-white">
            {isSuperAdmin ? <Crown className="w-7 h-7 text-amber-400" /> : user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user.name}</h1>

              <span className={`badge ${isSuperAdmin ? "badge-warning" : (isAdmin ? "badge-azure" : "badge-success")
                } text-[11px] flex items-center gap-1`}>
                {isSuperAdmin ? <Crown className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Role: {user.role}
              </span>

              {isMockMode && <span className="badge badge-warning text-[10px]">Mock Session</span>}
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span>{user.email}</span>
              <span>•</span>
              <span className="text-slate-400 font-medium">{user.jobTitle || "Authenticated User"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunBackendVerify}
            disabled={verifying}
            className="btn-primary py-2 px-4 text-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifying ? "Verifying..." : "Validate Token"}</span>
          </button>
        </div>
      </div>

      {/* SUPERADMIN CONTROL PANEL (Restricted strictly to SuperAdmin) */}
      {isSuperAdmin && superadminSummary && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              SuperAdmin Platform Control
            </h2>

            {/* SuperAdmin Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSuperadminTab("Organizationss")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${activeSuperadminTab === "Organizationss" ? "bg-slate-800 text-white border-slate-700" : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
              >
                Organizations
              </button>
              <button
                onClick={() => setActiveSuperadminTab("add_Organizations")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1 ${activeSuperadminTab === "add_Organizations" ? "bg-amber-950 text-amber-300 border-amber-800" : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Organizations</span>
              </button>
              <button
                onClick={() => setActiveSuperadminTab("add_user")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1 ${activeSuperadminTab === "add_user" ? "bg-blue-950 text-blue-300 border-blue-800" : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Admin/User</span>
              </button>
            </div>
          </div>

          {superadminSuccess && (
            <div className="p-3 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
              {superadminSuccess}
            </div>
          )}

          {superadminError && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {superadminError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 space-y-2 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Organizationss</span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{superadminSummary.total_clients}</p>
              <p className="text-[11px] text-slate-400">Registered Client Organizations</p>
            </div>

            <div className="glass-panel p-5 space-y-2 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Registered Users</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{superadminSummary.total_users}</p>
              <p className="text-[11px] text-slate-400">Platform Admins & Users</p>
            </div>

            <div className="glass-panel p-5 space-y-2 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>System Status</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                Operational
              </p>
              <p className="text-[11px] text-slate-400">RBAC Database Engine Active</p>
            </div>
          </div>

          {/* TAB 1: Organizations Table */}
          {activeSuperadminTab === "Organizationss" && (
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-slate-400" />
                Registered Client Organizations
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Organization</th>
                      <th className="py-2.5 px-3">Domain Suffix</th>
                      <th className="py-2.5 px-3">Slug ID</th>
                      <th className="py-2.5 px-3">Users</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {superadminSummary.clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white">{c.client_name}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{c.domain_suffix}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{c.slug}</td>
                        <td className="py-3 px-3 text-slate-300">{c.user_count} User(s)</td>
                        <td className="py-3 px-3 text-right">
                          <span className="badge badge-success text-[10px]">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SuperAdmin Register New Organizations Client */}
          {activeSuperadminTab === "add_Organizations" && (
            <div className="glass-panel p-6 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Register New Client Organizations (SuperAdmin Only)
              </h3>

              <form onSubmit={handleSuperadminAddOrganizations} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Globex Logistics"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="form-control text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Domain Suffix</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. globex-logistics.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="form-control text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Azure Organizations ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47"
                    value={newOrganizationsId}
                    onChange={(e) => setNewOrganizationsId(e.target.value)}
                    className="form-control text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Azure Client ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="form-control text-xs font-mono"
                  />
                </div>

                <button type="submit" className="btn-primary py-2 px-4 text-xs mt-2">
                  Save Organizations
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SuperAdmin Create Admin or User */}
          {activeSuperadminTab === "add_user" && (
            <div className="glass-panel p-6 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                Create New Admin or User Account (SuperAdmin Only)
              </h3>

              <form onSubmit={handleSuperadminCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="form-control text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah@acme.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="form-control text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="form-control text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role Assignment</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="form-control text-xs"
                  >
                    <option value="Admin">Organizations Admin (Admin)</option>
                    <option value="User">Standard User (User)</option>
                   
                  </select>
                </div>

                {newUserRole !== "SuperAdmin" && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Target Client Organization</label>
                    <select
                      value={newUserClientSlug}
                      onChange={(e) => setNewUserClientSlug(e.target.value)}
                      className="form-control text-xs"
                    >
                      {superadminSummary.clients.map((c) => (
                        <option key={c.id} value={c.slug}>{c.client_name} ({c.domain_suffix})</option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="btn-primary py-2 px-4 text-xs mt-2">
                  Create Account
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* CLAIMS & TOKEN INSPECTOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Claims */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Identity Claims
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned System Role</span>
                <span className="font-bold px-2 py-1 rounded inline-block bg-slate-900 border border-slate-800 text-slate-200">
                  {user.role}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">User Email</span>
                <span className="font-mono text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800 block truncate">
                  {user.email}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">IdentityProvider</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {user.idp}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: JWT Inspector */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 space-y-4">

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-bold text-white">JWT Access Token Inspector</h3>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTokenTab("decoded")}
                  className={`px-3 py-1 rounded font-medium transition-all ${activeTokenTab === "decoded" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                >
                  Decoded Claims
                </button>
                <button
                  onClick={() => setActiveTokenTab("raw")}
                  className={`px-3 py-1 rounded font-medium transition-all ${activeTokenTab === "raw" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                >
                  Raw Token
                </button>
              </div>
            </div>

            {activeTokenTab === "decoded" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>JWT Claims Payload</span>
                  <button onClick={handleCopyToken} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy Token"}</span>
                  </button>
                </div>
                <pre className="code-block text-slate-200 max-h-[380px] overflow-y-auto">
                  {JSON.stringify(tokenClaims || {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    roles: user.roles,
                    idp: user.idp
                  }, null, 2)}
                </pre>
              </div>
            )}

            {activeTokenTab === "raw" && (
              <div className="space-y-3">
                <div className="code-block break-all text-slate-300 text-xs max-h-[300px] overflow-y-auto leading-relaxed">
                  {rawToken || "mock-jwt-bearer-token"}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
