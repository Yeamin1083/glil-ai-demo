import json
from functools import cache
from pathlib import Path
from string import Template

from google import genai
from google.genai import types

from app import fixtures as fx
from app.config import settings
from app.schemas import ClaimIn, ModelReview

_PROMPT = Template((Path(__file__).parent / "prompts" / "review.txt").read_text())

_CONFIG = types.GenerateContentConfig(
    temperature=0,
    response_mime_type="application/json",
    response_schema=ModelReview,
    thinking_config=types.ThinkingConfig(
        thinking_level=types.ThinkingLevel[settings.GEMINI_THINKING.upper()]
    ),
)


@cache
def _client() -> genai.Client:
    return genai.Client(api_key=settings.GEMINI_API_KEY)


class ReviewFailed(Exception):
    pass


async def review_claim(claim: ClaimIn, document: bytes, mime_type: str) -> ModelReview:
    member = fx.MEMBERS[claim.member_code]
    prompt = _PROMPT.substitute(
        claim=claim.model_dump_json(indent=2),
        member=json.dumps(
            {
                "name": member["name"],
                "relation": member["relation"],
            }
        ),
        remarks="\n".join(f"- {r}" for r in fx.MODEL_REMARKS),
        reasons="\n".join(f"- {r}" for r in fx.MODEL_REJECTION_REASONS),
    )
    try:
        response = await _client().aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                prompt,
                types.Part.from_bytes(data=document, mime_type=mime_type),
            ],
            config=_CONFIG,
        )
    except Exception as e:  # ponytail: one catch-all, a demo just shows the message
        raise ReviewFailed(f"Gemini call failed: {e}") from e
    if not isinstance(response.parsed, ModelReview):
        raise ReviewFailed("Gemini returned an unexpected shape, retry.")
    return response.parsed
