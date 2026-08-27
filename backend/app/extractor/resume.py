"""Resume extractor (Section 4 / 8.3 Step 3): pdfplumber for text extraction,
then an LLM call for structured extraction. Purely local — never uploaded
to a third party beyond the configured LLM provider.
"""

from __future__ import annotations

import pdfplumber

from app.rag.llm_client import complete_structured

_EXTRACTION_PROMPT = """Extract structured data from this resume text. Return JSON with keys:
education (list of {{institution, degree, field, year}}),
work_experience (list of {{company, title, start_date, end_date, description}}),
projects (list of {{name, description}}),
skills_claimed (list of strings).
Only extract what is literally present in the text; do not infer or invent entries.

RESUME TEXT:
{text}
"""


def extract_text(pdf_path: str) -> str:
    with pdfplumber.open(pdf_path) as pdf:
        return "\n\n".join(page.extract_text() or "" for page in pdf.pages)


async def parse_resume(pdf_path: str) -> dict:
    text = extract_text(pdf_path)
    return await complete_structured(_EXTRACTION_PROMPT.format(text=text[:12000]))
