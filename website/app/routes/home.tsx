import { HomeLayout } from "fumadocs-ui/layouts/home";
import { HeroSection } from "@/components/hero-section";
import { HomeAgentsStrip } from "@/components/home-agents-strip";
import { HomeComponentsStrip } from "@/components/home-components-strip";
import { HomeFooter } from "@/components/home-footer";
import { HomeInstall } from "@/components/home-install";
import { HomeValueStrip } from "@/components/home-value-strip";
import { baseOptions } from "@/lib/layout.shared";

export function meta() {
  return [
    { title: "Vexa" },
    {
      name: "description",
      content:
        "Generative UI for any React app: a chat overlay that answers with text plus real components, constrained to a catalog your app controls.",
    },
  ];
}

export default function HomeRoute() {
  return (
    <HomeLayout {...baseOptions()} className="min-w-0">
      <HeroSection />
      <HomeValueStrip />
      <HomeInstall />
      <HomeComponentsStrip />
      <HomeAgentsStrip />
      <HomeFooter />
    </HomeLayout>
  );
}
