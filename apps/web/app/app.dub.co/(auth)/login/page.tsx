"use client";

import { fetchAuthSessionToken, redirectToSignIn } from "@/lib/qrlynk";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function LogInPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "loading" && !session) {
      fetchAuthSessionToken(true)
        .then((token) => {
          if (!token) redirectToSignIn(window.location.href);
          signIn("qrlynk-auth", {
            callbackUrl: window.location.href,
            token: token,
          });
        })
        .catch((err) => {
          console.log("Error fetching auth session token:", err);
        });
    }
  }, [status, session]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === "loading" ? "Loading..." : "Authenticating..."}
    </div>
  );
}
