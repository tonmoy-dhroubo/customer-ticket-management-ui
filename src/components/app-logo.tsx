import { cn } from '@/lib/utils'

type AppLogoProps = {
  className?: string
  showText?: boolean
}

export function AppLogo({ className, showText = true }: AppLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="size-9 rounded-xl"
        role="img"
      >
        <defs>
          <linearGradient id="ticket-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181B" />
            <stop offset="100%" stopColor="#3F3F46" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#ticket-logo-gradient)" />
        <path
          d="M12 14h16a1 1 0 0 1 1 1v4a3 3 0 0 0 0 6v4a1 1 0 0 1-1 1H12a1 1 0 0 1-1-1v-4a3 3 0 0 0 0-6v-4a1 1 0 0 1 1-1Z"
          fill="white"
          opacity="0.95"
        />
        <circle cx="20" cy="20" r="2.4" fill="#18181B" />
        <path d="M20 14v16" stroke="#18181B" strokeWidth="1.5" strokeDasharray="1.8 2.2" />
      </svg>
      {showText && (
        <div className="leading-tight">
          <p className="font-heading text-sm font-semibold tracking-tight">TicketPilot</p>
          <p className="text-[11px] text-muted-foreground">AI Ticket Management</p>
        </div>
      )}
    </div>
  )
}
