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

SYSTEM_PROMPT = """\
You are an expert insurance-claims analyst.  Given an image and a claim \
description, assess whether the visual evidence supports the claim.

You MUST respond with a single JSON object — no markdown fences, no \
extra commentary — matching this exact schema:

{
  "claim_supported": true | false,
  "confidence": 0.0 — 1.0,
  "objects_detected": ["object1", "object2", ...],
  "estimated_quantity": <integer or null if not applicable>,
  "reason": "concise explanation of your assessment",
  "limitations": "caveats about what cannot be determined from the image",
  "recommendation": "next-step advice for the claims adjuster"
}

Rules:
- Set confidence between 0 and 1 based on how strongly the image supports the claim.
- List every relevant object you can identify in the image.
- Use null for estimated_quantity when it does not apply to the claim type.
- Be factual and conservative — highlight uncertainty in limitations.
"""

USER_PROMPT_TEMPLATE = """\
Claim type: {claim_type}

Description: {description}

Analyze the attached image in the context of the claim above and return \
your assessment as a JSON object.
"""


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
                temperature=0.2,
            )
        except (APIConnectionError, RateLimitError, APIError) as exc:
            logger.exception("Fireworks API call failed")
            raise ai_service_unavailable(
                f"Fireworks AI request failed: {exc}"
            ) from exc

        # ── Extract and parse the response text ────────────────
        raw_text = response.choices[0].message.content or ""
        cleaned = _strip_json_fences(raw_text)

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

def _strip_json_fences(text: str) -> str:
    """Remove ```json ... ``` fences that some models wrap around JSON."""
    stripped = text.strip()
    if stripped.startswith("```"):
        first_newline = stripped.find("\n")
        if first_newline != -1:
            stripped = stripped[first_newline + 1 :]
        if stripped.endswith("```"):
            stripped = stripped[:-3]
        return stripped.strip()
    return stripped
