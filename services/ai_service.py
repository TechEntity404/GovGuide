import os
from typing import Dict

try:
    from google import genai
except ImportError:  # pragma: no cover - handled at runtime with a clear message
    genai = None


class AIService:
    """Small wrapper around Gemini so the rest of the app stays simple."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
        self.client = None

        if self.api_key and genai is not None:
            self.client = genai.Client(api_key=self.api_key)

    @property
    def is_configured(self) -> bool:
        """Return True when the Gemini SDK and API key are available."""
        return self.client is not None

    def _generate(self, prompt: str) -> str:
        """Generate short text and turn SDK failures into normal fallbacks."""
        if not self.client:
            raise RuntimeError("Gemini is not configured.")

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        text = (response.text or "").strip()
        if not text:
            raise RuntimeError("Gemini returned an empty response.")

        return text

    def explain_field(self, field_name: str, context: str, fallback: str) -> Dict[str, str | bool]:
        """Explain one field without inventing rules or eligibility decisions."""
        prompt = f"""
You are an accessibility assistant inside a student hackathon prototype called GovGuide.
GovGuide is NOT an official government portal.

Explain this form field in plain, friendly English for a first-time digital-service user.
Do not invent government rules, eligibility criteria, legal requirements, or document requirements.
Do not make any decision about whether the user qualifies.
Use one or two short paragraphs and optionally one concrete example.

Field name: {field_name}
Existing description: {context or 'No description provided.'}
""".strip()

        try:
            text = self._generate(prompt)
            return {"ok": True, "text": text, "source": "gemini"}
        except Exception:
            return {
                "ok": False,
                "text": fallback or "This field asks for information needed for the demonstration.",
                "source": "fallback",
            }

    def simplify_text(self, text: str) -> Dict[str, str | bool]:
        """Rewrite supplied text into simple language without changing meaning."""
        prompt = f"""
Simplify the following official-style sentence for a general audience.
Keep the meaning. Do not add facts, rules, eligibility decisions, deadlines, or legal advice.
Return only the simplified sentence or short paragraph.

Text:
{text}
""".strip()

        try:
            result = self._generate(prompt)
            return {"ok": True, "text": result, "source": "gemini"}
        except Exception:
            return {
                "ok": False,
                "text": "You need to provide a document showing your family's yearly income.",
                "source": "fallback",
            }

    def translate_to_hindi(self, text: str) -> Dict[str, str | bool]:
        """Translate short UI guidance from English to Hindi."""
        prompt = f"""
Translate this short user-interface instruction from English to natural, simple Hindi.
Do not add information or change the meaning.
Return only the Hindi translation.

Text:
{text}
""".strip()

        try:
            result = self._generate(prompt)
            return {"ok": True, "text": result, "source": "gemini"}
        except Exception:
            fallback_map = {
                "Upload your income certificate.": "अपना आय प्रमाण पत्र अपलोड करें।",
                "Review your information before continuing.": "आगे बढ़ने से पहले अपनी जानकारी जांच लें।",
                "Please enter your yearly family income.": "कृपया अपने परिवार की सालाना आय दर्ज करें।",
            }
            return {
                "ok": False,
                "text": fallback_map.get(text, "इस जानकारी को सरल तरीके से समझने के लिए कृपया ऊपर दिया गया अंग्रेज़ी पाठ देखें।"),
                "source": "fallback",
            }
