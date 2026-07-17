import { Monitor, Moon, Sun } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { cn } from '@/core/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { type ThemeMode, useTheme } from './ThemeProvider';

type ThemeIcon = ComponentType<SVGProps<SVGSVGElement>>;

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: ThemeIcon }> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const THEME_ICONS: Record<ThemeMode, ThemeIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export interface ThemeControlProps {
  className?: string;
  showLabel?: boolean;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ThemeControl({
  className,
  showLabel = false,
  align = 'end',
  side = 'bottom',
}: ThemeControlProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const ActiveIcon = THEME_ICONS[theme];
  const accessibleLabel = `Theme: ${capitalize(theme)}, currently ${capitalize(resolvedTheme)}`;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={accessibleLabel}
              className={cn(
                'inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-2.5 text-foreground shadow-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                showLabel && 'px-3',
                className,
              )}
            >
              <ActiveIcon aria-hidden="true" className="h-4 w-4" />
              {showLabel && <span className="text-sm font-semibold">{capitalize(theme)}</span>}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{accessibleLabel}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align={align} side={side} className="min-w-44">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (value === 'system' || value === 'light' || value === 'dark') setTheme(value);
          }}
        >
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2">
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span>{label}</span>
              {value === 'system' && (
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  {capitalize(resolvedTheme)}
                </span>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeControl;
