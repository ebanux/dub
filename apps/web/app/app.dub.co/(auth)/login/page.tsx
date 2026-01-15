// QRLynk-Integration: Replaced default NextAuth sign-in page with QRlynk authentication flow

"use client";

import { fetchAuthSessionToken, redirectToSignIn } from "@/lib/qrlynk";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

import { AuthAlternativeBanner } from "@/ui/auth/auth-alternative-banner";
import LoginForm from "@/ui/auth/login/login-form";
import { AuthLayout } from "@/ui/layout/auth-layout";
import Link from "next/link";

const isEmbed = () =>
  typeof window === "undefined" || window.self !== window.top;

export default function LoginPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (isEmbed() && status !== "loading" && !session) {
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

  if (isEmbed()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {"Loading..."}
      </div>
    );
  }

  return (
    <AuthLayout showTerms="app">
      <div className="w-full max-w-sm">
        <h3 className="text-center text-xl font-semibold">
          Log in to your Dub account
        </h3>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm font-medium text-neutral-500">
          Don't have an account?&nbsp;
          <Link
            href="register"
            className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
          >
            Sign up
          </Link>
        </p>

        <div className="mt-12 w-full">
          <AuthAlternativeBanner
            text="Looking for your Dub partner account?"
            cta="Log in at partners.dub.co"
            href="https://partners.dub.co/login"
          />
        </div>
      </div>
    </AuthLayout>
  );
}
