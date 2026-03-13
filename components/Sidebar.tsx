'use client'
import React from "react";
import { useRouter } from 'next/navigation'
import { RiDashboardLine, RiLockLine, RiMagicLine, RiExchangeLine, RiCheckboxCircleLine, RiCodeLine, RiGlobalLine, RiSettings3Line, RiMenuLine } from "react-icons/ri";
import { useSidebar } from "@/lib/SidebarContext";

const Sidebar = () => {
  const router = useRouter();
  const { isOpen, toggle } = useSidebar();
  
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-linear-to-b from-[#1a1a1a] to-[#0f0f0f] border-r border-[#2a2a2a] flex flex-col z-40 transition-all duration-300 ${isOpen ? 'w-60' : 'w-20'}`}>
      {/* Header */}
      <div className={`p-6 border-b border-[#2a2a2a] flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
        <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
          {isOpen && (
          <img src="https://public.readdy.ai/ai/img_res/6ca7fa48-87b8-4bcd-a93b-5fed1345c249.png" alt="DevToolbox" className="w-10 h-10" />
          )}
          {isOpen && <h1 className="text-[#00d9ff] font-bold text-lg font-mono">DevToolbox</h1>}
        </div>
        {isOpen && (
          <button onClick={toggle} className="text-[#8a8a8a] hover:text-white transition">
            <RiMenuLine className="text-xl" />
          </button>
        )}
        {!isOpen && (
          <button onClick={toggle} className="text-[#8a8a8a] hover:text-white transition absolute">
            <RiMenuLine className="text-xl top-10" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 overflow-y-auto ${isOpen ? '' : 'flex flex-col items-center'}`}>
        {[
          { icon: <RiDashboardLine />, label: "Dashboard" },
          { icon: <RiLockLine />, label: "Encoders" },
          { icon: <RiMagicLine />, label: "Generators" },
          { icon: <RiExchangeLine />, label: "Converters" },
          { icon: <RiCheckboxCircleLine />, label: "Validators" },
          { icon: <RiCodeLine />, label: "Formatters" },
          { icon: <RiGlobalLine />, label: "Network Tools" },
        ].map((item) => (
          <button 
            key={item.label} 
            onClick={() => router.push('/' + item.label)} 
            className={`flex items-center gap-3 transition-all duration-200 group relative text-[#8a8a8a] hover:text-[#00d9ff] hover:bg-[#252525] rounded-lg ${
              isOpen 
                ? 'w-full px-4 py-3' 
                : 'w-12 h-12 justify-center'
            }`}
          >
            <span className="text-xl w-6 h-6 flex items-center justify-center flex-shrink-0">{item.icon}</span>
            {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            {!isOpen && <div className="hidden group-hover:block absolute left-20 bg-[#252525] px-3 py-1 rounded text-xs whitespace-nowrap text-white z-50">{item.label}</div>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-[#2a2a2a] flex ${isOpen ? 'justify-start' : 'justify-center'}`}>
        <button className={`flex items-center gap-3 text-[#8a8a8a] hover:bg-[#252525] hover:text-white transition-all rounded-lg group relative ${
          isOpen 
            ? 'w-full px-4 py-3' 
            : 'w-12 h-12 justify-center'
        }`}>
          <RiSettings3Line className="text-xl w-6 h-6 flex-shrink-0" />
          {isOpen && <span className="text-sm">Settings</span>}
          {!isOpen && <div className="hidden group-hover:block absolute left-20 bg-[#252525] px-3 py-1 rounded text-xs whitespace-nowrap text-white z-50">Settings</div>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;