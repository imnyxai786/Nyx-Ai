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
    <ClerkProvider>
      <html lang="en" className="dark h-full">
        <body className="min-h-screen w-full bg-editor-surface text-editor-text overflow-x-hidden overflow-y-auto">
          <AuthProvider>{children}</AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}