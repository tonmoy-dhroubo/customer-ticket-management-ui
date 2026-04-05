'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangleIcon, ClipboardListIcon, LogOutIcon, MenuIcon, PlusIcon, RefreshCwIcon, ShieldCheckIcon, UserRoundIcon, Users2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { clearAuthSession, getAccessToken, getAuthType } from '@/lib/auth-storage'
import { Category, Customer, Ticket, TicketPriority, TicketStatus, User } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AppLoader } from '@/components/app-loader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type TabKey = 'overview' | 'tickets' | 'users' | 'customers'

type RoleLite = { id: number; name: string }
type MeUser = { id: number; name: string; email: string; roleId: number; role: RoleLite | null }

const tabItems: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'users', label: 'Users' },
  { key: 'customers', label: 'Customers' },
]

const ticketStatusOptions: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const ticketPriorityOptions: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export function TicketAdminApp() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [currentUser, setCurrentUser] = useState<MeUser | null>(null)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [roles, setRoles] = useState<RoleLite[]>([])

  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    createdBy: '',
    customerId: 'none',
  })

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
  })

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [editTicketForm, setEditTicketForm] = useState({
    id: '',
    status: 'OPEN' as TicketStatus,
    priority: 'MEDIUM' as TicketPriority,
    categoryId: '',
    assignedTo: '',
    summary: '',
  })

  const stats = useMemo(() => {
    const openCount = tickets.filter((ticket) => ticket.status === 'OPEN').length
    const highPriorityCount = tickets.filter(
      (ticket) => ticket.priority === 'HIGH' || ticket.priority === 'URGENT'
    ).length

    return {
      totalTickets: tickets.length,
      openCount,
      highPriorityCount,
      totalUsers: users.length,
      totalCustomers: customers.length,
    }
  }, [customers.length, tickets, users.length])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const me = await api.getMe()
      setCurrentUser(me)

      const [ticketData, userData, customerData, categoryData, roleData] = await Promise.all([
        api.getTickets(),
        api.getUsers(),
        api.getCustomers(),
        api.getCategories(),
        api.getRoles(),
      ])

      setTickets(ticketData)
      setUsers(userData)
      setCustomers(customerData)
      setCategories(categoryData)
      setRoles(roleData)

      setTicketForm((prev) => ({
        ...prev,
        createdBy: prev.createdBy || String(me.id),
      }))
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load data.'

      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid token')) {
        clearAuthSession()
        router.replace('/login')
        return
      }

      setError(message)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  useEffect(() => {
    const token = getAccessToken()
    const authType = getAuthType()

    if (authType === 'CUSTOMER') {
      router.replace('/customer')
      return
    }

    if (!token) {
      router.replace('/login')
      return
    }

    void loadData()
  }, [router])

  const handleLogout = () => {
    clearAuthSession()
    router.replace('/login')
  }

  const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!ticketForm.createdBy) {
      toast.error('Select the creator user first.')
      return
    }

    setSubmitting(true)
    try {
      await api.createTicket({
        title: ticketForm.title,
        description: ticketForm.description,
        createdBy: Number(ticketForm.createdBy),
        customerId: ticketForm.customerId !== 'none' ? Number(ticketForm.customerId) : undefined,
      })

      toast.success('Ticket created successfully.')
      setTicketForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        customerId: 'none',
      }))
      setTicketDialogOpen(false)
      await loadData()
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create ticket.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await api.createUser({
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        roleId: userForm.roleId ? Number(userForm.roleId) : undefined,
      })
      toast.success('User created successfully.')
      setUserForm({ name: '', email: '', password: '', roleId: '' })
      await loadData()
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create user.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await api.createCustomer({
        name: customerForm.name,
        email: customerForm.email,
        phone: customerForm.phone || undefined,
      })
      toast.success('Customer created successfully.')
      setCustomerForm({ name: '', email: '', phone: '' })
      await loadData()
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create customer.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (ticket: Ticket) => {
    setEditTicketForm({
      id: String(ticket.id),
      status: ticket.status,
      priority: ticket.priority,
      categoryId: String(ticket.categoryId),
      assignedTo: ticket.assignedTo ? String(ticket.assignedTo) : '',
      summary: ticket.summary ?? '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editTicketForm.id) {
      return
    }

    setSubmitting(true)
    try {
      await api.updateTicket(Number(editTicketForm.id), {
        status: editTicketForm.status,
        priority: editTicketForm.priority,
        categoryId: Number(editTicketForm.categoryId),
        assignedTo: editTicketForm.assignedTo ? Number(editTicketForm.assignedTo) : undefined,
        summary: editTicketForm.summary,
      })
      toast.success('Ticket updated successfully.')
      setEditDialogOpen(false)
      await loadData()
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update ticket.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !initialized) {
    return <AppLoader title="Loading Admin Portal" subtitle="Syncing tickets, users, customers, and categories..." />
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-50 via-background to-background">
      <aside className="hidden w-64 border-r bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-900 text-zinc-100 lg:flex lg:flex-col">
        <div className="flex flex-col gap-2 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Admin Portal</p>
          <h1 className="font-heading text-lg font-semibold">AI Ticket Manager</h1>
        </div>
        <Separator className="bg-zinc-800" />
        <div className="flex flex-col gap-1 p-2">
          {tabItems.map((item) => (
            <Button
              key={item.key}
              variant={activeTab === item.key ? 'secondary' : 'ghost'}
              className={cn(
                'justify-start text-zinc-100 hover:bg-zinc-800 hover:text-white',
                activeTab === item.key && 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200',
              )}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>AI Ticket Manager</SheetTitle>
            <SheetDescription>Navigate between admin sections.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 p-4">
            {tabItems.map((item) => (
              <Button
                key={item.key}
                variant={activeTab === item.key ? 'secondary' : 'ghost'}
                className="justify-start"
                onClick={() => {
                  setActiveTab(item.key)
                  setMobileNavOpen(false)
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="flex items-center justify-between gap-2 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="outline" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
                <MenuIcon />
              </Button>
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold lg:text-base">Ticket Management Dashboard</h2>
                <p className="text-xs text-muted-foreground">Manage users, tickets, assignments and AI outputs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void loadData()}>
                <RefreshCwIcon data-icon="inline-start" />
                Refresh
              </Button>
              <Button onClick={() => setTicketDialogOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                New Ticket
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOutIcon data-icon="inline-start" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {currentUser && (
            <Alert className="border-zinc-200 bg-white/80 shadow-sm">
              <ShieldCheckIcon data-icon="inline-start" />
              <AlertTitle>Authenticated as {currentUser.name}</AlertTitle>
              <AlertDescription>{currentUser.role?.name ?? 'Role unavailable'}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Backend connection issue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {tabItems.map((item) => (
                  <TabsTrigger key={item.key} value={item.key}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard label="Total Tickets" value={stats.totalTickets} icon={<ClipboardListIcon className="size-4" />} tone="neutral" />
                  <MetricCard label="Open Tickets" value={stats.openCount} icon={<AlertTriangleIcon className="size-4" />} tone="warning" />
                  <MetricCard label="High Priority" value={stats.highPriorityCount} icon={<AlertTriangleIcon className="size-4" />} tone="danger" />
                  <MetricCard label="Users" value={stats.totalUsers} icon={<Users2Icon className="size-4" />} tone="cool" />
                  <MetricCard label="Customers" value={stats.totalCustomers} icon={<UserRoundIcon className="size-4" />} tone="mint" />
                </div>
                <Card className="border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Tickets</CardTitle>
                    <CardDescription>Latest 5 tickets created in the system.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TicketsTable tickets={tickets.slice(0, 5)} onEdit={openEditDialog} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tickets" className="flex flex-col gap-4">
                <Card className="border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>All Tickets</CardTitle>
                    <CardDescription>Admins can override AI output, update status, and reassign ownership.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TicketsTable tickets={tickets} onEdit={openEditDialog} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                <Card className="border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage admin and agent accounts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="size-8">
                                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role?.name ?? 'Unassigned'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Create User</CardTitle>
                    <CardDescription>Create a new user and assign a role.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="user-name">Name</FieldLabel>
                          <Input
                            id="user-name"
                            value={userForm.name}
                            onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="user-email">Email</FieldLabel>
                          <Input
                            id="user-email"
                            type="email"
                            value={userForm.email}
                            onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="user-password">Password</FieldLabel>
                          <Input
                            id="user-password"
                            type="password"
                            value={userForm.password}
                            onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Role</FieldLabel>
                          <Select
                            value={userForm.roleId || undefined}
                            onValueChange={(value) => setUserForm((prev) => ({ ...prev, roleId: value ?? '' }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Roles</SelectLabel>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={String(role.id)}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FieldDescription>Optional. If empty, backend assigns Support Team.</FieldDescription>
                        </Field>
                      </FieldGroup>
                      <Button type="submit" disabled={submitting}>Create User</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                <Card className="border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>Customer profiles used for support history and ownership.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phone || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Create Customer</CardTitle>
                    <CardDescription>Add a customer for future ticket associations.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCustomer} className="flex flex-col gap-4">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="customer-name">Name</FieldLabel>
                          <Input
                            id="customer-name"
                            value={customerForm.name}
                            onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="customer-email">Email</FieldLabel>
                          <Input
                            id="customer-email"
                            type="email"
                            value={customerForm.email}
                            onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
                          <Input
                            id="customer-phone"
                            value={customerForm.phone}
                            onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                          />
                        </Field>
                      </FieldGroup>
                      <Button type="submit" disabled={submitting}>Create Customer</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
      </main>

      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
            <DialogDescription>Ticket will be auto-classified by the backend mock AI service.</DialogDescription>
          </DialogHeader>

          <form id="create-ticket-form" onSubmit={handleCreateTicket} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ticket-title">Title</FieldLabel>
                <Input
                  id="ticket-title"
                  value={ticketForm.title}
                  onChange={(event) => setTicketForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ticket-description">Description</FieldLabel>
                <Textarea
                  id="ticket-description"
                  rows={5}
                  value={ticketForm.description}
                  onChange={(event) => setTicketForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Created By</FieldLabel>
                <Select
                  value={ticketForm.createdBy || undefined}
                  onValueChange={(value) => setTicketForm((prev) => ({ ...prev, createdBy: value ?? '' }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Users</SelectLabel>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Customer</FieldLabel>
                <Select
                  value={ticketForm.customerId}
                  onValueChange={(value) => setTicketForm((prev) => ({ ...prev, customerId: value ?? 'none' }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Optional customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Customers</SelectLabel>
                      <SelectItem value="none">No customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-ticket-form" disabled={submitting}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage Ticket</DialogTitle>
            <DialogDescription>Override AI results and update assignment or progress status.</DialogDescription>
          </DialogHeader>

          <form id="edit-ticket-form" onSubmit={handleUpdateTicket} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={editTicketForm.status}
                  onValueChange={(value) =>
                    setEditTicketForm((prev) => ({ ...prev, status: (value ?? 'OPEN') as TicketStatus }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      {ticketStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  value={editTicketForm.priority}
                  onValueChange={(value) =>
                    setEditTicketForm((prev) => ({ ...prev, priority: (value ?? 'MEDIUM') as TicketPriority }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Priority</SelectLabel>
                      {ticketPriorityOptions.map((priority) => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={editTicketForm.categoryId || undefined}
                  onValueChange={(value) => setEditTicketForm((prev) => ({ ...prev, categoryId: value ?? '' }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Category</SelectLabel>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Assigned To</FieldLabel>
                <Select
                  value={editTicketForm.assignedTo || undefined}
                  onValueChange={(value) => setEditTicketForm((prev) => ({ ...prev, assignedTo: value ?? '' }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Users</SelectLabel>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>Keep empty to preserve current assignee.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="ticket-summary">Summary</FieldLabel>
                <Textarea
                  id="ticket-summary"
                  value={editTicketForm.summary}
                  onChange={(event) => setEditTicketForm((prev) => ({ ...prev, summary: event.target.value }))}
                  rows={4}
                />
              </Field>
            </FieldGroup>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="edit-ticket-form" disabled={submitting}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: ReactNode
  tone: 'neutral' | 'warning' | 'danger' | 'cool' | 'mint'
}) {
  const toneClass = {
    neutral: 'bg-zinc-50 border-zinc-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
    cool: 'bg-sky-50 border-sky-200',
    mint: 'bg-emerald-50 border-emerald-200',
  }[tone]

  return (
    <Card className={cn('shadow-sm', toneClass)}>
      <CardHeader>
        <div className="mb-2 inline-flex size-7 items-center justify-center rounded-full bg-white/80 text-zinc-700">
          {icon}
        </div>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
      </CardHeader>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Live data from API</p>
      </CardFooter>
    </Card>
  )
}

function TicketsTable({ tickets, onEdit }: { tickets: Ticket[]; onEdit: (ticket: Ticket) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Summary</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell className="font-medium">{ticket.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{ticket.category?.name ?? `#${ticket.categoryId}`}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={statusClass(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-zinc-900" style={{ width: `${Math.round(Number(ticket.aiConfidence) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(Number(ticket.aiConfidence) * 100)}%</span>
              </div>
            </TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">{ticket.summary ?? 'No summary'}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onEdit(ticket)}>Manage</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function priorityVariant(priority: TicketPriority): 'default' | 'secondary' | 'destructive' {
  if (priority === 'URGENT') {
    return 'destructive'
  }

  if (priority === 'HIGH') {
    return 'default'
  }

  return 'secondary'
}

function statusClass(status: TicketStatus): string {
  if (status === 'OPEN') {
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }

  if (status === 'IN_PROGRESS') {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  if (status === 'RESOLVED') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }

  return 'bg-zinc-100 text-zinc-700 border-zinc-200'
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
