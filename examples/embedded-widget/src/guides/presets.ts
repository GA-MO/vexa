import type { ChatLabels, ChatToolState } from "vexa/chat";
import type { VexaTheme } from "vexa/react";

export type ThemePreset = { id: string; name: string; theme: VexaTheme };

export const THEME_PRESETS: ThemePreset[] = [
  { id: "indigo", name: "Indigo (library default)", theme: { mode: "light" } },
  { id: "emerald", name: "Emerald, rounder", theme: { primary: "#059669", primaryDark: "#34d399", secondary: "#0d9488", radius: "1rem", mode: "light" } },
  { id: "rose-dark", name: "Rose on dark", theme: { primary: "#e11d48", primaryDark: "#fb7185", secondary: "#db2777", radius: "0.5rem", mode: "dark" } },
];

export type Language = "en" | "de";

const TOOL_STATES_DE: Record<ChatToolState, string> = {
  "input-streaming": "Wartet",
  "input-available": "Läuft",
  "approval-requested": "Wartet auf Freigabe",
  "approval-responded": "Beantwortet",
  "output-available": "Fertig",
  "output-denied": "Abgelehnt",
  "output-error": "Fehler",
};

export type LanguagePreset = {
  id: Language;
  name: string;
  locale: string;
  currency: string;
  title: string;
  subtitle: string;
  labels: Partial<ChatLabels>;
};

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  { id: "en", name: "English (library default)", locale: "en-US", currency: "USD", title: "Acme Notes help", subtitle: "Ask about your notes and plan", labels: {} },
  {
    id: "de",
    name: "Deutsch",
    locale: "de-DE",
    currency: "EUR",
    title: "Acme Notes Assistent",
    subtitle: "Fragen zu deinen Notizen und deinem Tarif",
    labels: {
      emptyTitle: "Frag etwas und bekomm die Antwort als UI",
      emptyDescription: "Antworten als Text oder als Karten, Kennzahlen und Tabellen direkt hier",
      thinking: "Denkt nach...",
      reasoning: "Begründung",
      thoughtFor: (seconds) => `${seconds} Sekunden nachgedacht`,
      steps: (count) => `${count} Schritte`,
      approveTool: (tool) => `${tool} ausführen erlauben?`,
      approved: "Erlaubt",
      rejected: "Abgelehnt",
      approve: "Erlauben",
      reject: "Ablehnen",
      runOnPage: (tool) => `${tool} auf dieser Seite ausführen?`,
      run: "Ausführen",
      cancel: "Abbrechen",
      restore: "Zurücksetzen",
      restoreTooltip: "Unterhaltung auf diesen Punkt zurücksetzen",
      startOver: "Neu beginnen",
      closeChat: "Chat schließen",
      openAssistant: "Assistent öffnen",
      closeAssistant: "Assistent schließen",
      queued: "Wartet",
      removeQueued: "Wartende Nachricht entfernen",
      sentWithAttachments: "Mit Anhängen gesendet",
      attachment: "Anhang",
      securityTitle: "Verdächtiger Text in Tool-Daten gefunden",
      securityBody: (tool) => `Die Daten von ${tool} enthalten Anweisungen, die den Assistenten steuern wollen. Sie wurden ignoriert und schreibende Tools sind für diese Antwort deaktiviert.`,
      buttonPressed: (tool) => `${tool} gedrückt`,
      placeholder: "Stell eine Frage oder lass dir eine UI bauen...",
      send: "Senden",
      stop: "Stopp",
      attach: "Anhängen",
      addAttachment: "Bild oder Datei hinzufügen",
      takeScreenshot: "Bildschirmfoto aufnehmen",
      removeAttachment: "Anhang entfernen",
      selectModel: "Modell wählen",
      searchModels: "Modelle suchen...",
      noModels: "Keine Modelle gefunden",
      tokenUsage: "Token-Verbrauch",
      usageInput: "Eingabe",
      usageOutput: "Ausgabe",
      usageReasoning: "Begründung",
      usageCache: "Cache",
      usageTotalCost: "Gesamtkosten",
      toolInput: "Parameter",
      toolOutput: "Ergebnis",
      toolState: (state) => TOOL_STATES_DE[state],
      usedSources: (count) => `${count} Quellen verwendet`,
    },
  },
];

export type ModelPickerChoice = "auto" | "show" | "hide";

export const MODEL_PICKER_CHOICES: Record<ModelPickerChoice, { name: string; value: boolean | undefined }> = {
  auto: { name: "auto (hidden with one model)", value: undefined },
  show: { name: "always", value: true },
  hide: { name: "never", value: false },
};


export type Position = "bottom-right" | "bottom-left";

export const POSITIONS: Position[] = ["bottom-right", "bottom-left"];

export const DEFAULT_LAUNCHER_LABEL = "Ask Acme";
