"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, Loader2, Mic, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { ConversationContext, EMPTY_CONVERSATION_CONTEXT } from "@/lib/ai-agent/conversation-context";
import type { AutomationEvent } from "@/lib/automation/automation-engine";
import { useSpeechRecognition } from "@/lib/voice/use-speech-recognition";
import { useTextToSpeech } from "@/lib/voice/use-text-to-speech";
import { AIAgentMessage, AIAgentTypingIndicator } from "./ai-agent-message";

const suggestions = [
  "Give me today's operations briefing.",
  "Which projects are at risk?",
  "Which projects are due soon?",
  "Who is overloaded right now?",
];

type TaskProposal = {
  action_id: string;
  project_name: string;
  task_name: string;
  description: string;
  department: string;
  assigned_user: string;
  priority: string;
  deadline: string | null;
};

type PlanAction = {
  id: string;
  type: "create_task";
  reason: string;
  risk: "low" | "medium" | "high";
  requiresApproval: true;
  action_id: string;
  payload: {
    projectName: string;
    name: string;
    description: string;
    department: string;
    assignedUserName: string;
    priority: string;
    deadline: string | null;
  };
};

type OperationsPlan = {
  title: string;
  summary: string;
  priority: string;
  reasoning: string[];
  actions: PlanAction[];
};

type PlanActionStatus = "pending" | "approving" | "success" | "failed" | "not_executed" | "cancelled";
type ChatMessage = { role: "user" | "assistant"; text: string };

export function AIAgentPanel() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<TaskProposal | null>(null);
  const [actionState, setActionState] = useState<"idle" | "approving" | "cancelling" | "success" | "error">("idle");
  const [plan, setPlan] = useState<OperationsPlan | null>(null);
  const [planStatuses, setPlanStatuses] = useState<Record<string, PlanActionStatus>>({});
  const [planLoading, setPlanLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext>(EMPTY_CONVERSATION_CONTEXT);
  const [automationEvents, setAutomationEvents] = useState<AutomationEvent[]>([]);
  const [automationLoaded, setAutomationLoaded] = useState(false);
  const [voiceState, setVoiceState] = useState<"IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING" | "ERROR">("IDLE");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const { speak, stop: stopSpeaking, isSpeaking, supported: ttsSupported, error: ttsError } = useTextToSpeech();
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  function appendAssistant(text: string) {
    setMessages((current) => [...current, { role: "assistant" as const, text }].slice(-8));
  }

  function removePendingAction(actionId: string) {
    setConversationContext((current) => ({ ...current, actionIds: current.actionIds.filter((id) => id !== actionId) }));
  }

  function speakResponse(text: string, shouldSpeak: boolean) {
    if (shouldSpeak && voiceOutputEnabled && ttsSupported) {
      speak(text);
      setVoiceState("IDLE");
    } else if (shouldSpeak) {
      setVoiceState("IDLE");
    }
  }

  useEffect(() => {
    if (!open || automationLoaded) return;
    fetch("/api/automation/events")
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load automated attention.")))
      .then((data) => setAutomationEvents(Array.isArray(data.events) ? data.events : []))
      .catch(() => setAutomationEvents([]))
      .finally(() => setAutomationLoaded(true));
  }, [open, automationLoaded]);

  useEffect(() => {
    if (open && shouldAutoScroll.current) bottomAnchorRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, open, proposal, plan]);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      const prompt = (event as CustomEvent<string>).detail;
      if (typeof prompt === "string" && prompt.trim()) { setOpen(true); ask(prompt); }
    };
    window.addEventListener("nexyrium-ai-prompt", handlePrompt);
    return () => window.removeEventListener("nexyrium-ai-prompt", handlePrompt);
  });

  async function ask(text = message, shouldSpeak = false) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setLoading(true);
    if (shouldSpeak) setVoiceState("PROCESSING");
    setMessages((current) => [...current, { role: "user" as const, text: prompt }].slice(-8));
    try {
      const response = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: messages.slice(-8),
          conversation_context: conversationContext,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      if (data.conversation_context) setConversationContext(data.conversation_context as ConversationContext);
      if (data.type === "task_creation_proposal") {
        setProposal(data as TaskProposal);
        const summary = "A task proposal is ready for your explicit approval. Review it and use the visual Approve control to continue.";
        appendAssistant(summary);
        speakResponse(summary, shouldSpeak);
      } else if (data.type === "operations_plan_proposal") {
        const nextPlan = data.plan as OperationsPlan;
        setPlan(nextPlan);
        setPlanStatuses(Object.fromEntries(nextPlan.actions.map((action) => [action.id, "pending"])));
        const summary = "A recommended action plan is ready for your review and explicit approval. Review the proposed actions before using the visual Approve Plan control.";
        appendAssistant(summary);
        speakResponse(summary, shouldSpeak);
      } else {
        const answer = data.answer || "No answer returned.";
        appendAssistant(answer);
        speakResponse(answer, shouldSpeak);
      }
    } catch (error) {
      appendAssistant(error instanceof Error ? error.message : "Something went wrong.");
      if (shouldSpeak) setVoiceState("ERROR");
    } finally {
      setLoading(false);
      setMessage("");
      if (!shouldSpeak) setVoiceState("IDLE");
    }
  }

  const recognition = useSpeechRecognition((text) => {
    if (process.env.NODE_ENV !== "production") console.info("[voice-debug] existing AI submit function called", { finalTranscriptReceived: true });
    ask(text, true);
  });
  const { stop: stopRecognition } = recognition;

  function toggleVoice() {
    if (!recognition.supported) { recognition.start(); setVoiceState("ERROR"); return; }
    if (isSpeaking) stopSpeaking();
    if (recognition.isListening) { recognition.stop(); setVoiceState("IDLE"); }
    else { setVoiceState("LISTENING"); recognition.start(); }
  }

  useEffect(() => () => { stopRecognition(); stopSpeaking(); }, [stopRecognition, stopSpeaking]);

  async function approvePlan() {
    if (!plan || !plan.actions.length || planLoading) return;
    setPlanLoading(true);
    const outcomes: string[] = [];
    for (let index = 0; index < plan.actions.length; index++) {
      const action = plan.actions[index];
      setPlanStatuses((current) => ({ ...current, [action.id]: "approving" }));
      try {
        const response = await fetch("/api/ai-agent/actions/create-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action_id: action.action_id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Request failed");
        outcomes.push(`✓ ${action.payload.name} completed`);
        setPlanStatuses((current) => ({ ...current, [action.id]: "success" }));
        removePendingAction(action.action_id);
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Something went wrong.";
        outcomes.push(`✗ ${action.payload.name} failed: ${detail}`);
        setPlanStatuses((current) => ({
          ...current,
          [action.id]: "failed",
          ...Object.fromEntries(plan.actions.slice(index + 1).map((remaining) => [remaining.id, "not_executed"])),
        }));
        appendAssistant(`Plan execution:\n${outcomes.join("\n")}\n○ Remaining actions were not executed.`);
        setPlanLoading(false);
        return;
      }
    }
    appendAssistant(`Plan execution:\n${outcomes.join("\n")}`);
    setPlanLoading(false);
  }

  async function cancelPlan() {
    if (!plan || planLoading) return;
    setPlanLoading(true);
    const pendingActions = plan.actions.filter((action) => planStatuses[action.id] === "pending");
    const cancellations = await Promise.all(pendingActions.map(async (action) => {
      try {
        const response = await fetch("/api/ai-agent/actions/cancel-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action_id: action.action_id }),
        });
        if (!response.ok) throw new Error("Cancellation failed");
        setPlanStatuses((current) => ({ ...current, [action.id]: "cancelled" }));
        removePendingAction(action.action_id);
        return true;
      } catch {
        setPlanStatuses((current) => ({ ...current, [action.id]: "failed" }));
        return false;
      }
    }));
    appendAssistant(cancellations.every(Boolean)
      ? "Plan cancelled. No pending actions were executed."
      : "Some plan proposals could not be cancelled. No action was executed by this request; review the failed proposals before trying again.");
    setPlanLoading(false);
  }

  async function handleProposal(action: "approve" | "cancel") {
    if (!proposal || actionState === "approving" || actionState === "cancelling") return;
    const isApproval = action === "approve";
    setActionState(isApproval ? "approving" : "cancelling");
    try {
      const response = await fetch(isApproval ? "/api/ai-agent/actions/create-task" : "/api/ai-agent/actions/cancel-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: proposal.action_id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      if (isApproval) {
        setActionState("success");
        appendAssistant(`Task created successfully.\n\n${data.task_name || proposal.task_name}\nProject: ${data.project_name || proposal.project_name}\nAssigned to: ${data.assigned_user || proposal.assigned_user}${data.deadline ? `\nDeadline: ${data.deadline}` : ""}\nTask ID: ${data.task_id}`);
        removePendingAction(proposal.action_id);
      } else {
        setProposal(null);
        appendAssistant("Action cancelled. No changes were made.");
        removePendingAction(proposal.action_id);
        setActionState("idle");
      }
    } catch (error) {
      setActionState("error");
      appendAssistant(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-[70] w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Nexyrium AI</p>
                <p className="text-[10px] text-zinc-500">CRM operations copilot · AI-powered</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={messageScrollRef} onScroll={(event) => { const element = event.currentTarget; shouldAutoScroll.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48; }} className="max-h-[420px] overflow-y-auto p-4">
            {automationLoaded && automationEvents.length > 0 && (
              <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">Automated attention</p>
                    <p className="mt-1 text-xs text-zinc-300">{automationEvents.length} issue{automationEvents.length === 1 ? "" : "s"} detected · needs review</p>
                  </div>
                  <button onClick={() => ask("Explain the automated attention items and what I should review first.")} disabled={loading} className="rounded-lg border border-amber-400/30 px-2.5 py-1.5 text-[10px] font-bold text-amber-300 disabled:opacity-50">Ask AI</button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {automationEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="text-xs leading-5 text-zinc-400">
                      <span className={`mr-2 font-semibold uppercase ${event.severity === "critical" ? "text-red-400" : event.severity === "high" ? "text-amber-400" : "text-zinc-400"}`}>[{event.severity}]</span>
                      <span className="text-zinc-200">{event.title}</span>{event.department ? ` · ${event.department}` : event.metadata.projectName ? ` · ${String(event.metadata.projectName)}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {messages.length === 0 && !proposal && !plan && !loading && (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold">Ask about your operations</span>
                  </div>
                  <p className="text-xs leading-5 text-zinc-400">The agent can read accessible operations data and propose a task for your explicit approval.</p>
                </div>
                <div className="grid gap-2">
                  {suggestions.map((item) => (
                    <button key={item} onClick={() => ask(item)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white">
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <AIAgentTypingIndicator />}

            {messages.length > 0 && (
              <div className="mb-3 space-y-3">
                {messages.map((item, index) => (
                  <AIAgentMessage key={`${item.role}-${index}-${item.text.slice(0, 20)}`} role={item.role} text={item.text} onSpeak={item.role === "assistant" && ttsSupported ? () => speak(item.text) : undefined} onStop={stopSpeaking} isSpeaking={item.role === "assistant" && isSpeaking} />
                ))}
                {(conversationContext.projects.length > 0 || conversationContext.users.length > 0) && (
                  <p className="px-1 text-[10px] text-zinc-600">Using context from this conversation</p>
                )}
              </div>
            )}

            {proposal && !loading && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">Action required</p>
                <h3 className="mt-1 text-sm font-bold text-white">Create Task</h3>
                <dl className="mt-3 space-y-2 text-xs leading-5">
                  <div><dt className="text-zinc-500">Project</dt><dd className="text-zinc-200">{proposal.project_name}</dd></div>
                  <div><dt className="text-zinc-500">Task</dt><dd className="text-zinc-200">{proposal.task_name}</dd></div>
                  <div><dt className="text-zinc-500">Assigned to</dt><dd className="text-zinc-200">{proposal.assigned_user}</dd></div>
                  <div><dt className="text-zinc-500">Priority</dt><dd className="text-zinc-200">{proposal.priority}</dd></div>
                  {proposal.deadline && <div><dt className="text-zinc-500">Deadline</dt><dd className="text-zinc-200">{proposal.deadline}</dd></div>}
                  {proposal.description && <div><dt className="text-zinc-500">Description</dt><dd className="text-zinc-200">{proposal.description}</dd></div>}
                </dl>
                {actionState === "success" ? (
                  <p className="mt-4 flex items-center gap-2 text-xs text-emerald-400"><Check className="h-4 w-4" /> Task created successfully.</p>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleProposal("approve")} disabled={actionState === "approving" || actionState === "cancelling"} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
                      {actionState === "approving" ? "Creating…" : "Approve"}
                    </button>
                    <button onClick={() => handleProposal("cancel")} disabled={actionState === "approving" || actionState === "cancelling"} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 disabled:opacity-50">
                      {actionState === "cancelling" ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {plan && !loading && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">Recommended action plan</p>
                <h3 className="mt-1 text-sm font-bold text-white">{plan.title}</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-300">{plan.summary}</p>

                {plan.reasoning.length > 0 && (
                  <div className="mt-4 border-t border-zinc-800 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Analysis</p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                      {plan.reasoning.map((reason) => <li key={reason}>• {reason}</li>)}
                    </ul>
                  </div>
                )}

                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Proposed actions</p>
                  {plan.actions.length === 0 ? (
                    <p className="mt-2 text-xs leading-5 text-zinc-400">No action was proposed because a required owner or workflow detail could not be verified.</p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      {plan.actions.map((action) => {
                        const status = planStatuses[action.id] || "pending";
                        return (
                          <div key={action.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs">
                            <p className="font-semibold text-zinc-100">Create task: {action.payload.name}</p>
                            <p className="mt-1 text-zinc-400">Project: {action.payload.projectName} · Priority: {action.payload.priority}</p>
                            <p className="mt-1 text-zinc-500">{action.reason}</p>
                            <p className={`mt-2 font-medium ${status === "success" ? "text-emerald-400" : status === "failed" ? "text-red-400" : status === "not_executed" || status === "cancelled" ? "text-zinc-500" : "text-amber-400"}`}>
                              {status === "success" ? "Executed" : status === "failed" ? "Failed" : status === "not_executed" ? "Not executed" : status === "cancelled" ? "Cancelled" : status === "approving" ? "Executing…" : "Requires approval"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {plan.actions.some((action) => planStatuses[action.id] === "pending") && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={approvePlan} disabled={planLoading} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
                      {planLoading ? "Processing…" : "Approve Plan"}
                    </button>
                    <button onClick={cancelPlan} disabled={planLoading} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 disabled:opacity-50">Cancel</button>
                  </div>
                )}
              </div>
            )}
            <div ref={bottomAnchorRef} />

          </div>

          <form onSubmit={(event) => { event.preventDefault(); ask(); }} className="border-t border-zinc-800 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2">
              <button type="button" onClick={toggleVoice} disabled={loading} aria-label={recognition.isListening ? "Stop voice input" : "Start voice input"} title={recognition.supported ? (recognition.isListening ? "Stop listening" : "Start voice input") : "Voice input isn't supported in this browser."} className={`rounded-lg p-2 disabled:opacity-40 ${recognition.isListening ? "bg-red-500/15 text-red-400" : recognition.supported ? "text-amber-400 hover:bg-zinc-800" : "text-zinc-600"}`}>
                {recognition.isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              </button>
              <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask about projects, tasks, workload…" className="min-w-0 flex-1 bg-transparent py-2.5 text-xs text-white outline-none placeholder:text-zinc-600" />
              <button type="button" onClick={() => { if (voiceOutputEnabled) stopSpeaking(); setVoiceOutputEnabled((enabled) => !enabled); }} disabled={!ttsSupported} aria-pressed={voiceOutputEnabled} aria-label={voiceOutputEnabled ? "Disable voice output" : "Enable voice output"} title={ttsSupported ? (voiceOutputEnabled ? "Disable voice output" : "Enable voice output") : "Voice output isn't supported in this browser."} className={`rounded-lg p-2 disabled:cursor-not-allowed disabled:text-zinc-600 ${voiceOutputEnabled ? "text-amber-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-800"}`}>
                {voiceOutputEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button type="submit" disabled={!message.trim() || loading} className="rounded-lg bg-amber-500 p-2 text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
            {(voiceState !== "IDLE" || recognition.interimTranscript || recognition.error || ttsError || isSpeaking) && <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-zinc-500"><span>{recognition.isListening ? `Listening… ${recognition.transcript || recognition.interimTranscript}` : voiceState === "PROCESSING" ? "Processing your voice request…" : isSpeaking ? "Speaking…" : recognition.error || ttsError || (voiceState === "ERROR" ? "Voice input isn't supported in this browser." : "")}</span>{(recognition.isListening || isSpeaking) && <button type="button" onClick={recognition.isListening ? stopRecognition : stopSpeaking} aria-label={recognition.isListening ? "Stop voice input" : "Stop speaking"} className="shrink-0 text-amber-400">{recognition.isListening ? "Stop" : "Stop speaking"}</button>}</div>}
          </form>
        </div>
      )}

      <button onClick={() => setOpen((value) => !value)} className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500 px-4 py-3 text-xs font-bold text-black shadow-xl shadow-amber-500/10 transition hover:bg-amber-400">
        <Sparkles className="h-4 w-4" />
        Ask Nexyrium AI
      </button>
    </>
  );
}
