import type { Metadata } from "next"
import { Suspense } from "react"
import "@/styles/globals.css"
import { AuthProvider } from "@/components/ui/PermissionGuard"
import { PlatformFooter } from "@/components/ui/PlatformFooter"

export const metadata: Metadata = {
  title: "GFI Compliance Portal",
  description: "GFI compliance, traceability, and due diligence control center.",
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
          <Suspense fallback={null}>
            <PlatformFooter />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}
