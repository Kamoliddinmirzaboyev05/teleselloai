from pydantic import BaseModel, Field


class FAQItem(BaseModel):
    question: str = ""
    answer: str = ""


class AISettings(BaseModel):
    business_name: str = ""
    business_description: str = ""
    services: str = ""
    pricing: str = ""
    target_customers: str = ""
    tone: str = "samimiy, qisqa, professional"
    languages: str = "o'zbekcha"
    required_lead_fields: str = "ism, telefon, qiziqayotgan mahsulot"
    forbidden_topics: str = ""
    escalation_rules: str = ""
    custom_instructions: str = ""
    conversation_style: str = ""
    faq: list[FAQItem] = Field(default_factory=list)


class AIPauseStatus(BaseModel):
    ai_paused: bool = False


class AIChatFilterSettings(BaseModel):
    mode: str = "all"


class GroqKeyRead(BaseModel):
    groq_api_key_set: bool = False


class GroqKeyUpdate(BaseModel):
    groq_api_key: str = ""
