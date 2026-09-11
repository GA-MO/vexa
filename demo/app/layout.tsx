import type { Metadata } from "next";
import { TooltipProvider } from "agentic-ui/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic UI Demo",
  description: "Host preview for the Agentic UI overlay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body className="min-h-dvh antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
