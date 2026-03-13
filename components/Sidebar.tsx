'use client'
import React from "react";
import { useRouter } from 'next/navigation'
import { RiDashboardLine, RiLockLine, RiMagicLine, RiExchangeLine, RiCheckboxCircleLine, RiCodeLine, RiGlobalLine, RiSettings3Line } from "react-icons/ri";

const Sidebar = () => {
  const router = useRouter();
  return (
    <aside className="fixed left-0 top-0 h-screen bg-[#1a1a1a] border-r border-[#2a2a2a] w-60 flex flex-col z-40">
      <div className="p-6 border-b border-[#2a2a2a] flex items-center gap-3">
        <img
          src="https://public.readdy.ai/ai/img_res/6ca7fa48-87b8-4bcd-a93b-5fed1345c249.png"
          alt="DevToolbox Logo"
          className="w-10 h-10 object-contain"
        />
        <div>
          <h1 className="text-[#00d9ff] font-bold text-xl font-mono">DevToolbox</h1>
          <div className="flex items-center gap-1 mt-1">
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {[
          { icon: <RiDashboardLine />, label: "Dashboard", active: false },
          { icon: <RiLockLine />, label: "Encoders", active: false },
          { icon: <RiMagicLine />, label: "Generators", active: false },
          { icon: <RiExchangeLine />, label: "Converters", active: false },
          { icon: <RiCheckboxCircleLine />, label: "Validators", active: false },
          { icon: <RiCodeLine />, label: "Formatters", active: false },
          { icon: <RiGlobalLine />, label: "Network Tools", active: false },
        ].map((item) => (
          <button
            onClick={() => router.push('/' + item.label)}
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 whitespace-nowrap ${
              item.active
                ? "bg-[#1e3a5f] text-[#00d9ff] border-l-2 border-[#00d9ff]"
                : "text-[#8a8a8a] hover:bg-[#252525] hover:text-white"
            }`}
          >
            <span className="text-xl w-6 h-6 flex items-center justify-center">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#2a2a2a]">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-[#8a8a8a] hover:bg-[#252525] hover:text-white transition-all duration-200 rounded-lg whitespace-nowrap">
          <RiSettings3Line className="text-xl w-6 h-6 flex items-center justify-center" />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;