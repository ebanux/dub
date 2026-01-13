import { awsSetup } from "./aws-exports.ts";
import { fetchAuthSession } from "aws-amplify/auth";
import { qrAppBaseUrl } from "./constants.ts";

export async function fetchAuthSessionToken(forceRefresh?: boolean) {
  awsSetup();

  const session = await fetchAuthSession({ forceRefresh });
  return session.tokens?.idToken?.toString() || "";
}

export function redirectToSignIn(redirectUri: string) {
  window.location.href = `${qrAppBaseUrl}/sign-in?cbr=${encodeURIComponent(redirectUri)}`;
}
