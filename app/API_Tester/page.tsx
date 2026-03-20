'use client'
import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useSidebar } from "@/lib/SidebarContext";

// Dynamically import Monaco Editor (Next.js SSR safe)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function APITester() {
  const { isOpen } = useSidebar();
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [response, setResponse] = useState('');
  
  // FIX: Allow status to be a number OR null
  const [status, setStatus] = useState<number | null>(null);
  
  // FIX: Allow error to be a string OR null
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async () => {
    setError(null);
    setResponse('');
    setStatus(null);

    try {
      const parsedHeaders = JSON.parse(headers || '{}');
      
      // Basic validation for JSON body
      let requestBody: string | undefined = undefined;
      if (method !== "GET" && body) {
        requestBody = JSON.stringify(JSON.parse(body));
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders
        },
        body: requestBody,
      });

      const data = await res.json().catch(() => null);
      
      setStatus(res.status);
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      // FIX: Check if err is an instance of Error to safely access .message
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
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
        <main className="p-8">
          <h1 className="text-2xl font-bold mb-4">API Tester</h1>

          <input
            type="text"
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded outline-none focus:border-blue-500"
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="p-2 mb-4 bg-gray-800 border border-gray-700 rounded outline-none"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>

          <div className="mb-4">
            <label className="block mb-1 text-sm text-gray-400">Headers (JSON)</label>
            <MonacoEditor
              height="120px"
              defaultLanguage="json"
              value={headers}
              // FIX: Fallback to empty string if value is undefined
              onChange={(value) => setHeaders(value ?? '')}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>

          {method !== "GET" && (
            <div className="mb-4">
              <label className="block mb-1 text-sm text-gray-400">Body (JSON)</label>
              <MonacoEditor
                height="180px"
                defaultLanguage="json"
                value={body}
                // FIX: Fallback to empty string if value is undefined
                onChange={(value) => setBody(value ?? '')}
                theme="vs-dark"
                options={{ minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>
          )}

          <button
            onClick={sendRequest}
            className="bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-2 rounded font-semibold mb-4"
          >
            Send Request
          </button>

          {status && (
            <div className={`mb-2 font-mono ${status >= 400 ? 'text-red-400' : 'text-green-400'}`}>
              Status: {status}
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
            <div className="bg-gray-800 px-4 py-1 text-xs uppercase tracking-wider text-gray-400">Response</div>
            <MonacoEditor
              height="300px"
              defaultLanguage="json"
              value={response || error || ''}
              theme="vs-dark"
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>
        </main>
      </div>
    </div>
    
  );
}