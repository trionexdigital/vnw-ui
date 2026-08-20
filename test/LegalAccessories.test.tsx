import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LegalPage from '@/pages/legal/LegalPage';
import AccessoryCard from '@/shared/components/AccessoryCard';
import AccessoryImageCropper from '@/pages/admin/components/AccessoryImageCropper';
import About from '@/pages/static/About';
import { useStore } from '@/shared/store/useStore';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('legal and accessories experience', () => {
  it('combines the about story, contact form, and configured Google map', () => {
    useStore.setState({ site: {
      CONTACT_EMAIL: 'help@example.test',
      CONTACT_PHONE: '+91 98765 43210',
      WHATSAPP: '919876543210',
      SUPPORT_ADDRESS: 'Jaipur, Rajasthan, India',
    } });
    render(<MemoryRouter initialEntries={['/about?subject=family-pack#contact']}><About /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /About VIP Number World/ })).toBeVisible();
    expect(screen.getByRole('heading', { name: /Contact our team/ })).toBeVisible();
    expect(screen.getByLabelText('Subject')).toHaveValue('family pack');
    expect(screen.getByRole('button', { name: /Send Message/ })).toBeVisible();
    expect(screen.getByTitle('VIP Number World location map')).toHaveAttribute('src', expect.stringContaining('Jaipur%2C%20Rajasthan%2C%20India'));
  });

  it('renders keyboard-operable legal disclosures and configured identity fallbacks', async () => {
    useStore.setState({ site: { SITE_TITLE: 'VIP Number World', CONTACT_EMAIL: 'help@example.test', POLICY_EFFECTIVE_DATE: '1 August 2026' } });
    const user = userEvent.setup(); render(<MemoryRouter><LegalPage policyKey="refund-policy" /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Refund, Cancellation and Return Policy' })).toBeVisible();
    expect(screen.getByText(/Effective 1 August 2026/)).toBeVisible(); expect(screen.getAllByText('help@example.test')).toHaveLength(2);
    const disclosure = screen.getByRole('button', { name: /Accessory issue returns/ }); expect(disclosure).toHaveAttribute('aria-expanded','true');
    await user.click(disclosure); expect(disclosure).toHaveAttribute('aria-expanded','false');
  });

  it('shows real stock, price and free-delivery information on accessory cards', () => {
    render(<MemoryRouter><AccessoryCard product={{ accessory_id:1,slug:'fast-charger',name:'20W Fast Charger',brand:'VNW',model:'C20',sku:'C20',mrp:1299,offer_price:999,discount_pct:23,stock:5,reserved_stock:0,available_stock:5,highlights:[],specifications:[],status:'ACTIVE' }}/></MemoryRouter>);
    expect(screen.getByRole('link',{name:'20W Fast Charger'})).toHaveAttribute('href','/accessories/fast-charger');
    expect(screen.getByText(/Free delivery/)).toBeVisible(); expect(screen.getByRole('button',{name:/Add to cart/})).toBeVisible();
  });

  it('lets homepage shoppers browse every stored product image from the card carousel', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AccessoryCard showcase product={{ accessory_id:1,slug:'fast-charger',name:'20W Fast Charger',brand:'VNW',model:'C20',sku:'C20',mrp:1299,offer_price:999,discount_pct:23,stock:5,reserved_stock:0,available_stock:5,highlights:[],specifications:[],status:'ACTIVE',primary_image_id:9,images:[
      { image_id:9,accessory_id:1,alt_text:'Front view',sort_order:0,is_primary:true },
      { image_id:10,accessory_id:1,alt_text:'Side view',sort_order:1,is_primary:false },
    ] }}/></MemoryRouter>);
    expect(screen.getByRole('button',{name:'Show image 1 of 20W Fast Charger'})).toHaveAttribute('aria-current','true');
    expect(screen.getByRole('button',{name:'Next image of 20W Fast Charger'})).toBeVisible();
    await user.click(screen.getByRole('button',{name:'Show image 2 of 20W Fast Charger'}));
    expect(screen.getByAltText('Side view')).toHaveAttribute('src',expect.stringContaining('/accessories/image/10'));
  });

  it('requires administrators to review every selected image in a fixed square crop', () => {
    Object.defineProperty(URL,'createObjectURL',{configurable:true,value:vi.fn(()=> 'blob:product-image')});
    Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});
    render(<AccessoryImageCropper files={[new File(['image'],'charger.png',{type:'image/png'})]} onCancel={vi.fn()} onComplete={vi.fn()}/>);
    expect(screen.getByRole('dialog',{name:'Crop image 1 of 1'})).toBeVisible();
    expect(screen.getByText(/1200 × 1200/)).toBeVisible();
    expect(screen.getByText('Square 1:1')).toBeVisible();
    expect(screen.getByRole('button',{name:/Crop and upload/})).toBeEnabled();
  });
});
