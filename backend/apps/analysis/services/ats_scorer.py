"""
Local ATS scoring heuristics — fast, no API call needed.
Used as a baseline before Gemini enrichment.
"""
import re
from typing import List


def normalize(text: str) -> str:
    return text.lower().strip()


def skill_match_ratio(resume_skills: List[str], jd_skills: List[str]) -> float:
    if not jd_skills:
        return 1.0
    resume_set = {normalize(s) for s in resume_skills}
    matched = sum(1 for s in jd_skills if normalize(s) in resume_set)
    return matched / len(jd_skills)


def keyword_density_score(resume_text: str, keywords: List[str]) -> float:
    if not keywords:
        return 1.0
    text_lower = resume_text.lower()
    matched = sum(1 for kw in keywords if normalize(kw) in text_lower)
    return matched / len(keywords)


def format_score(resume_text: str) -> int:
    """
    Quick heuristic check on resume formatting:
    - Has sections (Experience, Education, Skills)
    - Contact info present
    - Reasonable length
    - Bullet points / action verbs
    """
    score = 0
    checks = {
        r"\b(experience|work history)\b": 15,
        r"\b(education|degree|university|college)\b": 10,
        r"\bskills?\b": 10,
        r"\b[\w.+-]+@[\w-]+\.\w+\b": 10,  # email
        r"\b(\+?\d[\d\s\-().]{7,}\d)\b": 5,  # phone
        r"(•|\*|–|-)\s+\w": 15,  # bullet points
        r"\b(led|developed|built|improved|reduced|increased|managed|designed|architected)\b": 15,
        r"\d+%": 10,  # quantified achievements
        r"\b(linkedin|github)\b": 5,
        r"\b(certified|certification|certificate)\b": 5,
    }
    text_lower = resume_text.lower()
    for pattern, points in checks.items():
        if re.search(pattern, text_lower):
            score += points
    return min(score, 100)


def compute_local_ats_score(
    resume_text: str,
    resume_skills: List[str],
    jd_required_skills: List[str],
    jd_preferred_skills: List[str],
    jd_keywords: List[str],
) -> dict:
    req_ratio = skill_match_ratio(resume_skills, jd_required_skills)
    pref_ratio = skill_match_ratio(resume_skills, jd_preferred_skills)
    kw_ratio = keyword_density_score(resume_text, jd_keywords)
    fmt_score = format_score(resume_text)

    # Weighted composite
    weighted = (
        req_ratio * 40 +
        pref_ratio * 15 +
        kw_ratio * 25 +
        fmt_score * 0.20
    )

    return {
        "local_ats_score": round(weighted),
        "required_skill_ratio": round(req_ratio * 100),
        "preferred_skill_ratio": round(pref_ratio * 100),
        "keyword_ratio": round(kw_ratio * 100),
        "format_score": fmt_score,
    }
