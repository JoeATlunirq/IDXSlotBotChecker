import { cookies } from "next/headers";

import { PasswordGate } from "@/components/password-gate";
import { RankerClient } from "@/components/ranker-client";
import { AUTH_COOKIE_NAME, getAuthConfigurationError, hasValidSessionCookieValue } from "@/lib/site-auth";

export default function HomePage() {
  const configurationError = getAuthConfigurationError();
  const sessionCookie = cookies().get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = !configurationError && hasValidSessionCookieValue(sessionCookie);

  if (!isAuthenticated) {
    return <PasswordGate configurationError={configurationError} />;
  }

  return <RankerClient />;
}
