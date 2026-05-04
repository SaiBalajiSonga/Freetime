import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-white rounded-pill shadow-[0_10px_36px_-8px_rgba(59,130,246,0.55)] hover:brightness-110 active:brightness-95 active:scale-[0.98]",
        default:
          "bg-gradient-primary text-white rounded-pill shadow-[0_10px_36px_-8px_rgba(59,130,246,0.55)] hover:brightness-110 active:brightness-95 active:scale-[0.98]",
        outline:
          "rounded-pill border border-border-strong bg-transparent text-foreground hover:bg-surface-2 hover:border-accent-electric/35 focus-visible:ring-2 focus-visible:ring-accent-electric/35 focus-visible:border-accent-electric",
        secondary:
          "rounded-pill border border-border-strong bg-surface-2 text-foreground hover:bg-surface-2/80",
        ghost:
          "rounded-pill text-muted hover:text-foreground hover:bg-surface-2",
        destructive:
          "rounded-pill bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        link: "text-accent-electric underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-6 py-3 text-sm",
        sm: "h-8 gap-1.5 px-4 py-2 text-sm",
        lg: "h-12 gap-2 px-7 py-4 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        xs: "h-7 gap-1 px-3 py-1.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
