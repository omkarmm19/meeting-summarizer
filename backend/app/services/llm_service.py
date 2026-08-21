import json
import logging
from typing import Dict, Any
from groq import Groq
from app.config import settings
from app.schemas import MeetingStructuredSummary

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an assistant that extracts structured outcomes from meeting transcripts. "
    "Always respond with valid JSON only, no extra text."
)

USER_PROMPT_TEMPLATE = """Given the following meeting transcript, extract:
1. "summary": a 3-4 sentence overview of what was discussed
2. "key_decisions": array of strings, each a concrete decision made
3. "action_items": array of objects with "task", "owner" (null if not mentioned), "deadline" (null if not mentioned)

Transcript:
{transcript}

Respond only with JSON in this exact schema:
{{"summary": "", "key_decisions": [], "action_items": [{{"task": "", "owner": null, "deadline": null}}]}}"""


def get_mock_summary() -> MeetingStructuredSummary:
    """Returns a realistic mock structured summary for offline tests and development."""
    return MeetingStructuredSummary(
        summary=(
            "The team held a Q3 Product & Engineering sync to address checkout performance latency and review upcoming sprint deliverables. "
            "Sarah identified a database indexing bottleneck on the transactions table and will migrate queries to a composite index. "
            "Michael finalized the new UI design tokens in Figma and agreed to update the frontend components. "
            "Finally, the team aligned on adopting Redis for distributed caching and task queue management."
        ),
        key_decisions=[
            "Migrate user transactions database queries to use a composite index on (user_id, created_at).",
            "Deprecate legacy button components in favor of unified design system tokens.",
            "Adopt Redis for task queues and caching layer instead of Celery/RabbitMQ."
        ],
        action_items=[
            {
                "task": "Implement and deploy database composite indexing migration on user transactions table",
                "owner": "Sarah",
                "deadline": "This Friday"
            },
            {
                "task": "Update frontend design system with new Figma button components and tokens",
                "owner": "Michael",
                "deadline": "Next Tuesday"
            },
            {
                "task": "Setup Redis Docker configuration, connection pooling, and team documentation",
                "owner": "David",
                "deadline": "Wednesday EOD"
            }
        ]
    )


def summarize_transcript(transcript: str) -> MeetingStructuredSummary:
    """
    Summarize a meeting transcript using Groq API in JSON Mode with retry logic.
    """
    if not transcript or not transcript.strip():
        raise ValueError("Transcript content cannot be empty")

    api_key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""
    is_dummy_key = not api_key or api_key.startswith("your_") or api_key == "gsk_dummy"

    if settings.MOCK_SERVICES or is_dummy_key:
        logger.info("[LLM Mock] Generating mock structured summary")
        return get_mock_summary()

    client = Groq(api_key=api_key)
    prompt = USER_PROMPT_TEMPLATE.format(transcript=transcript)

    # Ordered list of models to try in case one is decommissioned or unavailable on account
    candidate_models = []
    if settings.GROQ_MODEL:
        candidate_models.append(settings.GROQ_MODEL)
    for default_cand in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b", "groq/compound"]:
        if default_cand not in candidate_models:
            candidate_models.append(default_cand)

    last_error = None
    for model_name in candidate_models:
        try:
            logger.info(f"Calling Groq API (model: {model_name}) with response_format=json_object")
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=2048,
            )
            content = response.choices[0].message.content
            parsed = json.loads(content)
            return MeetingStructuredSummary.model_validate(parsed)

        except Exception as exc:
            last_error = exc
            logger.warning(f"Groq model '{model_name}' failed: {exc}. Trying next candidate...")
            continue

    logger.error(f"All Groq LLM models failed. Last error: {last_error}", exc_info=True)
    raise RuntimeError(f"Groq LLM summarization failed: {str(last_error)}") from last_error
