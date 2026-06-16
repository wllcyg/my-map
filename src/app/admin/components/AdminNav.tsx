'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminNav() {
  const pathname = usePathname()
  
  const navs = [
    { name: '仪表盘', href: '/admin' },
    { name: '节点管理 (Places)', href: '/admin/places' },
    { name: '路线管理 (Routes)', href: '/admin/routes' },
  ]
  
  return (
    <nav className="flex-1 px-4 flex flex-col gap-2">
      {navs.map(nav => {
        const isActive = pathname === nav.href
        return (
          <Link
            key={nav.href}
            href={nav.href}
            className={`px-4 py-2 rounded transition-colors ${
              isActive 
                ? 'bg-amber-500/20 text-amber-500 font-medium' 
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            {nav.name}
          </Link>
        )
      })}
    </nav>
  )
}
