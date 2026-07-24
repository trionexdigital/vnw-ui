import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const sourceRoot = resolve(process.cwd(), 'src');

const intentionalFixedLines: Record<string, RegExp[]> = {
  'pages/admin/AdminBanners.tsx': [
    /ref=\{previewRef\}/,
    /ref=\{copyRef\}/,
    /cursor-grab touch-none/,
    /form\.subtitle \|\|/,
    /Button preview/,
    /Drag the text card/,
    /item\.is_active \?/,
    /Order \{item\.sort_order\}/,
    /h-\[min\(48vh,360px\)\]/,
  ],
  'pages/auth/Auth.tsx': [/rounded-xl bg-white p-2/],
  'pages/home/components/HomeCarousel.tsx': [
    /const ctaClass/,
    /bg-gradient-to-t from-stone-950/,
    /aria-live="polite"/,
    /absolute right-3 top-3/,
    /manualPause \?/,
    /aria-label=\{`Slide/,
    /aria-current=/,
    /className=\{`h-2/,
  ],
  'pages/home/components/HomeSections.tsx': [/absolute inset-\[8%\]/, /brand-stage__slogan/],
  'pages/shop/Shop.tsx': [/setFiltersOpen\(false\)/],
  'shared/components/NewsletterForm.tsx': [/dark \?/],
  'shared/layout/AccountLayout.tsx': [/<Slogan/],
  'shared/layout/PublicLayout.tsx': [/setOpen\(false\)/],
};

const lightOnlyUtility = /\b(?:bg-white(?:\/\d+)?|(?:bg|text|border)-(?:stone|gray|slate)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/\d+)?|text-royal)\b/g;

function listTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listTsxFiles(path);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [path] : [];
  });
}

describe('theme coverage', () => {
  it('keeps light-only surface utilities out of application chrome', () => {
    const violations: string[] = [];

    for (const file of listTsxFiles(sourceRoot)) {
      const fileName = relative(sourceRoot, file).replaceAll('\\', '/');
      const lines = readFileSync(file, 'utf8').split('\n');

      lines.forEach((line, index) => {
        const matches = [...line.matchAll(lightOnlyUtility)];
        if (matches.length === 0) return;
        if ((intentionalFixedLines[fileName] ?? []).some((pattern) => pattern.test(line))) return;

        for (const match of matches) violations.push(`${fileName}:${index + 1} ${match[0]}`);
      });
    }

    expect(violations, `Unexpected light-only utilities:\n${violations.join('\n')}`).toEqual([]);
  });

  it('keeps global surfaces semantic and dark browser controls enabled', () => {
    const css = readFileSync(resolve(sourceRoot, 'index.css'), 'utf8');

    expect(css).toMatch(/\.dark\s*\{[\s\S]*?color-scheme:\s*dark;/);
    expect(css).not.toMatch(/\.dark\s*\{\s*color-scheme:\s*light;/);
    expect(css).not.toMatch(/\[class\*="(?:text|bg|border|from|via|to|focus):?/);
    expect(css).toMatch(/body\s*\{\s*background:\s*var\(--vnw-page\);/);
    expect(css).toMatch(/\.app-shell-bg\s*\{\s*background:\s*var\(--vnw-page\);/);
  });

  it('uses VIP gold for primary actions in both themes without legacy purple action colors', () => {
    const css = readFileSync(resolve(sourceRoot, 'index.css'), 'utf8');
    const source = listTsxFiles(sourceRoot).map((file) => readFileSync(file, 'utf8')).join('\n');
    const legacyPurple = /#(?:7c2cff|d923c6|5b27ee|d119b9|7c3bb7|4c1d95|27105f|6c27ee|7c2bd1)\b/i;

    expect(css).toMatch(/:root\s*\{[\s\S]*?--primary:\s*38 90% 33%;/);
    expect(css).toMatch(/\.dark\s*\{[\s\S]*?--primary:\s*41 71% 57%;/);
    expect(css).toContain('--vnw-action: var(--vnw-primitive-gold-600);');
    expect(css).not.toMatch(legacyPurple);
    expect(source).not.toMatch(legacyPurple);
    expect(source).not.toMatch(/bg-foreground[^\n'"]*text-background/);
  });

  it('keeps every route family inside a shell with the shared theme provider', () => {
    const app = readFileSync(resolve(sourceRoot, 'App.tsx'), 'utf8');
    const routes = readFileSync(resolve(sourceRoot, 'app/router/AppRoutes.tsx'), 'utf8');
    const publicLayout = readFileSync(resolve(sourceRoot, 'shared/layout/PublicLayout.tsx'), 'utf8');
    const accountLayout = readFileSync(resolve(sourceRoot, 'shared/layout/AccountLayout.tsx'), 'utf8');
    const auth = readFileSync(resolve(sourceRoot, 'pages/auth/Auth.tsx'), 'utf8');
    const declaredPaths = [...routes.matchAll(/<Route path="([^"]+)"/g)].map((match) => match[1]);

    expect(app).toContain('<ThemeProvider>');
    expect(routes).toContain('<Route element={<PublicLayout />}>');
    expect(routes).toContain('<Route element={<RoleGuard><AccountLayout /></RoleGuard>}>');
    expect(declaredPaths).toEqual(expect.arrayContaining(['/', '/login', '/dashboard', '/employee', '/dealer', '/admin']));
    expect(declaredPaths.length).toBeGreaterThanOrEqual(45);
    expect(publicLayout).toContain('<ThemeControl');
    expect(accountLayout).toContain('<ThemeControl');
    expect(auth).toContain('<ThemeControl');
  });

  it('applies the stored or system theme before the application entry script', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const bootstrapIndex = html.indexOf("localStorage.getItem('vnw_theme')");
    const entryIndex = html.indexOf('src="/src/main.tsx"');

    expect(bootstrapIndex).toBeGreaterThan(0);
    expect(bootstrapIndex).toBeLessThan(entryIndex);
    expect(html).toContain("classList.toggle('dark', resolvedTheme === 'dark')");
    expect(html).toContain("root.setAttribute('data-theme', resolvedTheme)");
    expect(html).toContain('root.style.colorScheme = resolvedTheme');
  });
});
