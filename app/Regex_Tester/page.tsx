'use client'
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useState, useRef } from "react";
import { useSidebar } from "@/lib/SidebarContext";

export default function Regex_Tester() {
  const { isOpen } = useSidebar();
  const [code, setCode] = useState("");
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [error, setError] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [matchesValid, setMatchesValid] = useState(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const isDisabled = !pattern.trim() || !code.trim();

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
  };

  // ------------------------
  // Clear highlights helper
  const clearHighlights = () => {
    if (editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        []
      );
    }
    setMatchCount(0);
    setMatchesValid(false);
  };

  // ------------------------
  // Handlers that clear highlights on user input
  const handleCodeChange = (value: string | undefined) => {
    setCode(value || "");
    clearHighlights();
  };

  const handlePatternChange = (value: string) => {
    setPattern(value);
    clearHighlights();
  };

  const toggleFlag = (flag: string) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.replace(flag, "") : prev + flag
    );
    clearHighlights();
  };

  // ------------------------
  // Run Regex when button is clicked
  const updateHighlights = () => {
    if (!editorRef.current || !monacoRef.current) return;

    if (!pattern.trim() || !code.trim()) {
      setError("Please enter text and pattern");
      clearHighlights();
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    let count = 0;

    try {
      setError("");
      const regex = new RegExp(pattern, flags);
      const text = editor.getValue();

      const matches: monaco.editor.IModelDeltaDecoration[] = [];
      let match;

      while ((match = regex.exec(text)) !== null) {
        count++;

        const start = model.getPositionAt(match.index);
        const end = model.getPositionAt(match.index + match[0].length);

        matches.push({
          range: new monaco.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column
          ),
          options: {
            inlineClassName: "regexHighlight",
          },
        });

        // prevent infinite loop
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }

      setMatchCount(count);
      setMatchesValid(true);

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        matches
      );

    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Invalid regex");

      clearHighlights();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      {/*
      <div className="h-1 w-full bg-[#00ff88] animate-pulse"></div>
      */}
      <div>
      <Sidebar />
      </div>
      <div className="flex-1 transition-all duration-300" style={{paddingLeft: isOpen ? '240px' : '80px'}}>
        <Header />
        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold">Regex Tester</h1>

          {/* Pattern */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Regex Pattern
            </label>
            <input
              value={pattern}
              onChange={(e) => handlePatternChange(e.target.value)}
              placeholder="e.g. \\btest\\b"
              className="w-full p-3 rounded bg-[#2a2a2a] border border-gray-600 outline-none"
            />
          </div>

          {/* Flags */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Flags
            </label>
            <div className="flex gap-3">
              {["g", "i", "m", "s", "u", "y"].map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFlag(f)}
                  className={`px-4 py-2 rounded border ${
                    flags.includes(f)
                      ? "bg-blue-600 border-blue-600 cursor-pointer"
                      : "border-gray-600 cursor-pointer"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-400">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 items-center">
            <button
              onClick={updateHighlights}
              disabled={isDisabled}
              className={`px-6 py-2 rounded font-semibold
                ${isDisabled
                  ? "bg-gray-600 cursor-not-allowed opacity-50 pointer-events-none"
                  : "bg-green-600 hover:bg-green-700 cursor-pointer"
                }`}
            >
              Run Regex
            </button>

            <button
              onClick={() => {
                setPattern("");
                setCode("");
                setError("");
                clearHighlights();
              }}
              className="px-4 py-2 border border-gray-600 rounded cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Match count */}
          {!error && matchesValid && (
            <div className="text-sm text-gray-400">
              {matchCount} match{matchCount !== 1 && "es"} found
            </div>
          )}

          {/* Monaco Editor */}
          <div className="border border-gray-700 rounded overflow-hidden">
            <Editor
              height="400px"
              defaultLanguage="plaintext"
              value={code}
              onChange={handleCodeChange}
              onMount={handleMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
              }}
            />
          </div>

        </main>
      </div>
    </div>
  );
}