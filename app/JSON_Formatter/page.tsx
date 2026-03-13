'use client'
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Editor from "@monaco-editor/react";
import { OnMount } from "@monaco-editor/react";

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONValue[];

type JSONObject = {
  [key: string]: JSONValue;
};

export default function JSON_Formatter() {

  const [copied, setCopied] = useState<string | null>(null);
  const [variables, setVariables] = useState<string[]>([]);

  
  type TreeNode = {
    name: string
    children?: TreeNode[]
  }

  const [tree, setTree] = useState<TreeNode[]>([]);

    function TreeView({ nodes }: { nodes: TreeNode[] }) {
    return (
      <ul className="border-l border-gray-700 ml-3">
        {nodes.map((node, index) => (
          <li key={index} className="relative pl-4">

            {/* horizontal connector */}
            <span className="absolute left-0 top-3 w-3 border-t border-gray-700"></span>

            <div className="py-1 font-mono text-sm">
              {node.name}
            </div>

            {node.children && node.children.length > 0 && (
              <TreeView nodes={node.children} />
            )}

          </li>
        ))}
      </ul>
    );
  }
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "tree">("list");
  const DEFAULT_JSON = `{
  "user": {
    "id": 1,
    "name": "User",
    "profile": {
      "email": "user@example.com",
      "address": {
        "city": "City",
        "country": "Country"
      }
    }
  },
  "orders": [
    {
      "id": 101,
      "product": "Laptop"
    },
    {
      "id": 102,
      "product": "Keyboard"
    }
  ]
}`;

  const [editorValue, setEditorValue] = useState(DEFAULT_JSON);

  const handleEditorMount: OnMount = (editor) => {
  editor.getAction("editor.action.formatDocument")?.run();
};

  const copyVariable = async (value: string) => {
    await navigator.clipboard.writeText(`{${value}}`);
    setCopied(value);

    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };

  const extractKeys = (data: JSONValue, prefix = "", depth = 0) => {
    let vars: string[] = [];
    let treeLines: string[] = [];

    if (typeof data === "object" && data !== null) {

      if (Array.isArray(data)) {

        data.forEach((item, index) => {
          const path = `${prefix}[${index}]`;
          vars.push(path);

          const indent = "  ".repeat(depth);
          treeLines.push(`${indent}- [${index}]`);

          const child = extractKeys(item, path, depth + 1);
          vars = vars.concat(child.vars);
          treeLines = treeLines.concat(child.treeLines);
        });

      } else {

        Object.entries(data).forEach(([key, value]) => {

          const path = prefix ? `${prefix}.${key}` : key;

          vars.push(path);

          const indent = "  ".repeat(depth);
          treeLines.push(`${indent}- ${key}`);

          const child = extractKeys(value, path, depth + 1);

          vars = vars.concat(child.vars);
          treeLines = treeLines.concat(child.treeLines);
        });

      }
    }

    return { vars, treeLines };
  };

    const buildTree = (data: JSONValue): TreeNode[] => {

      if (typeof data !== "object" || data === null) return [];

      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          name: `[${index}]`,
          children: buildTree(item)
        }));
      }

      return Object.entries(data).map(([key, value]) => ({
        name: key,
        children: buildTree(value)
      }));
    };

    const formatJSON = () => {
    try {
      setError("");

      const parsed: JSONValue = JSON.parse(editorValue);

      const result = extractKeys(parsed);

      setVariables(result.vars);
      setTree(buildTree(parsed));

    } catch {
      setError("Invalid JSON");
      setVariables([]);
      setTree([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      <Sidebar />

      <div className="flex-1 ml-60 transition-all duration-300">

        <Header />

        <main className="p-8 space-y-6">

          <h1 className="text-2xl font-bold text-[#00ff88]">
            JSON Variable Mapper
          </h1>

          {/* INPUT */}
          <div className="border border-[#2a2a2a] rounded-lg">
            <Editor
              height="350px"
              defaultLanguage="json"
              theme="vs-dark"
              value={editorValue}
              onChange={(value) => setEditorValue(value || "")}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true
              }}
            />
          </div>

          <div className="flex gap-4">

            <button
              onClick={formatJSON}
              className="bg-[#00ff88] text-black px-6 py-2 rounded-lg font-semibold hover:opacity-80"
            >
              Generate Variables
            </button>

            <button
              onClick={() => setView(view === "list" ? "tree" : "list")}
              className="border border-[#2a2a2a] px-4 py-2 rounded-lg"
            >
              Toggle {view === "list" ? "Tree" : "List"}
            </button>

          </div>

          {error && (
            <p className="text-red-400">{error}</p>
          )}

          {/* OUTPUT */}

          {view === "list" && variables.length > 0 && (

            <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4">

              <h2 className="mb-4 text-lg font-semibold">Variables</h2>

              <div className="space-y-2 font-mono text-sm">

                {variables.map((v, i) => (

                  <div
                    key={i}
                    className="flex justify-between items-center px-3 py-2 rounded bg-[#1f1f1f] hover:bg-[#2a2a2a]"
                  >

                    <span>{v}</span>

                    <button
                      onClick={() => copyVariable(v)}
                      className="text-xs bg-[#00ff88] text-black px-2 py-1 rounded"
                    >
                      Copy
                    </button>

                  </div>

                ))}

              </div>

            </div>

          )}

          {/* TREE VIEW */}

          {view === "tree" && tree.length > 0 && (

            <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4">

              <h2 className="mb-4 text-lg font-semibold">Tree View</h2>

            <TreeView nodes={tree} />

            </div>

          )}

          {copied && (
            <div className="fixed bottom-6 right-6 bg-[#00ff88] text-black px-4 py-2 rounded-lg shadow-lg font-medium">
              Copied
            </div>
          )}
        </main>

      </div>

    </div>
  );
}


