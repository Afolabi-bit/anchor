// Web Speech API Voice Dictation Helper

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export function createSpeechRecognizer(
  onTranscript: (text: string, isFinal: boolean) => void,
  onStateChange: (isListening: boolean) => void,
  onError?: (err: string) => void
) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError("Voice dictation is not supported in this browser.");
    return null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    onStateChange(true);
  };

  recognition.onend = () => {
    onStateChange(false);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech recognition error:", event.error);
    onStateChange(false);
    if (onError) onError(event.error);
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onTranscript(finalTranscript, true);
    } else if (interimTranscript) {
      onTranscript(interimTranscript, false);
    }
  };

  return recognition;
}
