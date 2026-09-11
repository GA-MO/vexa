import { useState, type ReactNode } from "react";
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
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
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
  return (
    <section className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_-12px_rgba(79,70,229,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(79,70,229,0.35)] @md/agentic:p-5">
      {(props.title || props.description) && (
        <header className="mb-4 space-y-1">
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
      <div className="space-y-3">{children}</div>
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
    level === "1" && "text-2xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent",
    level === "2" && "text-xl",
    level === "3" && "text-lg",
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
    <div className="min-w-0 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-3 @md/agentic:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 break-words">
        {props.label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 break-words @md/agentic:text-2xl">
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
    <div className={cn("rounded-xl border px-4 py-3 text-sm", alertTone[tone])}>
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
              <th key={column.key} className="px-3 py-2 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-100 text-slate-700">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2">
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
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
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
  kind?: "bar" | "line" | null;
  points?: ChartPoint[] | null;
};

export function Chart({ props }: { props: ChartProps }) {
  const kind = props.kind ?? "bar";
  const points = props.points ?? [];
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
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-4">
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
      <div className="p-4">
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
    <div className="space-y-2 rounded-xl border border-indigo-100 bg-white p-4">
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
        <li key={`${item.title}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
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
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20";

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
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20";

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
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        emit?.("submit");
      }}
    >
      {props.title ? (
        <p className="text-sm font-semibold text-slate-900">{props.title}</p>
      ) : null}
      <div className="space-y-3">
        {fields.map((field) => (
          <BoundFormField key={field.name} props={field} />
        ))}
      </div>
      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white"
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
                  <div className="flex flex-1 flex-col gap-2 p-4">
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
              className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 transition hover:bg-slate-50"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Scroll next"
              onClick={() => emblaApi?.scrollNext()}
              className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 transition hover:bg-slate-50"
            >
              ›
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
        "relative overflow-hidden rounded-xl border px-4 py-3.5 pl-5",
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
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
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
              <div className="px-4 pb-4">
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
