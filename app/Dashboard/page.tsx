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
                <h1 className="text-3xl font-bold mb-2">Welcome back, Developer</h1>
                <p className="text-[#aaaaaa] text-sm">Last login: Jan 1, 12:00 AM</p>
                <div className="flex gap-4 mt-6">
                {/*                */}
                  <button className="h-10 px-6 bg-[#00d9ff] text-[#1a1a1a] rounded-lg font-semibold hover:bg-[#00c4ea] transition-colors">
                    Export Data
                  </button>

                  <button className="h-10 px-6 border-2 border-[#00d9ff] text-[#00d9ff] rounded-lg font-semibold hover:bg-[#00d9ff]/10 transition-colors">
                    Import Data
                  </button>
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