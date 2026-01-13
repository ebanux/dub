"use client";

import { signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LogOutPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const returnToUrl = searchParams?.get("return") || "/";

  useEffect(() => {
    if (status !== "loading") {
      signOut({ redirect: false }).then(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = returnToUrl;
      }).catch((err) => {
        console.log("Error during sign out:", err);
      });
    }
  }, [status, session]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === "loading" ? "Loading..." : "Closing Session..."}
    </div>
  );
}
