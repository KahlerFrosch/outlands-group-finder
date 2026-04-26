import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { AuthProvider } from "./providers";
import { SiteFooter } from "../components/SiteFooter";
import { UserStatus } from "../components/UserStatus";

export const metadata: Metadata = {
  title: "Outlands Group Finder",
  description:
    "Find and create activity groups for Ultima Online Outlands, using Discord login."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const discordServerUrl = process.env.NEXT_PUBLIC_DISCORD_SERVER_URL?.trim();

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
            <SiteFooter discordServerUrl={discordServerUrl ?? null} />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

