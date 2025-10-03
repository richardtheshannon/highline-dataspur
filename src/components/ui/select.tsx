import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => context?.setOpen(!context.open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const context = React.useContext(SelectContext)
  return <span>{context?.value || placeholder || "Select..."}</span>
}

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  const context = React.useContext(SelectContext)

  if (!context?.open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => context.setOpen(false)}
      />
      <div
        className={cn(
          "absolute top-full mt-1 z-50 w-full rounded-md border bg-white dark:bg-gray-800 shadow-lg",
          className
        )}
        {...props}
      >
        <div className="p-1">
          {children}
        </div>
      </div>
    </>
  )
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  className,
  children,
  ...props
}) => {
  const context = React.useContext(SelectContext)

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        context?.value === value && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => {
        context?.onValueChange?.(value)
        context?.setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}