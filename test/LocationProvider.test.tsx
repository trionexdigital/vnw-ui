import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LocationProvider, { LocationButton, RtaLocationControls, useLocationPreference } from '@/shared/location/LocationProvider';
import { LanguageContext } from '@/shared/language/LanguageContext';

const api=vi.hoisted(()=>({pincode:vi.fn()}));
vi.mock('@/core/api/vnwAPI',()=>({locationAPI:{pincode:api.pincode}}));
function Probe(){const {pin,showAll}=useLocationPreference();return <output data-testid="preference">{pin}:{String(showAll)}</output>;}
function mount(chooserOpen=false){return render(<MemoryRouter><LanguageContext.Provider value={{language:'en',chooserOpen,openChooser:()=>{},t:source=>source}}><LocationProvider><LocationButton/><RtaLocationControls/><Probe/></LocationProvider></LanguageContext.Provider></MemoryRouter>);}
beforeEach(()=>{localStorage.clear();sessionStorage.clear();api.pincode.mockReset();Object.defineProperty(window,'isSecureContext',{configurable:true,value:true});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});

it('waits for language selection, remembers skip, and allows reopening',async()=>{
  const view=mount(true);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  view.rerender(<MemoryRouter><LanguageContext.Provider value={{language:'en',chooserOpen:false,openChooser:()=>{},t:source=>source}}><LocationProvider><LocationButton/><Probe/></LocationProvider></LanguageContext.Provider></MemoryRouter>);
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Skip'}));
  expect(localStorage.getItem('vnw_location_prompt_seen')).toBe('1');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Choose your location'}));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('validates PINs, saves a device preference, and resets the show-all override',async()=>{
  sessionStorage.setItem('vnw_show_all_rta','1');mount();
  const input=await screen.findByRole('textbox',{name:'PIN code'});
  fireEvent.change(input,{target:{value:'000001'}});
  await userEvent.click(screen.getByRole('button',{name:'Save PIN code'}));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid six-digit PIN code.');
  fireEvent.change(input,{target:{value:'400001'}});
  await userEvent.click(screen.getByRole('button',{name:'Save PIN code'}));
  expect(localStorage.getItem('vnw_pin_code')).toBe('400001');
  expect(sessionStorage.getItem('vnw_show_all_rta')).toBe('0');
  expect(screen.getByTestId('preference')).toHaveTextContent('400001:false');
});

it('shares the explicit show-all choice and restores PIN matching without discarding the PIN',async()=>{
  localStorage.setItem('vnw_pin_code','400001');mount();
  await userEvent.click(screen.getByRole('button',{name:'Show all RTA numbers'}));
  expect(sessionStorage.getItem('vnw_show_all_rta')).toBe('1');
  expect(screen.getByTestId('preference')).toHaveTextContent('400001:true');
  await userEvent.click(screen.getByRole('button',{name:'Show numbers for my PIN'}));
  expect(screen.getByTestId('preference')).toHaveTextContent('400001:false');
});

it('requires confirmation of a detected PIN and ignores late GPS responses after editing',async()=>{
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(success:any)=>success({coords:{latitude:19,longitude:72}})}});
  let resolve:(value:any)=>void=()=>{};
  api.pincode.mockImplementation(()=>new Promise(done=>{resolve=done;}));mount();
  await userEvent.click(await screen.findByRole('button',{name:'Use my location'}));
  await waitFor(()=>expect(api.pincode).toHaveBeenCalledWith(19,72));
  fireEvent.change(screen.getByRole('textbox',{name:'PIN code'}),{target:{value:'500001'}});
  resolve({pin_code:'400001'});
  await waitFor(()=>expect(screen.getByRole('textbox',{name:'PIN code'})).toHaveValue('500001'));
  expect(localStorage.getItem('vnw_pin_code')).toBeNull();
  api.pincode.mockResolvedValue({pin_code:'400001'});
  await userEvent.click(screen.getByRole('button',{name:'Use my location'}));
  expect(await screen.findByText('Confirm or correct the detected PIN code before saving.')).toBeInTheDocument();
  expect(localStorage.getItem('vnw_pin_code')).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Save PIN code'}));
  expect(localStorage.getItem('vnw_pin_code')).toBe('400001');
});

it('keeps a confirmed PIN after GPS denial or an unavailable lookup',async()=>{
  localStorage.setItem('vnw_pin_code','400001');mount();
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_success:any,failure:any)=>failure({code:1})}});
  await userEvent.click(screen.getByRole('button',{name:'Change PIN code'}));
  await userEvent.click(screen.getByRole('button',{name:'Use my location'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Location access failed');
  await userEvent.click(screen.getByRole('button',{name:'Skip'}));
  expect(localStorage.getItem('vnw_pin_code')).toBe('400001');
});

it('requests an accurate GPS fix and distinguishes a busy or unavailable lookup from a missing postcode',async()=>{
  const getCurrentPosition=vi.fn((success:any,_failure:any,options:any)=>{expect(options.enableHighAccuracy).toBe(true);success({coords:{latitude:19,longitude:72}});});
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition}});
  api.pincode.mockResolvedValue({pin_code:null,reason:'BUSY'});mount();
  await userEvent.click(await screen.findByRole('button',{name:'Use my location'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Location lookup is busy. Please wait a moment and try again.');
  api.pincode.mockResolvedValue({pin_code:null,reason:'UNAVAILABLE'});
  await userEvent.click(screen.getByRole('button',{name:'Use my location'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Location lookup is temporarily unavailable.');
  api.pincode.mockRejectedValue(new Error('Network error'));
  await userEvent.click(screen.getByRole('button',{name:'Use my location'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Location lookup is temporarily unavailable.');
  expect(screen.queryByText('Location access failed or was denied. Enter your PIN code manually.')).not.toBeInTheDocument();
});
