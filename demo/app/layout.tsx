import type { Metadata } from "next";
import { TooltipProvider } from "vexa/ui/tooltip";
import { DemoHost } from "@/components/demo-host";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vexa Demo",
  description: "Host preview for the Vexa overlay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="vexa-scrollbar font-sans">
      <body className="min-h-dvh antialiased">
        <TooltipProvider>
          <DemoHost>{children}</DemoHost>
        </TooltipProvider>
      </body>
    </html>
  );
}
