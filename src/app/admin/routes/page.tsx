import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminRoutesPage(props: {
  searchParams?: Promise<{ page?: string }>
}) {
  const searchParams = await props.searchParams
  const page = parseInt(searchParams?.page || '1', 10)
  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: routes, count } = await supabase
    .from('routes')
    .select('*', { count: 'exact' })
    .order('id', { ascending: true })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-serif">路线管理</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>路线 ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>所属时期</TableHead>
              <TableHead>节点数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes?.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-mono text-sm">{route.id}</TableCell>
                <TableCell className="font-medium">{route.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{route.period}</Badge>
                </TableCell>
                <TableCell>{route.coordinates?.length || 0} 个坐标点</TableCell>
              </TableRow>
            ))}
            {!routes?.length && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-stone-500">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* 分页控制 */}
        <div className="p-4 border-t border-stone-200 flex items-center justify-between">
          <span className="text-sm text-stone-500">
            共 {count || 0} 条记录，第 {page} / {totalPages || 1} 页
          </span>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>上一页</Button>
            ) : (
              <Link 
                href={`/admin/routes?page=${page - 1}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                上一页
              </Link>
            )}
            {page >= totalPages ? (
              <Button variant="outline" size="sm" disabled>下一页</Button>
            ) : (
              <Link 
                href={`/admin/routes?page=${page + 1}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                下一页
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
