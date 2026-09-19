let recognition = null;
let listening = false;

function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionAvailable() {
  return Boolean(getRecognitionConstructor());
}

export function startListening(input, statusElement, onResult) {
  const Recognition = getRecognitionConstructor();

  if (!Recognition) {
    statusElement.textContent = "Voice input is not available in this browser. Please type your answer instead.";
    return false;
  }

  if (listening && recognition) {
    recognition.stop();
    return false;
  }

  recognition = new Recognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  listening = true;

  statusElement.textContent = "Listening… speak clearly, then pause.";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    input.value = transcript;
    onResult?.(transcript);
    statusElement.textContent = `Heard: ${transcript}`;
  };

  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone permission was blocked. You can type your answer instead.",
      "no-speech": "I couldn't hear speech. Please try again or type your answer.",
      "network": "Voice recognition needs a working connection in this browser. You can type your answer instead.",
    };
    statusElement.textContent = messages[event.error] || "Voice input failed. Please try again or type your answer.";
  };

  recognition.onend = () => {
    listening = false;
  };

  try {
    recognition.start();
    return true;
  } catch {
    listening = false;
    statusElement.textContent = "Voice input could not start. Please type your answer instead.";
    return false;
  }
}

export function speakText(text, statusElement = null) {
  if (!("speechSynthesis" in window)) {
    if (statusElement) statusElement.textContent = "Read-aloud is not available in this browser.";
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
  utterance.rate = 0.95;
  utterance.onstart = () => {
    if (statusElement) statusElement.textContent = "Reading aloud…";
  };
  utterance.onend = () => {
    if (statusElement) statusElement.textContent = "Read-aloud finished.";
  };
  utterance.onerror = () => {
    if (statusElement) statusElement.textContent = "Read-aloud could not start. You can continue reading normally.";
  };

  window.speechSynthesis.speak(utterance);
  return true;
}
