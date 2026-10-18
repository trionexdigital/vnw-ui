import { cloneElement, createElement, forwardRef, isValidElement, useContext, type ElementType, type ReactNode } from 'react';
import { LanguageContext, TranslationDisabled } from './LanguageContext';

/** React renders translated text itself. Never modify React's DOM after a commit. */
export const LocalizedElement = forwardRef<any, { as: ElementType; children?: ReactNode; [key: string]: any }>(
  function LocalizedElement({ as, children, ...props }, ref) {
    const { t } = useContext(LanguageContext);
    const inherited = useContext(TranslationDisabled);
    const disabled = inherited || props.translate === 'no' || props['data-no-translate'] !== undefined || props['data-private'] !== undefined;
    const translated: Record<string,any> = { ...props, ...(ref ? { ref } : {}) };
    if (!disabled) for (const key of ['placeholder', 'title', 'aria-label', 'alt', 'data-label']) {
      if (typeof translated[key] === 'string') translated[key] = t(translated[key]);
    }
    const literalContent = ['script', 'style', 'code', 'pre', 'textarea'].includes(String(as));
    const translateChild = (child: ReactNode): ReactNode => {
      if(typeof child==='string') return t(child);
      if(Array.isArray(child)) {
        const result:ReactNode[]=[];let run:Array<string|number>=[];
        const flush=()=>{if(!run.length)return;const source=run.join(''),target=t(source);result.push(target===source ? run.map(value=>typeof value==='string'?t(value):value) : target);run=[];};
        for(const value of child) {if(typeof value==='string'||typeof value==='number')run.push(value);else{flush();result.push(translateChild(value));}}
        flush();return result;
      }
      return as==='select' && isValidElement<{children?:ReactNode}>(child) && child.type==='option' ? cloneElement(child,{},translateChild(child.props.children)) : child;
    };
    const element = createElement(as, translated, disabled || literalContent ? children : translateChild(children));
    return disabled !== inherited
      ? createElement(TranslationDisabled.Provider, { value: disabled }, element)
      : element;
  },
);
