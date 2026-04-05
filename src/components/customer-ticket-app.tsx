'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOutIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { clearAuthSession, getAccessToken, getAuthType } from '@/lib/auth-storage'
import { Ticket } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

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
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer Portal</p>
          <h1 className="font-heading text-xl font-semibold">My Support Tickets</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadData()}>
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOutIcon data-icon="inline-start" />
            Logout
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{loading ? 'Loading profile...' : customer?.name ?? 'Customer'}</CardTitle>
          <CardDescription>{customer?.email ?? 'Signed in customer account'}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create New Ticket</CardTitle>
          <CardDescription>Describe your issue and we will auto-classify and assign it.</CardDescription>
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
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ticket-description">Description</FieldLabel>
                <Textarea
                  id="ticket-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={submitting}>
              <PlusIcon data-icon="inline-start" />
              Submit Ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
          <CardDescription>Latest tickets you have created.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
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
                      <Badge variant="secondary">{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>{ticket.priority}</TableCell>
                    <TableCell>{ticket.category?.name ?? '-'}</TableCell>
                    <TableCell>{ticket.aiSource}</TableCell>
                  </TableRow>
                ))}
                {!tickets.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No tickets yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
