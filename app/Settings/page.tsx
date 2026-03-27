'use client'
import { useState} from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useRouter } from 'next/navigation'

export default function Settings() {
  const router = useRouter();

  // 1. Define a helper or just do it inline
  const [offlineEnabled, setOfflineEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("offlineMode") === "true";
    }
    return false; // Default for SSR
  });

  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("developerName") || "";
    }
    return "";
  });

  const handleSave = () => {
    localStorage.setItem("developerName", name.trim());
    alert("Profile saved!");
  };

    const toggleOffline = () => {
    const newValue = !offlineEnabled;
    setOfflineEnabled(newValue);
    localStorage.setItem("offlineMode", String(newValue));
  };

//  const clearOfflineData = async () => {
//  if ('caches' in window) {
//    const keys = await caches.keys();
//    await Promise.all(keys.map((key) => caches.delete(key)));
//  }
//  alert("Offline data cleared!");
//};

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

        <div className="mt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={offlineEnabled}
              onChange={toggleOffline}
            />
            <span>Enable Offline Mode</span>
          </label>
        </div>

        </main>
      </div>
    </div>
  );
}