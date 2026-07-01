from app.bot.worker import should_start_worker


def test_worker_does_not_start_when_disabled():
    assert should_start_worker(False, "123", "hash") is False


def test_worker_requires_credentials_when_enabled():
    assert should_start_worker(True, "", "hash") is False
    assert should_start_worker(True, "123", "") is False
    assert should_start_worker(True, "123", "hash") is True
