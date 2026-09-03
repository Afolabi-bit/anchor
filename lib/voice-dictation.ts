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
  // continuous = false is significantly more reliable across localhost and desktop Chromium
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    onStateChange(true);
  };

  recognition.onend = () => {
    onStateChange(false);
  };

  recognition.onerror = (event: any) => {
    onStateChange(false);

    // Filter out normal silence/aborts without noisy warnings
    if (event.error === "no-speech" || event.error === "aborted") {
      return;
    }

    let userFriendlyMsg = "Voice dictation is temporarily unavailable. You can type freely.";
    if (event.error === "network") {
      userFriendlyMsg = "Speech service couldn't connect. You can type your reflection directly.";
    } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      userFriendlyMsg = "Microphone access was not permitted. You can type your reflection.";
    }

    if (onError) onError(userFriendlyMsg);
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
