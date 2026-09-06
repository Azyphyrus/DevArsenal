'use client'
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ToolCard from "@/components/ToolCard";
import { RiLink, RiCodeView } from "react-icons/ri";
import { PiPlaceholder, PiHashStraightFill } from "react-icons/pi";
import { LuFileJson, LuBarcode, LuClipboardList } from "react-icons/lu";
import { TbNumber64Small, TbNotes, TbRegex, TbApi, TbShape } from "react-icons/tb";
import { Footer } from "@/components/Footer";
import { useSidebar } from "@/lib/SidebarContext";
import { useState, useEffect } from 'react';
import SyncButton from "@/components/SyncButton";
import { useAuth } from "@/lib/AuthContext";

const tools = [
  { icon: TbNumber64Small, title: "Base64 Encoder", description: "Encode and Decode and decode Base64 strings with ease" },
  { icon: RiLink, title: "URL Encoder", description: "Encode and Decode URLs and query parameters safely" },
  { icon: RiCodeView, title: "Code Snippet Manager", description: "Encode HTML entities and special characters" },
  { icon: LuFileJson, title: "JSON Formatter", description: "Format and validate JSON Data" },
  { icon: LuClipboardList, title: "Task Board", description: "Task management tool used to track work-in-progress." },
  { icon: TbNotes, title: "Notes", description: "Write down and save quick notes" },
  { icon: LuBarcode, title: "UUID Generator", description: "Quickly and easily generate individual or bulk sets of universally unique identifiers (UUIDs)." },
  { icon: PiHashStraightFill, title: "Hash Generator", description: "Generate MD5, SHA-1, SHA-256, and other hash algorithms" },
  { icon: TbRegex, title: "Regex Tester", description: "A lightweight and interactive tool to test regular expressions in real-time." },
  { icon: TbApi, title: "API Tester", description: "Test your APIs instantly with GET, POST, PUT, DELETE requests." },
  { icon: TbShape, title: "Visual Tool", description: "Create, draw, and collaborate visually with an intuitive canvas." },
  { icon: PiPlaceholder, title: "lorem ipsum", description: "lorem ipsum" },
];

export default function Dashboard() {

  const { isOpen } = useSidebar();
  const { user } = useAuth();

  const welcomeName = user?.name || "Developer";

  // Data is synced automatically by the sync engine (lib/syncManager.ts).
  // Manual export/import via data_exports codes was removed — use the
  // Sync button below for an immediate push/pull.
  

  const [lastLogin, setLastLogin] = useState("First time visiting");
  useEffect(() => {
    // Read the previous visit's timestamp BEFORE the day-rollover write below,
    // so the UI shows when you were last here (not right now).
    const savedDisplayTime = localStorage.getItem("last_login_display"); // e.g., "Mar 23, 1:42 AM"

    // Day-rollover bookkeeping: pure localStorage side effect, no state updates.
    const now = new Date();
    const currentDateKey = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const savedDateKey = localStorage.getItem("last_login_date_key"); // e.g., "2026-03-23"
    if (savedDateKey !== currentDateKey) {
      // Only update the stored timestamp if the DAY has changed
      // (or if it's the very first time ever logging in).
      const currentDisplayTime = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      localStorage.setItem("last_login_display", currentDisplayTime);
      localStorage.setItem("last_login_date_key", currentDateKey);
    }

    // Hydrate the UI from localStorage. Deferred with a timeout so we never
    // call setState synchronously inside the effect
    // (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => {
      if (savedDisplayTime) {
        setLastLogin(savedDisplayTime);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      {/*
      <div className="h-1 w-full bg-[#00ff88] animate-pulse"></div>
      */}
      <div>
      <Sidebar />
      </div>
      <div className="flex-1 transition-all duration-300" style={{paddingLeft: isOpen ? '240px' : '80px'}}>
        <Header />
        <main className="p-8">
          <div className="relative h-44 rounded-xl overflow-hidden mb-8 bg-linear-to-r from-[#2d1b4e] via-[#1e2a4a] to-[#1a2332]">
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/10 to-black/20"></div>
            <div className="relative h-full flex items-center justify-between px-8">
              <div className="z-10">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {welcomeName}</h1>
                <p className="text-[#aaaaaa] text-sm">Last login: {lastLogin}</p>
                <div className="flex flex-col items-start gap-3 mt-6">
                  <SyncButton variant="solid" />
                  <p className="text-xs text-[#888888]">
                    Snippets, notes and tasks sync automatically in the background — use this button for an immediate sync.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Tools</h2>
              <select className="px-4 py-2 bg-[#252525] border border-[#333333] rounded-lg text-sm text-white cursor-pointer">
                <option>All Categories</option>
                <option>Most Used</option>
                <option>Recently Added</option>
              </select>
            </div>
        </div>
          <div className="grid grid-cols-4 gap-5 mb-8">
            {tools.map((tool) => (
              <ToolCard
                key={tool.title}
                {...tool}
              />
            ))}
          </div>

        </main>
        <Footer />
      </div>
    </div>
  );
}