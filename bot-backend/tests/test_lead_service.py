import uuid

import pytest

from app.api.leads import _scoped_account_id
from app.models.lead import Lead
from app.schemas.user import CurrentUser
from app.services.lead_service import find_lead_by_telegram_id


class FakeScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeSession:
    def __init__(self, value):
        self.value = value

    async def execute(self, statement):
        self.statement = statement
        return FakeScalarResult(self.value)


@pytest.mark.asyncio
async def test_find_lead_by_telegram_id_returns_existing_lead():
    account_id = uuid.uuid4()
    lead = Lead(account_id=account_id, telegram_id=42)
    session = FakeSession(lead)

    result = await find_lead_by_telegram_id(session, account_id=account_id, telegram_id=42)

    assert result is lead


def test_scoped_account_id_filters_admins_and_not_superadmin():
    account_id = uuid.uuid4()
    admin = CurrentUser(id=uuid.uuid4(), username="admin1", role="admin", account_id=account_id)
    superadmin = CurrentUser(id=uuid.uuid4(), username="owner", role="superadmin", account_id=uuid.uuid4())

    assert _scoped_account_id(admin) == account_id
    assert _scoped_account_id(superadmin) is None
