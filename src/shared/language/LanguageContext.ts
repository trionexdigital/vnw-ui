import { createContext, useContext } from 'react';

export type MessageValues = Record<string,string|number>;
export const interpolate = (source:string,values?:MessageValues) => values ? source.replace(/\{([a-zA-Z]\w*)\}/g,(token,name)=>values[name]===undefined ? token : String(values[name])) : source;
export const LanguageContext = createContext<{ language: string; chooserOpen?: boolean; consoleRoute?: boolean; openChooser: () => void; t: (source: string, values?: MessageValues) => string }>({ language: 'en', openChooser: () => {}, t: (source: string,values?:MessageValues) => interpolate(source,values) });
export const TranslationDisabled = createContext(false);
export const useLanguage = () => useContext(LanguageContext);
