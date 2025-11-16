"use client";

import React, { useEffect, useRef, useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAgentStream } from "./useAgentStream";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const genId = () => Math.random().toString(36).slice(2, 11);

export default function PrepGuru() {
  const { message, setMessage, send, abort, isStreaming, response, error } = useAgentStream();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Copy message content to clipboard
  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedId(messageId);
        setTimeout(() => setCopiedId(null), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      },
    );
  };

  // when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setMessages((prev) => {
        if (prev.some((m) => m.streaming && m.role === "assistant")) return prev;
        return [...prev, { id: genId(), role: "assistant", content: "", streaming: true }];
      });
    }
  }, [isStreaming]);

  // update assistant message as it streams
  useEffect(() => {
    if (!response) return;
    setMessages((prev) =>
      prev.map((m) => (m.streaming && m.role === "assistant" ? { ...m, content: response } : m)),
    );
  }, [response]);

  // mark message done streaming
  useEffect(() => {
    if (!isStreaming) {
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    }
  }, [isStreaming]);

  // auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const sendPrompt = () => {
    if (!message.trim() || isStreaming) return;
    const trimmed = message.trim();
    setMessages((prev) => [...prev, { id: genId(), role: "user", content: trimmed }]);
    send(trimmed);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendPrompt();
    }
  };

  const clearChat = () => {
    abort();
    setMessages([]);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-3xl mx-auto border border-gray-200 rounded-2xl bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-between">
        <h1 className="font-semibold text-lg">PrepGuru</h1>
        <button
          onClick={clearChat}
          disabled={isStreaming || messages.length === 0}
          className="text-xs bg-white/10 hover:bg-white/20 rounded px-3 py-1 transition disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 bg-gradient-to-br from-white to-blue-50 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-16 text-sm">
            💬 Start chatting with PrepGuru!
            <br />
            <span className="italic text-blue-700">
              Example: “Explain quantum entanglement simply.”
            </span>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="flex gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-blue-500 text-white"
              }`}
            >
              {m.role === "user" ? "Y" : "AI"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 uppercase mb-1">
                {m.role === "user" ? "You" : "Assistant"}
              </div>

              <div
                className={`rounded-xl border p-4 text-gray-800 leading-relaxed relative group ${
                  m.role === "user" ? "bg-indigo-50 border-indigo-100" : "bg-white border-gray-200"
                }`}
              >
                {m.role === "assistant" && !m.streaming && (
                  <button
                    onClick={() => copyToClipboard(m.content, m.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600"
                    title="Copy to clipboard"
                    aria-label="Copy to clipboard"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <ClipboardCopy className="w-4 h-4" />
                    )}
                  </button>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {m.content}
                </ReactMarkdown>
                {m.streaming && <span className="opacity-50 animate-pulse">▌</span>}
              </div>
            </div>
          </div>
        ))}

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your question... (Ctrl+Enter to send)"
            disabled={isStreaming}
            rows={1}
            className="flex-1 text-sm rounded-lg border border-gray-300 bg-white p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 shadow-sm max-h-48 overflow-y-auto"
          />
          {isStreaming ? (
            <button
              onClick={abort}
              className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={sendPrompt}
              disabled={!message.trim()}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              Send
            </button>
          )}
        </div>

        <div className="mt-2 text-[10px] text-gray-600 flex justify-between">
          <span>⚠️ AI may make mistakes — verify key facts.</span>
          <span>Ctrl+Enter to send</span>
        </div>
      </div>
    </div>
  );
}
