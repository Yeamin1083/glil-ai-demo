import asyncio
import json
from functools import cache
from pathlib import Path
from string import Template

from google import genai
from google.genai import types
from pydantic import BaseModel

from app import fixtures as fx
from app.config import settings
from app.schemas import ClaimIn, SettleResult, Status

# the prompts name the statuses from the enum, so a rename cannot leave them behind
_STATUS_WORDS = {s.name.lower(): s.value for s in Status}
_SETTLE_PROMPT = Template(
    (Path(__file__).parent / "prompts" / "settle.txt").read_text()
)


@cache
def _client() -> genai.Client:
    return genai.Client(api_key=settings.GEMINI_API_KEY)


RETRIES = 3
RETRY_WAIT_SECONDS = 2


class ReviewFailed(Exception):
    pass


async def settle_and_check(
    claim: ClaimIn, document: bytes, mime_type: str
) -> SettleResult:
    """The one AI call after the officer has checked the details: settle, then double-check."""
    member = fx.MEMBERS[claim.member_code]
    prompt = _SETTLE_PROMPT.substitute(
        claim=claim.model_dump_json(indent=2),
        member=json.dumps(
            {
                "name": member["name"],
                "relation": member["relation"],
                "plan_covers_dental_and_optical": fx.covers_dental_optical(
                    member["plan"]
                ),
            }
        ),
        remarks="\n".join(f"- {r}" for r in fx.MODEL_REMARKS),
        reasons="\n".join(f"- {r}" for r in fx.MODEL_REJECTION_REASONS),
        **_STATUS_WORDS,
    )
    return await _generate(prompt, document, mime_type, SettleResult)


async def _generate(
    prompt: str, document: bytes, mime_type: str, schema: type[BaseModel]
):
    config = types.GenerateContentConfig(
        temperature=0,
        response_mime_type="application/json",
        response_schema=schema,
        thinking_config=types.ThinkingConfig(
            thinking_level=types.ThinkingLevel[settings.GEMINI_THINKING.upper()]
        ),
    )
    # ponytail: Gemini answers 503 "high demand" in spikes, so try a few times before giving up
    for attempt in range(RETRIES):
        try:
            response = await _client().aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=document, mime_type=mime_type),
                ],
                config=config,
            )
            break
        except Exception as e:  # one catch-all, a demo just shows the message
            overloaded = "503" in str(e) or "429" in str(e)
            if not overloaded or attempt == RETRIES - 1:
                raise ReviewFailed(f"Gemini call failed: {e}") from e
            await asyncio.sleep(RETRY_WAIT_SECONDS * (attempt + 1))
    if not isinstance(response.parsed, schema):
        raise ReviewFailed("Gemini returned an unexpected shape, retry.")
    return response.parsed
