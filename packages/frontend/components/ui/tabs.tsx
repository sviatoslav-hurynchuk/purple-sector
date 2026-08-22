'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  active: '',
  setActive: () => {},
});

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

/** Tab container that manages the active tab state */
function Tabs({ defaultValue, className, children }: TabsProps) {
  const [active, setActive] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

/** Horizontal tab trigger list */
function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl gap-1',
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

/** Individual tab button */
function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { active, setActive } = React.useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActive(value)}
      className={cn(
        'px-5 py-2 rounded-lg text-sm font-bold transition-all select-none',
        isActive
          ? 'bg-zinc-100 text-zinc-950 shadow-sm'
          : 'text-zinc-400 hover:text-zinc-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

/** Tab panel — only renders its children when it is the active tab */
function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return <div role="tabpanel" className={cn('', className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };