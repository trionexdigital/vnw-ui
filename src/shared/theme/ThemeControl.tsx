import { cn } from '@/core/lib/utils';
import { Monitor, Sun, Moon } from 'lucide-react';
import { type ThemeMode, useTheme } from './ThemeProvider';

const modes: Array<{ value: ThemeMode; label: string; description: string }> = [
  { value: 'system', label: 'Auto', description: 'Follow system theme' },
  { value: 'light', label: 'Light', description: 'Use light theme' },
  { value: 'dark', label: 'Dark', description: 'Use dark theme' },
];

export interface ThemeControlProps {
  className?: string;
  showLabel?: boolean;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  compact?: boolean;
}

export function ThemeControl({
  className,
  showLabel = false,
  compact = false,
}: ThemeControlProps) {
  const { theme, setTheme } = useTheme();

  return <div className={cn('inline-flex shrink-0 items-center gap-2', className)}>
    {showLabel && <span className="text-xs font-semibold text-foreground">Appearance</span>}
    <div role="radiogroup" aria-label="Color theme" className="inline-flex h-9 items-center rounded-xl border border-border bg-card p-0.5 shadow-sm">
      {modes.map((mode, index) => <button
        key={mode.value}
        type="button"
        role="radio"
        aria-label={mode.description}
        aria-checked={theme === mode.value}
        title={mode.description}
        tabIndex={theme === mode.value ? 0 : -1}
        onClick={() => setTheme(mode.value)}
        onKeyDown={(event) => {
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1
            : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % modes.length
              : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + modes.length - 1) % modes.length : -1;
          if (next < 0) return;
          event.preventDefault();
          setTheme(modes[next].value);
          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
        }}
        className={cn(
          'inline-flex h-7 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-bold leading-none text-muted-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          theme === mode.value && 'bg-primary text-primary-foreground shadow-sm',
        )}
      >{mode.value === 'system' ? <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> : mode.value === 'light' ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}<span className={compact ? 'sr-only' : ''}>{mode.label}</span></button>)}
    </div>
  </div>;
}

export default ThemeControl;
