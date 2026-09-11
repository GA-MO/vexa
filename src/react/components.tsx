import { Children, useCallback, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChartBar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Heart,
  House,
  Info,
  List as ListIcon,
  Mail,
  MapPin,
  Music,
  Package,
  Pencil,
  Phone,
  Plane,
  Play,
  Receipt,
  Search,
  Send,
  ShoppingCart,
  Star,
  Tag,
  Trash2,
  TriangleAlert,
  Truck,
  User,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import {
  useBoundProp,
  useFieldValidation,
  useStateBinding,
} from "@json-render/react";
import { cn } from "./cn";
type StackProps = {
  direction?: "vertical" | "horizontal" | null;
  gap?: "sm" | "md" | "lg" | null;
};

const gapClass = {
  sm: "gap-1.5",
  md: "gap-3",
  lg: "gap-4",
} as const;

export function Stack({
  props,
  children,
}: {
  props: StackProps;
  children?: ReactNode;
}) {
  const direction = props.direction ?? "vertical";
  const gap = props.gap ?? "md";

  return (
    <div
      className={cn(
        "flex w-full",
        direction === "horizontal" ? "flex-row flex-wrap items-stretch" : "flex-col",
        gapClass[gap],
      )}
    >
      {children}
    </div>
  );
}

type CardProps = {
  title?: string | null;
  description?: string | null;
};

export function Card({
  props,
  children,
}: {
  props: CardProps;
  children?: ReactNode;
}) {
  const hasChildren = Children.toArray(children).length > 0;
  return (
    <section className="w-full min-w-0 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_-12px_rgba(79,70,229,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(79,70,229,0.35)] @md/agentic:p-4">
      {(props.title || props.description) && (
        <header className={cn("space-y-0.5", hasChildren && "mb-3")}>
          {props.title ? (
            <h3 className="text-base font-semibold tracking-tight text-slate-900">
              {props.title}
            </h3>
          ) : null}
          {props.description ? (
            <p className="text-sm text-slate-500">{props.description}</p>
          ) : null}
        </header>
      )}
      {hasChildren ? (
        <div className="flex w-full min-w-0 flex-col gap-2.5 [&>*]:min-w-0">{children}</div>
      ) : null}
    </section>
  );
}

type GridProps = {
  columns?: "1" | "2" | "3" | "4" | null;
  gap?: "sm" | "md" | "lg" | null;
};

/** Columns follow SpecView `@container/agentic`, not the viewport — chat panels stay ~1 col. */
const columnClass = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 @md/agentic:grid-cols-2",
  "3": "grid-cols-1 @md/agentic:grid-cols-2 @2xl/agentic:grid-cols-3",
  "4": "grid-cols-1 @md/agentic:grid-cols-2 @xl/agentic:grid-cols-3 @3xl/agentic:grid-cols-4",
} as const;

export function Grid({
  props,
  children,
}: {
  props: GridProps;
  children?: ReactNode;
}) {
  const columns = props.columns ?? "2";
  const gap = props.gap ?? "md";

  return (
    <div
      className={cn(
        "grid w-full min-w-0 [&>*]:min-w-0",
        columnClass[columns],
        gapClass[gap],
      )}
    >
      {children}
    </div>
  );
}

type HeadingProps = {
  text: string;
  level?: "1" | "2" | "3" | null;
};

export function Heading({ props }: { props: HeadingProps }) {
  const level = props.level ?? "2";
  const className = cn(
    "font-semibold tracking-tight text-slate-900",
    level === "1" && "text-xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent",
    level === "2" && "text-lg",
    level === "3" && "text-base",
  );

  if (level === "1") return <h1 className={className}>{props.text}</h1>;
  if (level === "3") return <h3 className={className}>{props.text}</h3>;
  return <h2 className={className}>{props.text}</h2>;
}

type TextProps = {
  content: string;
  muted?: boolean | null;
};

export function Text({ props }: { props: TextProps }) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed whitespace-pre-wrap",
        props.muted ? "text-slate-500" : "text-slate-700",
      )}
    >
      {props.content}
    </p>
  );
}

type MetricProps = {
  label: string;
  value: string;
  detail?: string | null;
  trend?: "up" | "down" | "neutral" | null;
};

const trendClass = {
  up: "text-emerald-600",
  down: "text-rose-600",
  neutral: "text-slate-500",
} as const;

export function Metric({ props }: { props: MetricProps }) {
  return (
    <div className="min-w-0 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-2.5 @md/agentic:p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 break-words">
        {props.label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900 break-words @md/agentic:text-xl">
        {props.value}
      </p>
      {props.detail ? (
        <p
          className={cn(
            "mt-1 text-xs font-medium break-words",
            props.trend ? trendClass[props.trend] : "text-slate-500",
          )}
        >
          {props.detail}
        </p>
      ) : null}
    </div>
  );
}

type BadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | null;
};

const badgeTone = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
} as const;

export function Badge({ props }: { props: BadgeProps }) {
  const tone = props.tone ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
        badgeTone[tone],
      )}
    >
      {props.label}
    </span>
  );
}

type AlertProps = {
  title?: string | null;
  body: string;
  tone?: "info" | "success" | "warning" | "danger" | null;
};

const alertTone = {
  info: "border-indigo-200 bg-indigo-50 text-indigo-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
} as const;

export function Alert({ props }: { props: AlertProps }) {
  const tone = props.tone ?? "info";
  return (
    <div className={cn("rounded-lg border px-3 py-2.5 text-sm", alertTone[tone])}>
      {props.title ? <p className="font-semibold">{props.title}</p> : null}
      <p className={cn(props.title && "mt-1", "leading-relaxed")}>{props.body}</p>
    </div>
  );
}

export function Separator() {
  return <hr className="border-slate-200" />;
}

type TableProps = {
  columns?: Array<{ key: string; label: string }> | null;
  rows?: Array<Record<string, string | number>> | null;
};

export function Table({ props }: { props: TableProps }) {
  const columns = props.columns ?? [];
  const rows = props.rows ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-2.5 py-1.5 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-100 text-slate-700">
              {columns.map((column) => (
                <td key={column.key} className="px-2.5 py-1.5">
                  {row[column.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ListProps = {
  items?: string[] | null;
  ordered?: boolean | null;
};

export function List({ props }: { props: ListProps }) {
  const items = props.items ?? [];
  const Tag = props.ordered ? "ol" : "ul";
  return (
    <Tag
      className={cn(
        "space-y-1 text-sm text-slate-700",
        props.ordered ? "list-decimal pl-5" : "list-disc pl-5",
      )}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Tag>
  );
}

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary" | null;
};

export function Button({
  props,
  emit,
}: {
  props: ButtonProps;
  emit?: (event: string) => void;
}) {
  const variant = props.variant ?? "primary";
  return (
    <button
      type="button"
      onClick={() => emit?.("press")}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-lg px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        variant === "primary"
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)] hover:brightness-105"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {props.label}
    </button>
  );
}

type ChartPoint = { label: string; value: number };

type ChartProps = {
  title?: string | null;
  kind?: "bar" | "line" | "pie" | "spark" | null;
  points?: ChartPoint[] | null;
};

const PIE_COLORS = ["#4f46e5", "#7c3aed", "#818cf8", "#a78bfa", "#c4b5fd", "#e0e7ff"];

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  a0: number,
  a1: number,
) {
  const full = a1 - a0 >= Math.PI * 2 - 1e-6;
  const end = full ? a0 + Math.PI * 2 - 1e-4 : a1;
  const large = end - a0 > Math.PI ? 1 : 0;
  const p = (r: number, a: number) =>
    `${cx + r * Math.sin(a)},${cy - r * Math.cos(a)}`;
  const outer = `M${p(rOuter, a0)} A${rOuter},${rOuter} 0 ${large} 1 ${p(rOuter, end)}`;
  if (rInner <= 0) return `${outer} L${cx},${cy} Z`;
  return `${outer} L${p(rInner, end)} A${rInner},${rInner} 0 ${large} 0 ${p(rInner, a0)} Z`;
}

function PieChart({ title, points }: { title?: string | null; points: ChartPoint[] }) {
  const total = points.reduce((sum, point) => sum + Math.max(0, point.value), 0) || 1;
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rInner = rOuter * 0.6;
  let angle = 0;
  const arcs = points.map((point, index) => {
    const share = Math.max(0, point.value) / total;
    const a0 = angle;
    angle += share * Math.PI * 2;
    return { ...point, index, share, d: arcPath(cx, cy, rOuter, rInner, a0, angle) };
  });

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-3">
      {title ? (
        <p className="mb-2 text-sm font-semibold text-slate-900">{title}</p>
      ) : null}
      <div className="flex flex-col items-center gap-3 @sm/agentic:flex-row">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="size-[120px] shrink-0"
          role="img"
          aria-label={title ?? "Pie chart"}
        >
          {arcs.map((arc) => (
            <path
              key={`${arc.label}-${arc.index}`}
              d={arc.d}
              fill={PIE_COLORS[arc.index % PIE_COLORS.length]}
              stroke="#fff"
              strokeWidth={1.5}
            >
              <title>{`${arc.label}: ${arc.value} (${Math.round(arc.share * 100)}%)`}</title>
            </path>
          ))}
        </svg>
        <ul className="w-full min-w-0 flex-1 space-y-1.5">
          {arcs.map((arc) => (
            <li
              key={`${arc.label}-${arc.index}`}
              className="flex items-center gap-2 text-xs"
            >
              <span
                aria-hidden
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ background: PIE_COLORS[arc.index % PIE_COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-slate-700">{arc.label}</span>
              <span className="shrink-0 tabular-nums text-slate-400">
                {Math.round(arc.share * 100)}%
              </span>
              <span className="shrink-0 font-medium tabular-nums text-slate-900">
                {arc.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SparkChart({ title, points }: { title?: string | null; points: ChartPoint[] }) {
  const width = 240;
  const height = 40;
  const values = points.map((point) => point.value);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const coords = values.map((value, index) => {
    const x =
      values.length <= 1 ? width / 2 : 2 + (index / (values.length - 1)) * (width - 4);
    const y = height - 3 - ((value - min) / span) * (height - 6);
    return [x, y] as const;
  });
  const last = coords[coords.length - 1];
  const first = values[0] ?? 0;
  const latest = values[values.length - 1] ?? 0;
  const delta = latest - first;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-white px-3 py-2">
      <div className="min-w-0 shrink-0">
        {title ? (
          <p className="text-xs font-medium text-slate-500">{title}</p>
        ) : null}
        <p className="text-base font-semibold tabular-nums text-slate-900">
          {latest}
          <span
            className={cn(
              "ml-2 text-xs font-medium",
              delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-slate-400",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-10 min-w-0 flex-1"
        role="img"
        aria-label={title ?? "Sparkline"}
      >
        {coords.length > 1 ? (
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            points={coords.map(([x, y]) => `${x},${y}`).join(" ")}
          />
        ) : null}
        {last ? <circle cx={last[0]} cy={last[1]} r="3" fill="#7c3aed" /> : null}
      </svg>
    </div>
  );
}

export function Chart({ props }: { props: ChartProps }) {
  const kind = props.kind ?? "bar";
  const points = props.points ?? [];
  if (kind === "pie") return <PieChart title={props.title} points={points} />;
  if (kind === "spark") return <SparkChart title={props.title} points={points} />;
  const max = Math.max(...points.map((point) => point.value), 1);
  const width = 320;
  const height = 140;
  const pad = 16;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;
  const gradientId = `chartStroke-${Math.abs(
    (props.title ?? "chart")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0),
  )}-${points.length}-${points[0]?.value ?? 0}`;

  const linePoints = points
    .map((point, index) => {
      const x =
        points.length <= 1
          ? pad + chartW / 2
          : pad + (index / (points.length - 1)) * chartW;
      const y = pad + chartH - (point.value / max) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-3">
      {props.title ? (
        <p className="mb-3 text-sm font-semibold text-slate-900">
          {props.title}
        </p>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={props.title ?? "Chart"}
      >
        {kind === "bar"
          ? points.map((point, index) => {
              const barW = chartW / Math.max(points.length, 1) - 8;
              const x =
                pad +
                index * (chartW / Math.max(points.length, 1)) +
                4;
              const barH = (point.value / max) * chartH;
              const y = pad + chartH - barH;
              return (
                <g key={`${point.label}-${index}`}>
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(barW, 4)}
                    height={barH}
                    rx={6}
                    className="fill-indigo-500"
                  />
                  <text
                    x={x + Math.max(barW, 4) / 2}
                    y={height - 2}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px]"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })
          : null}
        {kind === "line" && points.length > 0 ? (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={linePoints}
            />
            {points.map((point, index) => {
              const x =
                points.length <= 1
                  ? pad + chartW / 2
                  : pad + (index / (points.length - 1)) * chartW;
              const y = pad + chartH - (point.value / max) * chartH;
              return (
                <g key={`${point.label}-${index}`}>
                  <circle cx={x} cy={y} r="4" className="fill-violet-600" />
                  <text
                    x={x}
                    y={height - 2}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px]"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </>
        ) : null}
      </svg>
    </div>
  );
}

type ImageProps = {
  src: string;
  alt: string;
  caption?: string | null;
  aspect?: "wide" | "square" | "tall" | null;
};

const aspectClass = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  tall: "aspect-[3/4]",
} as const;

export function Image({ props }: { props: ImageProps }) {
  const aspect = props.aspect ?? "wide";
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <img
        src={props.src}
        alt={props.alt}
        className={cn("w-full object-cover", aspectClass[aspect])}
      />
      {props.caption ? (
        <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          {props.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

type TabsProps = {
  items?: Array<{ label: string; content: string }> | null;
};

export function Tabs({ props }: { props: TabsProps }) {
  const items = props.items ?? [];
  const [active, setActive] = useState(0);
  if (items.length === 0) return null;
  const current = items[Math.min(active, items.length - 1)];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-1.5">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              index === active
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-3">
        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
          {current?.content}
        </p>
      </div>
    </div>
  );
}

type ProgressProps = {
  label: string;
  value: number;
  detail?: string | null;
};

export function Progress({ props }: { props: ProgressProps }) {
  const value = Math.max(0, Math.min(100, props.value));
  return (
    <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{props.label}</p>
        <p className="text-sm font-semibold text-indigo-600">{value}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
          style={{ width: `${value}%` }}
        />
      </div>
      {props.detail ? (
        <p className="text-xs text-slate-500">{props.detail}</p>
      ) : null}
    </div>
  );
}

type TimelineProps = {
  items?: Array<{
    title: string;
    detail?: string | null;
    time?: string | null;
  }> | null;
};

export function Timeline({ props }: { props: TimelineProps }) {
  const items = props.items ?? [];
  return (
    <ol className="space-y-0">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative flex gap-3 pb-3.5 last:pb-0">
          <div className="flex flex-col items-center">
            <span className="mt-1 size-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
            {index < items.length - 1 ? (
              <span className="mt-1 w-px flex-1 bg-slate-200" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.time ? (
                <p className="text-xs text-slate-400">{item.time}</p>
              ) : null}
            </div>
            {item.detail ? (
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

type FieldCheck = {
  type: string;
  message: string;
  args?: Record<string, string | number | boolean | null> | null;
};

type FieldProps = {
  label: string;
  name: string;
  placeholder?: string | null;
  inputType?: "text" | "email" | "number" | "textarea" | null;
  value?: string | null;
  checks?: FieldCheck[] | null;
  validateOn?: "change" | "blur" | "submit" | null;
};

function FieldControl({
  props,
  bindings,
}: {
  props: FieldProps;
  bindings?: Record<string, string>;
}) {
  const inputType = props.inputType ?? "text";
  const path = bindings?.value;
  const [value, setValue] = useBoundProp<string>(
    props.value ?? undefined,
    path,
  );
  const { errors, validate, touch } = useFieldValidation(path ?? props.name, {
    checks: (props.checks ?? undefined) as never,
    validateOn: props.validateOn ?? "blur",
  });
  const className =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20";

  const onChange = (next: string) => {
    setValue(next);
    if ((props.validateOn ?? "blur") === "change") validate();
  };

  return (
    <label className="block text-sm font-medium text-slate-700">
      {props.label}
      {inputType === "textarea" ? (
        <textarea
          name={props.name}
          value={value ?? ""}
          placeholder={props.placeholder ?? undefined}
          rows={3}
          className={className}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            touch();
            if ((props.validateOn ?? "blur") === "blur") validate();
          }}
        />
      ) : (
        <input
          type={inputType}
          name={props.name}
          value={value ?? ""}
          placeholder={props.placeholder ?? undefined}
          className={className}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            touch();
            if ((props.validateOn ?? "blur") === "blur") validate();
          }}
        />
      )}
      {errors.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5">
          {errors.map((error) => (
            <li key={error} className="text-xs text-rose-600">
              {error}
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}

function BoundFormField({ props }: { props: FieldProps }) {
  const inputType = props.inputType ?? "text";
  const path = `/form/${props.name}`;
  const [value, setValue] = useStateBinding<string>(path);
  const { errors, validate, touch } = useFieldValidation(path, {
    checks: (props.checks ?? undefined) as never,
    validateOn: props.validateOn ?? "blur",
  });
  const className =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20";

  const onChange = (next: string) => {
    setValue(next);
    if ((props.validateOn ?? "blur") === "change") validate();
  };

  return (
    <label className="block text-sm font-medium text-slate-700">
      {props.label}
      {inputType === "textarea" ? (
        <textarea
          name={props.name}
          value={value ?? ""}
          placeholder={props.placeholder ?? undefined}
          rows={3}
          className={className}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            touch();
            if ((props.validateOn ?? "blur") === "blur") validate();
          }}
        />
      ) : (
        <input
          type={inputType}
          name={props.name}
          value={value ?? ""}
          placeholder={props.placeholder ?? undefined}
          className={className}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            touch();
            if ((props.validateOn ?? "blur") === "blur") validate();
          }}
        />
      )}
      {errors.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5">
          {errors.map((error) => (
            <li key={error} className="text-xs text-rose-600">
              {error}
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}

export function Input({
  props,
  bindings,
}: {
  props: FieldProps;
  bindings?: Record<string, string>;
}) {
  return <FieldControl props={props} bindings={bindings} />;
}

type FormProps = {
  title?: string | null;
  submitLabel?: string | null;
  fields?: FieldProps[] | null;
};

export function Form({
  props,
  emit,
}: {
  props: FormProps;
  emit?: (event: string) => void;
}) {
  const fields = props.fields ?? [];

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        emit?.("submit");
      }}
    >
      {props.title ? (
        <p className="text-sm font-semibold text-slate-900">{props.title}</p>
      ) : null}
      <div className="space-y-2.5">
        {fields.map((field) => (
          <BoundFormField key={field.name} props={field} />
        ))}
      </div>
      <button
        type="submit"
        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-sm font-medium text-white"
      >
        {props.submitLabel ?? "Submit"}
      </button>
    </form>
  );
}

type AvatarProps = {
  name: string;
  role?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg" | null;
};

const avatarSize = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const;

export function Avatar({ props }: { props: AvatarProps }) {
  const size = props.size ?? "md";
  const initials = props.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex items-center gap-3">
      {props.src ? (
        <img
          src={props.src}
          alt={props.name}
          className={cn(
            "rounded-full object-cover ring-2 ring-indigo-100",
            avatarSize[size],
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 font-semibold text-white",
            avatarSize[size],
          )}
        >
          {initials || "?"}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {props.name}
        </p>
        {props.role ? (
          <p className="truncate text-xs text-slate-500">{props.role}</p>
        ) : null}
      </div>
    </div>
  );
}

type CodeProps = {
  code: string;
  language?: string | null;
  filename?: string | null;
};

export function Code({ props }: { props: CodeProps }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
        <span>{props.filename ?? "snippet"}</span>
        <span>{props.language ?? "text"}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code>{props.code}</code>
      </pre>
    </div>
  );
}

type MapMarker = {
  label: string;
  latitude: number;
  longitude: number;
};

type MapProps = {
  title?: string | null;
  latitude: number;
  longitude: number;
  zoom?: number | null;
  markers?: MapMarker[] | null;
};

export function Map({ props }: { props: MapProps }) {
  const zoom = props.zoom ?? 12;
  const markers = props.markers?.length
    ? props.markers
    : [
        {
          label: props.title ?? "Location",
          latitude: props.latitude,
          longitude: props.longitude,
        },
      ];
  const span = 0.08 / Math.max(zoom / 10, 0.5);
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${
    props.longitude - span
  }%2C${props.latitude - span * 0.7}%2C${
    props.longitude + span
  }%2C${props.latitude + span * 0.7}&layer=mapnik&marker=${props.latitude}%2C${props.longitude}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {props.title ? (
        <div className="border-b border-slate-100 px-3 py-2">
          <p className="text-sm font-medium text-slate-900">{props.title}</p>
        </div>
      ) : null}
      <div className="relative aspect-[16/10] bg-slate-100">
        <iframe
          title={props.title ?? "Map"}
          src={osmSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <ul className="divide-y divide-slate-100">
        {markers.map((marker, index) => (
          <li
            key={`${marker.label}-${index}`}
            className="flex items-start justify-between gap-3 px-3 py-2 text-xs"
          >
            <span className="font-medium text-slate-800">{marker.label}</span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CarouselItem = {
  src?: string | null;
  alt?: string | null;
  caption?: string | null;
  title?: string | null;
  description?: string | null;
  badge?: string | null;
};

type CarouselProps = {
  variant?: "image" | "card" | null;
  items?: CarouselItem[] | null;
};

export function Carousel({ props }: { props: CarouselProps }) {
  const items = props.items ?? [];
  const variant =
    props.variant ??
    (items.some((item) => item.title || item.description) ? "card" : "image");
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className={cn("flex", variant === "card" ? "gap-3" : "gap-3")}>
          {items.map((item, index) =>
            variant === "card" ? (
              <div
                key={`${item.title ?? item.src ?? "slide"}-${index}`}
                className="min-w-0 shrink-0 grow-0 basis-[85%] @md/agentic:basis-[56%]"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)]">
                  {item.src ? (
                    <img
                      src={item.src}
                      alt={item.alt ?? item.title ?? ""}
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      {item.title ? (
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                      ) : null}
                      {item.badge ? (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="text-sm leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    ) : null}
                    {item.caption ? (
                      <p className="mt-auto text-xs text-slate-400">
                        {item.caption}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={`${item.src ?? "image"}-${index}`}
                className="min-w-0 shrink-0 grow-0 basis-[88%] @md/agentic:basis-[72%]"
              >
                <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {item.src ? (
                    <img
                      src={item.src}
                      alt={item.alt ?? item.caption ?? ""}
                      className="aspect-[16/9] w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-xs text-slate-400">
                      No image
                    </div>
                  )}
                  {item.caption || item.alt ? (
                    <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                      {item.caption ?? item.alt}
                    </figcaption>
                  ) : null}
                </figure>
              </div>
            ),
          )}
        </div>
      </div>
      {items.length > 1 ? (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="text-[11px] text-slate-400">
            Swipe or drag to scroll freely
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Scroll previous"
              onClick={() => emblaApi?.scrollPrev()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <ChevronLeft aria-hidden size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Scroll next"
              onClick={() => emblaApi?.scrollNext()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <ChevronRight aria-hidden size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type CalloutProps = {
  eyebrow?: string | null;
  title: string;
  body: string;
  tone?: "brand" | "info" | "success" | "warning" | "danger" | null;
};

const calloutTone = {
  brand: {
    shell: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50",
    bar: "bg-gradient-to-b from-indigo-600 to-violet-600",
    eyebrow: "text-indigo-600",
    title: "text-slate-900",
    body: "text-slate-600",
  },
  info: {
    shell: "border-sky-200 bg-sky-50",
    bar: "bg-sky-500",
    eyebrow: "text-sky-700",
    title: "text-sky-950",
    body: "text-sky-800",
  },
  success: {
    shell: "border-emerald-200 bg-emerald-50",
    bar: "bg-emerald-500",
    eyebrow: "text-emerald-700",
    title: "text-emerald-950",
    body: "text-emerald-800",
  },
  warning: {
    shell: "border-amber-200 bg-amber-50",
    bar: "bg-amber-500",
    eyebrow: "text-amber-700",
    title: "text-amber-950",
    body: "text-amber-800",
  },
  danger: {
    shell: "border-rose-200 bg-rose-50",
    bar: "bg-rose-500",
    eyebrow: "text-rose-700",
    title: "text-rose-950",
    body: "text-rose-800",
  },
} as const;

export function Callout({ props }: { props: CalloutProps }) {
  const tone = calloutTone[props.tone ?? "brand"];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-3 py-3 pl-4",
        tone.shell,
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", tone.bar)}
      />
      {props.eyebrow ? (
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            tone.eyebrow,
          )}
        >
          {props.eyebrow}
        </p>
      ) : null}
      <p className={cn("text-sm font-semibold", tone.title, props.eyebrow && "mt-1")}>
        {props.title}
      </p>
      <p className={cn("mt-1 text-sm leading-relaxed", tone.body)}>
        {props.body}
      </p>
    </div>
  );
}

type AccordionItem = {
  title: string;
  content: string;
};

type AccordionProps = {
  items?: AccordionItem[] | null;
};

export function Accordion({ props }: { props: AccordionProps }) {
  const items = props.items ?? [];
  const [open, setOpen] = useState(0);
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div
            key={`${item.title}-${index}`}
            className="border-b border-slate-100 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-slate-900">
                {item.title}
              </span>
              <span
                className={cn(
                  "text-slate-400 transition",
                  isOpen && "rotate-180 text-indigo-600",
                )}
              >
                ▾
              </span>
            </button>
            {isOpen ? (
              <div className="px-3 pb-3">
                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type VideoProps = {
  src: string;
  poster?: string | null;
  caption?: string | null;
  aspect?: "wide" | "square" | "tall" | null;
};

function isYouTubeSrc(src: string) {
  return /youtube\.com|youtu\.be/.test(src);
}

function youtubeEmbedUrl(src: string) {
  try {
    const url = new URL(src);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }
    const id = url.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    // fall through
  }
  return src;
}

export function Video({ props }: { props: VideoProps }) {
  const aspect = props.aspect ?? "wide";
  const youtube = isYouTubeSrc(props.src);

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={cn("bg-slate-950", aspectClass[aspect])}>
        {youtube ? (
          <iframe
            title={props.caption ?? "Video"}
            src={youtubeEmbedUrl(props.src)}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={props.src}
            poster={props.poster ?? undefined}
            controls
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {props.caption ? (
        <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          {props.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

type CheckboxProps = {
  label: string;
  name: string;
  hint?: string | null;
  checked?: boolean | null;
  disabled?: boolean | null;
};

export function Checkbox({
  props,
  bindings,
}: {
  props: CheckboxProps;
  bindings?: Record<string, string>;
}) {
  const [checked, setChecked] = useBoundProp<boolean>(
    props.checked ?? undefined,
    bindings?.checked,
  );
  const isChecked = checked ?? false;
  const disabled = props.disabled ?? false;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 text-sm text-slate-700",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        type="checkbox"
        name={props.name}
        checked={isChecked}
        disabled={disabled}
        onChange={(event) => setChecked(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border transition",
          isChecked
            ? "border-indigo-600 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_6px_14px_-8px_rgba(79,70,229,0.9)]"
            : "border-slate-300 bg-white",
        )}
      >
        {isChecked ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5 5 9l4.5-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className={cn("block", isChecked && "font-medium text-slate-900")}>
          {props.label}
        </span>
        {props.hint ? (
          <span className="block text-xs text-slate-500">{props.hint}</span>
        ) : null}
      </span>
    </label>
  );
}

type SwitchProps = CheckboxProps;

export function Switch({
  props,
  bindings,
}: {
  props: SwitchProps;
  bindings?: Record<string, string>;
}) {
  const [checked, setChecked] = useBoundProp<boolean>(
    props.checked ?? undefined,
    bindings?.checked,
  );
  const isChecked = checked ?? false;
  const disabled = props.disabled ?? false;

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{props.label}</p>
        {props.hint ? (
          <p className="text-xs text-slate-500">{props.hint}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        name={props.name}
        aria-checked={isChecked}
        aria-label={props.label}
        disabled={disabled}
        onClick={() => setChecked(!isChecked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition",
          isChecked
            ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_8px_18px_-10px_rgba(79,70,229,0.9)]"
            : "border-slate-300 bg-slate-100",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-all",
            isChecked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

type ChoiceOption = { value: string; label: string };

type RadioGroupProps = {
  label?: string | null;
  name: string;
  options?: ChoiceOption[] | null;
  value?: string | null;
  disabled?: boolean | null;
};

export function RadioGroup({
  props,
  bindings,
}: {
  props: RadioGroupProps;
  bindings?: Record<string, string>;
}) {
  const [value, setValue] = useBoundProp<string>(
    props.value ?? undefined,
    bindings?.value,
  );
  const options = props.options ?? [];
  const disabled = props.disabled ?? false;

  return (
    <fieldset className="min-w-0 border-0 p-0">
      {props.label ? (
        <legend className="mb-2 text-sm font-medium text-slate-700">
          {props.label}
        </legend>
      ) : null}
      <div role="radiogroup" className="flex flex-col gap-1.5">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-sm transition",
                checked
                  ? "border-indigo-300 bg-indigo-50/60 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name={props.name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => setValue(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-4 shrink-0 items-center justify-center rounded-full border bg-white transition",
                  checked ? "border-indigo-600" : "border-slate-300",
                )}
              >
                {checked ? (
                  <span className="size-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600" />
                ) : null}
              </span>
              <span className={cn(checked && "font-medium")}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type SelectProps = {
  label?: string | null;
  name: string;
  placeholder?: string | null;
  options?: ChoiceOption[] | null;
  value?: string | null;
  disabled?: boolean | null;
};

export function Select({
  props,
  bindings,
}: {
  props: SelectProps;
  bindings?: Record<string, string>;
}) {
  const [value, setValue] = useBoundProp<string>(
    props.value ?? undefined,
    bindings?.value,
  );
  const options = props.options ?? [];
  const disabled = props.disabled ?? false;

  return (
    <label className="block text-sm font-medium text-slate-700">
      {props.label}
      <span className="relative mt-1 block">
        <select
          name={props.name}
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          className={cn(
            "w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-9 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            value ? "text-slate-900" : "text-slate-400",
          )}
        >
          <option value="" disabled>
            {props.placeholder ?? "Select…"}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 12 12"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <path
            d="m3 4.5 3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </label>
  );
}

type RatingProps = {
  label?: string | null;
  value: number;
  max?: number | null;
  count?: number | null;
  showValue?: boolean | null;
};

const STAR_PATH =
  "m8 2.4 1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.1l-3.4 1.8.7-3.8L2.5 6.4l3.8-.5z";

export function Rating({ props }: { props: RatingProps }) {
  const max = Math.max(1, Math.round(props.max ?? 5));
  const clamped = Math.max(
    0,
    Math.min(max, Number.isFinite(props.value) ? props.value : 0),
  );
  const showValue = props.showValue ?? true;
  const stars = Array.from({ length: max }, (_, index) =>
    Math.max(0, Math.min(1, clamped - index)),
  );
  const idBase = `star-${max}-${Math.round(clamped * 100)}`;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {props.label ? (
        <span className="font-medium text-slate-700">{props.label}</span>
      ) : null}
      <span
        role="img"
        aria-label={`${clamped.toFixed(1)} out of ${max}${
          props.count != null ? `, ${props.count.toLocaleString()} reviews` : ""
        }`}
        className="inline-flex items-center gap-2"
      >
        <span className="inline-flex gap-0.5 text-amber-400">
          {stars.map((fill, index) => {
            const gradientId = `${idBase}-${index}`;
            return (
              <svg key={index} width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <defs>
                  <linearGradient id={gradientId} x1="0" x2="1">
                    <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                    <stop offset={`${fill * 100}%`} stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d={STAR_PATH}
                  fill={`url(#${gradientId})`}
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            );
          })}
        </span>
        {showValue ? (
          <span className="font-semibold tabular-nums text-slate-900">
            {clamped.toFixed(1)}
          </span>
        ) : null}
        {props.count != null ? (
          <span className="text-xs text-slate-500">
            ({props.count.toLocaleString()} reviews)
          </span>
        ) : null}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout: Divider / Column / Row                                      */
/* ------------------------------------------------------------------ */

type DividerProps = { label?: string | null };

export function Divider({ props }: { props: DividerProps }) {
  if (!props.label) return <hr className="my-1 border-0 border-t border-slate-200" />;
  return (
    <div className="my-1 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      <span>{props.label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

type LayoutGap = "none" | "xs" | "sm" | "md" | "lg";
type LayoutAlign = "start" | "center" | "end" | "stretch";
type LayoutJustify = "start" | "center" | "end" | "between";

const layoutGap: Record<LayoutGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-1.5",
  md: "gap-3",
  lg: "gap-4",
};
const layoutAlign: Record<LayoutAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};
const layoutJustify: Record<LayoutJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

type ColumnProps = { gap?: LayoutGap | null; align?: LayoutAlign | null };

export function Column({
  props,
  children,
}: {
  props: ColumnProps;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col",
        layoutGap[props.gap ?? "sm"],
        layoutAlign[props.align ?? "stretch"],
      )}
    >
      {children}
    </div>
  );
}

type RowProps = {
  gap?: LayoutGap | null;
  align?: LayoutAlign | null;
  justify?: LayoutJustify | null;
  wrap?: boolean | null;
};

export function Row({
  props,
  children,
}: {
  props: RowProps;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-row [&>*]:min-w-0",
        props.wrap !== false && "flex-wrap",
        layoutGap[props.gap ?? "sm"],
        layoutAlign[props.align ?? "center"],
        layoutJustify[props.justify ?? "start"],
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Charts: BarChart / LineChart                                        */
/* ------------------------------------------------------------------ */

type ChartFormat = "number" | "currency" | "percent";
type ChartSeries = { name: string; values: number[] };

const SERIES_COLORS = ["#4f46e5", "#a78bfa", "#10b981", "#f59e0b", "#f43f5e"];
const GRID_COLOR = "#e2e8f0";
const AXIS_COLOR = "#64748b";
const CHART_HEIGHT = { sm: 120, md: 180, lg: 260 } as const;

const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function formatChartValue(format: ChartFormat | null | undefined, value: number) {
  if (format === "currency") return `฿${numberFmt.format(value)}`;
  if (format === "percent") return `${numberFmt.format(value)}%`;
  return numberFmt.format(value);
}

function compactTick(format: ChartFormat | null | undefined, value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const prefix = format === "currency" ? "฿" : "";
  const suffix = format === "percent" ? "%" : "";
  const trim = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, ""));
  if (abs >= 1_000_000) return `${sign}${prefix}${trim(abs / 1_000_000)}M${suffix}`;
  if (abs >= 1_000) return `${sign}${prefix}${trim(abs / 1_000)}K${suffix}`;
  return `${sign}${prefix}${trim(abs)}${suffix}`;
}

function scale(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const rough = max / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const unit = [1, 2, 5, 10].map((m) => m * pow).find((u) => u >= rough) ?? pow * 10;
  const ticks: number[] = [];
  for (let v = 0; v <= max + unit * 0.001; v += unit) ticks.push(Math.round(v * 1e6) / 1e6);
  if ((ticks[ticks.length - 1] ?? 0) < max) ticks.push((ticks[ticks.length - 1] ?? 0) + unit);
  return ticks;
}

function seriesMax(series: ChartSeries[], stacked: boolean) {
  const n = Math.max(0, ...series.map((s) => s.values.length));
  let max = 0;
  for (let i = 0; i < n; i += 1) {
    if (stacked) {
      max = Math.max(max, series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0));
    } else {
      for (const s of series) max = Math.max(max, s.values[i] ?? 0);
    }
  }
  return max;
}

function clipLabel(text: string, maxPx: number) {
  const max = Math.max(3, Math.floor(maxPx / 6.5));
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function thinLabels(count: number, maxLabels: number): Set<number> {
  if (count <= maxLabels) return new Set(Array.from({ length: count }, (_, i) => i));
  const step = Math.ceil((count - 1) / (maxLabels - 1));
  const picked: number[] = [];
  for (let i = 0; i < count - 1; i += step) picked.push(i);
  const last = count - 1;
  if ((picked[picked.length - 1] ?? -Infinity) >= last - step / 2) picked.pop();
  picked.push(last);
  return new Set(picked);
}

function useContainerWidth(fallback = 320) {
  const [width, setWidth] = useState(fallback);
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = Math.round(node.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function ChartLegend({ series }: { series: ChartSeries[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
      {series.map((s, i) => (
        <li key={`${i}-${s.name}`} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
          />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function ChartFrame({ title, children }: { title?: string | null; children: ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 p-3">
      {title ? (
        <p className="mb-2 text-sm font-semibold text-slate-900">{title}</p>
      ) : null}
      {children}
    </div>
  );
}

type BarChartProps = {
  title?: string | null;
  labels?: string[] | null;
  series?: ChartSeries[] | null;
  horizontal?: boolean | null;
  stacked?: boolean | null;
  showValues?: boolean | null;
  format?: ChartFormat | null;
  height?: "sm" | "md" | "lg" | null;
};

export function BarChart({ props }: { props: BarChartProps }) {
  const [ref, width] = useContainerWidth();
  const labels = props.labels ?? [];
  const series = (props.series ?? []).slice(0, 5);
  const stacked = props.stacked ?? false;
  const showValues = props.showValues ?? false;
  const format = props.format ?? "number";
  const n = labels.length;
  const ticks = niceTicks(seriesMax(series, stacked));
  const top = ticks[ticks.length - 1] ?? 0;
  const fmt = (v: number) => formatChartValue(format, v);
  const color = (i: number) =>
    series.length === 1 ? SERIES_COLORS[0] : SERIES_COLORS[i % SERIES_COLORS.length];
  const rowValue = (i: number) =>
    stacked
      ? series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0)
      : Math.max(0, ...series.map((s) => s.values[i] ?? 0));

  if (n === 0 || series.length === 0) {
    return (
      <ChartFrame title={props.title}>
        <p className="text-sm text-slate-400">No data</p>
      </ChartFrame>
    );
  }

  if (props.horizontal ?? false) {
    const LABEL_W = Math.min(108, Math.max(64, width * 0.28));
    const rowH = stacked || series.length === 1 ? 24 : 12 * series.length + 10;
    const height = n * rowH + 20;
    const right = width - (showValues ? 56 : 12);
    const x = scale(0, top, LABEL_W, right);
    const shown = thinLabels(ticks.length, Math.max(2, Math.floor((right - LABEL_W) / 52)));
    return (
      <ChartFrame title={props.title}>
        <div ref={ref} className="flex w-full flex-col gap-1.5">
          <ChartLegend series={series} />
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            role="img"
            aria-label={props.title ?? "Bar chart"}
          >
            {ticks.map((t) => (
              <line key={t} x1={x(t)} x2={x(t)} y1={0} y2={n * rowH} stroke={GRID_COLOR} />
            ))}
            {labels.map((label, i) => {
              const y0 = i * rowH;
              const barH = stacked || series.length === 1 ? rowH - 8 : 10;
              let acc = 0;
              return (
                <g key={`${i}-${label}`}>
                  <text
                    x={LABEL_W - 8}
                    y={y0 + rowH / 2}
                    fontSize={11}
                    fill={AXIS_COLOR}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {clipLabel(label, LABEL_W - 12)}
                  </text>
                  {series.map((s, si) => {
                    const v = Math.max(0, s.values[i] ?? 0);
                    const start = stacked ? acc : 0;
                    if (stacked) acc += v;
                    const by = stacked || series.length === 1 ? y0 + 4 : y0 + 5 + si * 12;
                    const x0 = x(start);
                    return (
                      <rect
                        key={s.name}
                        x={x0}
                        y={by}
                        width={Math.max(0, x(start + v) - x0)}
                        height={barH}
                        rx={3}
                        fill={color(si)}
                      >
                        <title>{`${label} · ${s.name}: ${fmt(v)}`}</title>
                      </rect>
                    );
                  })}
                  {showValues ? (
                    <text
                      x={x(rowValue(i)) + 5}
                      y={y0 + rowH / 2}
                      fontSize={11}
                      fill="#0f172a"
                      fontWeight={500}
                      dominantBaseline="middle"
                    >
                      {fmt(rowValue(i))}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {ticks.map((t, ti) =>
              shown.has(ti) ? (
                <text
                  key={`t${t}`}
                  x={x(t)}
                  y={n * rowH + 14}
                  fontSize={10}
                  fill={AXIS_COLOR}
                  textAnchor={ti === ticks.length - 1 ? "end" : ti === 0 ? "start" : "middle"}
                >
                  {compactTick(format, t)}
                </text>
              ) : null,
            )}
          </svg>
        </div>
      </ChartFrame>
    );
  }

  const AXIS_W = 44;
  const height = CHART_HEIGHT[props.height ?? "md"];
  const plotH = height - 24;
  const y = scale(0, top, plotH, 6);
  const slotW = (width - AXIS_W - 8) / n;
  const groupW = Math.min(slotW * 0.7, 48);
  const barW = stacked || series.length === 1 ? groupW : groupW / series.length;
  const shownLabels = thinLabels(n, Math.max(2, Math.floor((width - AXIS_W) / 48)));

  return (
    <ChartFrame title={props.title}>
      <div ref={ref} className="flex w-full flex-col gap-1.5">
        <ChartLegend series={series} />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label={props.title ?? "Bar chart"}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={AXIS_W} x2={width - 4} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} />
              <text
                x={AXIS_W - 6}
                y={y(t)}
                fontSize={10}
                fill={AXIS_COLOR}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {compactTick(format, t)}
              </text>
            </g>
          ))}
          {labels.map((label, i) => {
            const cx = AXIS_W + slotW * i + slotW / 2;
            let acc = 0;
            return (
              <g key={`${i}-${label}`}>
                {series.map((s, si) => {
                  const v = Math.max(0, s.values[i] ?? 0);
                  const start = stacked ? acc : 0;
                  if (stacked) acc += v;
                  const bx =
                    stacked || series.length === 1
                      ? cx - groupW / 2
                      : cx - groupW / 2 + si * barW;
                  const yTop = y(start + v);
                  return (
                    <rect
                      key={s.name}
                      x={bx}
                      y={yTop}
                      width={Math.max(1, barW - 1)}
                      height={Math.max(0, y(start) - yTop)}
                      rx={3}
                      fill={color(si)}
                    >
                      <title>{`${label} · ${s.name}: ${fmt(v)}`}</title>
                    </rect>
                  );
                })}
                {showValues ? (
                  <text
                    x={cx}
                    y={y(rowValue(i)) - 4}
                    fontSize={10}
                    fill="#0f172a"
                    fontWeight={500}
                    textAnchor="middle"
                  >
                    {fmt(rowValue(i))}
                  </text>
                ) : null}
                {shownLabels.has(i) ? (
                  <text x={cx} y={height - 6} fontSize={10} fill={AXIS_COLOR} textAnchor="middle">
                    {clipLabel(label, slotW - 4)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </ChartFrame>
  );
}

type LineChartProps = {
  title?: string | null;
  labels?: string[] | null;
  series?: ChartSeries[] | null;
  area?: boolean | null;
  showDots?: boolean | null;
  format?: ChartFormat | null;
  height?: "sm" | "md" | "lg" | null;
};

export function LineChart({ props }: { props: LineChartProps }) {
  const [ref, width] = useContainerWidth();
  const labels = props.labels ?? [];
  const series = (props.series ?? []).slice(0, 5);
  const format = props.format ?? "number";
  const n = labels.length;
  const AXIS_W = 44;
  const height = CHART_HEIGHT[props.height ?? "md"];
  const plotH = height - 24;
  const ticks = niceTicks(seriesMax(series, false));
  const top = ticks[ticks.length - 1] ?? 0;
  const x = scale(0, Math.max(1, n - 1), AXIS_W + 4, width - 8);
  const y = scale(0, top, plotH, 6);
  const shown = thinLabels(n, Math.max(2, Math.min(12, Math.floor((width - AXIS_W) / 56))));
  const dots = (props.showDots ?? false) || n <= 14;
  const fmt = (v: number) => formatChartValue(format, v);

  if (n === 0 || series.length === 0) {
    return (
      <ChartFrame title={props.title}>
        <p className="text-sm text-slate-400">No data</p>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame title={props.title}>
      <div ref={ref} className="flex w-full flex-col gap-1.5">
        <ChartLegend series={series} />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label={props.title ?? "Line chart"}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={AXIS_W} x2={width - 4} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} />
              <text
                x={AXIS_W - 6}
                y={y(t)}
                fontSize={10}
                fill={AXIS_COLOR}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {compactTick(format, t)}
              </text>
            </g>
          ))}
          {series.map((s, si) => {
            const stroke = series.length === 1 ? SERIES_COLORS[0] : SERIES_COLORS[si % SERIES_COLORS.length];
            const pts = labels.map((_, i) => [x(i), y(Math.max(0, s.values[i] ?? 0))] as const);
            const path = pts
              .map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`)
              .join(" ");
            const areaPath = `${path} L ${x(n - 1).toFixed(1)} ${plotH} L ${x(0).toFixed(1)} ${plotH} Z`;
            return (
              <g key={s.name}>
                {props.area ? <path d={areaPath} fill={stroke} opacity={0.12} /> : null}
                <path
                  d={path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {dots
                  ? pts.map(([px, py], i) => (
                      <circle key={i} cx={px} cy={py} r={2.75} fill={stroke}>
                        <title>{`${labels[i] ?? ""} · ${s.name}: ${fmt(s.values[i] ?? 0)}`}</title>
                      </circle>
                    ))
                  : null}
              </g>
            );
          })}
          {labels.map((label, i) =>
            shown.has(i) ? (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                fontSize={10}
                fill={AXIS_COLOR}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              >
                {label}
              </text>
            ) : null,
          )}
        </svg>
      </div>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Icon / IconText                                                     */
/* ------------------------------------------------------------------ */

const ICONS = {
  phone: Phone,
  mail: Mail,
  pin: MapPin,
  clock: Clock,
  star: Star,
  check: Check,
  alert: TriangleAlert,
  plane: Plane,
  cart: ShoppingCart,
  user: User,
  calendar: Calendar,
  tag: Tag,
  box: Package,
  receipt: Receipt,
  truck: Truck,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  search: Search,
  edit: Pencil,
  trash: Trash2,
  info: Info,
  play: Play,
  music: Music,
  coffee: Coffee,
  home: House,
  chart: ChartBar,
  list: ListIcon,
  send: Send,
  heart: Heart,
} as const;

type IconName = keyof typeof ICONS;
type IconTone = "default" | "muted" | "primary" | "success" | "warning" | "danger";

const iconTone: Record<IconTone, string> = {
  default: "text-slate-700",
  muted: "text-slate-400",
  primary: "text-indigo-600",
  success: "text-emerald-600",
  warning: "text-amber-500",
  danger: "text-rose-600",
};
const iconSize = { sm: 14, md: 18, lg: 24 } as const;

function LucideIcon({
  name,
  tone = "default",
  size = "md",
  className,
}: {
  name: IconName | string;
  tone?: IconTone;
  size?: keyof typeof iconSize;
  className?: string;
}) {
  const Cmp = (ICONS as Record<string, typeof Phone>)[name] ?? Info;
  return (
    <Cmp
      aria-hidden
      size={iconSize[size]}
      strokeWidth={1.75}
      className={cn("shrink-0", iconTone[tone], className)}
    />
  );
}

type IconProps = {
  name: IconName;
  tone?: IconTone | null;
  size?: "sm" | "md" | "lg" | null;
};

export function Icon({ props }: { props: IconProps }) {
  return (
    <span className="inline-flex items-center" role="img" aria-label={props.name}>
      <LucideIcon name={props.name} tone={props.tone ?? "default"} size={props.size ?? "md"} />
    </span>
  );
}

type IconTextProps = {
  icon: IconName;
  text: string;
  hint?: string | null;
};

export function IconText({ props }: { props: IconTextProps }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="pt-0.5">
        <LucideIcon name={props.icon} tone="muted" size="sm" />
      </span>
      <span className="min-w-0">
        <span className="block break-words text-slate-800">{props.text}</span>
        {props.hint ? (
          <span className="block text-xs text-slate-500">{props.hint}</span>
        ) : null}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LineItems / FromTo / KeyValue                                       */
/* ------------------------------------------------------------------ */

type LineItem = {
  name: string;
  detail?: string | null;
  qty?: number | null;
  amount: number;
};
type SummaryLine = { label: string; amount: number; emphasis?: "total" | null };
type LineItemsProps = {
  items?: LineItem[] | null;
  summary?: SummaryLine[] | null;
  currency?: string | null;
};

const moneyFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function LineItems({ props }: { props: LineItemsProps }) {
  const items = props.items ?? [];
  const summary = props.summary ?? [];
  const currency = props.currency ?? "฿";
  const money = (v: number) => `${currency}${moneyFmt.format(v)}`;

  return (
    <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
      {items.length === 0 ? (
        <p className="py-1 text-slate-400">No items</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={`${i}-${item.name}`} className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-slate-800">
                  {item.qty != null ? (
                    <span className="mr-1.5 tabular-nums text-slate-400">{item.qty}×</span>
                  ) : null}
                  {item.name}
                </span>
                {item.detail ? (
                  <span className="block text-xs italic text-slate-500">{item.detail}</span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-slate-800">{money(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      {summary.length > 0 ? (
        <dl className="mt-2.5 flex flex-col gap-1 border-t border-slate-200 pt-2">
          {summary.map((line, i) => {
            const total = line.emphasis === "total";
            return (
              <div
                key={`${i}-${line.label}`}
                className={cn("flex items-baseline justify-between gap-3", total && "mt-1")}
              >
                <dt className={total ? "text-base font-semibold text-slate-900" : "text-slate-500"}>
                  {line.label}
                </dt>
                <dd
                  className={cn(
                    "tabular-nums",
                    total ? "text-lg font-semibold text-indigo-700" : "text-slate-800",
                  )}
                >
                  {money(line.amount)}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </div>
  );
}

type FromToProps = {
  from: string;
  to: string;
  via?: string | null;
  icon?: "arrowRight" | "plane" | "truck" | "send" | null;
};

export function FromTo({ props }: { props: FromToProps }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-white px-3 py-2.5">
      <span className="min-w-0 flex-1 break-words text-base font-semibold leading-tight text-slate-900">
        {props.from}
      </span>
      <span className="flex shrink-0 flex-col items-center gap-0.5 text-slate-400">
        <LucideIcon name={props.icon ?? "arrowRight"} tone="primary" size="lg" />
        {props.via ? (
          <span className="whitespace-nowrap text-[10.5px] font-medium">{props.via}</span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1 break-words text-right text-base font-semibold leading-tight text-slate-900">
        {props.to}
      </span>
    </div>
  );
}

type KeyValueProps = {
  pairs?: Array<{ label: string; value: string }> | null;
  size?: "sm" | "md" | null;
};

export function KeyValue({ props }: { props: KeyValueProps }) {
  const pairs = props.pairs ?? [];
  const size = props.size ?? "sm";
  return (
    <dl
      className={cn(
        "w-full min-w-0 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white",
        size === "sm" ? "text-[13px]" : "text-sm",
      )}
    >
      {pairs.map((pair, i) => (
        <div
          key={`${i}-${pair.label}`}
          className={cn("flex items-baseline justify-between gap-3 px-2.5", size === "sm" ? "py-1" : "py-1.5")}
        >
          <dt className="shrink-0 text-slate-500">{pair.label}</dt>
          <dd className="min-w-0 break-words text-right font-medium text-slate-900">{pair.value}</dd>
        </div>
      ))}
    </dl>
  );
}
