import { ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1d1830]/45 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} glass-panel max-h-[90vh] overflow-y-auto rounded-[1.5rem] p-6 animate-rise-in`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#1d1830]">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-2xl bg-white/64 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
