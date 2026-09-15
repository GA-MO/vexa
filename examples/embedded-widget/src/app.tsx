import { useCallback, useEffect, useMemo, useState } from "react";
import { VexaChat, VexaChatOverlay } from "vexa/chat";
import { VexaProvider } from "vexa/react";
import { MOCK_MODEL_ID } from "vexa/mock";
import { GuideCard } from "./guide-card";
import { composerSnippet, GUIDES, labelsSnippet, PLACEMENTS, placementSnippet, positionSnippet, themeSnippet, type Placement } from "./guides/guides";
import {
  DEFAULT_LAUNCHER_LABEL,
  LANGUAGE_PRESETS,
  MODEL_PICKER_CHOICES,
  POSITIONS,
  THEME_PRESETS,
  type Language,
  type ModelPickerChoice,
  type Position,
} from "./guides/presets";
import { PromptSender } from "./prompt-sender";

const SELECT_CLASS = "rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground";
const FULL_PAGE_HASH = "#fullpage";

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function FullPage() {
  return (
    <div className="relative">
      <a href="#placement" className="absolute right-4 top-3 z-20 text-sm text-primary underline-offset-2 hover:underline">
        Back to the guides
      </a>
      <VexaChat layout="page" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function presetById<T extends { id: string }>(presets: T[], id: string): T {
  return presets.find((preset) => preset.id === id) ?? presets[0];
}

export function App() {
  const [themeId, setThemeId] = useState(THEME_PRESETS[0].id);
  const [language, setLanguage] = useState<Language>("en");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [launcherLabel, setLauncherLabel] = useState(DEFAULT_LAUNCHER_LABEL);
  const [glow, setGlow] = useState(true);
  const [placement, setPlacement] = useState<Placement>("overlay");
  const [attachments, setAttachments] = useState(true);
  const [tokenUsage, setTokenUsage] = useState(true);
  const [modelPicker, setModelPicker] = useState<ModelPickerChoice>("auto");
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const themePreset = presetById(THEME_PRESETS, themeId);
  const theme = useMemo(() => (glow ? themePreset.theme : { ...themePreset.theme, glow: false }), [themePreset, glow]);
  const languagePreset = presetById(LANGUAGE_PRESETS, language);
  const [themeGuide, labelsGuide, composerGuide, positionGuide, placementGuide] = GUIDES;
  const composer = useMemo(
    () => ({ attachments, tokenUsage, modelPicker: MODEL_PICKER_CHOICES[modelPicker].value }),
    [attachments, tokenUsage, modelPicker],
  );

  const hash = useHash();
  const chat = useMemo(
    () => ({
      title: languagePreset.title,
      subtitle: languagePreset.subtitle,
      labels: languagePreset.labels,
      composer,
      position,
      launcherLabel,
      backdrop: false,
      defaultModel: MOCK_MODEL_ID,
    }),
    [languagePreset, composer, position, launcherLabel],
  );
  const format = useMemo(() => ({ locale: languagePreset.locale, currency: languagePreset.currency }), [languagePreset]);

  const tryPrompt = useCallback(
    (prompt: string) => {
      if (placement === "overlay") setChatOpen(true);
      setPendingPrompt(prompt);
    },
    [placement],
  );
  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), []);

  return (
    <VexaProvider chat={chat} theme={theme} format={format}>
      {hash === FULL_PAGE_HASH ? (
        <FullPage />
      ) : (
        <div className="min-h-dvh bg-background text-foreground">
          <header className="border-b border-border">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
              <span className="font-semibold tracking-tight">Acme Notes</span>
              <span className="text-xs text-muted-foreground">Vexa embedded widget example</span>
            </div>
          </header>
          <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">The smallest Vexa integration</h1>
              <p className="max-w-xl text-muted-foreground">
                One page, one <code className="rounded bg-muted px-1 text-[0.9em]">VexaProvider</code>, one overlay, no host tools. Every guide below
                changes a config value, shows the code that does it, and sends a prompt to the free mock model so you can see the result in the chat.
              </p>
            </div>
            <GuideCard
              guide={themeGuide}
              code={themeSnippet(theme)}
              onPrompt={tryPrompt}
              controls={
                <>
                  <Field label="Theme">
                    <select value={themeId} onChange={(event) => setThemeId(event.target.value)} className={SELECT_CLASS}>
                      {THEME_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Glow shadow">
                    <input type="checkbox" checked={glow} onChange={(event) => setGlow(event.target.checked)} className="size-4 accent-primary" />
                  </Field>
                </>
              }
            />
            <GuideCard
              guide={labelsGuide}
              code={labelsSnippet(languagePreset)}
              onPrompt={tryPrompt}
              controls={
                <Field label="Language">
                  <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} className={SELECT_CLASS}>
                    {LANGUAGE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </Field>
              }
            />
            <GuideCard
              guide={composerGuide}
              code={composerSnippet(composer)}
              onPrompt={tryPrompt}
              controls={
                <>
                  <Field label="Attachments">
                    <input type="checkbox" checked={attachments} onChange={(event) => setAttachments(event.target.checked)} className="size-4 accent-primary" />
                  </Field>
                  <Field label="Token usage">
                    <input type="checkbox" checked={tokenUsage} onChange={(event) => setTokenUsage(event.target.checked)} className="size-4 accent-primary" />
                  </Field>
                  <Field label="Model picker">
                    <select value={modelPicker} onChange={(event) => setModelPicker(event.target.value as ModelPickerChoice)} className={SELECT_CLASS}>
                      {Object.entries(MODEL_PICKER_CHOICES).map(([id, choice]) => (
                        <option key={id} value={id}>
                          {choice.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              }
            />
            <GuideCard
              guide={positionGuide}
              code={positionSnippet(position, launcherLabel)}
              onPrompt={tryPrompt}
              controls={
                <>
                  <Field label="Position">
                    <select value={position} onChange={(event) => setPosition(event.target.value as Position)} className={SELECT_CLASS}>
                      {POSITIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Launcher label">
                    <input value={launcherLabel} onChange={(event) => setLauncherLabel(event.target.value)} className={SELECT_CLASS} />
                  </Field>
                </>
              }
            />
            <GuideCard
              guide={placementGuide}
              code={placementSnippet(placement)}
              onPrompt={tryPrompt}
              controls={
                <Field label="Placement">
                  <select value={placement} onChange={(event) => setPlacement(event.target.value as Placement)} className={SELECT_CLASS}>
                    {PLACEMENTS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              }
            >
              {placement === "panel" ? (
                <div className="h-[32rem]">
                  <VexaChat />
                </div>
              ) : null}
              {placement === "inline" ? (
                <aside className="-mx-5 h-[32rem] border-y border-border">
                  <VexaChat layout="inline" />
                </aside>
              ) : null}
            </GuideCard>
          </main>
        </div>
      )}
      {placement === "overlay" && hash !== FULL_PAGE_HASH ? <VexaChatOverlay open={chatOpen} onOpenChange={setChatOpen} /> : null}
      <PromptSender pending={pendingPrompt} onSent={clearPendingPrompt} />
    </VexaProvider>
  );
}
