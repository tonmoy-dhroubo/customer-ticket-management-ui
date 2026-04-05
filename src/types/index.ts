export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Role {
  id: number
  name: string
}

export interface User {
  id: number
  name: string
  email: string
  roleId: number
  role?: Role
  createdAt?: string
}

export interface Customer {
  id: number
  name: string
  email: string
  phone: string | null
  createdAt?: string
}

export interface Category {
  id: number
  name: string
}

export interface Ticket {
  id: number
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  categoryId: number
  createdBy: number
  assignedTo: number | null
  customerId: number | null
  aiConfidence: number
  aiSource: string
  summary: string | null
  createdAt: string
  updatedAt: string
  category?: Category
  creator?: User
  assignee?: User | null
  customer?: Customer | null
}
