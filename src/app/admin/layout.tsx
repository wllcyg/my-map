import { ReactNode } from 'react'
import Link from 'next/link'
import { logoutAction } from './login/actions'
import { Button } from '@/components/ui/button'
import { AdminNav } from './components/AdminNav'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* 侧边栏 */}
      <div className="w-64 bg-stone-900 text-stone-100 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold font-serif tracking-widest text-amber-500">丝路·后台</h2>
        </div>
        <AdminNav />
        <div className="p-4 border-t border-stone-800">
          <form action={logoutAction}>
            <Button variant="ghost" className="w-full text-stone-300 hover:text-white hover:bg-stone-800 justify-start">
              退出登录
            </Button>
          </form>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
