'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Root dialog provider */
function Dialog({ children, open, onOpenChange }: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
    >
      {children}
    </DialogPrimitive.Root>
  );
}

/** Invisible wrapper that opens the dialog when its child is interacted with */
function DialogTrigger({ children }: { children: React.ReactElement }) {
  return <DialogPrimitive.Trigger render={children} />;
}

/** Semi-transparent backdrop rendered behind the dialog panel */
function DialogBackdrop({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-200',
        className
      )}
      {...props}
    />
  );
}

/** Centred modal panel */
function DialogPanel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-h-[90vh] overflow-hidden',
          'rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col',
          'duration-200',
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

/** Scrollable content area */
function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto overscroll-contain', className)} {...props} />
  );
}

/** Sticky header with red top accent line */
function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-between px-6 py-5 border-b border-zinc-800 shrink-0',
        'after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5',
        'after:bg-gradient-to-r after:from-primary after:via-primary/60 after:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/** Close (x) button for the header */
function DialogClose({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        'size-8 rounded-lg flex items-center justify-center',
        'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className
      )}
      {...props}
    >
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </DialogPrimitive.Close>
  );
}

/** Accessible title inside the dialog header */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-black tracking-tight uppercase italic', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPanel,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogTitle,
};