type AmbientBackdropProps = {
  /** Stronger blobs (e.g. landing hero) */
  intensity?: 'subtle' | 'medium' | 'strong'
  className?: string
}

export function AmbientBackdrop({ intensity = 'subtle', className = '' }: AmbientBackdropProps) {
  const op =
    intensity === 'strong' ? { a: 0.5, b: 0.35, c: 0.28 } : intensity === 'medium' ? { a: 0.35, b: 0.22, c: 0.18 } : { a: 0.22, b: 0.14, c: 0.12 }

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="ambient-blob -top-[20%] -left-[10%] h-[min(70vw,520px)] w-[min(70vw,520px)] animate-float-slow"
        style={{
          background: `radial-gradient(circle, rgba(59,130,246,${op.a}) 0%, transparent 68%)`,
        }}
      />
      <div
        className="ambient-blob top-[35%] -right-[15%] h-[min(55vw,420px)] w-[min(55vw,420px)] animate-float-slower"
        style={{
          background: `radial-gradient(circle, rgba(34,211,238,${op.b}) 0%, transparent 65%)`,
        }}
      />
      <div
        className="ambient-blob -bottom-[15%] left-[20%] h-[min(60vw,480px)] w-[min(60vw,480px)] animate-float-slow"
        style={{
          background: `radial-gradient(circle, rgba(37,99,235,${op.c}) 0%, transparent 70%)`,
          animationDelay: '-8s',
        }}
      />
      <div className="absolute inset-0 bg-gradient-mesh opacity-80" />
      <div className="absolute inset-0 dot-grid opacity-30" />
    </div>
  )
}
