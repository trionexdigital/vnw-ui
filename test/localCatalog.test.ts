import { describe,it,expect } from 'vitest';
import { catalogResolver,loadLocalCatalog,mergeCatalog } from '../src/shared/language/localCatalog';
describe('app-owned language catalogs',()=>{
  it('ships all 11 translated languages with complete common actions and no fetch dependency',async()=>{
    for(const code of ['hi','mr','hg','gu','bn','pa','ta','te','kn','ml','or']) {
      const catalog=await loadLocalCatalog(code);expect(Object.keys(catalog).length).toBeGreaterThan(100);
      for(const action of ['Buy Now','Add to Cart','Terms and Conditions','Family Pack']) expect(catalog[action]).toBeTruthy();
      expect(catalogResolver(catalog)('BUY NOW')).toBe(catalog['Buy Now']);
    }
    expect(await loadLocalCatalog('en')).toEqual({});
  });
  it('normalizes whitespace, applies published overrides and keeps missing sources visible',()=>{
    const resolve=catalogResolver(mergeCatalog({'Home':'होम'},{'HOME':'मुख्य पृष्ठ','FAQ':'सवाल',bad:123}));
    expect(resolve('  Home\n')).toBe('मुख्य पृष्ठ');expect(resolve('Untranslated legal content')).toBe('Untranslated legal content');
    expect(resolve('9876543210')).toBe('9876543210');expect(resolve('₹1,999.50')).toBe('₹1,999.50');
  });
  it('preserves prices and numbers inside named templates without interpreting markup',()=>{
    const resolve=catalogResolver({'Buy {number} for {price}':'{number} को {price} में खरीदें','{count} of {count} selected':'{count} में से {count} चुने गए','A.B {count}':'<b>{count}</b>'});
    expect(resolve('Buy 9876543210 for ₹1,999.50')).toBe('9876543210 को ₹1,999.50 में खरीदें');
    expect(resolve('2 of 3 selected')).toBe('2 of 3 selected');expect(resolve('2 of 2 selected')).toBe('2 में से 2 चुने गए');
    expect(resolve('A.B 2')).toBe('<b>2</b>');expect(resolve('AXB 2')).toBe('AXB 2');
  });
});
