import { useId, useRef, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Dialog, type DialogProps } from "../dialog";

export type WorkspaceTab = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};
export type WorkspaceTabsProps = {
  tabs: readonly WorkspaceTab[];
  value: string;
  onChange: (id: string) => void;
  label: string;
};
/** Controlled content tabs. Use normal links for URL navigation. */
export function WorkspaceTabs({
  tabs,
  value,
  onChange,
  label,
}: WorkspaceTabsProps) {
  const id = useId();
  const refs = useRef(new Map<string, HTMLButtonElement>());
  return (
    <div data-tint-tabs>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-6 border-b border-tint-border"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) refs.current.set(tab.id, el);
              else refs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={`${id}-${tab.id}`}
            aria-controls={`${id}-${tab.id}-panel`}
            aria-selected={tab.id === value}
            tabIndex={tab.id === value ? 0 : -1}
            disabled={tab.disabled}
            className={cn(
              "border-b-2 border-transparent px-1 py-3 text-sm text-tint-muted",
              tab.id === value && "border-tint-accent text-tint-accent",
            )}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              const available = tabs.filter((item) => !item.disabled),
                index = available.findIndex((item) => item.id === tab.id);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? available.length - 1
                    : event.key === "ArrowRight"
                      ? (index + 1) % available.length
                      : event.key === "ArrowLeft"
                        ? (index + available.length - 1) % available.length
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                onChange(available[next].id);
                refs.current.get(available[next].id)?.focus();
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${id}-${tab.id}-panel`}
          aria-labelledby={`${id}-${tab.id}`}
          hidden={value !== tab.id}
          tabIndex={0}
          className="pt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

export type MetadataPanelProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  image?: ReactNode;
  description?: ReactNode;
  fields?: readonly { label: string; value: ReactNode }[];
  tags?: readonly string[];
  actions?: ReactNode;
  children?: ReactNode;
};
export function MetadataPanel({
  title,
  eyebrow,
  image,
  description,
  fields,
  tags,
  actions,
  children,
}: MetadataPanelProps) {
  return (
    <section
      data-tint-metadata-panel
      className="flex flex-wrap gap-6 rounded-md border border-tint-border bg-tint-panel p-5"
    >
      {image ? <div className="shrink-0">{image}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="m-0 text-xs tracking-widest text-tint-accent">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="my-2 text-2xl font-medium">{title}</h2>
          </div>
          {actions}
        </div>
        {description ? (
          <p className="text-sm leading-relaxed text-tint-muted">
            {description}
          </p>
        ) : null}
        {tags?.length ? (
          <div className="my-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-tint-surface px-2 py-1 text-xs text-tint-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {fields?.length ? (
          <dl className="m-0 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {fields.map((field) => (
              <div key={field.label} className="flex gap-2">
                <dt className="text-tint-muted">{field.label}</dt>
                <dd className="m-0">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** Side-mounted dialog with the same focus and dismissal contract as Dialog. */
export function DetailSheet(props: DialogProps) {
  return <Dialog {...props} placement="right" />;
}

export function FilterBar({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      data-tint-filter-bar
      className="flex flex-wrap items-end justify-between gap-3 border-b border-tint-border bg-tint-panel p-3"
    >
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {actions}
    </div>
  );
}
