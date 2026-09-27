"use client";

import { Loader2, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AIAgentMessage({ role, text, onSpeak, onStop, isSpeaking }: { role: "user" | "assistant"; text: string; onSpeak?: () => void; onStop?: () => void; isSpeaking?: boolean }) {
  if (role === "user") return (
    <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md border border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-zinc-100">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300/70">You</p>
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  );

  return (
    <div className="group max-w-full py-1 text-xs leading-5 text-zinc-300">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        Nexyrium AI
        {onSpeak && <button type="button" onClick={isSpeaking ? onStop : onSpeak} aria-label={isSpeaking ? "Stop speaking this response" : "Speak this response"} title={isSpeaking ? "Stop speaking" : "Speak this response"} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-amber-400">{isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>}
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h1: ({ children }) => <h1 className="mt-3 text-base font-bold text-zinc-100 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mt-3 text-sm font-bold text-zinc-100 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mt-3 text-xs font-bold text-zinc-100 first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-amber-400">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-amber-400">{children}</ol>,
        blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-amber-400/50 pl-3 text-zinc-400">{children}</blockquote>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">{children}</a>,
        code: ({ children, className }) => className ? <code className={`${className} block overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-200`}>{children}</code> : <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px] text-amber-200">{children}</code>,
        pre: ({ children }) => <pre className="my-2 max-w-full overflow-x-auto">{children}</pre>,
        table: ({ children }) => <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-zinc-800"><table className="w-full min-w-max border-collapse text-left text-[11px]">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-zinc-800/80 text-zinc-200">{children}</thead>,
        th: ({ children }) => <th className="whitespace-nowrap border-b border-zinc-700 px-3 py-2 font-semibold">{children}</th>,
        td: ({ children }) => <td className="border-b border-zinc-800 px-3 py-2 align-top last:border-b-0">{children}</td>,
      }}>{text}</ReactMarkdown>
    </div>
  );
}

export function AIAgentTypingIndicator() {
  return <div className="flex items-center gap-2 py-2 text-xs text-zinc-400"><Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" /><span className="font-medium">Nexyrium AI</span><span className="tracking-[0.25em] text-amber-400">•••</span></div>;
}
