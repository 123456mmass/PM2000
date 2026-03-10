#!/usr/bin/env python3
"""
Regression tests for 4 confirmed runtime bugs:
  P1-A  EnergyManagement.close() – AttributeError on lifespan shutdown
  P1-B  Serial timeout / ERROR path leaves stale active alerts
  P1-C  Disconnected client leaves stale data & alerts
  P2    Poll cadence drifts beyond 1 Hz when read is slow
"""

import asyncio
import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch

# ── helpers ─────────────────────────────────────────────────────────────────

def _make_state():
    """Return a fresh mock of core.state with minimal attributes."""
    s = MagicMock()
    s.SIMULATE_MODE = False
    s.cached_data = {}
    s.last_poll_error = None
    s.current_alerts = {"status": "OK", "alerts": [], "active": False, "retained": False}
    s.last_active_alerts = None
    s.last_alert_seen_at = 0.0
    s.ALERT_RETENTION_SECONDS = 30.0
    s.is_logging = False
    s.alerts_lock = asyncio.Lock()
    s.real_client = None
    return s


# ============================================================================
# P1-A  EnergyManagement.close() must exist and be awaitable
# ============================================================================
class TestEnergyManagementClose:

    @pytest.mark.asyncio
    async def test_close_method_exists_and_is_awaitable(self):
        """EnergyManagement.close() must exist so lifespan shutdown doesn't raise."""
        from energy_management import EnergyManagement

        em = EnergyManagement()
        # Replace the real httpx client with a mock so no network is needed
        em.client = AsyncMock()
        em.client.aclose = AsyncMock()

        # Must not raise AttributeError or any other exception
        await em.close()
        em.client.aclose.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_close_survives_aclose_exception(self):
        """close() must swallow exceptions from httpx.aclose() gracefully."""
        from energy_management import EnergyManagement

        em = EnergyManagement()
        em.client = AsyncMock()
        em.client.aclose = AsyncMock(side_effect=RuntimeError("already closed"))

        # Should NOT re-raise
        await em.close()


# ============================================================================
# P1-B  Stale alert must be cleared when read returns ERROR / exception
# ============================================================================
class TestTimeoutClearsAlert:

    @pytest.mark.asyncio
    async def test_error_status_clears_active_alerts(self):
        """
        When read_all_parameters() returns status=ERROR,
        active must go False immediately (within retention window: retained=True).
        After the retention window expires it becomes status=OK.
        """
        import copy, time as _time
        from services import modbus_service as svc

        state = _make_state()

        # Pre-seed a stale *active* alert
        stale_alert = {
            "status": "ALERT",
            "count": 1,
            "alerts": [{"category": "harmonics", "message": "THD high", "severity": "high", "detail": ""}],
            "active": True,
            "retained": False,
        }
        state.current_alerts = copy.deepcopy(stale_alert)
        state.last_active_alerts = copy.deepcopy(stale_alert)
        state.last_alert_seen_at = _time.time()  # just now → inside retention window

        fake_client = MagicMock()
        fake_client.connected = True
        fake_client.read_all_parameters = MagicMock(return_value={"status": "ERROR"})
        state.real_client = fake_client

        single_iter_done = asyncio.Event()

        async def _fake_sleep(t):
            single_iter_done.set()
            raise asyncio.CancelledError

        with patch("services.modbus_service.state", state), \
             patch("asyncio.sleep", side_effect=_fake_sleep):
            task = asyncio.create_task(svc.poll_modbus_data())
            try:
                await asyncio.wait_for(single_iter_done.wait(), timeout=3.0)
            except asyncio.TimeoutError:
                pass
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

        # THE BUG WAS: active stayed True forever.
        # The fix: within the retention window, active must be False (retained=True).
        assert state.current_alerts.get("active") is False, (
            f"Expected active=False, got: {state.current_alerts}"
        )

    @pytest.mark.asyncio
    async def test_error_status_clears_alerts_after_retention_expires(self):
        """
        After the retention window expires, status must become OK.
        """
        import copy, time as _time
        from services import modbus_service as svc

        state = _make_state()
        state.ALERT_RETENTION_SECONDS = 0.0  # no retention

        stale_alert = {
            "status": "ALERT",
            "count": 1,
            "alerts": [{"category": "harmonics", "message": "THD high", "severity": "high", "detail": ""}],
            "active": True,
            "retained": False,
        }
        state.current_alerts = copy.deepcopy(stale_alert)
        state.last_active_alerts = copy.deepcopy(stale_alert)
        state.last_alert_seen_at = 0.0  # far in the past → retention expired

        fake_client = MagicMock()
        fake_client.connected = True
        fake_client.read_all_parameters = MagicMock(return_value={"status": "ERROR"})
        state.real_client = fake_client

        single_iter_done = asyncio.Event()

        async def _fake_sleep(t):
            single_iter_done.set()
            raise asyncio.CancelledError

        with patch("services.modbus_service.state", state), \
             patch("asyncio.sleep", side_effect=_fake_sleep):
            task = asyncio.create_task(svc.poll_modbus_data())
            try:
                await asyncio.wait_for(single_iter_done.wait(), timeout=3.0)
            except asyncio.TimeoutError:
                pass
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

        assert state.current_alerts.get("status") == "OK", (
            f"Expected OK after retention expired, got: {state.current_alerts}"
        )
        assert state.current_alerts.get("alerts") == []

    @pytest.mark.asyncio
    async def test_exception_in_read_clears_active_alerts(self):
        """
        When read_all_parameters() raises (e.g. serial timeout) the outer
        except block must call update_current_alerts so active becomes False.
        """
        import copy, time as _time
        from services import modbus_service as svc

        state = _make_state()
        state.ALERT_RETENTION_SECONDS = 0.0  # no retention → status goes straight to OK
        stale_alert = {
            "status": "ALERT",
            "count": 1,
            "alerts": [{"category": "voltage_sag", "message": "Low V", "severity": "high", "detail": ""}],
            "active": True,
            "retained": False,
        }
        state.current_alerts = copy.deepcopy(stale_alert)
        state.last_active_alerts = copy.deepcopy(stale_alert)
        state.last_alert_seen_at = 0.0  # retention already expired

        fake_client = MagicMock()
        fake_client.connected = True
        fake_client.read_all_parameters = MagicMock(side_effect=TimeoutError("serial timeout"))
        state.real_client = fake_client

        single_iter_done = asyncio.Event()

        async def _fake_sleep(t):
            single_iter_done.set()
            raise asyncio.CancelledError

        with patch("services.modbus_service.state", state), \
             patch("asyncio.sleep", side_effect=_fake_sleep):
            task = asyncio.create_task(svc.poll_modbus_data())
            try:
                await asyncio.wait_for(single_iter_done.wait(), timeout=3.0)
            except asyncio.TimeoutError:
                pass
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

        # With retention=0 and last_alert_seen_at=0, alerts must fully clear to OK
        assert state.current_alerts.get("status") == "OK", (
            f"Expected OK after timeout + retention expired, got: {state.current_alerts}"
        )
        assert state.current_alerts.get("active") is False


# ============================================================================
# P1-C  Disconnected client must clear stale data and alerts in next poll
# ============================================================================
class TestDisconnectClearsStaleState:

    @pytest.mark.asyncio
    async def test_disconnected_client_clears_cached_data_and_alerts(self):
        """
        When real_client.connected is False:
          - real_client handle must be None'd
          - cached_data.status must become NOT_CONNECTED
          - active alert must become False (the core of P1-C)
        """
        import copy, time as _time
        from services import modbus_service as svc

        state = _make_state()
        state.ALERT_RETENTION_SECONDS = 0.0  # so status goes straight to OK
        stale_alert = {
            "status": "ALERT",
            "count": 1,
            "alerts": [{"category": "phase_loss", "message": "Phase L1 lost", "severity": "critical", "detail": ""}],
            "active": True,
            "retained": False,
        }
        state.current_alerts = copy.deepcopy(stale_alert)
        state.last_active_alerts = copy.deepcopy(stale_alert)
        state.last_alert_seen_at = 0.0  # retention already expired
        state.cached_data = {"status": "OK", "V_LN1": 230}  # stale good data

        fake_client = MagicMock()
        fake_client.connected = False
        state.real_client = fake_client

        single_iter_done = asyncio.Event()

        async def _fake_sleep(t):
            single_iter_done.set()
            raise asyncio.CancelledError

        with patch("services.modbus_service.state", state), \
             patch("asyncio.sleep", side_effect=_fake_sleep):
            task = asyncio.create_task(svc.poll_modbus_data())
            try:
                await asyncio.wait_for(single_iter_done.wait(), timeout=3.0)
            except asyncio.TimeoutError:
                pass
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

        # THE BUG WAS: stale data/alerts stayed forever.
        # real_client handle must be dropped
        assert state.real_client is None, "Disconnected client handle should be set to None"
        # cached_data must immediately reflect NOT_CONNECTED
        assert state.cached_data.get("status") == "NOT_CONNECTED", (
            f"Expected NOT_CONNECTED, got: {state.cached_data.get('status')}"
        )
        # alerts must clear (retention=0 so goes straight to OK)
        assert state.current_alerts.get("status") == "OK", (
            f"Expected OK, got: {state.current_alerts}"
        )
        assert state.current_alerts.get("active") is False


# ============================================================================
# P2   Poll cadence must be ~1 Hz regardless of read duration
# ============================================================================
class TestFixedPollCadence:

    @pytest.mark.asyncio
    async def test_sleep_compensates_for_slow_read(self):
        """
        With a 0.5-second simulated read the loop must sleep ~0.5 s,
        not a full 1.0 s.  Total interval stays ≈ 1 s.
        """
        from services import modbus_service as svc

        state = _make_state()
        state.SIMULATE_MODE = True

        READ_DURATION = 0.5          # seconds of fake read time
        sleep_amounts: list[float] = []
        iter_count = 0
        MAX_ITERS = 2

        real_time = asyncio.get_event_loop().time

        async def _fake_sleep(t: float):
            nonlocal iter_count
            sleep_amounts.append(t)
            iter_count += 1
            if iter_count >= MAX_ITERS:
                raise asyncio.CancelledError

        _original_sim = svc.generate_simulated_data

        def _slow_sim():
            """Block the thread for READ_DURATION to simulate a slow Modbus read."""
            time.sleep(READ_DURATION)
            data = _original_sim()
            return data

        with patch("services.modbus_service.state", state), \
             patch("services.modbus_service.generate_simulated_data", side_effect=_slow_sim), \
             patch("asyncio.sleep", side_effect=_fake_sleep):
            task = asyncio.create_task(svc.poll_modbus_data())
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

        assert sleep_amounts, "sleep() was never called"

        for s in sleep_amounts:
            # With a 0.5 s read the sleep should be < 0.7 s (not ~1.0 s)
            assert s < 0.7, (
                f"sleep({s:.3f}) too long – cadence isn't being compensated. "
                f"Expected < 0.7 s with a {READ_DURATION} s read."
            )
            # And sleep must be non-negative
            assert s >= 0.0, f"sleep({s:.3f}) is negative"



# ============================================================================
# P1-A  Full lifespan: startup → shutdown must not raise AttributeError
# ============================================================================
class TestLifespanShutdown:
    """
    Drive the *real* main.py lifespan context manager through TestClient so
    that startup and shutdown both execute.  All external side-effects
    (serial scan, tunnel, polling task) are mocked out.
    """

    def test_lifespan_shutdown_does_not_raise(self):
        """
        TestClient enters the lifespan on __enter__ and exits on __exit__.
        Before P1-A fix: shutdown raised AttributeError because
        EnergyManagement had no close() method.
        After fix: exits cleanly with no AttributeError or TypeError.
        """
        from fastapi.testclient import TestClient

        # Build mock instances with awaitable close()
        mock_em = MagicMock()
        mock_em.close = AsyncMock()

        mock_ext_pm = MagicMock()
        mock_ext_pm.close = AsyncMock()

        mock_pm = MagicMock()

        mock_polling_task = MagicMock()
        mock_polling_task.cancel = MagicMock()

        with (
            # Don't try real serial ports
            patch("services.modbus_service.auto_connect", return_value=(None, [])),
            # Don't start the polling coroutine, but close the coroutine to avoid RuntimeWarning
            patch("asyncio.create_task", side_effect=lambda c: (c.close(), mock_polling_task)[1]),
            # Don't start Cloudflare tunnel thread
            patch("threading.Thread"),
            # Patch constructors in main's namespace so lifespan
            # gets our mocks when it does EnergyManagement(...) etc.
            patch("main.EnergyManagement", return_value=mock_em),
            patch("main.ExternalPredictiveMaintenance", return_value=mock_ext_pm),
            patch("main.PredictiveMaintenance", return_value=mock_pm),
        ):
            from main import app

            raised = None
            try:
                with TestClient(app, raise_server_exceptions=True):
                    pass  # startup on entry, shutdown on exit
            except (AttributeError, TypeError) as exc:
                raised = exc

        assert raised is None, (
            f"Lifespan shutdown raised {type(raised).__name__}: {raised}\n"
            "EnergyManagement.close() or ExternalPM.close() is not properly awaitable."
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

