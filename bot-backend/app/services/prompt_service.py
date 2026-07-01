from app.models.chat_history import ChatHistory

SYSTEM_PROMPT = """You are a helpful Uzbek-speaking sales assistant for Telegram leads.
Collect useful CRM data naturally. Always append hidden JSON at the end:
DATA_CAPTURE: {"first_name":null,"phone":null,"product_interest":null,"status":"new"}
Valid statuses are new, thinking, won, lost. Do not mention DATA_CAPTURE to the customer."""


def build_messages(history: list[ChatHistory]) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history[-10:]:
        role = "assistant" if item.role == "assistant" else "user"
        messages.append({"role": role, "content": item.content})
    return messages
