'use client'
import { RiMore2Fill, RiLogoutBoxLine } from "react-icons/ri";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import SyncIndicator from "./SyncIndicator";

const Header = () => {
    const { user, loading, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.name || "Developer";
  const firstLetter = displayName[0].toUpperCase();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 h-16 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#2a2a2a] z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">

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
        <SyncIndicator />

        <button className="w-10 h-10 flex items-center justify-center text-[#8a8a8a] hover:text-white">
          <RiMore2Fill className="text-xl" />
        </button>

        {!loading && (user ? (
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full bg-linear-to-br from-[#00d9ff] to-[#00ff88] flex items-center justify-center cursor-pointer"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="text-sm font-semibold text-[#1a1a1a]">{firstLetter}</span>
            </div>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#252525] border border-[#333333] rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#333333]">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-[#8a8a8a] truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-[#2e2e2e] transition-colors"
                >
                  <RiLogoutBoxLine className="text-base" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="h-9 px-4 rounded-lg bg-[#00d9ff] text-[#1a1a1a] text-sm font-semibold flex items-center hover:bg-[#00c4ea] transition-colors"
          >
            Sign in
          </Link>
        ))}
      </div>
    </header>
  );
};

export default Header;