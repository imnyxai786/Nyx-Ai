import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Nyx AI — Intelligent Code Assistant",
  description: "A pristine dark-themed AI code assistant with live preview",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "bg-vsc-sidebar border border-vsc-border shadow-none",
          headerTitle: "text-vsc-text-bright",
          headerSubtitle: "text-vsc-text-dim",
          socialButtonsBlockButton:
            "bg-vsc-input border-vsc-border text-vsc-text hover:bg-vsc-list-hover",
          formFieldLabel: "text-vsc-text-dim",
          formFieldInput:
            "bg-vsc-input border-vsc-border text-vsc-text focus:border-vsc-border-focus",
          formButtonPrimary:
            "bg-vsc-accent hover:bg-vsc-accent-hover text-white",
          footerActionLink: "text-vsc-accent hover:text-vsc-accent-hover",
          dividerLine: "bg-vsc-border",
          dividerText: "text-vsc-text-subtle",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="h-screen w-screen overflow-hidden">
          <AuthProvider>{children}</AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
