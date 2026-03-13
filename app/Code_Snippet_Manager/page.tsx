'use client'

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import Editor from "@monaco-editor/react"
import { useSidebar } from "@/lib/SidebarContext";

interface Snippet {
  id: string
  title: string
  language: string
  code: string
}

export default function Code_Snippet_Manager() {

  const [snippets, setSnippets] = useState<Snippet[]>([])

  const [title, setTitle] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Load snippets from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem("devtools_snippets")
    if (!stored) return

    // Defer setState to avoid cascading render warning
    requestAnimationFrame(() => {
      setSnippets(JSON.parse(stored))
    })
  }, [])

  // Save snippets
    const [toast, setToast] = useState<string | null>(null)

    const saveSnippet = () => {
      if (!title.trim()) return

      const existingIndex = snippets.findIndex(s => s.id === editingId)
      let updatedSnippets: Snippet[]

      if (existingIndex > -1) {
        updatedSnippets = [...snippets]
        updatedSnippets[existingIndex] = { id: editingId!, title, language, code }
      } else {
        const newSnippet: Snippet = {
          id: Date.now().toString(),
          title,
          language,
          code
        }
        updatedSnippets = [...snippets, newSnippet]
      }

      setSnippets(updatedSnippets)
      if (typeof window !== "undefined") {
        localStorage.setItem("devtools_snippets", JSON.stringify(updatedSnippets))
      }

      // Reset editor
      setTitle("")
      setCode("")
      setLanguage("javascript")
      setEditingId(null)

      // Show toast
      setToast("Snippet saved successfully!")
      setTimeout(() => setToast(null), 2000) // disappears after 2s
    }

    const makeNewSnippet = () => {
      setTitle("")
      setCode("")
      setLanguage("javascript")
      setEditingId(null)
    }

    const loadSnippet = (snippet: Snippet) => {
      setTitle(snippet.title)
      setLanguage(snippet.language)
      setCode(snippet.code)
      setEditingId(snippet.id) // important
    }

    const deleteSnippet = (id: string) => {
      const confirmed = window.confirm("Are you sure you want to delete this snippet?")
      if (!confirmed) return

      const updated = snippets.filter(s => s.id !== id)
      setSnippets(updated)
      if (typeof window !== "undefined") {
        localStorage.setItem("devtools_snippets", JSON.stringify(updated))
      }
    }

  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      <Sidebar />

      <div className="flex-1 transition-all duration-300" style={{paddingLeft: isOpen ? '240px' : '80px'}}>

        <Header />

        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold">Code Snippet Manager</h1>

          <div className="flex gap-4">

            {/* Snippet List */}
            <div className="w-1/4 bg-[#111] p-4 rounded flex flex-col">
              <h2 className="mb-3 font-semibold">Saved Snippets</h2>

              {/* Scrollable container */}
              <div className="max-h-100 overflow-y-auto">
                {snippets.length === 0 && (
                  <p className="text-sm text-gray-400">
                    No snippets stored locally
                  </p>
                )}

                {snippets.map(snippet => (
                  <div
                    key={snippet.id}
                    className="flex items-center gap-2 p-1 hover:bg-[#222] rounded"
                  >
                    {/* Title: scrollable horizontally if too long */}
                    <span
                      onClick={() => loadSnippet(snippet)}
                      className="flex-1 overflow-x-auto whitespace-nowrap cursor-pointer"
                    >
                      {snippet.title}
                    </span>

                    {/* Delete button: always visible */}
                    <button
                      onClick={() => deleteSnippet(snippet.id)}
                      className="shrink-0 text-red-500 px-2 py-1 rounded cursor-pointer
                                hover:bg-red-600 hover:text-white
                                active:scale-95 transition-all duration-150 ease-in-out"
                      title="Delete snippet"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* Editor */}
            <div className="flex-1 space-y-3">

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Snippet title"
                className="w-full p-2 bg-[#111] border border-[#333] rounded"
              />

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="p-2 bg-[#111] border border-[#333] rounded"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="json">JSON</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="python">Python</option>
              </select>

              <Editor
                height="350px"
                theme="vs-dark"
                language={language}
                value={code}
                onChange={(value) => setCode(value || "")}
              />

            <div className="flex gap-2">
              <button
                onClick={saveSnippet}
                className="px-4 py-2 bg-[#00ff88] text-black rounded font-semibold"
              >
                Save Snippet
              </button>

              <button
                onClick={makeNewSnippet}
                className="px-4 py-2 bg-[#555] text-white rounded font-semibold"
              >
                New Snippet
              </button>
            </div>

            </div>

          </div>

          {toast && (
            <div className="fixed top-5 right-5 bg-green-500 text-black px-4 py-2 rounded shadow">
              {toast}
            </div>
          )}

        </main>

      </div>

    </div>
  )
}