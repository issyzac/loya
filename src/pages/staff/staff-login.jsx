import React, { useState } from "react";
import logo from "../../assets/e-nzi-01.png";
import axiosInstance from "../../api/axios";
import { useUpdateStaffUser, useUpdateStaffToken, useUpdateStaffRefreshToken, useUpdateStaffPermissions } from "../../providers/UserProvider";

export default function StaffLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const setUser = useUpdateStaffUser();
  const setToken = useUpdateStaffToken();
  const setRefreshToken = useUpdateStaffRefreshToken();
  const setPermissions = useUpdateStaffPermissions();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/api/auth/login", {
        identifier,
        password,
      });

      if (response.status === 200) {
        const { access_token, refresh_token, user, permissions } = response.data;

        // Store JWT tokens and user data
        localStorage.setItem("staffToken", access_token);
        localStorage.setItem("staffRefreshToken", refresh_token);
        localStorage.setItem("staffUser", JSON.stringify(user));
        localStorage.setItem("staffPermissions", JSON.stringify(permissions));

        // Update context
        setUser(user);
        setToken(access_token);
        setRefreshToken(refresh_token);
        setPermissions(permissions);

        // Redirect to dashboard
        window.location.href = "/staff/dashboard";
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-50 to-stone-100 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <img
            alt="Enzi Coffee"
            src={logo}
            className="h-16 w-auto mb-6 select-none"
            draggable={false}
          />
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Staff Login
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            Access the internal management system
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="grid gap-2">
            <label htmlFor="identifier" className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Email or Phone Number
            </label>
            <div className="relative">
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                placeholder="e.g. barista@enzi.coffee or +255 712 345 678"
                aria-label="Identifier"
                className="block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 dark:bg-slate-800 dark:border-slate-700 dark:text-stone-100 dark:placeholder:text-slate-400"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <span className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" />
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                aria-label="Password"
                className="block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 dark:bg-slate-800 dark:border-slate-700 dark:text-stone-100 dark:placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-white text-base font-semibold shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                className="mr-2 h-5 w-5 opacity-90 group-hover:translate-x-0.5 transition"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
            Internal access only. Contact administrator for credentials.
          </p>
        </form>
      </div>
    </div>
  );
}