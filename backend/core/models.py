from pydantic import BaseModel, Field

class ParameterData(BaseModel):
    timestamp: str
    status: str
    V_LN1: float
    V_LN2: float
    V_LN3: float
    V_LN_avg: float = 0.0
    V_LL12: float = 0.0
    V_LL23: float = 0.0
    V_LL31: float = 0.0
    V_LL_avg: float = 0.0
    # Current
    I_L1: float
    I_L2: float
    I_L3: float
    I_N: float
    I_avg: float = 0.0
    # Frequency
    Freq: float
    # Active Power
    P_L1: float
    P_L2: float
    P_L3: float
    P_Total: float
    # Apparent Power
    S_L1: float
    S_L2: float
    S_L3: float
    S_Total: float
    # Reactive Power
    Q_L1: float
    Q_L2: float
    Q_L3: float
    Q_Total: float
    # THD Voltage
    THDv_L1: float
    THDv_L2: float
    THDv_L3: float
    # THD Current
    THDi_L1: float
    THDi_L2: float
    THDi_L3: float
    # Unbalance
    V_unb: float
    I_unb: float
    # Power Factor
    PF_L1: float
    PF_L2: float
    PF_L3: float
    PF_Total: float
    # Energy
    kWh_Total: float
    kVAh_Total: float
    kvarh_Total: float

class DashboardPage1(BaseModel):
    """Page 1: Overview & Basic"""
    timestamp: str
    status: str
    V_LN1: float
    V_LN2: float
    V_LN3: float
    V_LN_avg: float = 0.0
    V_LL12: float = 0.0
    V_LL23: float = 0.0
    V_LL31: float = 0.0
    V_LL_avg: float = 0.0
    I_L1: float
    I_L2: float
    I_L3: float
    I_N: float
    I_avg: float = 0.0
    Freq: float

class DashboardPage2(BaseModel):
    """Page 2: Power"""
    timestamp: str
    status: str
    P_L1: float
    P_L2: float
    P_L3: float
    P_Total: float
    S_L1: float
    S_L2: float
    S_L3: float
    S_Total: float
    Q_L1: float
    Q_L2: float
    Q_L3: float
    Q_Total: float

class DashboardPage3(BaseModel):
    """Page 3: Power Quality"""
    timestamp: str
    status: str
    THDv_L1: float
    THDv_L2: float
    THDv_L3: float
    THDi_L1: float
    THDi_L2: float
    THDi_L3: float
    V_unb: float
    U_unb: float
    I_unb: float
    PF_L1: float
    PF_L2: float
    PF_L3: float
    PF_Total: float

class DashboardPage4(BaseModel):
    """Page 4: Energy"""
    timestamp: str
    status: str
    kWh_Total: float
    kVAh_Total: float
    kvarh_Total: float
    PF_Total: float

class ConnectRequest(BaseModel):
    port: str = Field(..., min_length=1, max_length=50, description="Serial port name")
    baudrate: int = Field(..., description="Baudrate, usually 9600")
    slave_id: int = Field(..., ge=1, le=247, description="Modbus slave ID")
    parity: str = Field(..., pattern="^[ENO]$", description="Parity: E (Even), N (None), O (Odd)")

class AutoConnectRequest(BaseModel):
    pass
