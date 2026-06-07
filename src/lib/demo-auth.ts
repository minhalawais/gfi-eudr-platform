export const DEMO_CREDENTIALS = {
  email: "admin_gfi@gmail.com",
  password: "admin123",
} as const;

export type DemoAuthenticationResult =
  | { authenticated: true }
  | { authenticated: false; message: string };

const DEMO_AUTH_DELAY_MS = 650;

export async function authenticateDemoCredentials(
  email: string,
  password: string,
  accountEmail: string = DEMO_CREDENTIALS.email,
): Promise<DemoAuthenticationResult> {
  await new Promise((resolve) => window.setTimeout(resolve, DEMO_AUTH_DELAY_MS));

  const authenticated =
    email.trim().toLowerCase() === accountEmail.trim().toLowerCase()
    && password === DEMO_CREDENTIALS.password;

  if (authenticated) {
    return { authenticated: true };
  }

  return {
    authenticated: false,
    message: "Email or password is incorrect. Use the demo credentials provided below.",
  };
}
