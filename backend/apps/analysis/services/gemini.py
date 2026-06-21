"""
Google Gemini integration for resume parsing and job matching.
All prompts are structured to return clean JSON that can be parsed reliably.
"""
import json
import logging
import re
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_client():
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(settings.GEMINI_MODEL)


def _safe_json(text: str) -> dict | list:
    """Strip markdown fences and parse JSON."""
    text = text.strip()
    # Remove ```json ... ``` wrappers
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def parse_resume_with_gemini(raw_text: str) -> dict:
    """
    Parse raw resume text into structured fields.
    Returns a dict with keys: contact_info, skills, experience,
    education, certifications, summary, total_years_experience, seniority_level.
    """
    prompt = f"""You are an expert resume parser. Analyze this resume text and return ONLY a valid JSON object.

RESUME TEXT:
---
{raw_text[:12000]}
---

Return this EXACT JSON structure (no markdown, no explanation):
{{
  "contact_info": {{
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  }},
  "summary": "Brief professional summary extracted or inferred from the resume",
  "skills": ["skill1", "skill2"],
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "start_date": "MM/YYYY",
      "end_date": "MM/YYYY or Present",
      "duration_months": 0,
      "bullets": ["Achievement 1", "Achievement 2"]
    }}
  ],
  "education": [
    {{
      "degree": "BS Computer Science",
      "institution": "University Name",
      "graduation_year": "2020",
      "gpa": ""
    }}
  ],
  "certifications": ["AWS Solutions Architect", "PMP"],
  "total_years_experience": 0.0,
  "seniority_level": "junior|mid|senior|lead|executive"
}}"""

    model = _get_client()
    response = model.generate_content(prompt)
    return _safe_json(response.text)


def parse_job_description_with_gemini(raw_text: str) -> dict:
    """Extract structured data from a job description."""
    prompt = f"""Parse this job description into structured JSON. Return ONLY the JSON, no explanation.

JOB DESCRIPTION:
---
{raw_text[:8000]}
---

Return this EXACT structure:
{{
  "title": "Extracted job title",
  "company": "Company name if found",
  "location": "Location if found",
  "job_type": "full-time|part-time|contract|internship",
  "experience_level": "entry|mid|senior|lead|manager",
  "required_skills": ["Python", "React"],
  "preferred_skills": ["Kubernetes", "GraphQL"],
  "responsibilities": ["Build scalable APIs", "Lead code reviews"],
  "qualifications": ["BS in CS or related field", "5+ years experience"],
  "keywords": ["agile", "microservices", "ci/cd"]
}}"""

    model = _get_client()
    response = model.generate_content(prompt)
    return _safe_json(response.text)


def analyze_resume_job_match(
    resume_text: str,
    resume_skills: list,
    jd_text: str,
    jd_required_skills: list,
    jd_preferred_skills: list,
) -> dict:
    """
    Perform deep analysis of resume vs job description.
    Returns ATS score, match score, gaps, recommendations.
    """
    prompt = f"""You are an expert ATS (Applicant Tracking System) and career coach.
Analyze how well this resume matches the job description and return ONLY valid JSON.

RESUME SKILLS: {json.dumps(resume_skills)}

RESUME TEXT (first 6000 chars):
---
{resume_text[:6000]}
---

JOB REQUIRED SKILLS: {json.dumps(jd_required_skills)}
JOB PREFERRED SKILLS: {json.dumps(jd_preferred_skills)}

JOB DESCRIPTION (first 4000 chars):
---
{jd_text[:4000]}
---

Return this EXACT JSON (no markdown):
{{
  "ats_score": 72,
  "match_score": 68,
  "keyword_match_score": 75,
  "experience_match_score": 70,
  "skills_match_score": 65,
  "matched_skills": ["Python", "Django"],
  "missing_required_skills": ["Kubernetes", "Terraform"],
  "missing_preferred_skills": ["GraphQL"],
  "matched_keywords": ["agile", "microservices"],
  "missing_keywords": ["ci/cd", "aws"],
  "strengths": [
    "Strong Python background aligns with core role requirement",
    "Demonstrated leadership in previous roles matches senior position"
  ],
  "gaps": [
    "No cloud infrastructure experience (Kubernetes/Terraform required)",
    "Missing CI/CD pipeline experience mentioned 3 times in JD"
  ],
  "recommendations": [
    {{
      "priority": "high",
      "category": "skills",
      "title": "Add Kubernetes to resume",
      "description": "Kubernetes is listed as required. Even basic exposure (personal projects) should be highlighted.",
      "action": "Add a projects section showcasing containerization work"
    }},
    {{
      "priority": "medium",
      "category": "keywords",
      "title": "Include CI/CD keywords",
      "description": "CI/CD appears 3 times in the JD but is absent from your resume.",
      "action": "Add GitHub Actions or Jenkins experience to relevant job bullets"
    }}
  ],
  "resume_improvements": [
    "Quantify impact in experience bullets (e.g., 'reduced load time by 40%')",
    "Add a Skills section at the top for better ATS parsing",
    "Include relevant certifications prominently"
  ],
  "overall_verdict": "Good match with targeted improvements",
  "hire_probability": "moderate"
}}"""

    model = _get_client()
    response = model.generate_content(prompt)
    return _safe_json(response.text)
