import { redirect } from "next/navigation";

export default async function TestsRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/guides/${id}`);
}
