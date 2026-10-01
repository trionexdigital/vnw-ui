import { Children, isValidElement, useState, type ChangeEvent, type ReactElement, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'children'> & {
  children: ReactNode;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};
const EMPTY_VALUE = '__vnw_empty_select_value__';

/** A native-select-compatible adapter with a consistently themed, keyboard-accessible menu. */
export function ThemedSelect({ children, value, defaultValue, onChange, className = '', name, disabled, required, id, 'aria-label': ariaLabel, ...rest }: Props) {
  const options = Children.toArray(children).filter((child): child is ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }> => isValidElement(child) && child.type === 'option');
  const firstValue = options.length ? String(options[0].props.value ?? options[0].props.children ?? '') : '';
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? firstValue));
  const selected = String(value ?? internalValue);
  const handleChange = (next: string) => {
    if (value === undefined) setInternalValue(next);
    const event = { target: { value: next }, currentTarget: { value: next } } as ChangeEvent<HTMLSelectElement>;
    onChange?.(event);
    if (value === undefined && event.target.value !== next) setInternalValue(event.target.value);
  };

  return <>
    {name && <input type="hidden" name={name} value={selected} required={required} />}
    <Select value={selected || EMPTY_VALUE} onValueChange={(next) => handleChange(next === EMPTY_VALUE ? '' : next)} disabled={disabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={`themed-select ${className}`} {...rest as any}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="themed-select-content">
        {options.map((option, index) => {
          const optionValue = String(option.props.value ?? option.props.children ?? '');
          return <SelectItem key={`${optionValue}-${index}`} value={optionValue || EMPTY_VALUE} disabled={option.props.disabled}>
            {option.props.children}
          </SelectItem>;
        })}
      </SelectContent>
    </Select>
  </>;
}
