import { SparklesIcon } from 'lucide-react'

type AppLoaderProps = {
  title?: string
  subtitle?: string
}

export function AppLoader({
  title = 'Preparing your workspace',
  subtitle = 'Fetching latest tickets, users, and AI insights...',
}: AppLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 via-background to-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white/90 p-7 text-center shadow-sm">
        <div className="relative mx-auto mb-5 flex size-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-zinc-200" />
          <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-zinc-900 border-r-zinc-900 animate-spin" />
          <div className="loader-spin-reverse absolute inset-3 rounded-full border-2 border-transparent border-b-zinc-500 border-l-zinc-500" />
          <div className="loader-float relative z-10 rounded-full bg-zinc-950 p-2 text-white shadow-sm">
            <SparklesIcon className="size-4" />
          </div>
        </div>

        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
