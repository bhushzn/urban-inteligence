import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Lock, User as UserIcon, Shield, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { api, type User } from "../api";

interface Props {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function LoginModal({ onClose, onSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "field_agent">("field_agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error("Please enter your full name");
        const res = await api.register(username.trim(), password, name.trim(), role);
        onSuccess(res.user);
      } else {
        const res = await api.login(username.trim(), password);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoRole: "admin" | "field_agent") {
    setError(null);
    setIsRegister(false);
    if (demoRole === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("agent");
      setPassword("agent123");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 999999 }}
    >
      <div className="glass glow-cyan w-full max-w-md rounded-2xl border border-cyan-500/30 p-6 relative overflow-hidden shadow-2xl">
        {/* Background glow orb */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">
                {isRegister ? "Create Command Account" : "Command Center Login"}
              </h2>
              <p className="text-xs text-slate-400">UrbanIntel AI • Role-Based Access Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Demo Credentials */}
        {!isRegister && (
          <div className="my-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Quick Demo Fill (One Click)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium text-left transition-colors"
              >
                👑 <b>Admin</b>
                <span className="block text-[10px] text-slate-400 font-mono">admin / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("field_agent")}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-medium text-left transition-colors"
              >
                👷 <b>Field Agent</b>
                <span className="block text-[10px] text-slate-400 font-mono">agent / agent123</span>
              </button>
            </div>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Officer Rajesh Kumar"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
              />
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("field_agent")}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    role === "field_agent"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  👷 Field Agent
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    role === "admin"
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                      : "bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  👑 Command Admin
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" /> {isRegister ? "Create Account & Sign In" : "Sign In to Console"}
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {isRegister ? (
              <>Already have an account? <span className="font-semibold text-cyan-400">Sign In</span></>
            ) : (
              <>Need a new account? <span className="font-semibold text-cyan-400">Register here</span></>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
}
