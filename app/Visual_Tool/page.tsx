'use client'
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useSidebar } from "@/lib/SidebarContext";

// Import the Tldraw component and its required CSS
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

export default function Visual_Tool() {
  const { isOpen } = useSidebar();

  return (
    // Added flex and h-screen to the main wrapper to manage height
    <div className="flex h-screen bg-[#1a1a1a] text-white font-sans overflow-hidden">
      {/*
      <div className="absolute top-0 left-0 h-1 w-full bg-[#00ff88] animate-pulse z-50"></div>
      */}
      
      <div>
        <Sidebar />
      </div>
      
      <div 
        className="flex flex-col flex-1 transition-all duration-300" 
        style={{paddingLeft: isOpen ? '240px' : '80px'}}
      >
        <Header />
        
        {/* Give main a flexible height so the canvas fills the area properly */}
        <main className="flex-1 p-4 relative">
          
          {/* Tldraw needs a wrapper div with absolute/relative positioning and full height/width */}
          <div className="absolute inset-4 rounded-xl overflow-hidden border border-[#333] shadow-lg">
            <Tldraw 
              persistenceKey="my-visual-tool-save" // Automatically saves to local storage!
              autoFocus
            />
          </div>

        </main>
      </div>
    </div>
  );
}