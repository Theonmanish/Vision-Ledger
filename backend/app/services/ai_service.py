"""
AI verification service — sends claim images to the Fireworks
OpenAI-compatible API powered by Qwen 3.7 Plus.

Responsibilities:
  * Build a multimodal prompt with the image and claim context.
  * Call the Fireworks inference endpoint.
  * Parse and validate the structured JSON response via Pydantic.
  * Surface clear errors when the upstream API fails.
"""

import json
import logging

from openai import OpenAI, APIError, APIConnectionError, RateLimitError

from app.core.config import settings
from app.core.errors import ai_service_unavailable, ai_response_invalid
from app.schemas.claims import AIResult

logger = logging.getLogger(__name__)

# ── Prompt engineering ────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a JSON API. Return ONLY valid JSON. Never explain. Never use markdown. Never output reasoning. Never output thoughts. Never output analysis. Never output numbered lists. Never output text outside JSON.

Return a single JSON object matching this schema:

{
  "claim_supported": boolean,
  "confidence": number (0.0-1.0),
  "vision_confidence": integer (0-100),
  "claim_match_confidence": integer (0-100),
  "verification_confidence": integer (0-100),
  "objects_detected": array of objects with "label" (string) and "confidence" (integer 0-100),
  "estimated_quantity": integer or null,
  "reason": string,
  "limitations": string,
  "recommendation": string
}

Confidence scoring:
- vision_confidence: Image quality and object detection certainty (0-100)
- claim_match_confidence: How well the image supports the claim type (0-100)
- verification_confidence: Final verification score combining all factors (0-100)

Status mapping:
- 90-100: Verified (claim_supported: true)
- 75-89: Likely Verified (claim_supported: true)
- 50-74: Needs Review (claim_supported: false)
- 25-49: Inconclusive (claim_supported: false)
- 0-24: Rejected (claim_supported: false)

Return ONLY the JSON object. No other text."""

USER_PROMPT_TEMPLATE = """Claim type: {claim_type}
Description: {description}

Analyze the image and return JSON."""


# ── Service ───────────────────────────────────────────────────────────

class AIService:
    """
    Wraps the Fireworks OpenAI-compatible chat-completions API.

    Inject a custom ``OpenAI`` client for testing; otherwise the client
    is built from application settings.
    """

    def __init__(self, client: OpenAI | None = None) -> None:
        self._client: OpenAI = client or OpenAI(
            api_key=settings.FIREWORKS_API_KEY,
            base_url=settings.FIREWORKS_BASE_URL,
            timeout=60.0,
        )
        self._model: str = settings.MODEL_NAME

    def analyze_claim(
        self,
        *,
        image_url: str,
        claim_type: str,
        description: str,
    ) -> AIResult:
        """
        Send the image + claim to the model and return a validated result.

        Raises:
            AppException (503): if the Fireworks API is unreachable or
                returns a server/rate-limit error.
            AppException (502): if the response cannot be parsed into the
                expected ``AIResult`` schema.
        """
        user_prompt = USER_PROMPT_TEMPLATE.format(
            claim_type=claim_type,
            description=description,
        )

        try:
            response = self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url},
                            },
                        ],
                    },
                ],
                max_tokens=1024,
                temperature=0,
            )
        except (APIConnectionError, RateLimitError, APIError) as exc:
            logger.exception("Fireworks API call failed")
            raise ai_service_unavailable(
                f"Fireworks AI request failed: {exc}"
            ) from exc

        # ── Extract and parse the response text ────────────────
        raw_text = response.choices[0].message.content or ""
        cleaned = _extract_json(raw_text)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error("AI returned non-JSON response: %s", raw_text[:500])
            raise ai_response_invalid(
                "AI returned an invalid or unparseable response."
            ) from exc

        try:
            result = AIResult.model_validate(parsed)
        except Exception as exc:
            logger.error("AI response failed schema validation: %s", parsed)
            raise ai_response_invalid(
                f"AI response did not match expected schema: {exc}"
            ) from exc

        return result


# ── Helpers ────────────────────────────────────────────────────────────

def _extract_json(text: str) -> str:
    """Extract JSON from response, handling markdown fences and reasoning text."""
    text = text.strip()
    
    # If it starts with {, assume it's already JSON
    if text.startswith("{"):
        return text
    
    # Look for JSON object in the text
    # Find the first { and last }
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return text[start_idx:end_idx + 1]
    
    # Fallback: try to strip markdown fences
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```)
        if lines:
            lines = lines[1:]
        # Remove last line if it's ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    
    return text
