import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  runDebateTurnStream,
  synthesizeConclusion,
} from "../../services/geminiService";
import { addSession } from "../../services/dbService";
import type {
  DebateSession,
  Persona,
  ChatMessage,
  Conclusion,
} from "../../types";
import { Spinner, AudioOnIcon, AudioOffIcon } from "../icons/Icons";
import useSpeech from "../../hooks/useSpeech";

interface DebateScreenProps {
  session: {
    topic: string;
    title: string;
    personas: Persona[];
  };
  onDebateComplete: (session: DebateSession) => void;
  onError: (message: string) => void;
}

const MAX_TURNS = 12;

const Countdown: React.FC<{ onEnd: () => void }> = ({ onEnd }) => {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onEnd();
    }
  }, [count, onEnd]);

  return (
    <div className="absolute inset-0 bg-light-secondary/80 dark:bg-dark-secondary/80 flex items-center justify-center z-20 backdrop-blur-sm">
      <div className="text-8xl font-bold text-light-accent dark:text-dark-accent animate-ping duration-1000">
        {count}
      </div>
    </div>
  );
};

const ConclusionModal: React.FC<{
  conclusion: Conclusion;
  onClose: () => void;
}> = ({ conclusion, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
      <h2 className="text-2xl font-bold p-6 text-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        Resolution Summary
      </h2>
      <div className="p-6 overflow-y-auto space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-2 text-light-accent dark:text-dark-accent">
            Final Conclusion
          </h3>
          <p className="text-light-text/80 dark:text-dark-text/80">
            {conclusion.conclusion}
          </p>
        </div>
        {conclusion.action_items && conclusion.action_items.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3 text-light-accent dark:text-dark-accent">
              Actionable Suggestions
            </h3>
            <div className="space-y-4">
              {conclusion.action_items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-light-primary dark:bg-dark-primary rounded-lg"
                >
                  <p className="font-semibold text-light-text dark:text-dark-text">
                    {item.personaName}:
                  </p>
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-light-text/80 dark:text-dark-text/80 text-sm">
                    {item.suggestions.map((suggestion, sIndex) => (
                      <li key={sIndex}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 text-center flex-shrink-0">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-success text-white font-bold rounded-lg shadow-md hover:bg-success-hover transition-all duration-300"
        >
          Close & View History
        </button>
      </div>
    </div>
  </div>
);

const DebateScreen: React.FC<DebateScreenProps> = ({
  session,
  onDebateComplete,
  onError,
}) => {
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [conclusion, setConclusion] = useState<Conclusion | null>(null);
  const [isCountdown, setIsCountdown] = useState(true);
  const [isDebating, setIsDebating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("");
  const [finalSession, setFinalSession] = useState<DebateSession | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const { speak, cancel, isSpeaking } = useSpeech();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasConcludedRef = useRef(false);
  const chatLogRef = useRef(chatLog);
  useEffect(() => {
    chatLogRef.current = chatLog;
  }, [chatLog]);

  const personaIndices = new Map(session.personas.map((p, i) => [p.name, i]));

  const concludeDebate = useCallback(async () => {
    if (hasConcludedRef.current) return;
    hasConcludedRef.current = true;

    setIsDebating(false);
    setIsSynthesizing(true);
    setCurrentSpeaker("");

    try {
      const finalChatLog = chatLogRef.current;
      if (finalChatLog.length === 0) {
        onDebateComplete({
          ...session,
          id: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          chatLog: [],
          conclusion: null,
        });
        return;
      }

      const conclusionResult = await synthesizeConclusion(
        session.topic,
        finalChatLog
      );
      setConclusion(conclusionResult);

      const sessionToSave: DebateSession = {
        ...session,
        id: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        chatLog: finalChatLog,
        conclusion: conclusionResult,
      };
      await addSession(sessionToSave);
      setFinalSession(sessionToSave);
      setIsComplete(true);
    } catch (e) {
      console.error(e);
      onError("Failed to synthesize conclusion. Please try again.");
    } finally {
      setIsSynthesizing(false);
    }
  }, [session, onDebateComplete, onError]);

  const handleConcludeClick = () => {
    concludeDebate();
  };

  useEffect(() => {
    let timeoutId: number | null = null;
    let isEffectActive = true;

    const runTurn = async () => {
      if (!isDebating || !isEffectActive) return;

      if (chatLogRef.current.length >= MAX_TURNS) {
        concludeDebate();
        return;
      }

      try {
        const turnGenerator = runDebateTurnStream(
          session.topic,
          session.personas,
          chatLogRef.current
        );

        for await (const chunk of turnGenerator) {
          if (!isDebating || !isEffectActive) break;

          setCurrentSpeaker(chunk.personaName);
          setChatLog((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.personaName === chunk.personaName) {
              return [...prev.slice(0, -1), chunk];
            } else {
              return [...prev, chunk];
            }
          });
        }

        if (isDebating && isEffectActive) {
          timeoutId = window.setTimeout(runTurn, 2000);
        }
      } catch (e) {
        console.error(e);
        if (isEffectActive) {
          onError("An error occurred during the debate.");
          setIsDebating(false);
        }
      }
    };

    if (isDebating) {
      runTurn();
    }

    return () => {
      isEffectActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isDebating, session, concludeDebate, onError]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const lastMessage = chatLog[chatLog.length - 1];
    if (isAudioOn && lastMessage && isDebating) {
      const pIndex = personaIndices.get(lastMessage.personaName);
      const personaIndex = pIndex === undefined ? 0 : pIndex;

      const endsWithPunctuation = /[.?!]$/.test(lastMessage.message);
      if (endsWithPunctuation && !isSpeaking) {
        speak(lastMessage.message, personaIndex);
      }
    }
  }, [chatLog, isAudioOn, speak, isDebating, personaIndices, isSpeaking]);

  const handleCountdownEnd = () => {
    setIsCountdown(false);
    setIsDebating(true);
  };

  const toggleAudio = () => {
    if (isAudioOn && isSpeaking) cancel();
    setIsAudioOn((prev) => !prev);
  };

  return (
    <div className="max-w-4xl mx-auto h-[75vh] flex flex-col bg-light-secondary dark:bg-dark-secondary rounded-2xl shadow-2xl">
      {isCountdown && <Countdown onEnd={handleCountdownEnd} />}
      {isComplete && conclusion && finalSession && (
        <ConclusionModal
          conclusion={conclusion}
          onClose={() => onDebateComplete(finalSession)}
        />
      )}

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-y-2">
        <h2 className="text-lg font-bold truncate pr-4" title={session.topic}>
          Debate: {session.title}
        </h2>
        <div className="flex items-center justify-end gap-4 flex-1">
          {isDebating && !isSynthesizing && (
            <button
              onClick={handleConcludeClick}
              className="px-4 py-2 text-sm bg-light-accent text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all duration-300 disabled:opacity-50"
            >
              Conclude Debate
            </button>
          )}
          <div className="flex-grow" />
          <div className="flex items-center gap-2">
            {isDebating && currentSpeaker && (
              <div className="flex items-center gap-2">
                <Spinner className="text-light-accent dark:text-dark-accent" />{" "}
                <span className="text-sm font-medium">
                  {currentSpeaker} is speaking...
                </span>
              </div>
            )}
            {isSynthesizing && (
              <div className="flex items-center gap-2">
                <Spinner className="text-light-accent dark:text-dark-accent" />{" "}
                <span className="text-sm font-medium">Synthesizing...</span>
              </div>
            )}
            {isComplete && (
              <div className="text-sm font-bold text-success">
                Conversation Complete!
              </div>
            )}
            <button
              onClick={toggleAudio}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              disabled={isSynthesizing || isComplete}
            >
              {isAudioOn ? <AudioOnIcon /> : <AudioOffIcon />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow p-6 space-y-6 overflow-y-auto">
        {chatLog.map((chat, index) => {
          const personaIndex = personaIndices.get(chat.personaName);
          const indexValue: number =
            personaIndex === undefined ? 0 : personaIndex;
          const isSelf = indexValue % 2 === 0;

          return (
            <div
              key={`${chat.timestamp}-${index}`}
              className={`flex items-end gap-3 ${isSelf ? "justify-end" : ""}`}
            >
              {!isSelf && (
                <div className="w-8 h-8 rounded-full bg-light-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  {chat.personaName.charAt(0)}
                </div>
              )}
              <div
                className={`max-w-md p-3 rounded-lg ${
                  isSelf
                    ? "bg-light-accent text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-gray-700 rounded-bl-none"
                }`}
              >
                {!isSelf && (
                  <p className="font-bold text-sm mb-1">{chat.personaName}</p>
                )}
                <p className="text-base">{chat.message}</p>
              </div>
              {isSelf && (
                <div className="w-8 h-8 rounded-full bg-indigo-300 text-indigo-800 flex items-center justify-center font-bold flex-shrink-0">
                  {chat.personaName.charAt(0)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default DebateScreen;
