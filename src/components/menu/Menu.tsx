import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Popover as BasePopover } from '@base-ui/react/popover'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type PopoverProps = {
  open: boolean
  onOpenChange(open: boolean): void
  trigger: ReactElement
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function Popover({ open, onOpenChange, trigger, children, title, description, className, side = 'bottom' }: PopoverProps) {
  return (
    <BasePopover.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} sideOffset={8} className="z-50">
          <BasePopover.Popup className={cn('max-w-sm rounded-xl border border-tint-border bg-tint-panel p-3 text-tint-ink shadow-lg outline-none', className)}>
            {title ? <BasePopover.Title className="text-sm font-semibold">{title}</BasePopover.Title> : null}
            {description ? <BasePopover.Description className="mt-1 text-xs text-tint-muted">{description}</BasePopover.Description> : null}
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  )
}

export type MenuItem = { id: string; label: ReactNode; disabled?: boolean; danger?: boolean; onSelect?: () => void }
export type MenuProps = {
  open: boolean
  onOpenChange(open: boolean): void
  trigger: ReactElement
  items: readonly (MenuItem | { id: string; type: 'separator' })[]
  label?: string
  className?: string
}

export function Menu({ open, onOpenChange, trigger, items, label = 'Menu', className }: MenuProps) {
  return (
    <BaseMenu.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={6} className="z-50">
          <BaseMenu.Popup aria-label={label} className={cn('min-w-44 rounded-lg border border-tint-border bg-tint-panel py-1 text-tint-ink shadow-lg outline-none', className)}>
            {items.map((item) => 'type' in item ? (
              <BaseMenu.Separator key={item.id} className="my-1 h-px bg-tint-border" />
            ) : (
              <BaseMenu.Item
                key={item.id}
                disabled={item.disabled}
                onClick={item.onSelect}
                className={cn('cursor-default px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-tint-accent-soft', item.danger && 'text-tint-danger-ink')}
              >
                {item.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

export type TabItem = { id: string; label: ReactNode; content: ReactNode; disabled?: boolean }
export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  tabs: readonly TabItem[]
  value: string
  onValueChange(value: string): void
  label?: string
}

export function Tabs({ tabs, value, onValueChange, label = 'Tabs', className, ...props }: TabsProps) {
  return (
    <BaseTabs.Root value={value} onValueChange={(next) => onValueChange(String(next))} className={className} {...props}>
      <BaseTabs.List aria-label={label} className="relative flex gap-1 border-b border-tint-border">
        {tabs.map((tab) => (
          <BaseTabs.Tab key={tab.id} value={tab.id} disabled={tab.disabled} className="px-3 py-2 text-sm text-tint-muted outline-none data-[selected]:font-medium data-[selected]:text-tint-accent data-[disabled]:opacity-50">
            {tab.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className="absolute bottom-0 h-0.5 bg-tint-accent transition-all motion-reduce:transition-none" />
      </BaseTabs.List>
      {tabs.map((tab) => <BaseTabs.Panel key={tab.id} value={tab.id} className="py-3 outline-none">{tab.content}</BaseTabs.Panel>)}
    </BaseTabs.Root>
  )
}
