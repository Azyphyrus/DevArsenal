'use client'
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function URL_Encoder() {
    
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <Sidebar />
      <div className="flex-1 ml-60 transition-all duration-300">
        <Header />
        <main className="p-8">



        </main>
      </div>
    </div>
  );
}