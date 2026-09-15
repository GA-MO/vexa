import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";
import { forwardedActionText, isForwardedActionFor, parseForwardedAction } from "@/lib/scenarios/action-message";

const ROOM = "A";
const HEADCOUNT = 4;

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["room-input", "headcount-input", "book-btn"] },
    "room-input": {
      type: "Input",
      props: { label: "Room", name: "room", placeholder: "A or B", inputType: "text", value: { $bindState: "/ui/room" }, checks: null, validateOn: null },
    },
    "headcount-input": {
      type: "Input",
      props: { label: "Headcount", name: "headcount", placeholder: "4", inputType: "number", value: { $bindState: "/ui/headcount" }, checks: null, validateOn: null },
    },
    "book-btn": {
      type: "Button",
      props: { label: "Book", variant: "primary" },
      on: {
        press: [
          {
            action: "runTool",
            params: { name: "book_room", input: { room: { $state: "/ui/room" }, headcount: { $state: "/ui/headcount" } } },
          },
        ],
      },
    },
  },
};

const FORWARDED_TEXT = forwardedActionText("book_room", { room: ROOM, headcount: HEADCOUNT });

export const scenario: Scenario = {
  id: "input-to-model",
  title: "A typed booking form reaches the model and the server tool",
  controlPath: "type /ui/room + /ui/headcount → press Book → runTool unknown to client → sendToChat → model calls book_room with the typed values",
  page: "/guides/input-to-model",
  docs: "host/runtool",
  opener: "Show the booking form",
  fixture: { spec },
  script: [
    { type: { path: "/ui/room", value: ROOM } },
    { type: { path: "/ui/headcount", value: HEADCOUNT } },
    { press: "book-btn", deferSend: true },
    { expectSentToChat: new RegExp(`runTool book_room.*"room":"${ROOM}".*"headcount":${HEADCOUNT}`) },
    {
      user: FORWARDED_TEXT,
      expectTools: ["book_room"],
      expectToolInput: { book_room: { room: ROOM, headcount: HEADCOUNT } },
    },
  ],
  mock: [
    {
      match: isForwardedActionFor("book_room"),
      steps: (prompt) => {
        const input = parseForwardedAction(prompt)?.input ?? {};
        return [
          { reasoning: "The forwarded message carries the room and headcount the user typed, so I pass them to book_room as they are." },
          {
            tool: "book_room",
            input,
            then: [{ text: `Room ${String(input.room)} is booked for ${String(input.headcount)}.` }],
            onError: [{ text: "The booking did not go through." }],
          },
        ];
      },
    },
  ],
  bestPractice:
    "A spec button can name a server tool the client never implements: runTool falls through to sendToChat, and the forwarded ⟦action⟧ text carries the exact typed values through to the model, so book_room runs with the same room and headcount the user entered, not a re-asked or re-typed pair.",
};
