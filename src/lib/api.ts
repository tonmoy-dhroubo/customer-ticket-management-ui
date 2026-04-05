import { Category, Customer, Ticket, User } from '@/types'
import { getAccessToken } from '@/lib/auth-storage'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let message = `Request failed: ${response.status}`
    const text = await response.text()

    if (text) {
      try {
        const payload = JSON.parse(text) as { message?: string | string[] }
        if (Array.isArray(payload.message)) {
          message = payload.message.join(', ')
        } else if (payload.message) {
          message = payload.message
        } else {
          message = text
        }
      } catch {
        message = text
      }
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export const api = {
  getMe: () => request<{ id: number; name: string; email: string; roleId: number; role: { id: number; name: string } | null }>('/auth/me'),
  getCustomerMe: () => request<{ id: number; name: string; email: string; phone: string | null; createdAt: string }>('/customer-auth/me'),
  getTickets: () => request<Ticket[]>('/tickets'),
  getCustomerTickets: () => request<Ticket[]>('/tickets/customer/me'),
  getUsers: () => request<User[]>('/users'),
  getCustomers: () => request<Customer[]>('/customers'),
  getCategories: () => request<Category[]>('/categories'),
  getRoles: () => request<Array<{ id: number; name: string }>>('/roles'),
  createTicket: (payload: {
    title: string
    description: string
    createdBy: number
    customerId?: number
  }) => request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(payload) }),
  createCustomerTicket: (payload: { title: string; description: string }) =>
    request<Ticket>('/tickets/customer/me', { method: 'POST', body: JSON.stringify(payload) }),
  updateTicket: (ticketId: number, payload: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    categoryId?: number
    assignedTo?: number
    summary?: string
  }) => request<Ticket>(`/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createUser: (payload: { name: string; email: string; password: string; roleId?: number }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  createCustomer: (payload: { name: string; email: string; phone?: string }) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ accessToken: string; user: { id: number; name: string; email: string; role: string | null } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  customerLogin: (payload: { email: string; password: string }) =>
    request<{ accessToken: string; customer: { id: number; name: string; email: string; phone: string | null } }>(
      '/customer-auth/login',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  customerRegister: (payload: { name: string; email: string; password: string; phone?: string }) =>
    request<{ id: number; name: string; email: string; phone: string | null; createdAt: string }>(
      '/customer-auth/register',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
}
