import React from "react";
import { RiMenuLine, RiMore2Fill } from "react-icons/ri";

const Header = () => {
  return (
    <header className="sticky top-0 h-16 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#2a2a2a] z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button className="w-8 h-8 flex items-center justify-center text-[#8a8a8a] hover:text-white">
          <RiMenuLine className="text-xl" />
        </button>

        <div className="relative w-96">
          <input
            type="text"
            placeholder="Search tools... (Ctrl+K)"
            className="w-full h-10 pl-10 pr-20 bg-[#252525] border border-[#333333] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#00d9ff]"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1a1a1a] border border-[#333333] rounded text-xs text-[#666666] font-mono">
            Ctrl+K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center text-[#8a8a8a] hover:text-white">
          <RiMore2Fill className="text-xl" />
        </button>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#00d9ff] to-[#00ff88] flex items-center justify-center cursor-pointer">
            <span className="text-sm font-semibold text-[#1a1a1a]">D</span>
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00ff88] rounded-full border-2 border-[#1a1a1a]"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;