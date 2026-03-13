// components/FeaturesSection.jsx
export default function FeaturesSection() {
  const features = [
    {
      icon: 'ri-dashboard-3-line',
      title: 'Unified Dashboard',
      description:
        'All your tools in one clean, organized workspace. No more hunting across bookmarks or browser tabs.',
      gradient: 'from-cyan-500 to-cyan-600',
    },
    {
      icon: 'ri-star-line',
      title: 'Favorites & Shortcuts',
      description:
        'Pin your most-used tools to the quick-access bar. Customize your workflow to match how you actually work.',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: 'ri-pulse-line',
      title: 'Real-Time Status',
      description:
        "Live indicators show which tools are ready, processing, or under maintenance — always know what's available.",
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: 'ri-search-line',
      title: 'Instant Search',
      description:
        'Find any tool in milliseconds with Ctrl+K. Filter by category, name, or recent usage.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: 'ri-layout-grid-line',
      title: 'Grid & List Views',
      description:
        'Switch between compact grid tiles and detailed list view. Your dashboard, your preference.',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: 'ri-history-line',
      title: 'Activity History',
      description:
        'Track your recent tool usage with a live activity feed. Quickly jump back to where you left off.',
      gradient: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <section id="features" className="py-28 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <span className="text-[#00d9ff] text-sm font-semibold font-['JetBrains_Mono'] uppercase tracking-widest">
            Why DevToolbox
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4">
            Built for how developers
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d9ff] to-[#00ff88]">
              actually work
            </span>
          </h2>
          <p className="text-[#888888] text-lg max-w-xl mx-auto">
            Every feature is designed to reduce friction and keep you in flow state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#141414] border border-[#222222] rounded-xl p-7 hover:border-[#333333] hover:bg-[#181818] transition-all duration-250 group"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5`}
              >
                <i className={`${feature.icon} text-2xl text-white`}></i>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-[#888888] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}