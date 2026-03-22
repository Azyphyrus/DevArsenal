'use client'
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useRouter } from 'next/navigation'

export default function Settings() {
  const router = useRouter();
  const [name, setName] = useState("");

  // Load existing name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("developerName") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(savedName);
  }, []);

  const handleSave = () => {
    localStorage.setItem("developerName", name.trim());
    alert("Profile saved!");
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <Sidebar />
      <div className="flex-1 transition-all duration-300" style={{ paddingLeft: '240px' }}>
        <Header />
        <main className="p-8">
          <h1 className="text-2xl font-bold mb-6">Developer Profile Settings</h1>
          <div className="max-w-md">
            <label className="block mb-2 text-sm font-semibold text-[#aaaaaa]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-10 px-4 rounded-lg bg-[#252525] border border-[#333333] text-white focus:outline-none focus:border-[#00d9ff]"
            />
            <button
              onClick={() => {
                handleSave();
                router.push('/Dashboard');
              }}
              className="mt-4 h-10 px-6 bg-[#00d9ff] text-[#1a1a1a] rounded-lg font-semibold hover:bg-[#00c4ea] transition-colors"
            >
              Save Profile
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}