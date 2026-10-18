import { createElement, createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Slot } from '@radix-ui/react-slot';
import { LocalizedElement } from '@/shared/language/LocalizedElement';
import { LanguageContext } from '@/shared/language/LanguageContext';
import { catalogResolver } from '@/shared/language/localCatalog';
import { ThemedSelect } from '@/shared/ui/themed-select';
import { Table } from '@/shared/components/ui-bits';
const t=catalogResolver({'Hello':'नमस्ते','Your name':'आपका नाम','{selected} of {total} selected':'{total} में से {selected} चयनित','Language':'भाषा','Hindi':'हिंदी'});
const withLocale=(child:React.ReactNode,translate=t)=>createElement(LanguageContext.Provider,{value:{language:'hi',openChooser:()=>{},t:translate}},child);

describe('React-owned localization',()=>{
  it('updates and removes translated text through normal React reconciliation',()=>{
    const node=createElement(LocalizedElement,{as:'div'},'Hello');
    const view=render(withLocale(node));expect(screen.getByText('नमस्ते')).toBeVisible();
    view.rerender(withLocale(node,s=>s));expect(screen.getByText('Hello')).toBeVisible();
    view.rerender(withLocale(createElement(LocalizedElement,{as:'div'},createElement('strong',{},'Changed'))));expect(screen.getByText('Changed')).toBeVisible();
    view.unmount();expect(document.body.textContent).not.toContain('नमस्ते');
  });
  it('keeps private values, form values, URLs and identifiers unchanged while translating placeholders',()=>{
    render(withLocale(createElement(LocalizedElement,{as:'div'},
      createElement(LocalizedElement,{as:'span','data-private':true},createElement(LocalizedElement,{as:'b'},'Hello')),
      createElement(LocalizedElement,{as:'input',placeholder:'Your name',value:'Hello',readOnly:true,'data-label':'Your name'}),
      createElement(LocalizedElement,{as:'a',href:'/Hello','data-id':'Hello'},'Hello'))));
    expect(screen.getByText('Hello',{selector:'b'})).toBeVisible();
    expect(screen.getByPlaceholderText('आपका नाम')).toHaveValue('Hello');
    expect(screen.getByRole('link')).toHaveAttribute('href','/Hello');
    expect(screen.getByRole('link')).toHaveAttribute('data-id','Hello');
  });
  it('preserves forwarded refs and both handlers when used with Radix asChild',()=>{
    const ref=createRef<HTMLButtonElement>(),own=vi.fn(),slot=vi.fn();
    render(withLocale(createElement(Slot,{onClick:slot},createElement(LocalizedElement,{as:'button',onClick:own,ref},'Hello'))));
    const button=screen.getByRole('button',{name:'नमस्ते'});expect(ref.current).toBe(button);
    fireEvent.click(button);expect(own).toHaveBeenCalledOnce();expect(slot).toHaveBeenCalledOnce();
  });
  it('translates complete interpolated messages without changing number values',()=>{
    render(withLocale(createElement(LocalizedElement,{as:'p'},2,' of ',10,' selected')));
    expect(screen.getByText('10 में से 2 चयनित')).toBeVisible();
  });
  it('preserves select options and table row metadata inspected by component adapters',()=>{
    render(withLocale(createElement('div',{},
      createElement(ThemedSelect,{value:'hi','aria-label':'Language',children:createElement('option',{value:'hi'},'Hindi')}),
      createElement(Table,{head:['Language'],children:createElement('tr',{},createElement(LocalizedElement,{as:'td'},'Hindi'))}))));
    expect(screen.getByRole('combobox',{name:'भाषा'})).toHaveTextContent('हिंदी');
    expect(screen.getByRole('cell')).toHaveAttribute('data-label','भाषा');
    expect(screen.getByRole('cell')).toHaveClass('admin-table-cell');
  });
});
