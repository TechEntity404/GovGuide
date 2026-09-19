from flask import Flask, jsonify, render_template, request
import json
from pathlib import Path
from dotenv import load_dotenv

from services.ai_service import AIService

load_dotenv()

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

ai_service = AIService()


@app.get("/")
def index():
    """Serve the single-page GovGuide prototype."""
    return render_template("index.html")


@app.get("/api/service")
def service_config():
    """Return the fictional demo service configuration."""
    service_path = Path(__file__).parent / "data" / "demo_service.json"
    with service_path.open("r", encoding="utf-8") as file:
        return jsonify(json.load(file))


@app.get("/api/health")
def health():
    """Return a small status response for the frontend and demos."""
    return jsonify(
        {
            "status": "ok",
            "gemini_configured": ai_service.is_configured,
            "message": "GovGuide demo backend is running.",
        }
    )


@app.post("/api/explain")
def explain():
    """Explain a form field in simple language, with a local fallback."""
    data = request.get_json(silent=True) or {}
    field_name = str(data.get("field_name", "")).strip()
    context = str(data.get("context", "")).strip()
    fallback = str(data.get("fallback", "")).strip()

    if not field_name:
        return jsonify({"error": "field_name is required."}), 400

    result = ai_service.explain_field(field_name, context, fallback)
    return jsonify(result)


@app.post("/api/simplify")
def simplify():
    """Simplify official-style text, with a safe fallback."""
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({"error": "text is required."}), 400

    result = ai_service.simplify_text(text)
    return jsonify(result)


@app.post("/api/translate")
def translate():
    """Translate short explanatory text from English to Hindi."""
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({"error": "text is required."}), 400

    result = ai_service.translate_to_hindi(text)
    return jsonify(result)


@app.errorhandler(404)
def not_found(error):
    """Return JSON for missing API paths while keeping the UI route intact."""
    if request.path.startswith("/api/"):
        return jsonify({"error": "API endpoint not found."}), 404
    return error


@app.errorhandler(500)
def server_error(error):
    """Return a safe JSON error for API failures."""
    if request.path.startswith("/api/"):
        return jsonify({"error": "The server could not complete that request."}), 500
    return error


if __name__ == "__main__":
    app.run(debug=True)
