import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { loginRequest, createMsalConfig } from "../msalConfig";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { instance, accounts } = useMsal();
  const msalIsAuthenticated = useIsAuthenticated();

  const [backendConfig, setBackendConfig] = useState(null);
  const [isMockMode, setIsMockMode] = useState(true);
  const [mockUser, setMockUser] = useState(null);
  const [mockToken, setMockToken] = useState(null);
  const [mockClaims, setMockClaims] = useState(null);
  
  const [loginMethod, setLoginMethod] = useState("popup");
  const [tenantType, setTenantType] = useState("common");
  const [loading, setLoading] = useState(true);

  // Fetch Backend App Configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/auth/config");
        if (response.ok) {
          const data = await response.json();
          setBackendConfig(data);
          setIsMockMode(data.mockMode || !data.isConfigured);
        }
      } catch (err) {
        setIsMockMode(true);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const isAuthenticated = Boolean(msalIsAuthenticated || mockUser);

  const user = mockUser || (accounts.length > 0 ? {
    name: accounts[0].name || accounts[0].username || "Entra User",
    email: accounts[0].username || "",
    role: "User",
    roles: accounts[0].idTokenClaims?.roles || ["User.Read"],
    oid: accounts[0].localAccountId || "",
    tid: accounts[0].tenantId || "",
    scopes: ["openid", "profile", "email", "User.Read"],
    idp: "Microsoft Entra ID",
    jobTitle: "Enterprise Identity User"
  } : null);

  const rawToken = mockToken || (accounts.length > 0 ? accounts[0].idTokenClaims?.__raw || "msal-active-session-token" : null);
  const tokenClaims = mockClaims || (accounts.length > 0 ? accounts[0].idTokenClaims : null);

  // 1. Direct Email + Password Login
  const loginWithEmailPassword = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "Authentication failed");
    }
    const data = await res.json();
    setMockToken(data.access_token);
    setMockClaims(data.user);
    setMockUser({
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      roles: data.user.roles,
      client_slug: data.user.client_slug,
      client_name: data.user.client_name,
      idp: data.user.idp,
      jobTitle: data.user.role === "SuperAdmin" ? "Global Platform SuperAdmin" : (data.user.role === "Admin" ? "Tenant Admin" : "User")
    });
    return data;
  };

  // 2. Microsoft Entra ID SSO Login with Dynamic Tenant & Client ID Support
  const loginWithEntra = async (customClientId, customTenantId) => {
    try {
      if (customClientId && customTenantId && customClientId !== "your-entra-client-id-here") {
        const dynamicMsal = new PublicClientApplication(createMsalConfig(customClientId, customTenantId));
        await dynamicMsal.initialize();
        if (loginMethod === "popup") {
          await dynamicMsal.loginPopup(loginRequest);
        } else {
          await dynamicMsal.loginRedirect(loginRequest);
        }
      } else {
        if (loginMethod === "popup") {
          await instance.loginPopup(loginRequest);
        } else {
          await instance.loginRedirect(loginRequest);
        }
      }
    } catch (err) {
      console.error("Entra ID Login error:", err);
      throw err;
    }
  };

  // 3. Instant Demo Login
  const loginWithMock = async (email = "superadmin@platform.com", name = "Global SuperAdmin", role = "SuperAdmin") => {
    try {
      const res = await fetch("/api/auth/mock-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, tenant_type: tenantType }),
      });
      if (res.ok) {
        const data = await res.json();
        setMockToken(data.access_token);
        setMockClaims(data.claims);
        setMockUser({
          name: data.claims.name,
          email: data.claims.email,
          role: data.claims.role,
          roles: data.claims.roles,
          client_name: data.claims.client_name,
          idp: data.claims.idp,
          jobTitle: data.claims.role === "SuperAdmin" ? "Platform SuperAdmin" : (data.claims.role === "Admin" ? "Tenant Admin" : "User")
        });
      }
    } catch (err) {
      console.error("Mock login error:", err);
    }
  };

  const verifyBackendToken = async () => {
    const tokenToVerify = rawToken || "mock-token-sample";
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenToVerify}`
        },
        body: JSON.stringify({ token: tokenToVerify })
      });
      return await res.json();
    } catch (err) {
      return { valid: false, error: err.message || "Failed to reach backend API" };
    }
  };

  const logout = () => {
    setMockUser(null);
    setMockToken(null);
    setMockClaims(null);
    if (msalIsAuthenticated) {
      instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    }
  };

  const toggleMockMode = () => {
    setIsMockMode(prev => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        rawToken,
        tokenClaims,
        backendConfig,
        isMockMode,
        loading,
        loginMethod,
        tenantType,
        setLoginMethod,
        setTenantType,
        loginWithEntra,
        loginWithEmailPassword,
        loginWithMock,
        logout,
        verifyBackendToken,
        toggleMockMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
