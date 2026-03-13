'use client'

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { useSidebar } from "@/lib/SidebarContext";

export default function Base64_Encoder() {

  const [mode, setMode] = useState<"text" | "image">("text")
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const encodeText = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)))
      setOutput(encoded)
    } catch {
      setOutput("Invalid text input")
    }
  }

  const decodeText = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(input)))
      setOutput(decoded)
    } catch {
      setOutput("Invalid Base64 string")
    }
  }

  const handleImageUpload = (file: File) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      setOutput(result)
      setImagePreview(result)
    }

    reader.readAsDataURL(file)
  }

  const decodeImage = () => {
    try {
      setImagePreview(input)
      setOutput(input)
    } catch {
      setOutput("Invalid Base64 image")
    }
  }

  const copyResult = async () => {
    if (!output) return

    await navigator.clipboard.writeText(output)
    setCopied(true)

    setTimeout(() => setCopied(false), 1500)
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setImagePreview(null)
  }
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      <Sidebar />

      <div className="flex-1 transition-all duration-300" style={{paddingLeft: isOpen ? '240px' : '80px'}}>
        <Header />

        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold text-[#00ff88]">
            Base64 Encoder / Decoder
          </h1>

          {/* Mode Selector */}
          <div className="flex gap-3">

            <button
              onClick={() => setMode("text")}
              className={`px-4 py-2 rounded-md cursor-pointer transition ${
                mode === "text"
                  ? "bg-[#00ff88] text-black"
                  : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
              }`}
            >
              Text
            </button>

            <button
              onClick={() => setMode("image")}
              className={`px-4 py-2 rounded-md cursor-pointer transition ${
                mode === "image"
                  ? "bg-[#00ff88] text-black"
                  : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
              }`}
            >
              Image
            </button>

          </div>

          {/* TEXT MODE */}
          {mode === "text" && (
            <>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text or Base64..."
                className="w-full h-40 bg-[#111] border border-[#2a2a2a] rounded-lg p-4 resize-none focus:border-[#00ff88] outline-none"
              />

              <div className="flex gap-3 flex-wrap">

                <button
                  onClick={encodeText}
                  className="px-4 py-2 bg-[#00ff88] text-black rounded-md cursor-pointer hover:brightness-110 active:scale-95 transition"
                >
                  Encode Text
                </button>

                <button
                  onClick={decodeText}
                  className="px-4 py-2 bg-blue-500 rounded-md cursor-pointer hover:brightness-110 active:scale-95 transition"
                >
                  Decode Text
                </button>

                <button
                  onClick={copyResult}
                  className="px-4 py-2 bg-[#2a2a2a] rounded-md cursor-pointer hover:bg-[#3a3a3a]"
                >
                  Copy Result
                </button>

                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-red-500 rounded-md cursor-pointer hover:brightness-110"
                >
                  Clear
                </button>

              </div>
            </>
          )}

          {/* IMAGE MODE */}
          {mode === "image" && (
            <>
                <div className="w-full">
                <label
                    htmlFor="imageUpload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#2a2a2a] rounded-lg cursor-pointer bg-[#111] hover:border-[#00ff88] hover:bg-[#151515] transition"
                >
                    <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-lg font-semibold text-[#00ff88]">
                        Upload Image
                    </p>
                    <p className="text-sm text-gray-400">
                        Click to browse or drag an image here
                    </p>
                    </div>
                </label>

                <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                    if (e.target.files?.[0]) {
                        handleImageUpload(e.target.files[0])
                    }
                    }}
                    className="hidden"
                />
                </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste Base64 image to decode..."
                className="w-full h-32 bg-[#111] border border-[#2a2a2a] rounded-lg p-4 resize-none"
              />

              <div className="flex gap-3 flex-wrap">

                <button
                  onClick={decodeImage}
                  className="px-4 py-2 bg-blue-500 rounded-md cursor-pointer hover:brightness-110"
                >
                  Decode Image
                </button>

                <button
                  onClick={copyResult}
                  className="px-4 py-2 bg-[#2a2a2a] rounded-md cursor-pointer hover:bg-[#3a3a3a]"
                >
                  Copy Base64
                </button>

                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-red-500 rounded-md cursor-pointer hover:brightness-110"
                >
                  Clear
                </button>

              </div>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Preview</p>
                  <img
                    src={imagePreview}
                    alt="Decoded preview"
                    className="max-w-md border border-[#2a2a2a] rounded"
                  />
                </div>
              )}
            </>
          )}

          {/* OUTPUT */}
          <textarea
            value={output}
            readOnly
            placeholder="Result..."
            className="w-full h-40 bg-[#111] border border-[#2a2a2a] rounded-lg p-4 text-[#00ff88] resize-none"
          />

          {copied && (
            <div className="fixed bottom-6 right-6 bg-[#00ff88] text-black px-4 py-2 rounded-lg">
              Copied!
            </div>
          )}

        </main>
      </div>
    </div>
  )
}