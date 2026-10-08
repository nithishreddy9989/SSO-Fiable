import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, Shield, FileText, CheckCircle2 } from "lucide-react";

export const ConfigGuideModal = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-left">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative border border-slate-700/80">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Microsoft Entra ID App Registration Guide</h2>
            <p className="text-xs text-slate-400">Step-by-step setup to connect this application with your Azure Organizations.</p>
          </div>
        </div>

        {/* Step 1 */}
        <div className="space-y-2 border-l-2 border-l-cyan-500 pl-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">1</span>
            <h3 className="text-sm font-bold text-white">Create App Registration in Azure Portal</h3>
          </div>
          <p className="text-xs text-slate-300">
            Navigate to the{" "}
            <a
              href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline inline-flex items-center gap-1 font-semibold"
            >
              Azure Portal - Entra ID App Registrations <ExternalLink className="w-3 h-3" />
            </a>{" "}
            and click <strong className="text-white">New registration</strong>.
          </p>
        </div>

        {/* Step 2 */}
        <div className="space-y-2 border-l-2 border-l-blue-500 pl-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">2</span>
            <h3 className="text-sm font-bold text-white">Configure SPA Redirect URI</h3>
          </div>
          <p className="text-xs text-slate-300">Under Platform settings, select <strong className="text-white">Single-page application (SPA)</strong> and add:</p>
          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
            <span className="font-mono text-cyan-300">http://localhost:5173</span>
            <button
              onClick={() => copyToClipboard("http://localhost:5173", "uri")}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
            >
              {copiedField === "uri" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === "uri" ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-2 border-l-2 border-l-indigo-500 pl-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">3</span>
            <h3 className="text-sm font-bold text-white">Copy Credentials into Environment File</h3>
          </div>
          <p className="text-xs text-slate-300">
            Copy the <strong className="text-white">Application (client) ID</strong> and <strong className="text-white">Directory (Organizations) ID</strong> from the Overview page into <code className="text-cyan-300">backend/.env</code>:
          </p>
          <pre className="code-block text-cyan-300 text-xs">
            {`AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
AZURE_Organizations_ID=common
MOCK_AUTH_MODE=false`}
          </pre>
        </div>

        {/* Step 4 */}
        <div className="space-y-2 border-l-2 border-l-emerald-500 pl-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">4</span>
            <h3 className="text-sm font-bold text-white">Grant API Permissions</h3>
          </div>
          <p className="text-xs text-slate-300">
            Under <strong className="text-white">API permissions</strong>, ensure Microsoft Graph delegated permissions are added: <code className="text-emerald-400">User.Read</code>, <code className="text-emerald-400">openid</code>, <code className="text-emerald-400">profile</code>, <code className="text-emerald-400">email</code>.
          </p>
        </div>

        {/* Bottom Done button */}
        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="btn-primary text-xs py-2 px-6">
            Got It!
          </button>
        </div>

      </div>
    </div>
  );
};
