import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Modal({ open, onClose, title, children, wide, extraWide, className = '' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; extraWide?: boolean; className?: string }) {
  const { pathname } = useLocation();
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[90] bg-[var(--vnw-overlay)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <Dialog.Content aria-describedby={undefined} className={`fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 ${extraWide ? 'max-w-6xl' : wide ? 'max-w-2xl' : 'max-w-md'} glass-panel max-h-[90dvh] overflow-y-auto overscroll-contain rounded-[1.5rem] p-6 data-[state=open]:animate-in data-[state=open]:fade-in-0 ${pathname.startsWith('/admin') ? 'admin-dialog' : ''} ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <Dialog.Title className="min-w-0 break-words text-lg font-black text-foreground">{title}</Dialog.Title>
          <Dialog.Close asChild><button type="button" aria-label="Close dialog" className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
    </Dialog.Root>
  );
}
