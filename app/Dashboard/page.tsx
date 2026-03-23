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
import { createClient } from '@supabase/supabase-js';




const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

  const [devName, setDevName] = useState("Developer");
  const { isOpen } = useSidebar();
  const [exportCode, setExportCode] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    // 1. Gather all keys from Local Storage
    // We use JSON.parse for the objects/arrays and a fallback for strings
    const dataToSave = {
      developerName: localStorage.getItem('developerName'),
      notes: localStorage.getItem('notes'),
      taskboard_tasks: JSON.parse(localStorage.getItem('taskboard_tasks') || '[]'),
      TLDRAW_DB_NAME_INDEX_v2: JSON.parse(localStorage.getItem('TLDRAW_DB_NAME_INDEX_v2') || '{}'),
      TLDRAW_USER_DATA_v3: JSON.parse(localStorage.getItem('TLDRAW_USER_DATA_v3') || '{}'),
      last_login_display: localStorage.getItem('last_login_display'),
      last_login_date_key: localStorage.getItem('last_login_date_key'),
    };

    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from('data_exports')
      .insert([{ payload: dataToSave }])
      .select('export_code')
      .single();

    if (error) {
      console.error(error);
      alert("Export failed!");
    } else {
      setExportCode(data.export_code);
    }
    setIsExporting(false);
  };

  const handleImport = async () => {
  if (!importCode) return alert("Please enter a code");
  setIsImporting(true);

  try {
    // 1. Fetch the data from Supabase
    const { data, error } = await supabase
      .from('data_exports')
      .select('payload')
      .eq('export_code', importCode)
      .single();

    if (error || !data) {
      alert("Invalid code or data not found.");
      setIsImporting(false);
      return;
    }

    const payload = data.payload;

    // 2. Map payload back to Local Storage
    // Use JSON.stringify for objects/arrays to match your export logic
    localStorage.setItem('developerName', payload.developerName || "");
    localStorage.setItem('notes', payload.notes || "");
    localStorage.setItem('taskboard_tasks', JSON.stringify(payload.taskboard_tasks));
    localStorage.setItem('TLDRAW_DB_NAME_INDEX_v2', JSON.stringify(payload.TLDRAW_DB_NAME_INDEX_v2));
    localStorage.setItem('TLDRAW_USER_DATA_v3', JSON.stringify(payload.TLDRAW_USER_DATA_v3));
    localStorage.setItem('developerName', payload.developerName || "");
    localStorage.setItem('last_login_display', payload.last_login_display || "");
    localStorage.setItem('last_login_date_key', payload.last_login_date_key || "");

    // 3. Delete the data from the cloud
    await supabase
      .from('data_exports')
      .delete()
      .eq('export_code', importCode);

    // 4. Final Success & Refresh
    alert("Data imported and cloud backup cleared. Refreshing...");
    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("An unexpected error occurred.");
  } finally {
    setIsImporting(false);
  }
};
  

  const [lastLogin, setLastLogin] = useState("First time visiting");
  useEffect(() => {

    const savedName = localStorage.getItem("developerName");
    if (savedName) {
      setDevName(savedName);
    }

    const savedDisplayTime = localStorage.getItem("last_login_display"); // e.g., "Mar 23, 1:42 AM"
    const savedDateKey = localStorage.getItem("last_login_date_key");   // e.g., "2026-03-23"

    // Get current Date info
    const now = new Date();
    const currentDateKey = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const currentDisplayTime = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // 1. If we have a saved time, show it in the UI
    if (savedDisplayTime) {
      setLastLogin(savedDisplayTime);
    }

    // 2. Logic: Only update the stored timestamp if the DAY has changed
    // (Or if it's the very first time they ever log in)
    if (savedDateKey !== currentDateKey) {
      localStorage.setItem("last_login_display", currentDisplayTime);
      localStorage.setItem("last_login_date_key", currentDateKey);
    }
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
                <h1 className="text-3xl font-bold mb-2">Welcome back, {devName}</h1>
                <p className="text-[#aaaaaa] text-sm">Last login: {lastLogin}</p>
                <div className="flex gap-4 mt-6">
                {/*                */}
                  <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="h-10 px-6 bg-[#00d9ff] text-[#1a1a1a] rounded-lg font-semibold hover:bg-[#00c4ea] transition-colors">
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </button>

                  {/* Simple Modal overlay */}
                  {exportCode && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#00d9ff] text-white max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold mb-4">Export Successful!</h3>
                        <p className="text-gray-400 mb-2">Use this code to import your data later:</p>
                        <div className="bg-black p-4 rounded font-mono text-[#00d9ff] text-2xl tracking-widest mb-6">
                          {exportCode}
                        </div>
                        <button 
                          onClick={() => setExportCode(null)}
                          className="w-full py-2 bg-[#00d9ff] text-[#1a1a1a] rounded font-bold"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                  onClick={() => setShowImportModal(true)}
                  className="h-10 px-6 border-2 border-[#00d9ff] text-[#00d9ff] rounded-lg font-semibold hover:bg-[#00d9ff]/10 transition-colors">
                    Import Data
                  </button>

                  {/* Import Modal Overlay */}
                  {showImportModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#00d9ff] text-white max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-2">Import Data</h3>
                        <p className="text-[#aaaaaa] text-sm mb-6">
                          Enter your code. <span className="text-[#00d9ff]">Note:</span> Cloud data is deleted immediately after import.
                        </p>
                        
                        <input 
                          type="text"
                          placeholder="Enter 8-digit code"
                          value={importCode}
                          onChange={(e) => setImportCode(e.target.value)}
                          className="w-full bg-black border border-[#333333] p-3 rounded-lg mb-6 text-center font-mono text-[#00d9ff] uppercase tracking-widest focus:border-[#00d9ff] outline-none"
                        />

                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={handleImport}
                            disabled={isImporting}
                            className="w-full py-3 bg-[#00d9ff] text-[#1a1a1a] rounded-lg font-bold hover:bg-[#00c4ea] disabled:opacity-50"
                          >
                            {isImporting ? 'Processing...' : 'Restore & Refresh'}
                          </button>
                          <button 
                            onClick={() => setShowImportModal(false)}
                            className="w-full py-2 text-[#666666] hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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