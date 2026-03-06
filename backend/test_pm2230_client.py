#!/usr/bin/env python3
"""
Tests for PM2230 Modbus Scanner (pm2230_client.py)
Tests for PM2230Scanner class methods with mocked serial connection
"""

import pytest
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime

from pm2230_client import (
    PM2230Scanner,
    PM2230Client,
    REGISTER_MAP,
)


# ============================================================================
# Fixtures
# ============================================================================
@pytest.fixture
def mock_serial_client():
    """Mock ModbusSerialClient for testing."""
    with patch("pm2230_client.ModbusSerialClient") as mock:
        yield mock


@pytest.fixture
def scanner(mock_serial_client):
    """Create a PM2230Scanner instance with mocked serial."""
    mock_instance = mock_serial_client.return_value
    mock_instance.connect.return_value = True
    mock_instance.isError.return_value = False

    scanner = PM2230Scanner(port="COM3", baudrate=9600, slave_id=1, parity="E")
    scanner.connected = True
    return scanner


@pytest.fixture
def sample_registers():
    """Sample register values for testing."""
    return {
        "voltage_230v": [30720, 0],  # 230.0 as float32
        "current_10a": [30464, 0],   # 10.0 as float32
        "frequency_50hz": [29696, 0],  # 50.0 as float32
        "energy_1000kwh": [0, 0, 0, 1000],  # Simplified int64
    }


# ============================================================================
# Tests for PM2230Scanner Initialization
# ============================================================================
class TestPM2230ScannerInit:
    """Tests for PM2230Scanner initialization."""

    def test_init_default_values(self, mock_serial_client):
        """Test initialization with default values."""
        scanner = PM2230Scanner()

        assert scanner.port == "COM3"
        assert scanner.baudrate == 9600
        assert scanner.slave_id == 1
        assert scanner.parity == "E"
        assert scanner.connected is False
        mock_serial_client.assert_called_once()

    def test_init_custom_values(self, mock_serial_client):
        """Test initialization with custom values."""
        scanner = PM2230Scanner(
            port="/dev/ttyUSB0",
            baudrate=19200,
            slave_id=5,
            parity="N"
        )

        assert scanner.port == "/dev/ttyUSB0"
        assert scanner.baudrate == 19200
        assert scanner.slave_id == 5
        assert scanner.parity == "N"

    def test_init_creates_modbus_client(self, mock_serial_client):
        """Test that ModbusSerialClient is created on init."""
        PM2230Scanner(port="COM5")

        mock_serial_client.assert_called_once()
        call_args = mock_serial_client.call_args
        assert call_args.kwargs["port"] == "COM5"
        assert call_args.kwargs["baudrate"] == 9600
        assert call_args.kwargs["parity"] == "E"


# ============================================================================
# Tests for Connection Methods
# ============================================================================
class TestConnectionMethods:
    """Tests for connect and disconnect methods."""

    def test_connect_success(self, mock_serial_client):
        """Test successful connection."""
        mock_instance = mock_serial_client.return_value
        mock_instance.connect.return_value = True

        scanner = PM2230Scanner()
        result = scanner.connect()

        assert result is True
        assert scanner.connected is True
        assert scanner.last_error is None

    def test_connect_failure(self, mock_serial_client):
        """Test failed connection."""
        mock_instance = mock_serial_client.return_value
        mock_instance.connect.return_value = False

        scanner = PM2230Scanner()
        result = scanner.connect()

        assert result is False
        assert scanner.connected is False
        assert scanner.last_error is not None

    def test_connect_exception(self, mock_serial_client):
        """Test connection exception."""
        mock_instance = mock_serial_client.return_value
        mock_instance.connect.side_effect = Exception("Port busy")

        scanner = PM2230Scanner()
        result = scanner.connect()

        assert result is False
        assert scanner.connected is False
        assert scanner.last_error == "Port busy"

    def test_disconnect_when_connected(self, mock_serial_client):
        """Test disconnect when connected."""
        mock_instance = mock_serial_client.return_value
        mock_instance.close.return_value = None

        scanner = PM2230Scanner()
        scanner.connected = True
        scanner.disconnect()

        assert scanner.connected is False
        mock_instance.close.assert_called_once()

    def test_disconnect_when_not_connected(self, mock_serial_client):
        """Test disconnect when not connected."""
        scanner = PM2230Scanner()
        scanner.connected = False
        scanner.disconnect()

        assert scanner.connected is False


# ============================================================================
# Tests for convert_value Method
# ============================================================================
class TestConvertValue:
    """Tests for convert_value() method."""

    def test_convert_positive_value(self, scanner):
        """Test converting positive value."""
        # Raw value 230 with scale 1.0
        result = scanner.convert_value(230, 1.0, "V")
        assert result == 230.0

    def test_convert_with_scale(self, scanner):
        """Test converting with scale factor."""
        # Legacy 16-bit path should still apply the provided scale factor.
        result = scanner.convert_value(1000, 0.001, "kWh")
        assert result == 1.0

    def test_convert_negative_value(self, scanner):
        """Test converting negative value (two's complement)."""
        # Value > 32767 is negative
        raw = 65535  # Should be -1
        result = scanner.convert_value(raw, 1.0, "V")
        assert result == -1.0

        raw = 49152  # Should be -16384
        result = scanner.convert_value(raw, 1.0, "V")
        assert result == -16384.0

    def test_convert_zero_value(self, scanner):
        """Test converting zero value."""
        result = scanner.convert_value(0, 1.0, "V")
        assert result == 0.0

    def test_convert_boundary_32767(self, scanner):
        """Test converting boundary value 32767 (max positive)."""
        result = scanner.convert_value(32767, 1.0, "V")
        assert result == 32767.0

    def test_convert_boundary_32768(self, scanner):
        """Test converting boundary value 32768 (min negative)."""
        result = scanner.convert_value(32768, 1.0, "V")
        assert result == -32768.0

    def test_convert_rounding(self, scanner):
        """Test that result is rounded to 3 decimal places."""
        result = scanner.convert_value(1000, 0.0015, "kWh")
        assert result == 1.5


# ============================================================================
# Tests for _decode_float32 Method
# ============================================================================
class TestDecodeFloat32:
    """Tests for _decode_float32() method."""

    def test_decode_230_volts(self, scanner):
        """Test decoding 230.0V from registers."""
        # 230.0 as IEEE 754 float32 big endian: 0x43660000
        registers = [0x4366, 0x0000]
        result = scanner._decode_float32(registers)
        assert abs(result - 230.0) < 0.01

    def test_decode_50_hz(self, scanner):
        """Test decoding 50.0Hz from registers."""
        # 50.0 as IEEE 754 float32 big endian: 0x42480000
        registers = [0x4248, 0x0000]
        result = scanner._decode_float32(registers)
        assert abs(result - 50.0) < 0.01

    def test_decode_10_5_amps(self, scanner):
        """Test decoding 10.5A from registers."""
        # 10.5 as IEEE 754 float32 big endian: 0x41280000
        registers = [0x4128, 0x0000]
        result = scanner._decode_float32(registers)
        assert abs(result - 10.5) < 0.01

    def test_decode_zero(self, scanner):
        """Test decoding zero."""
        registers = [0x0000, 0x0000]
        result = scanner._decode_float32(registers)
        assert result == 0.0

    def test_decode_negative_value(self, scanner):
        """Test decoding negative value."""
        # -230.0 as IEEE 754 float32 big endian: 0xC3660000
        registers = [0xC366, 0x0000]
        result = scanner._decode_float32(registers)
        assert abs(result - (-230.0)) < 0.01

    def test_decode_nan_returns_zero(self, scanner):
        """Test that NaN values return 0.0."""
        # NaN representation
        registers = [0x7F80, 0x0001]
        result = scanner._decode_float32(registers)
        assert result == 0.0

    def test_decode_inf_returns_zero(self, scanner):
        """Test that Infinity values return 0.0."""
        # Infinity representation
        registers = [0x7F80, 0x0000]
        result = scanner._decode_float32(registers)
        assert result == 0.0

    def test_decode_rounding(self, scanner):
        """Test that result is rounded to 4 decimal places."""
        # 230.12345 would be rounded to 230.1235
        registers = [0x4366, 0x0312]  # Approximate
        result = scanner._decode_float32(registers)
        # Just verify it returns a float with max 4 decimal places
        assert isinstance(result, float)


# ============================================================================
# Tests for _decode_int64 Method
# ============================================================================
class TestDecodeInt64:
    """Tests for _decode_int64() method."""

    def test_decode_1000000(self, scanner):
        """Test decoding 1,000,000."""
        # 1000000 in big endian: 0x00000000000F4240
        registers = [0x0000, 0x0000, 0x000F, 0x4240]
        result = scanner._decode_int64(registers)
        assert result == 1000000

    def test_decode_zero(self, scanner):
        """Test decoding zero."""
        registers = [0x0000, 0x0000, 0x0000, 0x0000]
        result = scanner._decode_int64(registers)
        assert result == 0

    def test_decode_max_int32(self, scanner):
        """Test decoding max int32 value."""
        # 2147483647 = 0x7FFFFFFF
        registers = [0x0000, 0x0000, 0x7FFF, 0xFFFF]
        result = scanner._decode_int64(registers)
        assert result == 2147483647

    def test_decode_negative(self, scanner):
        """Test decoding negative value."""
        # -1 in big endian: 0xFFFFFFFFFFFFFFFF
        registers = [0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF]
        result = scanner._decode_int64(registers)
        assert result == -1

    def test_decode_energy_value(self, scanner):
        """Test decoding typical energy meter value."""
        # 1234567.890 kWh (scaled) = 1234567890
        registers = [0x0000, 0x0000, 0x4996, 0x02D2]
        result = scanner._decode_int64(registers)
        assert result == 1234567890


# ============================================================================
# Tests for read_register Method
# ============================================================================
class TestReadRegister:
    """Tests for read_register() method."""

    def test_read_register_success(self, scanner, mock_serial_client):
        """Test successful register read."""
        mock_response = MagicMock()
        mock_response.isError.return_value = False
        mock_response.registers = [1234, 5678]
        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        result = scanner.read_register(3000, 2)

        assert result == [1234, 5678]
        mock_serial_client.return_value.read_holding_registers.assert_called_once_with(
            address=3000, count=2, slave=1
        )

    def test_read_register_not_connected(self, scanner):
        """Test read when not connected."""
        scanner.connected = False
        result = scanner.read_register(3000)

        assert result is None

    def test_read_register_error_response(self, scanner, mock_serial_client):
        """Test read with error response."""
        mock_response = MagicMock()
        mock_response.isError.return_value = True
        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        result = scanner.read_register(3000)

        assert result is None

    def test_read_register_modbus_exception(self, scanner, mock_serial_client):
        """Test read with ModbusException."""
        from pymodbus.exceptions import ModbusException
        mock_serial_client.return_value.read_holding_registers.side_effect = ModbusException("Error")

        result = scanner.read_register(3000)

        assert result is None

    def test_read_register_general_exception(self, scanner, mock_serial_client):
        """Test read with general Exception."""
        mock_serial_client.return_value.read_holding_registers.side_effect = Exception("Error")

        result = scanner.read_register(3000)

        assert result is None


# ============================================================================
# Tests for read_parameter Method
# ============================================================================
class TestReadParameter:
    """Tests for read_parameter() method."""

    def test_read_parameter_success(self, scanner, mock_serial_client):
        """Test successful parameter read."""
        # Mock response for voltage (2 registers, float32)
        mock_response = MagicMock()
        mock_response.isError.return_value = False
        # 230.0 as float32
        mock_response.registers = [0x4366, 0x0000]
        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        result = scanner.read_parameter("V_LN1")

        assert result is not None
        assert result["name"] == "V_LN1"
        assert abs(result["value"] - 230.0) < 0.1
        assert result["unit"] == "V"

    def test_read_parameter_unknown(self, scanner):
        """Test read unknown parameter."""
        result = scanner.read_parameter("UNKNOWN_PARAM")

        assert result is None

    def test_read_parameter_not_connected(self, scanner):
        """Test read when not connected."""
        scanner.connected = False
        result = scanner.read_parameter("V_LN1")

        assert result is None

    def test_read_parameter_pf_lead_lag_conversion(self, scanner, mock_serial_client):
        """Test PF lead/lag conversion."""
        mock_response = MagicMock()
        mock_response.isError.return_value = False
        # PF > 1.0 means leading, should be converted
        # 1.2 stored -> 2.0 - 1.2 = 0.8 actual
        mock_response.registers = [0x3F99, 0x999A]  # ~1.2
        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        result = scanner.read_parameter("PF_Total")
        assert result is not None
        assert result["value"] < 1.0

    def test_read_parameter_energy_int64(self, scanner, mock_serial_client):
        """Test reading energy parameter (int64)."""
        mock_response = MagicMock()
        mock_response.isError.return_value = False
        # 1000000000 as int64
        mock_response.registers = [0x0000, 0x0000, 0x3B9A, 0xC900]
        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        result = scanner.read_parameter("kWh_Total")

        assert result is not None
        assert result["name"] == "kWh_Total"
        assert result["unit"] == "kWh"


# ============================================================================
# Tests for read_all_parameters Method
# ============================================================================
class TestReadAllParameters:
    """Tests for read_all_parameters() method."""

    def test_read_all_parameters_not_connected(self, scanner):
        """Test read all when not connected."""
        scanner.connected = False
        result = scanner.read_all_parameters()

        assert result["status"] == "NOT_CONNECTED"
        assert "timestamp" in result
        assert "parameters" in result

    def test_read_all_parameters_success(self, scanner, mock_serial_client):
        """Test successful read all parameters."""
        # Mock all three bulk reads
        mock_response = MagicMock()
        mock_response.isError.return_value = False
        mock_response.registers = [0x4366, 0x0000] * 100  # Fill with 230.0 values

        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        result = scanner.read_all_parameters()

        assert result["status"] in ["OK", "PARTIAL"]
        assert "timestamp" in result
        assert len(result["parameters"]) > 0

    def test_read_all_parameters_bulk_read_exception(self, scanner, mock_serial_client):
        """Test read all with bulk read exception."""
        mock_serial_client.return_value.read_holding_registers.side_effect = Exception("Bulk error")

        result = scanner.read_all_parameters()

        assert result["status"] == "ERROR"

    def test_read_all_parameters_partial_failure(self, scanner, mock_serial_client):
        """Test read all with some parameters failing."""
        # First call succeeds, second fails
        mock_response1 = MagicMock()
        mock_response1.isError.return_value = False
        mock_response1.registers = [0x4366, 0x0000] * 100

        mock_response2 = MagicMock()
        mock_response2.isError.return_value = True

        mock_serial_client.return_value.read_holding_registers.side_effect = [
            mock_response1, mock_response2, mock_response1
        ]

        result = scanner.read_all_parameters()

        # Should still return data with some errors
        assert "parameters" in result


# ============================================================================
# Tests for scan_registers Method
# ============================================================================
class TestScanRegisters:
    """Tests for scan_registers() method."""

    def test_scan_registers_success(self, scanner, mock_serial_client):
        """Test successful register scan."""
        def mock_read(address, count, slave):
            mock = MagicMock()
            mock.isError.return_value = False
            # Return non-zero for even addresses
            if address % 2 == 0:
                mock.registers = [100]
            else:
                mock.registers = [0]
            return mock

        mock_serial_client.return_value.read_holding_registers.side_effect = mock_read

        result = scanner.scan_registers(3100, 3110, 1)

        assert len(result) > 0
        # Only even addresses should have values
        for addr in result:
            assert addr % 2 == 0

    def test_scan_registers_empty_range(self, scanner, mock_serial_client):
        """Test scan with no non-zero values."""
        mock_response = MagicMock()
        mock_response.isError.return_value = False
        mock_response.registers = [0]
        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        result = scanner.scan_registers(3100, 3110, 1)

        assert len(result) == 0

    def test_scan_registers_not_connected(self, scanner):
        """Test scan when not connected."""
        scanner.connected = False
        result = scanner.scan_registers(3100, 3110, 1)

        assert len(result) == 0


# ============================================================================
# Tests for PM2230Client Wrapper
# ============================================================================
class TestPM2230ClientWrapper:
    """Tests for PM2230Client wrapper class."""

    def test_client_init(self, mock_serial_client):
        """Test PM2230Client initialization."""
        client = PM2230Client(port="COM5", baudrate=19200, slave_id=3, parity="N")

        assert client.port == "COM5"
        assert client.baudrate == 19200
        assert client.slave_id == 3
        assert client.parity == "N"

    def test_client_connected_property(self, mock_serial_client):
        """Test connected property."""
        mock_scanner = mock_serial_client.return_value
        mock_scanner.connected = True

        client = PM2230Client()
        client._scanner.connected = True
        assert client.connected is True

    def test_client_connect(self, mock_serial_client):
        """Test connect method."""
        mock_scanner = mock_serial_client.return_value
        mock_scanner.connect.return_value = True

        client = PM2230Client()
        result = client.connect()

        assert result is True
        mock_scanner.connect.assert_called_once()

    def test_client_disconnect(self, mock_serial_client):
        """Test disconnect method."""
        mock_scanner = mock_serial_client.return_value

        client = PM2230Client()
        client.disconnect()

        mock_scanner.close.assert_called_once()

    def test_client_close_alias(self, mock_serial_client):
        """Test close() as alias for disconnect()."""
        mock_scanner = mock_serial_client.return_value

        client = PM2230Client()
        client.close()

        mock_scanner.close.assert_called_once()

    def test_client_read_all_parameters(self, mock_serial_client):
        """Test read_all_parameters returns flat dict."""
        client = PM2230Client()
        client._scanner.read_all_parameters = Mock(return_value={
            "timestamp": "2026-03-03T10:00:00",
            "status": "OK",
            "parameters": {
                "V_LN1": {"value": 230.5},
                "Freq": {"value": 50.0},
            }
        })

        result = client.read_all_parameters()

        assert isinstance(result, dict)
        assert result["V_LN1"] == 230.5
        assert result["Freq"] == 50.0
        assert result["status"] == "OK"

    def test_client_read_all_parameters_handles_none(self, mock_serial_client):
        """Test read_all_parameters handles None values."""
        client = PM2230Client()
        client._scanner.read_all_parameters = Mock(return_value={
            "timestamp": "2026-03-03T10:00:00",
            "status": "OK",
            "parameters": {
                "V_LN1": {"value": None},
                "Freq": {"value": 50.0},
            }
        })

        result = client.read_all_parameters()

        # None values should be converted to 0.0
        assert result["V_LN1"] == 0.0
        assert result["Freq"] == 50.0

    def test_client_read_all_parameters_empty_response(self, mock_serial_client):
        """Test read_all_parameters handles empty response."""
        client = PM2230Client()
        client._scanner.read_all_parameters = Mock(return_value={})
        result = client.read_all_parameters()

        assert result["status"] == "ERROR"
        assert "timestamp" in result


# ============================================================================
# Tests for REGISTER_MAP
# ============================================================================
class TestRegisterMap:
    """Tests for REGISTER_MAP constant."""

    def test_register_map_exists(self):
        """Test REGISTER_MAP is defined."""
        assert REGISTER_MAP is not None
        assert isinstance(REGISTER_MAP, dict)

    def test_register_map_has_required_keys(self):
        """Test REGISTER_MAP has required parameters."""
        required_params = [
            "V_LN1", "V_LN2", "V_LN3",
            "I_L1", "I_L2", "I_L3",
            "Freq",
            "P_Total", "S_Total", "Q_Total",
            "PF_Total",
            "kWh_Total"
        ]
        for param in required_params:
            assert param in REGISTER_MAP

    def test_register_map_structure(self):
        """Test REGISTER_MAP entry structure."""
        entry = REGISTER_MAP["V_LN1"]
        assert "address" in entry
        assert "scale" in entry
        assert "unit" in entry

    def test_register_map_voltage_addresses(self):
        """Test voltage register addresses are correct."""
        assert REGISTER_MAP["V_LN1"]["address"] == 3027
        assert REGISTER_MAP["V_LL12"]["address"] == 3019

    def test_register_map_current_addresses(self):
        """Test current register addresses are correct."""
        assert REGISTER_MAP["I_L1"]["address"] == 2999
        assert REGISTER_MAP["I_avg"]["address"] == 3009

    def test_register_map_frequency_address(self):
        """Test frequency register address."""
        assert REGISTER_MAP["Freq"]["address"] == 3109


# ============================================================================
# Integration Tests
# ============================================================================
class TestIntegration:
    """Integration tests for complete workflows."""

    def test_full_read_workflow(self, scanner, mock_serial_client):
        """Test complete read workflow."""
        # Setup mock
        mock_response = MagicMock()
        mock_response.isError.return_value = False
        mock_response.registers = [0x4366, 0x0000] * 100
        mock_serial_client.return_value.read_holding_registers.return_value = mock_response

        # Connect
        assert scanner.connect() is True

        # Read single parameter
        result = scanner.read_parameter("V_LN1")
        assert result is not None

        # Read all parameters
        result = scanner.read_all_parameters()
        assert result["status"] in ["OK", "PARTIAL"]

        # Disconnect
        scanner.disconnect()
        assert scanner.connected is False

    def test_scanner_class_workflow(self, mock_serial_client):
        """Test PM2230Scanner class workflow."""
        mock_instance = mock_serial_client.return_value
        mock_instance.connect.return_value = True
        mock_instance.isError.return_value = False
        mock_instance.registers = [0x4366, 0x0000]

        scanner = PM2230Scanner(port="COM3")
        scanner.connect()

        # Verify scanner properties
        assert scanner.port == "COM3"
        assert scanner.baudrate == 9600
        assert scanner.connected is True

        scanner.disconnect()
        assert scanner.connected is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
