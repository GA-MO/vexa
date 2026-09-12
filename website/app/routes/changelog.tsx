import { HomeLayout } from "fumadocs-ui/layouts/home";
import { ComingSoon } from "@/components/coming-soon";
import { baseOptions } from "@/lib/layout.shared";

export function meta() {
  return [{ title: "Changelog | Vexa" }];
}

export default function ChangelogRoute() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <ComingSoon
          title="Changelog"
          description="Release notes for every version of the library, the catalog, and the docs site."
        />
      </div>
    </HomeLayout>
  );
}
