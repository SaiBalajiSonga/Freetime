import { cn } from "@/lib/utils"
import React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "destructive"
  dot?: boolean
}

function Badge({ className, variant = "default", dot = true, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-border bg-surface-2 px-3.5 py-1.5 text-xs uppercase tracking-[0.18em] text-muted font-medium transition-colors",
        variant === "outline" && "bg-transparent border-border-strong text-foreground",
        variant === "secondary" && "bg-surface border-border text-muted",
        variant === "destructive" && "bg-red-500/10 border-red-500/20 text-red-400",
        className
      )}
      {...props}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-accent-electric shadow-[0_0_10px_rgba(96,165,250,0.65)]" />
      )}
      {children}
    </span>
  )
}

export { Badge }
