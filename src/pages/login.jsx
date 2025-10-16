import React, { useState } from "react";
import logo from "../assets/hze-logo.png";
import { useUpdateUser } from "../providers/UserProvider";
import axiosInstance from "../api/axios";

// 1-1-2025
// UI/UX polish only — logic and functions kept the same

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const setUser = useUpdateUser();

  const handleChange = (event) => {
    setPhoneNumber(event.target.value);
    console.log(phoneNumber);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    axiosInstance
      .get(`/api/customers/search?phone_number=` + phoneNumber)
      .then((res) => {
        console.log("Response Code:   " + res.status);
        if (res.status === 200) {
          // user found
          const usr = res.data.customer;
          setUser(usr);
        }
      })
      .catch(function (error) {
        console.log("User not found");
      });
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
            Sign in with your phone number
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            Earn rewards and track your order pickup.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label htmlFor="phone_number" className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Phone number
            </label>
            <div className="relative">
              <input
                id="phone_number"
                name="Phone Number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="e.g. +255 712 345 678"
                aria-label="Phone Number"
                className="block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 dark:bg-slate-800 dark:border-slate-700 dark:text-stone-100 dark:placeholder:text-slate-400"
                value={phoneNumber}
                onChange={handleChange}
              />
              {/* subtle inset glow */}
              <span className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" />
            </div>
          </div>

          <button
            type="submit"
            className="group relative inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-white text-base font-semibold shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600"
          >
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
            Sign in
          </button>

          <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
            By continuing, you agree to our <a href="#" className="underline hover:no-underline">Terms</a> and <a href="#" className="underline hover:no-underline">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
