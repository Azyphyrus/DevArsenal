"use client"

import Editor from "@monaco-editor/react"

export default function CodeEditor() {
  return (
    <Editor
      height="400px"
      defaultLanguage="json"
      defaultValue='{"hello": "world"}'
      theme="vs-dark"
    />
  )
}