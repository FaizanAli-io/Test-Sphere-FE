import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./useApi";

interface StreamChunkChoiceDelta {
  content?: string;
}
interface StreamChunkChoice {
  delta?: StreamChunkChoiceDelta;
}
interface StreamChunk {
  choices?: StreamChunkChoice[];
}

export interface UseAgentStreamState {
  isStreaming: boolean;
  response: string;
  error: string | null;
  message: string;
  setMessage: (val: string) => void;
  send: (customMessage?: string) => Promise<void>;
  abort: () => void;
}

const STREAM_ENDPOINT = "/agent/stream";

export function useAgentStream(): UseAgentStreamState {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async (custom?: string) => {
      const msg = custom ?? message;
      if (!msg.trim() || isStreaming) return;
      setError(null);
      setResponse("");
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await api(STREAM_ENDPOINT, {
          method: "POST",
          body: JSON.stringify({ prompt: msg }),
          signal: controller.signal,
          stream: true,
          auth: true,
        });
        if (!res.ok || !res.body) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            if (data === "[DONE]") {
              abort();
              return;
            }
            try {
              const parsed: StreamChunk = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) setResponse((prev) => prev + text);
            } catch {}
          }
        }
        abort();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "Unknown error");
        abort();
      }
    },
    [message, isStreaming, abort],
  );

  useEffect(() => () => abort(), [abort]);

  return { isStreaming, response, error, message, setMessage, send, abort };
}
