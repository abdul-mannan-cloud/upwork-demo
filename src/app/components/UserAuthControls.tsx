"use client";

import React from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function UserAuthControls() {
  return (
    <div className="ml-4 flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button
            className="px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-sm"
          >
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
