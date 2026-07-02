from app.models.chat_history import ChatHistory

BASE_SYSTEM_PROMPT = """You are a helpful Uzbek-speaking sales assistant for Telegram leads.
Your job is to answer based on the business information below, qualify the lead,
and move the customer toward a useful next step."""

DATA_CAPTURE_CONTRACT = '{"first_name": null, "phone": null, "product_interest": null, "status": "new"}'


def _append_section(parts: list[str], title: str, value: str | None) -> None:
    if value:
        parts.append(f"{title}: {value}")


def build_system_prompt(ai_settings: dict | None = None) -> str:
    settings = ai_settings or {}
    parts = [BASE_SYSTEM_PROMPT, "Business settings:"]
    _append_section(parts, "Business name", settings.get("business_name"))
    _append_section(parts, "Business description", settings.get("business_description"))
    _append_section(parts, "Services/products", settings.get("services"))
    _append_section(parts, "Pricing", settings.get("pricing"))
    _append_section(parts, "Target customers", settings.get("target_customers"))
    _append_section(parts, "Tone", settings.get("tone"))
    _append_section(parts, "Languages", settings.get("languages"))
    _append_section(parts, "Lead fields to collect", settings.get("required_lead_fields"))
    _append_section(parts, "Do not say or discuss", settings.get("forbidden_topics"))
    _append_section(parts, "Escalate to admin when", settings.get("escalation_rules"))
    _append_section(parts, "Extra instructions", settings.get("custom_instructions"))
    _append_section(parts, "Conversation style learned from selected chat", settings.get("conversation_style"))

    faq = settings.get("faq") or []
    if faq:
        parts.append("FAQ examples:")
        for item in faq:
            question = item.get("question")
            answer = item.get("answer")
            if question and answer:
                parts.append(f"Q: {question}\nA: {answer}")

    parts.append(
        "Always append hidden JSON at the end exactly in this format:\n"
        f"DATA_CAPTURE: {DATA_CAPTURE_CONTRACT}\n"
        "Valid statuses are new, thinking, won, lost. Do not mention DATA_CAPTURE to the customer."
    )
    return "\n\n".join(parts)


def build_conversation_style_profile(history: list[ChatHistory]) -> str:
    style_messages = [item.content.strip() for item in history if item.role in {"assistant", "admin"} and item.content.strip()]
    if not style_messages:
        style_messages = [item.content.strip() for item in history if item.content.strip()]
    examples = style_messages[-6:]
    if not examples:
        return ""

    parts = [
        "Chatdan olingan gaplashish uslubi:",
        "- Javoblar shu namunalardagi ohangga yaqin bo'lsin.",
        "- Juda uzun yozma; mijozga sodda, tabiiy va qisqa javob ber.",
        "- Kerak bo'lsa bitta aniq savol bilan davom ettir.",
        "Namuna javoblar:",
    ]
    for index, message in enumerate(examples, start=1):
        compact = " ".join(message.split())
        if len(compact) > 320:
            compact = compact[:317].rstrip() + "..."
        parts.append(f"{index}. {compact}")
    return "\n".join(parts)


def build_messages(history: list[ChatHistory], ai_settings: dict | None = None) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": build_system_prompt(ai_settings)}]
    for item in history[-10:]:
        role = "assistant" if item.role == "assistant" else "user"
        messages.append({"role": role, "content": item.content})
    return messages
