import { useState, useRef, useEffect } from "react";
import { cn } from "@/core/lib/utils";
import { FieldError } from "./field-error";

export interface ComboboxProps<T> {
  label: string;
  items: T[];
  /** selected key (matches getKey) */
  value: string;
  onChange: (key: string) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderOption?: (item: T) => React.ReactNode;
  filterItem?: (item: T, query: string) => boolean;
  icon?: React.ReactNode;
  error?: string;
  placeholder?: string;
  /** optional sticky row at the top of the menu (e.g. "+ New Patient").
   *  May be a render-prop receiving a `close()` to dismiss the menu. */
  header?: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** shown when there are no matches; render-prop variant gets the query + close. */
  emptyContent?: (query: string, close: () => void) => React.ReactNode;
  emptyText?: string;
  disabled?: boolean;
  dense?: boolean;
  containerClassName?: string;
  onBlur?: () => void;
}

/**
 * Generic searchable combobox with a floating label — generalised from the
 * PatientForm city search. Replaces MUI Autocomplete usages.
 */
export function Combobox<T>({
  label, items, value, onChange, getKey, getLabel, renderOption, filterItem,
  icon, error, placeholder, header, emptyContent, emptyText, disabled, dense = false, containerClassName, onBlur,
}: ComboboxProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); setQuery(""); };

  const selected = items.find((it) => getKey(it) === value);
  const displayVal = open ? query : (selected ? getLabel(selected) : "");
  const isFloating = !!(selected || open || query);

  const matches = (it: T) =>
    filterItem ? filterItem(it, query) : getLabel(it).toLowerCase().includes(query.toLowerCase());
  const filtered = open ? (query ? items.filter(matches) : items) : [];

  useEffect(() => {
    const cb = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", cb);
    return () => document.removeEventListener("mousedown", cb);
  }, []);

  return (
    <div ref={wrapRef} className={containerClassName}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            {icon}
          </span>
        )}
        <input
          value={displayVal}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          placeholder=" "
          className={cn(
            "peer w-full rounded-lg border bg-white pr-3 text-sm text-gray-900 outline-none transition-colors dark:bg-gray-900 dark:text-white",
            dense ? "h-9" : "h-10",
            icon ? "pl-8" : "pl-3",
            error
              ? "border-red-400 focus:border-red-400"
              : "border-gray-200 focus:border-sky-400 dark:border-gray-700 dark:focus:border-sky-500",
            disabled && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
          )}
        />
        <label
          className={cn(
            "pointer-events-none absolute z-10 transition-all duration-150 select-none",
            isFloating
              ? cn("left-3 top-0 -translate-y-1/2 text-[0.65rem] font-medium px-1 bg-white dark:bg-gray-900",
                  error ? "text-red-500" : "text-sky-500 dark:text-sky-400")
              : cn(icon ? "left-8" : "left-3", "top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-gray-500")
          )}
        >
          {label}
        </label>

        {open && (header || filtered.length > 0 || query) && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {typeof header === "function" ? header(close) : header}
            {filtered.map((it) => (
              <button
                key={getKey(it)}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(getKey(it));
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:text-gray-200 dark:hover:bg-sky-950/50"
              >
                {renderOption ? renderOption(it) : getLabel(it)}
              </button>
            ))}
            {query && filtered.length === 0 && (
              emptyContent ? emptyContent(query, close)
                : emptyText ? <div className="px-3 py-2 text-sm text-slate-400">{emptyText}</div>
                : null
            )}
          </div>
        )}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default Combobox;
