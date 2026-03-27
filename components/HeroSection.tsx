'use client'
import Image from 'next/image';
import { useRouter } from 'next/navigation'

export default function HeroSection() {
  
  const router = useRouter();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/herobg.png"
          alt="Hero background"
          className="w-full h-full object-cover object-top"
          fill
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#0d0d0d]/60 via-[#0d0d0d]/50 to-[#0d0d0d]"></div>
      </div>

      <div className="absolute top-32 left-12 opacity-20 font-['JetBrains_Mono'] text-xs text-[#00d9ff] hidden lg:block">
        <div>$ base64 encode &quot; hello &quot;</div>
        <div className="text-[#00ff88] mt-1">aGVsbG8=</div>
      </div>

      <div className="absolute top-48 right-16 opacity-20 font-['JetBrains_Mono'] text-xs text-[#00d9ff] hidden lg:block">
        <div>$ uuid generate --v4</div>
        <div className="text-[#00ff88] mt-1">f47ac10b-58cc-4372...</div>
      </div>

      <div className="absolute bottom-48 left-20 opacity-20 font-['JetBrains_Mono'] text-xs text-[#00d9ff] hidden lg:block">
        <div>$ jwt decode token</div>
        <div className="text-[#00ff88] mt-1">{'{ "sub": "1234567890" }'}</div>
      </div>

      <div className="relative z-10 w-full text-center px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d9ff]/10 border border-[#00d9ff]/30 rounded-full mb-8">
          <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
          <span className="text-[#00d9ff] text-sm font-medium font-['JetBrains_Mono']">
            24+ Tools · Always Free · No login required
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
          Every Dev Tool
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00d9ff] to-[#00ff88]">
            In One Place
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#aaaaaa] max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop switching between dozens of tabs. DevToolbox gives you encoders, generators, converters, validators, formatters, and network tools — all in a single clean dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button onClick={() => router.push('/Dashboard')}
          className="px-8 py-4 bg-[#00d9ff] text-[#0d0d0d] font-bold text-base rounded-md hover:bg-[#00c4e8] transition-all duration-200 hover:scale-105 whitespace-nowrap cursor-pointer shadow-[0_0_30px_rgba(0,217,255,0.3)]">
            <i className="ri-rocket-line"></i>Open the Toolbox
          </button>
          <button className="px-8 py-4 bg-white/5 border border-white/20 text-white font-semibold text-base rounded-md hover:bg-white/10 transition-all duration-200 whitespace-nowrap cursor-pointer">
            <i className="ri-play-circle-line mr-2"></i>See What is Inside
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {['Encoders','Generators','Converters','Validators','Formatters','Network Tools'].map((tool) => (
            <div
              key={tool}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-full text-sm text-[#aaaaaa] hover:border-[#00d9ff]/40 hover:text-white transition-all duration-200 cursor-pointer"
            >
              <i className="ri-lock-line text-[#00d9ff]"></i> {tool}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}