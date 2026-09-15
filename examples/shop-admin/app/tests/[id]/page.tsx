import { GuideRedirect } from "@/components/guides/guide-redirect";
import { SCENARIOS } from "@/lib/scenarios";

export function generateStaticParams() {
  return SCENARIOS.map((scenario) => ({ id: scenario.id }));
}

export default async function TestsRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuideRedirect id={id} />;
}
