import type { Metadata } from "next"
import "@/styles/globals.css"
import { AuthProvider } from "@/components/ui/PermissionGuard"

export const metadata: Metadata = {
  title: "FOS EUDR Platform",
  description: "Multi-tenant EUDR compliance platform for traceability and due diligence.",
  icons: {
    icon: "/jojo_logo.png",
    shortcut: "/jojo_logo.png",
    apple: "/jojo_logo.png",
  },
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
