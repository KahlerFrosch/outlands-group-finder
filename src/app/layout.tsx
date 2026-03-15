import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { AuthProvider } from "./providers";
import { UserStatus } from "../components/UserStatus";

export const metadata: Metadata = {
  title: "Outlands Group Finder",
  description:
    "Find and create activity groups for Ultima Online Outlands, using Discord login."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <AuthProvider>
          <div className="mx-auto flex min-h-screen max-w-[1000px] flex-col px-4 py-6">
            <header className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <h1 className="text-xl font-semibold tracking-tight">
                <Link href="/" className="text-slate-50 hover:text-slate-200 hover:underline">
                  Outlands Group Finder
                </Link>
              </h1>
              <UserStatus />
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
              <a
                href="https://discord.com/users/229305790496768001"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 hover:underline"
              >
                Report Bug / Feedback
              </a>
              <Link href="/help" className="hover:text-slate-300 hover:underline">
                Instructions / Help
              </Link>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

