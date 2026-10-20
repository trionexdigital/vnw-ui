import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Modal from '@/shared/components/Modal';
import { BrandLockup } from '@/shared/components/Logo';
import { useLanguage } from '@/shared/language/LanguageContext';
import { LanguageText } from '@/shared/language/LanguageText';
import { locationAPI } from '@/core/api/vnwAPI';

export const validPin = (value: string) => /^[1-9][0-9]{5}$/.test(value);
export function lookupFailureMessage(reason?: string) {
  if (reason === 'BUSY') return 'Location lookup is busy. Please wait a moment and try again.';
  if (reason === 'UNAVAILABLE' || !reason) return 'Location lookup is temporarily unavailable. Please try again or enter your PIN code.';
  return 'We could not detect an Indian PIN code. Enter it manually or try again.';
}
const read = (key: string, session = false) => { try { return (session ? sessionStorage : localStorage).getItem(key) || ''; } catch { return ''; } };
const write = (key: string, value: string, session = false) => { try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* In-memory preferences still work. */ } };
const LocationContext = createContext({ pin: '', showAll: false, revision: 0, chooserOpen: false, promptResolved: false, openChooser: () => {}, setShowAll: (_value: boolean) => {} });
export const useLocationPreference = () => useContext(LocationContext);

export function LocationButton() {
  const { openChooser } = useLocationPreference();
  return <button type="button" onClick={openChooser} aria-label="Choose your location" title="Choose your location" data-location-button className="store-header__button store-header__icon"><MapPin aria-hidden="true" /></button>;
}

export default function LocationProvider({ children }: { children: ReactNode }) {
  const language = useLanguage();
  const { pathname } = useLocation();
  const consoleRoute = language.consoleRoute || /^\/(admin|dealer|employee)(\/|$)/.test(pathname);
  const [pin, setPin] = useState(() => validPin(read('vnw_pin_code')) ? read('vnw_pin_code') : '');
  const [revision, setRevision] = useState(0);
  const [showAll, updateShowAll] = useState(() => read('vnw_show_all_rta', true) === '1');
  const [seen, setSeen] = useState(() => !!read('vnw_location_prompt_seen') || !!read('vnw_pin_code'));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(pin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState(false);
  const request = useRef(0);
  const setShowAll = (value: boolean) => { updateShowAll(value); write('vnw_show_all_rta', value ? '1' : '0', true); };
  const openChooser = () => { request.current++; setBusy(false); setDraft(pin); setError(''); setDetected(false); setOpen(true); };
  const dismiss = () => { request.current++; setBusy(false); setOpen(false); setSeen(true); write('vnw_location_prompt_seen', '1'); };
  useEffect(() => { if (!consoleRoute && !language.chooserOpen && !seen) setOpen(true); }, [consoleRoute, language.chooserOpen, seen]);
  useEffect(() => { request.current++; setBusy(false); }, [consoleRoute, language.chooserOpen]);
  useEffect(() => () => { request.current++; }, []);

  const detect = async () => {
    const id = ++request.current;
    setError(''); setDetected(false);
    if (!window.isSecureContext || !navigator.geolocation) { setError('GPS is unavailable. Enter your PIN code manually.'); return; }
    setBusy(true);
    let stage: 'gps' | 'lookup' = 'gps';
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, maximumAge: 0, enableHighAccuracy: true }));
      if (id !== request.current) return;
      stage = 'lookup';
      const result = await locationAPI.pincode(position.coords.latitude, position.coords.longitude);
      if (id !== request.current) return;
      if (result.pin_code && validPin(result.pin_code)) { setDraft(result.pin_code); setDetected(true); }
      else setError(lookupFailureMessage(result.reason));
    } catch { if (id === request.current) setError(stage === 'gps' ? 'Location access failed or was denied. Enter your PIN code manually.' : lookupFailureMessage('UNAVAILABLE')); }
    finally { if (id === request.current) setBusy(false); }
  };

  return <LocationContext.Provider value={{ pin, showAll, revision, chooserOpen: open && !language.chooserOpen, promptResolved: seen, openChooser, setShowAll }}>
    {children}
    {!consoleRoute && !language.chooserOpen && <Modal open={open} onClose={dismiss} title="Choose your location">
      <form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (!validPin(draft)) { setError('Enter a valid six-digit PIN code.'); return; } setPin(draft); setRevision(value => value + 1); write('vnw_pin_code', draft); setShowAll(false); dismiss(); }}>
        <div className="flex justify-center"><BrandLockup /></div>
        <p className="text-sm text-muted-foreground">Choose a PIN code to find numbers ready to activate in your area.</p>
        <button type="button" className="btn-gold-outline" disabled={busy} onClick={() => void detect()}>{busy ? 'Detecting location…' : 'Use my location'}</button>
        <p className="text-xs text-muted-foreground">Using GPS sends your approximate location to OpenStreetMap to find your PIN code.</p>
        <label className="grid gap-2 text-sm font-bold">PIN code<input data-location-pin inputMode="numeric" autoComplete="postal-code" maxLength={6} value={draft} onChange={event => { request.current++; setBusy(false); setDetected(false); setError(''); setDraft(event.target.value); }} className="h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
        {detected && <p role="status" className="text-sm">Confirm or correct the detected PIN code before saving.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{language.t(error)}</p>}
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy} className="btn-gold">Save PIN code</button><button type="button" className="btn-gold-outline" onClick={dismiss}>Skip</button></div>
        <a className="text-xs underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
      </form>
    </Modal>}
  </LocationContext.Provider>;
}

export function RtaLocationControls({ loading = false, total = 0, home = false }: { loading?: boolean; total?: number; home?: boolean }) {
  const { pin, showAll, setShowAll, openChooser } = useLocationPreference();
  return <div className="flex min-w-0 flex-col gap-3 py-3" data-rta-location-controls>
    <div className="flex flex-wrap items-center gap-2">
      {pin ? <span className="text-sm"><LanguageText source="PIN code: {pin}" values={{ pin }} /></span> : <span className="text-sm">Set your PIN code to see local RTA numbers.</span>}
      <button type="button" data-location-change className="btn-gold-outline min-h-9 px-3 text-xs" onClick={openChooser}>{pin ? 'Change PIN code' : 'Choose your location'}</button>
      {showAll ? <button type="button" data-rta-local-only className="btn-gold-outline min-h-9 px-3 text-xs" onClick={() => setShowAll(false)}>Show numbers for my PIN</button> : (!pin || (!loading && total === 0)) && <button type="button" data-rta-show-all className="btn-gold min-h-9 px-3 text-xs" onClick={() => setShowAll(true)}>{home ? 'Show all numbers' : 'Show all RTA numbers'}</button>}
    </div>
    {showAll ? <p className="text-xs text-muted-foreground">Showing all RTA numbers. Activation availability depends on the service area.</p> : pin && !loading && total === 0 ? <p role="status" className="text-sm text-muted-foreground">No RTA numbers match your PIN code and current filters.</p> : null}
  </div>;
}
