import { useDocsSearch } from "fumadocs-core/search/client";
import { staticClient } from "fumadocs-core/search/client/orama-static";
import type { SortedResult } from "fumadocs-core/search";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  TagsList,
  TagsListItem,
  type SearchItemType,
} from "fumadocs-ui/components/dialog/search";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SEARCH_SECTIONS, searchSectionTitleFor, searchTagFor } from "@/lib/docs-sections";
import { DOCS_BASE_URL } from "@/lib/source";

const RECENT_STORAGE_KEY = "vexa-docs-search-recent";
const MAX_RECENT = 5;
const RECENT_GROUP_LABEL = "Recent";
const QUICK_LINKS_GROUP_LABEL = "Quick links";
const MARK_TAG = /<\/?mark>/g;

const KIND_WEIGHT: Record<string, number> = { page: 2.5, heading: 1.5, text: 1 };
const KIND_LABEL: Record<SortedResult["type"], string> = { page: "page", heading: "heading", text: "text" };

const KIND_BADGE_CLASS =
  "pe-16 after:pointer-events-none after:absolute after:end-2.5 after:top-2.5 after:rounded-md after:border after:border-fd-border after:bg-fd-secondary/60 after:px-1.5 after:text-[10px] after:font-medium after:uppercase after:tracking-wide after:text-fd-muted-foreground after:content-[attr(data-search-kind)]";

type ResultKind = SortedResult["type"];

interface RecentEntry {
  url: string;
  title: string;
  kind: ResultKind;
  breadcrumbs: string[];
}

interface ResultGroup {
  label: string;
  items: SearchItemType[];
}

type RankedHit = [id: number, score: number, document: Record<string, unknown>];

function weightedScore([, score, document]: RankedHit) {
  return score * (KIND_WEIGHT[String(document.type)] ?? 1);
}

function rankByKind(a: RankedHit, b: RankedHit) {
  return weightedScore(b) - weightedScore(a);
}

function plainText(content: ReactNode) {
  return typeof content === "string" ? content.replace(MARK_TAG, "") : "";
}

function isResultKind(value: unknown): value is ResultKind {
  return value === "page" || value === "heading" || value === "text";
}

function isRecentEntry(value: unknown): value is RecentEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.url === "string" &&
    typeof entry.title === "string" &&
    isResultKind(entry.kind) &&
    Array.isArray(entry.breadcrumbs) &&
    entry.breadcrumbs.every((crumb) => typeof crumb === "string")
  );
}

function readRecent(): RecentEntry[] {
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecentEntry) : [];
  } catch {
    return [];
  }
}

function writeRecent(entries: RecentEntry[]) {
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    return;
  }
}

function toRecentEntry(item: SearchItemType): RecentEntry | undefined {
  if (item.type === "action" || item.external) return undefined;
  const title = plainText(item.content);
  if (!title) return undefined;
  const breadcrumbs = (item.breadcrumbs ?? []).filter((crumb): crumb is string => typeof crumb === "string");
  return { url: item.url, title, kind: item.type, breadcrumbs };
}

function rememberRecent(item: SearchItemType) {
  const entry = toRecentEntry(item);
  if (!entry) return;
  const others = readRecent().filter((existing) => existing.url !== entry.url);
  writeRecent([entry, ...others].slice(0, MAX_RECENT));
}

function recentToItem(entry: RecentEntry): SearchItemType {
  return {
    id: `recent:${entry.url}`,
    type: entry.kind,
    url: entry.url,
    content: entry.title,
    breadcrumbs: entry.breadcrumbs,
  };
}

function linkToItem([name, href]: [name: string, href: string]): SearchItemType {
  return { id: `link:${href}`, type: "page", url: href, content: name };
}

function sectionTagFromUrl(url: string) {
  const path = url.split("#")[0] ?? "";
  const slugs = path.replace(`${DOCS_BASE_URL}/`, "").split("/").filter(Boolean);
  return searchTagFor(slugs);
}

function groupBySection(results: SortedResult[]): ResultGroup[] {
  const buckets = new Map<string, SearchItemType[]>();
  for (const result of results) {
    const label = searchSectionTitleFor(sectionTagFromUrl(result.url));
    const bucket = buckets.get(label) ?? [];
    bucket.push(result);
    buckets.set(label, bucket);
  }
  return [...buckets].map(([label, items]) => ({ label, items }));
}

function emptyQueryGroups(recent: RecentEntry[], links: [name: string, href: string][]): ResultGroup[] {
  const groups: ResultGroup[] = [];
  if (recent.length > 0) groups.push({ label: RECENT_GROUP_LABEL, items: recent.map(recentToItem) });
  if (links.length > 0) groups.push({ label: QUICK_LINKS_GROUP_LABEL, items: links.map(linkToItem) });
  return groups;
}

function flattenGroups(groups: ResultGroup[]) {
  const items: SearchItemType[] = [];
  const labels = new Map<string, string>();
  for (const group of groups) {
    const [first] = group.items;
    if (first) labels.set(first.id, group.label);
    items.push(...group.items);
  }
  return { items: groups.length > 0 ? items : null, labels };
}

function kindLabel(item: SearchItemType) {
  return item.type === "action" ? "" : KIND_LABEL[item.type];
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-3 text-xs font-medium text-fd-muted-foreground first:pt-1">{children}</div>
  );
}

function KeyHint({ keys, action }: { keys: string; action: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded-md border border-fd-border bg-fd-background px-1 font-mono text-[10px]">{keys}</kbd>
      {action}
    </span>
  );
}

function KeyboardHints() {
  return (
    <div className="ms-auto hidden items-center gap-3 text-xs text-fd-muted-foreground sm:flex">
      <KeyHint keys="↑↓" action="navigate" />
      <KeyHint keys="↵" action="open" />
      <KeyHint keys="esc" action="close" />
    </div>
  );
}

export interface VexaSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links?: [name: string, href: string][];
}

export default function VexaSearchDialog({ open, onOpenChange, links = [] }: VexaSearchDialogProps) {
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const client = useMemo(() => staticClient({ tag, search: { sortBy: rankByKind } }), [tag]);
  const { search, setSearch, query } = useDocsSearch({ client });

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  const { items, labels } = useMemo(() => {
    const groups =
      query.data === "empty" || query.data === undefined
        ? emptyQueryGroups(recent, links)
        : groupBySection(query.data);
    return flattenGroups(groups);
  }, [query.data, recent, links]);

  return (
    <SearchDialog
      open={open}
      onOpenChange={onOpenChange}
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      onSelect={rememberRecent}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput placeholder="Search docs, components, headings" />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={items}
          Item={({ item, onClick }) => (
            <>
              {labels.has(item.id) ? <GroupLabel>{labels.get(item.id)}</GroupLabel> : null}
              <SearchDialogListItem
                item={item}
                onClick={onClick}
                className={KIND_BADGE_CLASS}
                data-search-kind={kindLabel(item)}
              />
            </>
          )}
        />
        <SearchDialogFooter className="flex flex-wrap items-center gap-2">
          <TagsList tag={tag} onTagChange={setTag} allowClear>
            {SEARCH_SECTIONS.map((section) => (
              <TagsListItem key={section.tag} value={section.tag}>
                {section.title}
              </TagsListItem>
            ))}
          </TagsList>
          <KeyboardHints />
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
