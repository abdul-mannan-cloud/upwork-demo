import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { TokenProvider } from "@/app/contexts/TokenContext";
import App from "./App";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignedIn>
        <TokenProvider>
          <TranscriptProvider>
            <EventProvider>
              <App />
            </EventProvider>
          </TranscriptProvider>
        </TokenProvider>
      </SignedIn>
      <SignedOut>
        <div className="h-screen w-full flex items-center justify-center">
          <SignInButton mode="modal">
            <button className="px-4 py-2 border rounded bg-white shadow">Sign in to start</button>
          </SignInButton>
        </div>
      </SignedOut>
    </Suspense>
  );
}
