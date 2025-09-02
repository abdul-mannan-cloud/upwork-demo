"use client";

import React from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function UserAuthControls() {
  return (
    <div className="ml-4 flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-3 py-1 border rounded bg-white hover:bg-gray-50">Sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
