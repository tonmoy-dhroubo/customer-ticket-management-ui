'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LifeBuoyIcon, LogOutIcon, PlusIcon, RefreshCwIcon, SparklesIcon, TicketIcon } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { clearAuthSession, getAccessToken, getAuthType } from '@/lib/auth-storage'
import { Ticket } from '@/types'
import { AppLogo } from '@/components/app-logo'
import { AppLoader } from '@/components/app-loader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type CustomerMe = {
  id: number
  name: string
  email: string
  phone: string | null
  createdAt: string
}

export function CustomerTicketApp() {
  const router = useRouter()

  const [customer, setCustomer] = useState<CustomerMe | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'OPEN').length
    const inProgress = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length

    return {
      total: tickets.length,
      open,
      inProgress,
      resolved,
    }
  }, [tickets])

  const loadData = async () => {
    setLoading(true)
    try {
      const [me, myTickets] = await Promise.all([api.getCustomerMe(), api.getCustomerTickets()])
      setCustomer(me)
      setTickets(myTickets)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load customer data.'
      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid token')) {
        clearAuthSession()
        router.replace('/login?mode=customer')
        return
      }

      toast.error(message)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  useEffect(() => {
    const token = getAccessToken()
    const authType = getAuthType()

    if (!token) {
      router.replace('/login?mode=customer')
      return
    }

    if (authType !== 'CUSTOMER') {
      router.replace('/login?mode=customer')
      return
    }

    void loadData()
  }, [router])

  const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await api.createCustomerTicket({ title, description })
      toast.success('Ticket submitted successfully.')
      setTitle('')
      setDescription('')
      await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit ticket.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    router.replace('/login?mode=customer')
  }

  const statusBadgeClass = (status: Ticket['status']) => {
    if (status === 'OPEN') {
      return 'bg-amber-100 text-amber-800 border-amber-200'
    }
    if (status === 'IN_PROGRESS') {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    if (status === 'RESOLVED') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
    return 'bg-zinc-200 text-zinc-700 border-zinc-300'
  }

  const priorityBadgeClass = (priority: Ticket['priority']) => {
    if (priority === 'URGENT') {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (priority === 'HIGH') {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    }
    if (priority === 'MEDIUM') {
      return 'bg-sky-100 text-sky-800 border-sky-200'
    }
    return 'bg-zinc-100 text-zinc-700 border-zinc-200'
  }

  if (loading && !initialized) {
    return <AppLoader title="Loading Customer Portal" subtitle="Bringing your tickets and latest status updates..." />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-background to-background">
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-40 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 lg:px-6 lg:py-8">
        <Card className="overflow-hidden border-zinc-200 shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-800 p-5 text-white lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">Customer Portal</p>
                <h1 className="mt-1 font-heading text-2xl font-semibold lg:text-3xl">My Support Desk</h1>
                <p className="mt-2 text-sm text-zinc-300">
                  Submit tickets, track updates, and see how AI classified your requests.
                </p>
              </div>
              <AppLogo className="w-full basis-full pt-1 [&_p:first-child]:text-white [&_p:last-child]:text-zinc-300" />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => void loadData()}
                >
                  <RefreshCwIcon data-icon="inline-start" />
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  className="text-zinc-100 hover:bg-white/10 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOutIcon data-icon="inline-start" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="grid gap-3 p-4 lg:grid-cols-4 lg:p-5">
            <Card className="border-zinc-200/80 shadow-none lg:col-span-2">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed In As</p>
                <p className="mt-1 text-lg font-semibold">{customer?.name ?? 'Customer'}</p>
                <p className="text-sm text-muted-foreground">{customer?.email ?? 'Signed in customer account'}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Open</p>
                <p className="mt-1 text-2xl font-semibold">{stats.open}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">In Progress</p>
                <p className="mt-1 text-2xl font-semibold">{stats.inProgress}</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TicketIcon className="size-4" />
                Create New Ticket
              </CardTitle>
              <CardDescription>
                Share clear details. We will summarize and route your issue automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="ticket-title">Title</FieldLabel>
                    <Input
                      id="ticket-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Example: Invoice generated twice for April"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ticket-description">Description</FieldLabel>
                    <Textarea
                      id="ticket-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={6}
                      placeholder="Explain what happened, when it started, and what you expected."
                      required
                    />
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-auto rounded-xl border border-zinc-900/10 bg-zinc-950 px-5 py-2.5 font-medium text-white shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md"
                >
                  <PlusIcon data-icon="inline-start" />
                  Submit Ticket
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="size-4" />
                What Happens Next
              </CardTitle>
              <CardDescription>Each ticket goes through automated triage before human follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border bg-zinc-50/70 p-3">
                <p className="text-sm font-medium">1. AI Classification</p>
                <p className="mt-1 text-sm text-muted-foreground">Category and priority are predicted from your description.</p>
              </div>
              <div className="rounded-xl border bg-zinc-50/70 p-3">
                <p className="text-sm font-medium">2. Team Assignment</p>
                <p className="mt-1 text-sm text-muted-foreground">The ticket is routed to Finance, Tech, Product, or Support.</p>
              </div>
              <div className="rounded-xl border bg-zinc-50/70 p-3">
                <p className="text-sm font-medium">3. Agent Follow-up</p>
                <p className="mt-1 text-sm text-muted-foreground">Your status updates will appear in this portal.</p>
              </div>
              <div className="rounded-xl border bg-zinc-950 p-3 text-zinc-100">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <LifeBuoyIcon className="size-4" />
                  Total Tickets Submitted
                </p>
                <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>Latest tickets you created with real-time status and AI metadata.</CardDescription>
          </CardHeader>
          <CardContent>
            <>
                <div className="hidden rounded-xl border md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>AI Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('border', statusBadgeClass(ticket.status))}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('border', priorityBadgeClass(ticket.priority))}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.category?.name ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant={ticket.aiSource === 'GEMINI' ? 'default' : 'secondary'}>
                              {ticket.aiSource}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-xl border p-3">
                      <p className="font-medium">{ticket.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className={cn('border', statusBadgeClass(ticket.status))}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={cn('border', priorityBadgeClass(ticket.priority))}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="secondary">{ticket.category?.name ?? '-'}</Badge>
                        <Badge variant={ticket.aiSource === 'GEMINI' ? 'default' : 'secondary'}>
                          {ticket.aiSource}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {!tickets.length && (
                  <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                    No tickets yet. Submit your first issue above.
                  </div>
                )}
              </>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
