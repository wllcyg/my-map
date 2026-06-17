'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginAction } from './actions'

import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') || '/admin'
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function onSubmit(formData: FormData) {
    setIsPending(true)
    formData.append('redirectTo', redirectTo)
    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (e) {
      // ignore, redirect throws error in Next.js
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>管理后台</CardTitle>
        <CardDescription>请输入管理员密码以继续</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="flex flex-col gap-4">
          <Input 
            type="email" 
            name="email" 
            placeholder="管理员邮箱" 
            required
          />
          <Input 
            type="password" 
            name="password" 
            placeholder="管理员密码" 
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? '登录中...' : '登录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-stone-100">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
