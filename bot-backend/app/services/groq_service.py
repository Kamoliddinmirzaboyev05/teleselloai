import asyncio
from pathlib import Path

from app.config import get_settings


class GroqService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _client(self):
        if not self.settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured")
        from groq import Groq

        return Groq(api_key=self.settings.groq_api_key)

    async def generate_reply(self, messages: list[dict[str, str]]) -> str:
        def call() -> str:
            completion = self._client().chat.completions.create(
                model=self.settings.groq_text_model,
                messages=messages,
                temperature=0.4,
            )
            return completion.choices[0].message.content or ""

        return await asyncio.to_thread(call)

    async def transcribe_audio(self, audio_path: str) -> str:
        def call() -> str:
            with Path(audio_path).open("rb") as audio_file:
                transcription = self._client().audio.transcriptions.create(
                    file=audio_file,
                    model=self.settings.groq_stt_model,
                )
            return transcription.text

        return await asyncio.to_thread(call)
