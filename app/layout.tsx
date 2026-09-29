import type { Metadata } from "next";
import { fontVariables } from "@/design-system/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warmstart · Semantic cache for LLM APIs",
  description:
    "Three-layer LLM cache (exact + semantic + prefix) with a measured hit rate, cost savings, false-hit rate, and a precision curve — no API keys required in demo mode.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme="dark" enableSystem={false} attribute="class">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
