import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Chess Coach",
  description: "Personalized chess improvement from your Chess.com games."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          <header className="border-b border-slate-800">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <a className="text-lg font-semibold" href="/">
                ♟️ Chess Coach
              </a>
              <nav className="flex gap-4 text-sm text-slate-300">
                <a href="/dashboard" className="hover:text-white">
                  Dashboard
                </a>
                <a href="/games" className="hover:text-white">
                  Games
                </a>
                <a href="/training/tactics" className="hover:text-white">
                  Training
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
