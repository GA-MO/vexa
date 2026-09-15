import type { Metadata } from "next";
import { TooltipProvider } from "vexa/ui/tooltip";
import { DemoHost } from "@/components/demo-host";
import { StaticChat } from "@/components/static-chat";
import { TopNav } from "@/components/top-nav";
import { STATIC_BUILD } from "@/lib/static-build";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vexa Shop admin",
  description: "Test bench host app for the Vexa chat overlay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="vexa-scrollbar font-sans">
      <body className="min-h-dvh antialiased">
        {STATIC_BUILD ? <StaticChat /> : null}
        <TooltipProvider>
          <DemoHost>
            <TopNav />
            {children}
          </DemoHost>
        </TooltipProvider>
      </body>
    </html>
  );
}
