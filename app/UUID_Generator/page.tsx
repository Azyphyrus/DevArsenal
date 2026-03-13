'use client'

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from "uuid"
import { useSidebar } from "@/lib/SidebarContext";

export default function UUID_Generator() {

  const [version, setVersion] = useState("v4")
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const generateUUID = () => {
    const results: string[] = []

    for (let i = 0; i < count; i++) {

      if (version === "v1") results.push(uuidv1())
      if (version === "v4") results.push(uuidv4())
      if (version === "v7") results.push(uuidv7())

    }

    setUuids(results)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join("\n"))
    setCopied(true)

    setTimeout(() => setCopied(false), 1200)
  }

  const clearAll = () => {
    setUuids([])
  }

  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      <Sidebar />

      <div className="flex-1 transition-all duration-300" style={{paddingLeft: isOpen ? '240px' : '80px'}}>
        <Header />

        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold">
            UUID Generator
          </h1>

          {/* Options */}
          <div className="flex gap-4 flex-wrap items-center">

            <div className="flex flex-col">
              <label className="text-sm text-gray-400">
                Version
              </label>

              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="bg-[#111] border border-[#2a2a2a] rounded px-3 py-2"
              >
                <option value="v4">UUID v4 (Random)</option>
                <option value="v1">UUID v1 (Timestamp)</option>
                <option value="v7">UUID v7 (Sortable)</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-400">
                Count
              </label>

              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="bg-[#111] border border-[#2a2a2a] rounded px-3 py-2 w-24"
              />
            </div>

            <button
              onClick={generateUUID}
              className="px-4 py-2 bg-[#00ff88] text-black rounded hover:brightness-110 cursor-pointer mt-5"
            >
              Generate
            </button>

            <button
              onClick={copyAll}
              className="px-4 py-2 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a] cursor-pointer mt-5"
            >
              Copy All
            </button>

            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500 rounded hover:brightness-110 cursor-pointer mt-5"
            >
              Clear
            </button>

          </div>

          {/* Results */}

            <div className="space-y-3">

            {uuids.map((id, index) => (
                <div
                key={index}
                className="flex items-center gap-2"
                >

                <textarea
                    value={id}
                    readOnly
                    rows={1}
                    className="flex-1 bg-[#111] border border-[#2a2a2a] rounded p-3 text-[#00ff88] resize-none"
                />

                <button
                    onClick={async () => {
                    await navigator.clipboard.writeText(id)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1000)
                    }}
                    className="px-3 py-2 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a] cursor-pointer"
                >
                    Copy
                </button>

                </div>
            ))}

            </div>

          {copied && (
            <div className="fixed bottom-6 right-6 bg-[#00ff88] text-black px-4 py-2 rounded-lg shadow-lg">
              Copied UUIDs!
            </div>
          )}

        </main>
      </div>
    </div>
  )
}