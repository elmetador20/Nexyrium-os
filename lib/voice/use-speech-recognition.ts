"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type RecognitionEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type Recognition = { continuous: boolean; interimResults: boolean; maxAlternatives: number; lang: string; start(): void; stop(): void; abort(): void; onstart: (() => void) | null; onresult: ((event: RecognitionEvent) => void) | null; onend: (() => void) | null; onerror: ((event: { error: string }) => void) | null };
type RecognitionConstructor = new () => Recognition;
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
const subscribeToBrowserSupport = () => () => {};
const recognitionSupported = () => typeof window !== "undefined" && Boolean((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition);
function voiceDebug(event: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") console.info("[voice-debug]", event, details || {});
}

function recognitionError(error: string) {
  if (error === "not-allowed") return "Microphone permission was denied. Allow microphone access and try again.";
  if (error === "service-not-allowed") return "Speech recognition service is unavailable.";
  if (error === "audio-capture") return "No microphone was detected.";
  if (error === "no-speech") return "No speech detected. Try again.";
  if (error === "network") return "Speech recognition service/network error.";
  return "Voice recognition failed. Check microphone permission and try again.";
}

export function useSpeechRecognition(onFinal: (text: string) => void, language = "en-IN") {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supported = useSyncExternalStore(subscribeToBrowserSupport, recognitionSupported, () => false);
  const recognition = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const finalSubmitted = useRef(false);
  const cancelled = useRef(false);
  const listening = useRef(false);
  const callback = useRef(onFinal);

  useEffect(() => { callback.current = onFinal; }, [onFinal]);
  const stop = useCallback(() => {
    cancelled.current = true;
    if (listening.current) {
      voiceDebug("stop requested");
      recognition.current?.stop();
    }
  }, []);

  const start = useCallback(() => {
    const browser = window as SpeechWindow;
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    voiceDebug("browser", { userAgent: navigator.userAgent });
    voiceDebug("feature detection", { SpeechRecognition: Boolean(browser.SpeechRecognition), webkitSpeechRecognition: Boolean(browser.webkitSpeechRecognition) });
    if (!Constructor || recognition.current) {
      if (!Constructor) {
        voiceDebug("unsupported");
        setError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      } else voiceDebug("start ignored", { activeInstance: true, listening: listening.current });
      return;
    }
    const instance = new Constructor();
    voiceDebug("recognition instance created successfully");
    recognition.current = instance;
    finalText.current = "";
    finalSubmitted.current = false;
    cancelled.current = false;
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    instance.continuous = false;
    instance.interimResults = true;
    instance.maxAlternatives = 1;
    instance.lang = language;
    voiceDebug("configuration", { language, continuous: instance.continuous, interimResults: instance.interimResults, maxAlternatives: instance.maxAlternatives });
    instance.onstart = () => {
      listening.current = true;
      voiceDebug("onstart");
    };
    instance.onresult = (event) => {
      let finalPart = "";
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const text = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalPart += text;
        else interim += text;
      }
      if (finalPart) {
        finalText.current += finalPart;
        setTranscript(finalText.current.trim());
      }
      setInterimTranscript(interim.trim());
      voiceDebug("onresult", { finalTranscriptReceived: Boolean(finalPart), interimTranscriptReceived: Boolean(interim) });
    };
    instance.onerror = (event) => {
      voiceDebug("onerror", { error: event.error, permissionRelated: event.error === "not-allowed" || event.error === "service-not-allowed" });
      if (event.error !== "aborted") setError(recognitionError(event.error));
    };
    instance.onend = () => {
      recognition.current = null;
      listening.current = false;
      setIsListening(false);
      setInterimTranscript("");
      const text = finalText.current.trim();
      voiceDebug("onend", { finalTranscriptReceived: Boolean(text), finalTranscriptSubmitted: !cancelled.current && Boolean(text) && !finalSubmitted.current, cancelled: cancelled.current });
      if (!cancelled.current && text && !finalSubmitted.current) {
        finalSubmitted.current = true;
        callback.current(text);
      }
    };
    try {
      voiceDebug("start requested");
      instance.start();
      setIsListening(true);
    } catch {
      recognition.current = null;
      listening.current = false;
      setIsListening(false);
      voiceDebug("recognition.start threw synchronously");
      setError("Voice input couldn't be started. Please try again.");
    }
  }, [language]);

  useEffect(() => () => recognition.current?.abort(), []);
  return { start, stop, isListening, transcript, interimTranscript, error, supported };
}
