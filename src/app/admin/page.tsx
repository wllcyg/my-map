export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-serif mb-6">后台仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-medium text-stone-600 mb-2">节点总数</h3>
          <p className="text-3xl font-bold text-stone-900">10</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-medium text-stone-600 mb-2">路线总数</h3>
          <p className="text-3xl font-bold text-stone-900">2</p>
        </div>
      </div>
      
      <div className="mt-8 bg-amber-50 p-6 rounded-xl border border-amber-200">
        <h3 className="text-xl font-bold text-amber-900 mb-2">欢迎使用丝路地图后台管理</h3>
        <p className="text-amber-800">
          您可以在左侧菜单中选择“节点管理”或“路线管理”，对线上的地图数据进行新增、修改和删除。
          新增地点时，建议直接通过地图选点获取真实的经纬度。
        </p>
      </div>
    </div>
  )
}
