import json
import logging
from groq import Groq
from app.config import settings
from app.schemas import MeetingStructuredSummary

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an expert meeting analyst and executive intelligence assistant. "
    "Your objective is to extract highly accurate, comprehensive, and factual structured information "
    "from meeting transcripts with strict adherence to deadlines, timeframes, assignees, and decisions. "
    "Always output valid, well-formed JSON conforming exactly to the requested schema."
)

USER_PROMPT_TEMPLATE = """You are analyzing the following meeting transcript. Extract a highly accurate and comprehensive structured summary.

### INSTRUCTIONS:
1. "summary":
   - Write a clear, professional 3-4 sentence overview synthesizing the meeting's agenda, key discussion points, and conclusions.

2. "key_decisions":
   - List all concrete decisions, agreements, policy resolutions, or scheduling choices agreed upon during the discussion as an array of concise strings.

3. "action_items":
   - Extract all actionable tasks, requested deliverables, scheduled activities/breaks, presentation updates, and follow-ups.
   - For each item:
     * "task": A clear, concise description of the action required.
     * "owner": The specific person, speaker, team, or role responsible (e.g., "Paul", "Ms. Reyes"). If no person is assigned or implied, set to null.
     * "deadline": The precise deadline, scheduled time, clock time (e.g., "11:15 AM", "11:30 AM", "5:00 PM"), timeframe (e.g., "Before 11:30 arrival", "During 11:15 break", "By Friday", "End of meeting"), or milestone. 
       CRITICAL: If ANY time, hour, schedule, or deadline is mentioned in connection with an action, you MUST extract and record it. Only set to null if absolutely no time or deadline was referenced.

### TRANSCRIPT:
{transcript}

### REQUIRED JSON SCHEMA:
{{
  "summary": "String",
  "key_decisions": ["String"],
  "action_items": [
    {{
      "task": "String",
      "owner": "String or null",
      "deadline": "String or null"
    }}
  ]
}}"""


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
                temperature=0.0,
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
