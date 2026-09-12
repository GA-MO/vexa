import type { Spec } from "@json-render/core";
import { interactiveSpec } from "./tree";

export type InteractiveSection = {
  id: string;
  title: string;
  note: string;
  spec: Spec;
};

export const INTERACTIVE_SECTIONS: InteractiveSection[] = [
  {
    id: "host-tools",
    title: "Host tools · runTool",
    note: "Buttons dispatch runTool to tools the host registered in VexaProvider. set_theme asks for confirmation first; results land under /tools and /host holds the page context.",
    spec: interactiveSpec(
      {
        type: "Card",
        props: {
          title: "Control this page from a spec",
          description: "Every button below runs code registered by the demo host, not by the model.",
        },
        children: [
          {
            type: "KeyValue",
            props: {
              pairs: [
                { label: "Current path", value: { $template: "${/host/path}" } },
                { label: "Theme", value: { $template: "${/host/theme}" } },
              ],
              size: "sm",
            },
          },
          {
            type: "Row",
            props: { gap: "sm", align: "center", justify: "start", wrap: true },
            children: [
              {
                type: "Button",
                props: { label: "Jump to BarChart", variant: "secondary" },
                on: {
                  press: [
                    {
                      action: "runTool",
                      params: { name: "open_catalog_item", input: { tab: "primitives", item: "bar-chart" } },
                    },
                  ],
                },
              },
              {
                type: "Button",
                props: { label: "Dark theme (asks first)", variant: "secondary" },
                on: {
                  press: [
                    { action: "runTool", params: { name: "set_theme", input: { theme: "dark" } } },
                  ],
                },
              },
              {
                type: "Button",
                props: { label: "Light theme (asks first)", variant: "secondary" },
                on: {
                  press: [
                    { action: "runTool", params: { name: "set_theme", input: { theme: "light" } } },
                  ],
                },
              },
              {
                type: "Button",
                props: { label: "Unknown tool → chat", variant: "primary" },
                on: {
                  press: [
                    { action: "runTool", params: { name: "orders__list_orders", input: { status: "overdue" } } },
                  ],
                },
              },
            ],
          },
          {
            type: "Alert",
            props: {
              title: "Last result",
              body: { $state: "/toast" },
              tone: "info",
            },
            visible: { $state: "/toast" },
          },
          {
            type: "Text",
            props: {
              content: { $template: "/tools/set_theme = ${/tools/set_theme/theme}" },
              muted: true,
            },
            visible: { $state: "/tools/set_theme" },
          },
        ],
      },
      { toast: "" },
    ),
  },
  {
    id: "bind-form",
    title: "Data binding · form",
    note: "$bindState on Input + Button on.press → validateForm + submitForm + toast.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        children: [
          {
            type: "Heading",
            props: { text: "Request access", level: "3" },
          },
          {
            type: "Input",
            props: {
              label: "Email",
              name: "email",
              placeholder: "alex@acme.com",
              inputType: "email",
              value: { $bindState: "/form/email" },
              checks: [
                { type: "required", message: "Email is required", args: null },
                { type: "email", message: "Enter a valid email", args: null },
              ],
              validateOn: "blur",
            },
          },
          {
            type: "Input",
            props: {
              label: "Name",
              name: "name",
              placeholder: "Alex Kim",
              inputType: "text",
              value: { $bindState: "/form/name" },
              checks: [
                { type: "required", message: "Name is required", args: null },
              ],
              validateOn: "blur",
            },
          },
          {
            type: "Text",
            props: {
              content: {
                $template: "Preview: ${/form/name} · ${/form/email}",
              },
              muted: true,
            },
          },
          {
            type: "Button",
            props: { label: "Submit", variant: "primary" },
            on: {
              press: [
                {
                  action: "validateForm",
                  params: { statePath: "/formResult" },
                },
                { action: "submitForm", params: { statePath: "/lastSubmit" } },
                {
                  action: "toast",
                  params: { message: "Submitted — check /lastSubmit in devtools" },
                },
              ],
            },
          },
          {
            type: "Callout",
            props: {
              eyebrow: "Toast",
              title: { $state: "/toast" },
              body: "Action handlers write confirmation text here.",
              tone: "brand",
            },
            visible: { $state: "/toast" },
          },
        ],
      },
      {
        form: { email: "", name: "" },
        toast: "",
        formResult: null,
        lastSubmit: null,
      },
    ),
  },
  {
    id: "bind-choices",
    title: "Bound choices · order builder",
    note: "Select / RadioGroup / Checkbox / Switch bound with $bindState — badges and the address field react via visible, the summary via $template, and the button fires toast.",
    spec: interactiveSpec(
      {
        type: "Card",
        props: {
          title: "Build your latte",
          description: "Every control writes to /order. Nothing below is hard-coded.",
        },
        children: [
          {
            type: "Grid",
            props: { columns: "2", gap: "md" },
            children: [
              {
                type: "Select",
                props: {
                  label: "Size",
                  name: "size",
                  placeholder: "Pick a size",
                  options: [
                    { value: "S", label: "Small · 8 oz" },
                    { value: "M", label: "Medium · 12 oz" },
                    { value: "L", label: "Large · 16 oz" },
                  ],
                  value: { $bindState: "/order/size" },
                  disabled: false,
                },
              },
              {
                type: "RadioGroup",
                props: {
                  label: "Milk",
                  name: "milk",
                  options: [
                    { value: "Whole", label: "Whole" },
                    { value: "Oat", label: "Oat (+฿20)" },
                    { value: "Almond", label: "Almond (+฿20)" },
                  ],
                  value: { $bindState: "/order/milk" },
                  disabled: false,
                },
              },
            ],
          },
          {
            type: "Column",
            props: { gap: "sm", align: "stretch" },
            children: [
              {
                type: "Checkbox",
                props: {
                  label: "Extra shot",
                  name: "extraShot",
                  hint: "+฿25",
                  checked: { $bindState: "/order/extraShot" },
                  disabled: false,
                },
              },
              {
                type: "Checkbox",
                props: {
                  label: "Whipped cream",
                  name: "whip",
                  hint: "+฿15",
                  checked: { $bindState: "/order/whip" },
                  disabled: false,
                },
              },
            ],
          },
          { type: "Divider", props: { label: "Fulfilment" } },
          {
            type: "Switch",
            props: {
              label: "Deliver to me",
              name: "delivery",
              hint: "Off = pick up at the counter",
              checked: { $bindState: "/order/delivery" },
              disabled: false,
            },
          },
          {
            type: "Input",
            props: {
              label: "Delivery address",
              name: "address",
              placeholder: "99 Sukhumvit Rd, Bangkok",
              inputType: "text",
              value: { $bindState: "/order/address" },
              checks: [
                { type: "required", message: "Address is required for delivery", args: null },
              ],
              validateOn: "blur",
            },
            visible: { $state: "/order/delivery" },
          },
          {
            type: "IconText",
            props: {
              icon: "pin",
              text: "Pick up at Vexa Café, 2nd floor",
              hint: "Ready in ~8 minutes",
            },
            visible: { $state: "/order/delivery", not: true },
          },
          { type: "Divider", props: { label: "Summary" } },
          {
            type: "Row",
            props: { gap: "xs", align: "center", justify: "start", wrap: true },
            children: [
              {
                type: "Badge",
                props: { label: { $template: "Size ${/order/size}" }, tone: "neutral" },
              },
              {
                type: "Badge",
                props: { label: { $template: "${/order/milk} milk" }, tone: "neutral" },
              },
              {
                type: "Badge",
                props: { label: "Extra shot", tone: "warning" },
                visible: { $state: "/order/extraShot" },
              },
              {
                type: "Badge",
                props: { label: "Whipped cream", tone: "warning" },
                visible: { $state: "/order/whip" },
              },
              {
                type: "Badge",
                props: { label: "Delivery", tone: "success" },
                visible: { $state: "/order/delivery" },
              },
              {
                type: "Badge",
                props: { label: "Pickup", tone: "success" },
                visible: { $state: "/order/delivery", not: true },
              },
            ],
          },
          {
            type: "Row",
            props: { gap: "sm", align: "center", justify: "end", wrap: true },
            children: [
              {
                type: "Button",
                props: { label: "Reset", variant: "secondary" },
                on: {
                  press: [
                    { action: "setState", params: { statePath: "/order/size", value: "M" } },
                    { action: "setState", params: { statePath: "/order/milk", value: "Whole" } },
                    { action: "setState", params: { statePath: "/order/extraShot", value: false } },
                    { action: "setState", params: { statePath: "/order/whip", value: false } },
                    { action: "setState", params: { statePath: "/order/delivery", value: false } },
                    { action: "setState", params: { statePath: "/toast", value: "" } },
                  ],
                },
              },
              {
                type: "Button",
                props: { label: "Place order", variant: "primary" },
                on: {
                  press: [
                    { action: "validateForm", params: { statePath: "/orderResult" } },
                    {
                      action: "toast",
                      params: {
                        message: "Order placed — inspect /order in devtools to see the bound state",
                      },
                    },
                  ],
                },
              },
            ],
          },
          {
            type: "Callout",
            props: {
              eyebrow: "Toast",
              title: { $state: "/toast" },
              body: { $template: "Size ${/order/size} · ${/order/milk} milk" },
              tone: "brand",
            },
            visible: { $state: "/toast" },
          },
        ],
      },
      {
        order: {
          size: "M",
          milk: "Whole",
          extraShot: false,
          whip: false,
          delivery: false,
          address: "",
        },
        toast: "",
        orderResult: null,
      },
    ),
  },
  {
    id: "visibility",
    title: "Visibility",
    note: "Toggle /showDetails with setState; Alert uses visible.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        children: [
          {
            type: "Stack",
            props: { direction: "horizontal", gap: "sm" },
            children: [
              {
                type: "Button",
                props: { label: "Show details", variant: "primary" },
                on: {
                  press: {
                    action: "setState",
                    params: { statePath: "/showDetails", value: true },
                  },
                },
              },
              {
                type: "Button",
                props: { label: "Hide", variant: "secondary" },
                on: {
                  press: {
                    action: "setState",
                    params: { statePath: "/showDetails", value: false },
                  },
                },
              },
            ],
          },
          {
            type: "Alert",
            props: {
              title: "Details visible",
              body: "This Alert only renders when /showDetails is true.",
              tone: "info",
            },
            visible: { $state: "/showDetails" },
          },
          {
            type: "Text",
            props: {
              content: "Details are hidden. Press Show details.",
              muted: true,
            },
            visible: { $state: "/showDetails", not: true },
          },
        ],
      },
      { showDetails: false },
    ),
  },
  {
    id: "repeat",
    title: "Repeat · $item",
    note: "Column repeats over /todos; each row reads $item fields and $cond picks the badge.",
    spec: {
      root: "list",
      state: {
        todos: [
          { id: "1", title: "Ship overlay", done: true },
          { id: "2", title: "Wire binding", done: false },
          { id: "3", title: "Add watchers", done: false },
        ],
      },
      elements: {
        list: {
          type: "Stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["heading", "items"],
        },
        heading: {
          type: "Heading",
          props: { text: "Sprint todos", level: "3" },
          children: [],
        },
        items: {
          type: "Column",
          props: { gap: "xs", align: "stretch" },
          repeat: { statePath: "/todos", key: "id" },
          children: ["item-row"],
        },
        "item-row": {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "between", wrap: false },
          children: ["item-label", "item-badge"],
        },
        "item-label": {
          type: "IconText",
          props: {
            icon: {
              $cond: { $item: "done" },
              $then: "check",
              $else: "clock",
            },
            text: { $item: "title" },
            hint: null,
          },
          children: [],
        },
        "item-badge": {
          type: "Badge",
          props: {
            label: {
              $cond: { $item: "done" },
              $then: "Done",
              $else: "Pending",
            },
            tone: {
              $cond: { $item: "done" },
              $then: "success",
              $else: "neutral",
            },
          },
          children: [],
        },
      },
    },
  },
  {
    id: "watcher",
    title: "Watchers",
    note: "Changing country watches /form/country → runTool load_cities (a host tool) whose result lands in /tools/load_cities.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        watch: {
          "/form/country": {
            action: "runTool",
            params: { name: "load_cities", input: { country: { $state: "/form/country" } } },
          },
        },
        children: [
          {
            type: "Input",
            props: {
              label: "Country code",
              name: "country",
              placeholder: "TH, US, or JP",
              inputType: "text",
              value: { $bindState: "/form/country" },
              checks: null,
              validateOn: "change",
            },
          },
          {
            type: "Text",
            props: {
              content: {
                $template: "Cities: ${/tools/load_cities/cities}",
              },
              muted: false,
            },
          },
          {
            type: "Callout",
            props: {
              eyebrow: "Hint",
              title: "Try TH / US / JP",
              body: "Watcher fires when the bound country path changes.",
              tone: "info",
            },
          },
        ],
      },
      {
        form: { country: "TH", city: "" },
      },
    ),
  },
  {
    id: "computed",
    title: "Computed · directives",
    note: "$computed fullName / formatCurrency and $format / $template.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        children: [
          {
            type: "Input",
            props: {
              label: "First name",
              name: "first",
              placeholder: "Alex",
              inputType: "text",
              value: { $bindState: "/user/first" },
              checks: null,
              validateOn: null,
            },
          },
          {
            type: "Input",
            props: {
              label: "Last name",
              name: "last",
              placeholder: "Kim",
              inputType: "text",
              value: { $bindState: "/user/last" },
              checks: null,
              validateOn: null,
            },
          },
          {
            type: "Metric",
            props: {
              label: {
                $computed: "fullName",
                args: {
                  first: { $state: "/user/first" },
                  last: { $state: "/user/last" },
                },
              },
              value: {
                $computed: "formatCurrency",
                args: {
                  value: { $state: "/invoice/total" },
                  currency: "THB",
                },
              },
              detail: {
                $template: "Invoice for ${/user/first}",
              },
              trend: "up",
            },
          },
          {
            type: "Text",
            props: {
              content: {
                $format: "currency",
                value: { $state: "/invoice/total" },
                currency: "THB",
              },
              muted: true,
            },
          },
        ],
      },
      {
        user: { first: "Alex", last: "Kim" },
        invoice: { total: 2490 },
      },
    ),
  },
];

