import {
  initAccessibility,
  applyProfile,
  resetSettings,
} from "./accessibility.js";
import {
  isSpeechRecognitionAvailable,
  startListening,
  speakText,
} from "./voice.js";

const DATA_URL = "/api/service";
const STATE_KEY = "govguide_demo_state";

const state = {
  service: null,
  currentField: 0,
  answers: {},
  selectedProfile: null,
};

const els = {};

function $(selector) {
  return document.querySelector(selector);
}

function cacheElements() {
  els.serviceTitle = $("#service-title");
  els.serviceDescription = $("#service-description");
  els.estimatedTime = $("#estimated-time");
  els.serviceAudience = $("#service-audience");
  els.globalStatus = $("#global-status");
  els.documentList = $("#document-list");
  els.simplifyInputPreview = $("#simplify-input-preview");
  els.aiDemoOutput = $("#ai-demo-output");
  els.fieldContainer = $("#field-container");
  els.formCounter = $("#form-counter");
  els.formStepLabel = $("#form-step-label");
  els.formProgress = $("#form-progress");
  els.fieldHelpPanel = $("#field-help-panel");
  els.fieldHelpText = $("#field-help-text");
  els.fieldExample = $("#field-example");
  els.translationOutput = $("#translation-output");
  els.voicePanel = $("#voice-panel");
  els.voiceStatus = $("#voice-status");
  els.errorPanel = $("#field-error");
  els.reviewList = $("#review-list");
  els.reviewWarning = $("#review-warning");
  els.settingsModal = $("#settings-modal");
}

function setGlobalStatus(message, type = "") {
  els.globalStatus.textContent = message;
  els.globalStatus.className = `status-message ${type}`.trim();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => {
    const active = screen.id === id;
    screen.hidden = !active;
    screen.classList.toggle("active", active);
  });

  document
    .querySelector("#demo-service")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadService() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Unable to load demo service.");
    const data = await response.json();
    state.service = data.service;
    renderServiceIntro();
    renderDocuments();
    els.simplifyInputPreview.textContent = state.service.simple_text_demo;
  } catch (error) {
    console.error(error);
    setGlobalStatus(
      "The demo configuration could not be loaded. Refresh the page and try again.",
      "error",
    );
  }
}

function renderServiceIntro() {
  els.serviceTitle.textContent = state.service.name;
  els.serviceDescription.textContent = state.service.description;
  els.estimatedTime.textContent = state.service.estimated_time;
  els.serviceAudience.textContent = state.service.audience;
}

function renderDocuments() {
  const statusMap = {
    ready: ["Ready", "ready"],
    need: ["Need to prepare", "need"],
    missing: ["Missing", "missing"],
  };

  els.documentList.innerHTML = state.service.documents
    .map((document) => {
      const [label, className] = statusMap[document.status] || [
        "Check",
        "need",
      ];
      const icon =
        document.status === "ready"
          ? "✓"
          : document.status === "missing"
            ? "!"
            : "•";
      return `
      <article class="document-item">
        <div class="document-icon ${className}" aria-hidden="true">${icon}</div>
        <div class="document-copy">
          <h4>${escapeHtml(document.name)}</h4>
          <p>${escapeHtml(document.description)}</p>
        </div>
        <span class="status-chip ${className}">${label}</span>
      </article>`;
    })
    .join("");
}

function createFieldMarkup(field) {
  const safeId = `field-${field.id}`;
  const common = `id="${safeId}" name="${field.id}" aria-describedby="field-instruction"`;
  let control = "";

  if (field.type === "select") {
    control = `<select ${common}><option value="">Choose an option</option>${field.options.map((option) => `<option value="${escapeAttribute(option)}">${escapeHtml(option)}</option>`).join("")}</select>`;
  } else if (field.type === "file") {
    control = `<input ${common} type="file" accept="${escapeAttribute(field.accept || "")}">`;
  } else {
    const extra = [
      field.placeholder
        ? `placeholder="${escapeAttribute(field.placeholder)}"`
        : "",
      field.inputmode ? `inputmode="${escapeAttribute(field.inputmode)}"` : "",
      field.pattern ? `pattern="${escapeAttribute(field.pattern)}"` : "",
      Number.isFinite(field.min) ? `min="${field.min}"` : "",
      Number.isFinite(field.max) ? `max="${field.max}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    control = `<input ${common} type="${escapeAttribute(field.type)}" ${extra}>`;
  }

  return `
    <div class="field-block">
      <label for="${safeId}">${escapeHtml(field.label)}${field.required ? ' <span aria-hidden="true">*</span>' : ""}</label>
      <p class="field-instruction" id="field-instruction">${escapeHtml(field.help)}</p>
      ${control}
      <small class="field-example">Example: ${escapeHtml(field.example || "—")}</small>
    </div>`;
}

function renderCurrentField() {
  const field = state.service.fields[state.currentField];
  const total = state.service.fields.length;
  const existing = state.answers[field.id];

  els.fieldContainer.innerHTML = createFieldMarkup(field);
  const control = els.fieldContainer.querySelector(
    `#field-${CSS.escape(field.id)}`,
  );

  if (field.type === "file") {
    if (existing) {
      const fileNote = document.createElement("p");
      fileNote.className = "file-note";
      fileNote.textContent = `Selected for demo: ${existing}`;
      control.insertAdjacentElement("afterend", fileNote);
    }
  } else if (existing !== undefined) {
    control.value = existing;
  }

  els.formCounter.textContent = `${state.currentField + 1} / ${total}`;
  els.formStepLabel.textContent = `Step ${state.currentField + 4}`;
  els.formProgress.style.width = `${((state.currentField + 1) / total) * 100}%`;
  els.fieldHelpPanel.hidden = true;
  els.translationOutput.textContent = "";
  els.errorPanel.hidden = true;
  els.voiceStatus.textContent =
    "Use your microphone to answer this question, or type instead.";

  const voiceAvailable = isSpeechRecognitionAvailable();
  els.voicePanel.hidden = !voiceAvailable;

  requestAnimationFrame(() => control.focus());
}

function getCurrentControl() {
  const field = state.service.fields[state.currentField];
  return document.querySelector(`#field-${CSS.escape(field.id)}`);
}

function getCurrentValue() {
  const field = state.service.fields[state.currentField];
  const control = getCurrentControl();
  if (!control) return "";
  if (field.type === "file")
    return control.files[0]?.name || state.answers[field.id] || "";
  return control.value.trim();
}

function validateCurrentField() {
  const field = state.service.fields[state.currentField];
  const value = getCurrentValue();

  if (field.required && !value) {
    return `${field.label} is required for this demonstration. Please enter or select a value.`;
  }

  if (field.id === "annualIncome" && value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      return "Please enter a valid yearly family income, such as 240000.";
    }
  }

  if (field.id === "bankAccount" && value && !/^\d{6,18}$/.test(value)) {
    return "Please enter a fictional bank account number containing 6 to 18 digits. Do not use a real account number.";
  }

  return "";
}

function saveCurrentAnswer() {
  if (!state.service || !getCurrentControl()) return;
  const field = state.service.fields[state.currentField];
  state.answers[field.id] = getCurrentValue();
  saveState();
}

function goNext() {
  const error = validateCurrentField();
  if (error) {
    showFieldError(error);
    return;
  }

  saveCurrentAnswer();

  if (state.currentField < state.service.fields.length - 1) {
    state.currentField += 1;
    renderCurrentField();
  } else {
    renderReview();
    showScreen("screen-review");
  }
}

function goPrevious() {
  saveCurrentAnswer();
  if (state.currentField > 0) {
    state.currentField -= 1;
    renderCurrentField();
  } else {
    showScreen("screen-docs");
  }
}

function showFieldError(message) {
  els.errorPanel.textContent = `⚠️ ${message}`;
  els.errorPanel.hidden = false;
  els.errorPanel.focus?.();
}

function showFieldHelp() {
  const field = state.service.fields[state.currentField];
  els.fieldHelpPanel.hidden = false;
  els.fieldHelpText.textContent = field.help;
  els.fieldExample.textContent = `Example: ${field.example || "—"}`;
  setTimeout(
    () =>
      els.fieldHelpPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      }),
    0,
  );
}

async function explainCurrentField() {
  const field = state.service.fields[state.currentField];
  showFieldHelp();
  els.fieldHelpText.textContent = "Getting a simple explanation…";

  try {
    const response = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_name: field.label,
        context: field.help,
        fallback: field.help,
      }),
    });

    const result = await response.json();
    els.fieldHelpText.textContent = result.text || field.help;
    if (result.source === "fallback") {
      setGlobalStatus(
        "Using the built-in explanation because AI is unavailable.",
        "info",
      );
    } else {
      setGlobalStatus(
        "Gemini generated a plain-language explanation.",
        "success",
      );
    }
  } catch {
    els.fieldHelpText.textContent = field.help;
    setGlobalStatus(
      "AI is unavailable, so GovGuide is using the built-in explanation.",
      "info",
    );
  }
}

async function simplifyDemoText() {
  els.aiDemoOutput.textContent = "Simplifying…";
  try {
    const response = await fetch("/api/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: state.service.simple_text_demo }),
    });
    const result = await response.json();
    els.aiDemoOutput.textContent =
      result.text ||
      "You need to provide a document showing your family's yearly income.";
  } catch {
    els.aiDemoOutput.textContent =
      "You need to provide a document showing your family's yearly income.";
  }
}

async function translateText(text, outputElement) {
  outputElement.textContent = "Translating…";
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const result = await response.json();
    outputElement.textContent = result.text || "अनुवाद उपलब्ध नहीं है।";
  } catch {
    outputElement.textContent = "अनुवाद अभी उपलब्ध नहीं है।";
  }
}

function renderReview() {
  const fields = state.service.fields;
  const missing = fields.filter(
    (field) => field.required && !state.answers[field.id],
  );

  els.reviewList.innerHTML = fields
    .map((field) => {
      const value = state.answers[field.id];
      const display = value ? escapeHtml(value) : "Missing";
      const className = value ? "complete" : "missing";
      return `<div class="review-row ${className}"><div><span class="review-icon">${value ? "✓" : "!"}</span><strong>${escapeHtml(field.label)}</strong></div><span>${display}</span></div>`;
    })
    .join("");

  if (missing.length) {
    els.reviewWarning.textContent = `⚠️ ${missing.length} required item${missing.length > 1 ? "s are" : " is"} missing. You can go back and complete them.`;
  } else {
    els.reviewWarning.textContent =
      "✓ Everything required for this fictional demonstration is filled in.";
  }
}

function finishDemo() {
  renderReview();
  const missing = state.service.fields.some(
    (field) => field.required && !state.answers[field.id],
  );
  if (missing) {
    els.reviewWarning.textContent =
      "⚠️ Complete the required fields before finishing the demo.";
    return;
  }
  showScreen("screen-complete");
  setGlobalStatus(
    "Demo completed. Nothing was submitted to a real government service.",
    "success",
  );
  localStorage.removeItem(STATE_KEY);
}

function restartDemo() {
  state.currentField = 0;
  state.answers = {};
  state.selectedProfile = null;
  localStorage.removeItem(STATE_KEY);
  renderServiceIntro();
  showScreen("screen-intro");
  setGlobalStatus("Demo restarted.", "info");
}

function saveState() {
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      currentField: state.currentField,
      answers: state.answers,
      selectedProfile: state.selectedProfile,
    }),
  );
}

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (!saved) return;
    state.currentField = Number.isInteger(saved.currentField)
      ? Math.min(saved.currentField, state.service.fields.length - 1)
      : 0;
    state.answers =
      saved.answers && typeof saved.answers === "object" ? saved.answers : {};
    state.selectedProfile = saved.selectedProfile || null;
    if (state.selectedProfile) applyProfile(state.selectedProfile);
  } catch {
    localStorage.removeItem(STATE_KEY);
  }
}

function setupProfileCards() {
  document.querySelectorAll("[data-profile]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedProfile = card.dataset.profile;
      applyProfile(state.selectedProfile);
      document
        .querySelectorAll("[data-profile]")
        .forEach((item) => item.classList.toggle("selected", item === card));
      $("#profile-preview").textContent =
        `Selected: ${card.querySelector("strong").textContent}. You can change individual settings later.`;
      saveState();
    });
  });
}

function setupModal() {
  $("#open-settings").addEventListener("click", () => {
    els.settingsModal.hidden = false;
    $("#close-settings").focus();
  });
  $("#close-settings").addEventListener("click", closeModal);
  $("#close-settings-2").addEventListener("click", closeModal);
  $("#reset-settings").addEventListener("click", () => {
    resetSettings();
    $("#profile-preview").textContent = "Accessibility settings were reset.";
  });

  els.settingsModal.addEventListener("click", (event) => {
    if (event.target === els.settingsModal) closeModal();
  });

  function closeModal() {
    els.settingsModal.hidden = true;
    $("#open-settings").focus();
  }
}

function setupEvents() {
  $("#start-demo").addEventListener("click", () => showScreen("screen-intro"));
  $("#continue-profile").addEventListener("click", () =>
    showScreen("screen-profile"),
  );
  $("#back-to-intro").addEventListener("click", () =>
    showScreen("screen-intro"),
  );
  $("#continue-docs").addEventListener("click", () =>
    showScreen("screen-docs"),
  );
  $("#back-to-profile").addEventListener("click", () =>
    showScreen("screen-profile"),
  );
  $("#start-form").addEventListener("click", () => {
    renderCurrentField();
    showScreen("screen-form");
  });
  $("#guided-form").addEventListener("submit", (event) => {
    event.preventDefault();
    goNext();
  });
  $("#previous-field").addEventListener("click", goPrevious);
  $("#field-help").addEventListener("click", explainCurrentField);
  $("#read-field").addEventListener("click", () => {
    const field = state.service.fields[state.currentField];
    speakText(`${field.label}. ${field.help}`, els.voiceStatus);
  });
  $("#speak-help").addEventListener("click", () =>
    speakText(
      `${els.fieldHelpText.textContent}. ${els.fieldExample.textContent}`,
      els.voiceStatus,
    ),
  );
  $("#translate-help").addEventListener("click", () =>
    translateText(els.fieldHelpText.textContent, els.translationOutput),
  );
  $("#start-listening").addEventListener("click", () => {
    const input = getCurrentControl();
    startListening(
      input,
      els.voiceStatus,
      () => (els.errorPanel.hidden = true),
    );
  });
  $("#back-to-form").addEventListener("click", () => {
    renderCurrentField();
    showScreen("screen-form");
  });
  $("#finish-demo").addEventListener("click", finishDemo);
  $("#restart-demo").addEventListener("click", restartDemo);
  $("#read-hero").addEventListener("click", () =>
    speakText(document.querySelector(".hero-copy").innerText, els.globalStatus),
  );
  $("#read-complete").addEventListener("click", () =>
    speakText(
      document.querySelector("#screen-complete").innerText,
      els.globalStatus,
    ),
  );
  $("#simplify-text").addEventListener("click", simplifyDemoText);
  $("#translate-demo").addEventListener("click", () =>
    translateText(state.service.simple_text_demo, els.aiDemoOutput),
  );

  document.querySelectorAll(".speak-button").forEach((button) => {
    button.addEventListener("click", () => {
      const target = $(button.dataset.target);
      speakText(target?.innerText || "GovGuide information", els.globalStatus);
    });
  });

  window.addEventListener("beforeunload", saveCurrentAnswer);
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char],
  );
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

async function init() {
  cacheElements();
  initAccessibility();
  setupModal();
  setupProfileCards();
  setupEvents();
  await loadService();
  if (state.service) {
    restoreState();
    const response = await fetch("/api/health").catch(() => null);
    if (response?.ok) {
      const health = await response.json();
      setGlobalStatus(
        health.gemini_configured
          ? "AI assistance is configured. Basic functionality works without AI too."
          : "AI is optional right now. Basic functionality is ready to use.",
        "info",
      );
    }
  }
}

init();
