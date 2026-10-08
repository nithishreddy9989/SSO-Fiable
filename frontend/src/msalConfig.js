import { LogLevel } from "@azure/msal-browser";

// Default or environment configured Azure Entra App settings
export const defaultEntraConfig = {
  clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "your-entra-client-id-here",
  OrganizationsId: import.meta.env.VITE_AZURE_Organizations_ID || "common",
  redirectUri: window.location.origin,
};

/**
 * Creates MSAL Configuration dynamically with active Organizations & client settings
 */
export const createMsalConfig = (clientId, OrganizationsId) => {
  const activeClientId = clientId && clientId !== "your-entra-client-id-here"
    ? clientId
    : defaultEntraConfig.clientId;

  const activeOrganizations = OrganizationsId || defaultEntraConfig.OrganizationsId;
  const authority = `https://login.microsoftonline.com/${activeOrganizations}`;

  return {
    auth: {
      clientId: activeClientId,
      authority: authority,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: "sessionStorage", // "sessionStorage" or "localStorage"
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          switch (level) {
            case LogLevel.Error:
              console.error("[MSAL Error]", message);
              return;
            case LogLevel.Info:
              console.info("[MSAL Info]", message);
              return;
            case LogLevel.Verbose:
              console.debug("[MSAL Verbose]", message);
              return;
            case LogLevel.Warning:
              console.warn("[MSAL Warning]", message);
              return;
          }
        },
        logLevel: LogLevel.Warning,
      },
    },
  };
};

// Default Scopes for Microsoft Entra ID OIDC + Microsoft Graph
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

// Graph API Endpoint
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
