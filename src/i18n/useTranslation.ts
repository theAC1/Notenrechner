import { useAppStore } from '@/state/useAppStore';
import { TRANSLATIONS, type Dictionary } from './translations';

export function useTranslation(): Dictionary {
  const language = useAppStore((s) => s.settings.language);
  return TRANSLATIONS[language];
}

export function formatTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
