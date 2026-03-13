'use client'

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import CryptoJS from "crypto-js"

export default function Hash_Generator() {

  const [input, setInput] = useState("")
  const [copied, setCopied] = useState("")
  const [algorithm, setAlgorithm] = useState("all")

  const hashes = {
    md5: input ? CryptoJS.MD5(input).toString() : "",
    sha1: input ? CryptoJS.SHA1(input).toString() : "",
    sha256: input ? CryptoJS.SHA256(input).toString() : "",
    sha512: input ? CryptoJS.SHA512(input).toString() : ""
  }

  const copyHash = async (value: string, type: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(type)

    setTimeout(() => setCopied(""), 1200)
  }

  const clearAll = () => {
    setInput("")
  }

  const hashRow = (label: string, value: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-gray-400">{label}</label>

        <button
          onClick={() => copyHash(value, label)}
          className="text-xs px-3 py-1 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a] cursor-pointer"
        >
          Copy
        </button>
      </div>

      <textarea
        value={value}
        readOnly
        rows={2}
        className="w-full bg-[#111] border border-[#2a2a2a] rounded p-3 text-[#00ff88] text-sm resize-none"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <Sidebar />

      <div className="flex-1 ml-60 transition-all duration-300">
        <Header />

        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold">
            Hash Generator
          </h1>

          {/* Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="w-full h-40 bg-[#111] border border-[#2a2a2a] rounded-lg p-4 resize-none focus:outline-none focus:border-[#00ff88]"
          />

          {/* Algorithm Selector */}
          <div className="flex items-center gap-3">

            <label className="text-sm text-gray-400">
              Algorithm
            </label>

            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-[#111] border border-[#2a2a2a] rounded px-3 py-2 focus:border-[#00ff88] outline-none"
            >
              <option value="all">All Algorithms</option>
              <option value="md5">MD5</option>
              <option value="sha1">SHA-1</option>
              <option value="sha256">SHA-256</option>
              <option value="sha512">SHA-512</option>
            </select>

            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500 rounded hover:brightness-110 cursor-pointer"
            >
              Clear
            </button>

          </div>

          {/* Results */}

          {(algorithm === "all" || algorithm === "md5") &&
            hashRow("MD5", hashes.md5)}

          {(algorithm === "all" || algorithm === "sha1") &&
            hashRow("SHA-1", hashes.sha1)}

          {(algorithm === "all" || algorithm === "sha256") &&
            hashRow("SHA-256", hashes.sha256)}

          {(algorithm === "all" || algorithm === "sha512") &&
            hashRow("SHA-512", hashes.sha512)}

          {/* Notification */}
          {copied && (
            <div className="fixed bottom-6 right-6 bg-[#00ff88] text-black px-4 py-2 rounded-lg shadow-lg">
              {copied} copied!
            </div>
          )}

        </main>
      </div>
    </div>
  )
}