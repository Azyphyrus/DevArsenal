'use client'

import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { useSidebar } from "@/lib/SidebarContext"
import { useState, useEffect } from "react"
import Image from 'next/image'

type NoteBlock = { type: 'text'; content: string } | { type: 'image'; src: string }

interface Note {
  id: string
  title: string
  blocks: NoteBlock[]
}

export default function Notepad_Gallery() {

  const { isOpen } = useSidebar()

  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("notes")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [title, setTitle] = useState("")
  const [currentText, setCurrentText] = useState("")
  const [blocks, setBlocks] = useState<NoteBlock[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  // Save notes on change
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes))
  }, [notes])

  const addTextBlock = () => {
    if (currentText.trim() === "") return
    setBlocks([...blocks, { type: 'text', content: currentText }])
    setCurrentText("")
  }

  const addImageBlock = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setBlocks([...blocks, { type: 'image', src: reader.result as string }])
    }
    reader.readAsDataURL(file)
  }

  const addNote = () => {
    if (!title.trim() || blocks.length === 0) return
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      blocks
    }
    setNotes([newNote, ...notes])
    setTitle("")
    setBlocks([])
    setCurrentText("")
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id))
  }

  const previewText = (blocks: NoteBlock[]) => {
    return blocks
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; content: string }).content)
      .join(' ')
      .slice(0, 100) + (blocks.length > 1 ? "..." : "")
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      <Sidebar />

      <div
        className="flex-1 transition-all duration-300"
        style={{ paddingLeft: isOpen ? '240px' : '80px' }}
      >
        <Header />

        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold">Notepad Gallery</h1>

          {/* Add Note */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-6 space-y-3">

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3 outline-none focus:border-[#00ff88]"
            />

            <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Write some text..."
            className="w-full h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3 resize-none outline-none focus:border-[#00ff88]"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault() // prevent a newline from being inserted
                addTextBlock()
                }
            }}
            />
            <i className="text-xs">Note: You can press Shift + Enter to add your text</i>
            <div className="flex gap-2">
              <button
                onClick={addTextBlock}
                className="px-4 py-2 bg-[#00ff88] text-black rounded hover:brightness-110"
              >
                Add Text
              </button>

              <label className="px-4 py-2 bg-[#2a2a2a] rounded cursor-pointer hover:bg-[#3a3a3a]">
                Add Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) addImageBlock(e.target.files[0])
                  }}
                />
              </label>

              <button
                onClick={addNote}
                className="px-4 py-2 bg-blue-500 rounded hover:brightness-110"
              >
                Save Note
              </button>

                <button
                    onClick={() => {
                    setTitle("")
                    setCurrentText("")
                    setBlocks([])
                    }}
                    className="px-4 py-2 bg-gray-600 rounded hover:brightness-110"
                >
                    Reset
                </button>
            </div>

            {/* Preview blocks */}
            <div className="flex flex-col gap-2">
              {blocks.map((b, i) =>
                b.type === 'text' ? (
                  <p key={i} className="text-gray-300">{b.content}</p>
                ) : (
                  <img key={i} src={b.src} className="max-h-32 rounded border border-[#2a2a2a]" />
                )
              )}
            </div>

          </div>

          {/* Notes Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
              <div
                key={note.id}
                className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#00ff88] cursor-pointer transition"
                onClick={() => {
                  setSelectedNote(note)
                  setShowModal(true)
                }}
              >
                <h2 className="font-semibold text-lg mb-2">{note.title}</h2>
                <p className="text-sm text-gray-400 mb-2">{previewText(note.blocks)}</p>
                {note.blocks.map((b, i) => b.type === 'image' && (
                  <img key={i} src={b.src} className="h-24 w-full object-cover rounded mb-2" />
                ))}
                <button
                onClick={(e) => {
                    e.stopPropagation()
                    const confirmed = window.confirm(`Are you sure you want to delete "${note.title}"?`)
                    if (confirmed) deleteNote(note.id)
                }}
                className="mt-2 text-xs bg-red-500 px-2 py-1 rounded hover:brightness-110"
                >
                Delete
                </button>
              </div>
            ))}
          </div>

          {/* Modal */}
          {showModal && selectedNote && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6">
              <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-6 max-w-lg w-full space-y-4">
                <h2 className="text-xl font-bold">{selectedNote.title}</h2>
                <div className="flex flex-col gap-2">
                  {selectedNote.blocks.map((b, i) =>
                    b.type === 'text' ? (
                      <p key={i} className="text-gray-300 whitespace-pre-wrap">{b.content}</p>
                    ) : (
                      <img key={i} src={b.src} className="rounded border border-[#2a2a2a]" />
                    )
                  )}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a]"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}