'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogInIcon } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { getAccessToken, getAuthType, saveAuthSession } from '@/lib/auth-storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type LoginMode = 'admin' | 'customer'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<LoginMode>('admin')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialMode = params.get('mode')
    if (initialMode === 'customer' || initialMode === 'admin') {
      setMode(initialMode)
    }
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    const authType = getAuthType()

    if (token) {
      router.replace(authType === 'CUSTOMER' ? '/customer' : '/')
    }
  }, [router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      if (mode === 'customer') {
        const result = await api.customerLogin({ email, password })
        saveAuthSession(result.accessToken, 'CUSTOMER')
        toast.success(`Welcome back, ${result.customer.name}`)
        router.push('/customer')
      } else {
        const result = await api.login({ email, password })
        saveAuthSession(result.accessToken, 'ADMIN')
        toast.success(`Welcome back, ${result.user.name}`)
        router.push('/')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === 'customer' ? 'Customer Login' : 'Admin Login'}</CardTitle>
          <CardDescription>
            {mode === 'customer'
              ? 'Sign in to create and track your own tickets.'
              : 'Sign in to manage users and tickets.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as LoginMode)} className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="admin" className="flex-1">Admin</TabsTrigger>
              <TabsTrigger value="customer" className="flex-1">Customer</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>
            </FieldGroup>

            <Button type="submit" disabled={loading}>
              <LogInIcon data-icon="inline-start" />
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
