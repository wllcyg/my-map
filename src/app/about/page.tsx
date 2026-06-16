import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "关于项目 | 丝绸之路全景地图",
  description: "了解《丝绸之路全景地图》项目的定位、一期数据边界以及后续规划。",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* 顶部悬浮导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/map/silk-road" className="flex items-center gap-1.5 text-slate-600 hover:text-amber-600 transition-colors font-medium text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回地图
        </Link>
        <Link href="/sources" className="text-slate-600 hover:text-amber-600 transition-colors font-medium text-sm">
          数据来源
        </Link>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-full h-48 sm:h-64 md:h-72 relative mb-8 rounded-xl overflow-hidden shadow-inner border border-slate-100/50">
            <Image 
              src="/images/about-banner.png" 
              alt="丝绸之路全景地图"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-3">关于《丝绸之路全景地图》</h1>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              本项目旨在通过现代化的 Web GIS 技术，打造一个沉浸式、交互式的古代丝绸之路数据可视化平台，带您重走连接东西方文明的伟大贸易通道。
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
              项目定位
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>
                《丝绸之路全景地图》不仅是一个展示地理坐标的工具，更是一个结合了历史文献、时代变迁与地理数据的数字人文项目。我们希望通过直观的视觉交互，让历史爱好者、学生和研究者能够以全新的视角观察这跨越千年的文化交融之路。
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
              一期 MVP 边界说明
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>
                作为项目的第一阶段（MVP），我们对历史数据进行了一定程度的精简与抽象，主要边界如下：
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>核心节点</strong>：目前共收录了 25 个最具代表性的历史节点（如长安、敦煌、撒马尔罕等），暂未穷尽所有驿站和次级城镇。</li>
                <li><strong>核心路线</strong>：涵盖了沙漠绿洲北道、南道以及海上丝路的部分主干道，去除了过于复杂的网状分支。</li>
                <li><strong>历史分期</strong>：划分为汉、唐、蒙元三大标志性时期，以展示不同时代的丝路重镇变迁，未细分至每一个朝代。</li>
              </ul>
            </div>
          </section>

          <section className="mb-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
              后续开发规划
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>
                本平台将持续迭代更新，未来的主要开发方向包括：
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>数据扩充</strong>：引入更多的遗址点、商品交易数据（如丝绸、香料、陶瓷等），并扩展至罗马、波斯等更广阔的地域。</li>
                <li><strong>AI 智能导览</strong>：结合大语言模型，提供随叫随到的“历史导游”，根据您的兴趣智能规划探索路线并讲解历史故事。</li>
                <li><strong>时空热力图</strong>：基于更细粒度的时间戳，动态展示各大城市的人口、贸易活跃度随时间的变化。</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
