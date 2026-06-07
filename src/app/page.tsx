import type { Metadata } from "next";

import { LoginExperience } from "@/components/auth/LoginExperience";

export const metadata: Metadata = {
  title: "Log in | GFI Compliance Control Center",
  description: "Access the GFI compliance, traceability, and due diligence control center.",
};

export default function LoginPage() {
  return <LoginExperience />;
}
