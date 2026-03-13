'use client'

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"

export default function URL_Encoder() {

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const handleEncode = () => {
    try {
      setOutput(encodeURIComponent(input))
    } catch {
      setOutput("Invalid input")
    }
  }

  const handleDecode = () => {
    try {
      setOutput(decodeURIComponent(input))
    } catch {
      setOutput("Invalid encoded URL")
    }
  }

  const handleCopy = async () => {
    if (!output) return

    await navigator.clipboard.writeText(output)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  const handleClear = () => {
    setInput("")
    setOutput("")
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      <Sidebar />

      <div className="flex-1 ml-60 transition-all duration-300">
        <Header />

        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold text-[#00ff88]">
            URL Encoder / Decoder
          </h1>

          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Input</label>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter URL or text..."
              className="w-full h-40 bg-[#111] border border-[#2a2a2a] rounded-lg p-4 focus:outline-none focus:border-[#00ff88] resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">

            <button
              onClick={handleEncode}
              className="px-4 py-2 bg-[#00ff88] text-black rounded-md hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Encode
            </button>

            <button
              onClick={handleDecode}
              className="px-4 py-2 bg-blue-500 rounded-md hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Decode
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-[#2a2a2a] rounded-md hover:bg-[#3a3a3a] active:scale-95 transition cursor-pointer"
            >
              Copy Result
            </button>

            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-500 rounded-md hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Clear
            </button>

          </div>

          {/* Output */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Result</label>

            <textarea
              value={output}
              readOnly
              className="w-full h-40 bg-[#111] border border-[#2a2a2a] rounded-lg p-4 text-[#00ff88] resize-none"
            />
          </div>

          {/* Notification */}
          {copied && (
            <div className="fixed bottom-6 right-6 bg-[#00ff88] text-black px-4 py-2 rounded-lg shadow-lg">
              Copied to clipboard!
            </div>
          )}

        </main>
      </div>
    </div>
  )
}