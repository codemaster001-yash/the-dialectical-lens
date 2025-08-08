
import { useState, useEffect, useCallback } from 'react';

const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const handleVoicesChanged = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    handleVoicesChanged(); // Initial load
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string, personaIndex: number, onEndCallback?: () => void) => {
    if (!window.speechSynthesis) {
        onEndCallback?.();
        return;
    };
    
    cancel(); // Cancel any previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    const handleEnd = () => {
        setIsSpeaking(false);
        onEndCallback?.();
    };

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = handleEnd;
    utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        handleEnd();
    };

    // Assign a unique voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
        utterance.voice = englishVoices[personaIndex % englishVoices.length];
    }
    
    window.speechSynthesis.speak(utterance);
  }, [voices, cancel]);

  return { speak, cancel, isSpeaking };
};

export default useSpeech;
