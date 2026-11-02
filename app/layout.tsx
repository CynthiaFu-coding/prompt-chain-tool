import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import SignOutButton from "@/components/sign-out-button";
import ThemeToggle from "@/components/theme-toggle";
import { createClient } from "@/utils/supabase/server";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prompt Chain Tool",
  description: "Create, edit and run prompt chains",
};

// Runs before the page paints so there is no flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default async function RootLayout({
                                           children,
                                         }: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
      <html lang="en" suppressHydrationWarning className={geist.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Link
            href="/"
            className="text-lg font-black text-yellow-600 dark:text-yellow-300"
        >
          Prompt Chain Tool
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && <SignOutButton />}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
      </html>
  );
}