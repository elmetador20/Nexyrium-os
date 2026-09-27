"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { prepareTextForSpeech } from "@/lib/voice/speech-utils";
const subscribeToBrowserSupport = () => () => {};
const speechSynthesisSupported = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export function useTextToSpeech(language = "en-IN") {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const supported = useSyncExternalStore(subscribeToBrowserSupport, speechSynthesisSupported, () => false);
  const [error, setError] = useState<string | null>(null);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    activeUtterance.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    stop();
    const spoken = prepareTextForSpeech(text);
    if (!spoken) return;
    const utterance = new SpeechSynthesisUtterance(spoken);
    const voices = window.speechSynthesis.getVoices();
    utterance.lang = language;
    utterance.voice = voices.find((voice) => voice.lang === language)
      || voices.find((voice) => voice.lang.startsWith("en-IN"))
      || voices.find((voice) => voice.lang.startsWith("en-"))
      || null;
    utterance.onend = () => {
      if (activeUtterance.current === utterance) {
        activeUtterance.current = null;
        setIsSpeaking(false);
      }
    };
    utterance.onerror = () => {
      if (activeUtterance.current === utterance) {
        activeUtterance.current = null;
        setIsSpeaking(false);
        setError("Voice output couldn't be completed.");
      }
    };
    setError(null);
    activeUtterance.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [language, stop]);

  useEffect(() => () => stop(), [stop]);
  return { speak, stop, isSpeaking, supported, error };
}
