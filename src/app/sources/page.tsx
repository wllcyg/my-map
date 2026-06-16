import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "数据来源 | 丝绸之路全景地图",
  description: "了解《丝绸之路全景地图》中历史节点和路线数据的考证来源及可信度说明。",
};

export default function SourcesPage() {
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
        <Link href="/about" className="text-slate-600 hover:text-amber-600 transition-colors font-medium text-sm">
          关于项目
        </Link>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-full h-48 sm:h-64 md:h-72 relative mb-8 rounded-xl overflow-hidden shadow-inner border border-slate-100/50">
            <Image 
              src="/images/sources.png" 
              alt="文献考证与数据来源"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-3">数据来源与考证</h1>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
              地图上的每一个节点和路线，都尽可能基于权威的历史文献和考古发现。但由于年代久远与地理变迁，部分坐标和时期具有一定的推测性质。
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              主要文献参考
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm">《史记·大宛列传》 - 汉·司马迁</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">记载了张骞出使西域的见闻，是研究汉代丝路西域道最核心的第一手资料。</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm">《大唐西域记》 - 唐·玄奘</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">记录了玄奘西行取经沿途西域及印度的地理位置与风土人情，极其详实可信。</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm">《马可·波罗游记》 - 元·马可·波罗</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">生动记载了蒙元时期中国及欧亚大陆沿途的繁华都会和商品贸易情况。</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm">《诸蕃志》 - 宋·赵汝适</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">研究宋元时期“海上丝绸之路”沿线国家地理分布和物产的重要文献。</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              可信度说明 (Certainty)
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>我们在数据中标注了坐标的 <code>certainty</code>（可信度），以保证学术的严谨性：</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="text-green-600">Confirmed</strong>：现代依然存在的城市，或已准确发掘的遗址。</li>
                <li><strong className="text-amber-600">Approximate</strong>：文献中有记载但尚未发掘，或覆盖范围较大的区域。</li>
                <li><strong className="text-red-500">Disputed</strong>：学术界对其具体地理位置仍存在较大争议的节点。</li>
              </ul>
            </div>
          </section>

          <section className="mb-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              一期数据局限性
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>
                目前的节点经纬度坐标主要取自现代测绘的遗址中心点或对应现代城市的中心点。然而在漫长的历史长河中，许多城市的城址由于战乱、河流改道等原因发生过迁移。
                在地图渲染层，为了避免过度复杂的视觉干扰，我们对路线进行了平滑处理，并非绝对精准的古代人徒步轨迹。
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
