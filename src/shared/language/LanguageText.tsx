import { useLanguage, type MessageValues } from './LanguageContext';
/** Explicit named messages keep private values out of source keys and preserve native word order. */
export function LanguageText({source,values}:{source:string;values?:MessageValues}) {
  const {t}=useLanguage();return <>{t(source,values)}</>;
}
