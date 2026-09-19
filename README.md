# GOVGUIDE

## An accessibility-first guided digital service experience

GovGuide is a student hackathon prototype that demonstrates how a guided accessibility layer can make complicated digital-service workflows easier to understand and complete.

> **Prototype / Demo:** GovGuide is not an official government portal. It does not submit real applications, verify documents, or decide eligibility.

## Problem

Many digital-service forms are difficult to use because instructions can be dense, fields can appear all at once, errors can be unclear, and people with different accessibility or digital-literacy needs may struggle to understand what is being asked.

## Solution

GovGuide breaks a fictional scholarship-style workflow into small, understandable steps:

**Understand → Prepare → Complete → Review**

The user can select an accessibility profile, check document readiness, complete one field at a time, ask what a field means, use speech input/output, translate guidance to Hindi, simplify official-style text with Gemini, and review the answers before finishing the demo.

## Key Features

- One-question-at-a-time guided form
- Accessibility profiles: Voice Guided, Visual Assisted, Simplified, Keyboard Mode
- Font-size, contrast, spacing, motion and control-size settings
- Keyboard-friendly semantic HTML and visible focus states
- Browser voice input with Web Speech API
- Browser text-to-speech with SpeechSynthesis API
- English → Hindi translation for short guidance
- Gemini-powered field explanation and text simplification
- Built-in fallback text when AI or browser speech features fail
- Document readiness checklist
- LocalStorage progress saving
- Final review and demo completion screen
- Fictional demo data only; no real document upload or government submission

## Tech Stack

- Python
- Flask
- HTML
- CSS
- Vanilla JavaScript
- JSON
- localStorage
- Google Gemini API through the official `google-genai` Python SDK
- Browser Web Speech API / SpeechSynthesis API

The Gemini integration follows Google's current Python SDK pattern using `from google import genai` and `client.models.generate_content(...)`. See Google's official documentation for the current SDK usage.

## Project Structure

```text
GovGuide/
├── app.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── data/
│   └── demo_service.json
├── services/
│   ├── __init__.py
│   └── ai_service.py
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── accessibility.js
│       ├── app.js
│       └── voice.js
└── docs/
    ├── ARCHITECTURE.md
    ├── FILE_MAP.md
    ├── SECURITY.md
    ├── SETUP.md
    ├── TESTING.md
    └── explanations/
        ├── app_py.md
        ├── ai_service_py.md
        ├── index_html.md
        ├── style_css.md
        ├── app_js.md
        ├── accessibility_js.md
        ├── voice_js.md
        └── demo_service_json.md
```

## How It Works

1. Flask serves the web page.
2. The browser loads the fictional service configuration through `/api/service`.
3. The user chooses an accessibility profile.
4. The browser renders one form field at a time.
5. Voice input is handled directly by the browser when supported.
6. Text-to-speech is handled directly by the browser.
7. AI requests go from the browser to Flask, then to Gemini. The API key stays on the server.
8. Basic form validation works without AI.
9. Answers are temporarily saved in localStorage.
10. The final screen is a demonstration only; nothing is submitted externally.

## Setup

See [`docs/SETUP.md`](docs/SETUP.md) for complete Windows instructions.

Basic commands:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

Then open:

`http://127.0.0.1:5000`

## AI Usage

Gemini is used for:

- explaining complicated form fields in simpler language
- simplifying official-style text
- translating short English UI guidance into Hindi

Gemini does **not**:

- determine eligibility
- make government decisions
- submit official applications
- replace verified government information
- provide legal advice

The project also contains built-in fallbacks, so the basic experience continues when Gemini is unavailable.

## Accessibility

Accessibility is part of the main interaction rather than a cosmetic setting. The prototype includes:

- semantic headings and labels
- keyboard navigation
- visible focus styles
- skip link
- text-size control
- high-contrast mode
- larger controls
- additional spacing
- reduced-motion mode
- voice input where browser support exists
- read-aloud support where browser support exists
- plain-language explanations
- clear validation messages

## Screenshots

Add hackathon screenshots here later, for example:

```text
screenshots/
├── home.png
├── accessibility-profile.png
├── guided-form.png
└── review.png
```

## Limitations

This is a prototype. It does not:

- connect to real government portals
- verify real documents
- upload files to a server
- authenticate users
- store data in a database
- guarantee eligibility
- provide official legal or policy information
- support every Indian language
- guarantee browser-independent voice recognition

## Future Scalability

A future production version could add:

1. More service configurations
2. A browser extension
3. Stronger privacy controls and authentication
4. PostgreSQL or another managed database
5. Verified official information sources
6. More Indian languages
7. More accessibility profiles
8. Analytics and anonymous usability metrics
9. Official APIs where they are genuinely available

## Team Contribution

Suggested four-person split:

- **Teammate 1:** Flask backend + Gemini integration
- **Teammate 2:** HTML/CSS UI + responsive design
- **Teammate 3:** JavaScript form flow + localStorage + review
- **Teammate 4:** accessibility + voice features + testing + demo preparation

The codebase is intentionally simple so a beginner can understand and modify it.

## 2-Minute Demo Flow

1. Open GovGuide and point out the **Prototype / Demo** label.
2. Explain the problem in one sentence.
3. Click **Start demo**.
4. Choose **Simplified** or **Voice Guided**.
5. Show the document checklist.
6. Click **Simplify with Gemini**.
7. Start the guided form.
8. On **Annual Family Income**, click **What does this mean?** and show the explanation.
9. Demonstrate **Read aloud** or voice input.
10. Complete the remaining fictional fields.
11. Show the review screen and missing-information warning if desired.
12. Click **Finish demo** and explain that nothing was submitted to a real government service.

## License / Hackathon Note

Use the project according to your hackathon's submission rules. Before publishing, replace placeholder team details and add your own screenshots.
