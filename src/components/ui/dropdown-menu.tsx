import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined)

export const DropdownMenu: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        context?.setOpen(!context.open)
      }}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  className,
  align = "start",
  children,
  ...props
}) => {
  const context = React.useContext(DropdownMenuContext)

  if (!context?.open) return null

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => context.setOpen(false)}
      />
      <div
        className={cn(
          "absolute top-full mt-1 z-50 min-w-[8rem] rounded-md border bg-white dark:bg-gray-800 shadow-lg",
          alignmentClasses[align],
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

export const DropdownMenuItem: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
> = ({ className, children, onClick, ...props }) => {
  const context = React.useContext(DropdownMenuContext)

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        context?.setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export const DropdownMenuSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn("-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700", className)} {...props} />
)