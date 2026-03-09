from fastapi import APIRouter, Request, HTTPException
import logging
import copy
from typing import Dict, Any

from core import state
from core.models import (
    ParameterData,
    DashboardPage1,
    DashboardPage2,
    DashboardPage3,
    DashboardPage4
)
from core.security import rate_limit
from services.modbus_service import get_latest_data

router = APIRouter(prefix="/api/v1")
logger = logging.getLogger("PM2230_API")

@router.get("/data", response_model=ParameterData)
@rate_limit
async def get_all_data(request: Request):
    try:
        data = get_latest_data()
        return data
    except Exception as e:
        logger.error(f"Error in get_all_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/page1", response_model=DashboardPage1)
@rate_limit
async def get_page1(request: Request):
    try:
        data = get_latest_data()
        return {
            'timestamp': data['timestamp'],
            'status': data['status'],
            'V_LN1': data['V_LN1'],
            'V_LN2': data['V_LN2'],
            'V_LN3': data['V_LN3'],
            'V_LN_avg': data.get('V_LN_avg', 0),
            'V_LL12': data.get('V_LL12', 0),
            'V_LL23': data.get('V_LL23', 0),
            'V_LL31': data.get('V_LL31', 0),
            'V_LL_avg': data.get('V_LL_avg', 0),
            'I_L1': data['I_L1'],
            'I_L2': data['I_L2'],
            'I_L3': data['I_L3'],
            'I_N': data['I_N'],
            'I_avg': data.get('I_avg', 0),
            'Freq': data['Freq']
        }
    except Exception as e:
        logger.error(f"Error in get_page1: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/page2", response_model=DashboardPage2)
@rate_limit
async def get_page2(request: Request):
    try:
        data = get_latest_data()
        return {
            'timestamp': data['timestamp'],
            'status': data['status'],
            'P_L1': data.get('P_L1', 0),
            'P_L2': data.get('P_L2', 0),
            'P_L3': data.get('P_L3', 0),
            'P_Total': data.get('P_Total', 0),
            'S_L1': data.get('S_L1', 0),
            'S_L2': data.get('S_L2', 0),
            'S_L3': data.get('S_L3', 0),
            'S_Total': data.get('S_Total', 0),
            'Q_L1': data.get('Q_L1', 0),
            'Q_L2': data.get('Q_L2', 0),
            'Q_L3': data.get('Q_L3', 0),
            'Q_Total': data.get('Q_Total', 0)
        }
    except Exception as e:
        logger.error(f"Error in get_page2: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/page3", response_model=DashboardPage3)
@rate_limit
async def get_page3(request: Request):
    try:
        data = get_latest_data()
        return {
            'timestamp': data['timestamp'],
            'status': data['status'],
            'THDv_L1': data.get('THDv_L1', 0),
            'THDv_L2': data.get('THDv_L2', 0),
            'THDv_L3': data.get('THDv_L3', 0),
            'THDi_L1': data.get('THDi_L1', 0),
            'THDi_L2': data.get('THDi_L2', 0),
            'THDi_L3': data.get('THDi_L3', 0),
            'V_unb': data.get('V_unb', 0),
            'U_unb': data.get('U_unb', 0),
            'I_unb': data.get('I_unb', 0),
            'PF_L1': data.get('PF_L1', 0),
            'PF_L2': data.get('PF_L2', 0),
            'PF_L3': data.get('PF_L3', 0),
            'PF_Total': data.get('PF_Total', 0),
            'PF_L1_type': data.get('PF_L1_type', 'Lag'),
            'PF_L2_type': data.get('PF_L2_type', 'Lag'),
            'PF_L3_type': data.get('PF_L3_type', 'Lag'),
            'PF_Total_type': data.get('PF_Total_type', 'Lag'),
        }
    except Exception as e:
        logger.error(f"Error in get_page3: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/page4", response_model=DashboardPage4)
@rate_limit
async def get_page4(request: Request):
    try:
        data = get_latest_data()
        return {
            'timestamp': data['timestamp'],
            'status': data['status'],
            'kWh_Total': data.get('kWh_Total', 0),
            'kVAh_Total': data.get('kVAh_Total', 0),
            'kvarh_Total': data.get('kvarh_Total', 0),
            'PF_Total': data.get('PF_Total', 0)
        }
    except Exception as e:
        logger.error(f"Error in get_page4: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/parameters")
@rate_limit
async def get_parameters_list(request: Request):
    from pm2230_client import REGISTER_MAP
    params = []
    for i, (name, info) in enumerate(REGISTER_MAP.items(), 1):
        params.append({
            'no': i,
            'name': name,
            'address': hex(info['address']),
            'scale': info['scale'],
            'unit': info['unit']
        })
    return {'total': len(params), 'parameters': params}

@router.get("/alerts")
@rate_limit
async def get_alerts(request: Request):
    try:
        async with state.alerts_lock:
            return copy.deepcopy(state.current_alerts) if state.current_alerts else {"status": "OK", "alerts": []}
    except Exception as e:
        logger.error(f"Error in get_alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/snapshot")
@rate_limit
async def get_snapshot(request: Request):
    """
    Return page1 + page2 + page3 + page4 + systemStatus + alerts in a single
    round-trip so the frontend can drop from 6 parallel requests to 1.
    Updated at fast-track cadence (~300ms on the backend).
    """
    try:
        from datetime import datetime as _dt
        import os
        data = get_latest_data()
        async with state.alerts_lock:
            alerts = copy.deepcopy(state.current_alerts) if state.current_alerts else {"status": "OK", "alerts": []}

        size_bytes = 0
        if os.path.exists(state.log_filename):
            size_bytes = os.path.getsize(state.log_filename)
        
        fault_record_count = 0
        if os.path.exists(state.fault_log_filename):
            try:
                with open(state.fault_log_filename, 'r', encoding='utf-8') as f:
                    fault_record_count = max(0, sum(1 for line in f) - 1)
            except Exception as e:
                logger.error(f"Error reading fault log line count: {e}")

        return {
            "timestamp": data.get("timestamp", _dt.now().isoformat()),
            "page1": {
                "timestamp":  data.get("timestamp"),
                "status":     data.get("status"),
                "V_LN1":      data.get("V_LN1", 0),
                "V_LN2":      data.get("V_LN2", 0),
                "V_LN3":      data.get("V_LN3", 0),
                "V_LN_avg":   data.get("V_LN_avg", 0),
                "V_LL12":     data.get("V_LL12", 0),
                "V_LL23":     data.get("V_LL23", 0),
                "V_LL31":     data.get("V_LL31", 0),
                "V_LL_avg":   data.get("V_LL_avg", 0),
                "I_L1":       data.get("I_L1", 0),
                "I_L2":       data.get("I_L2", 0),
                "I_L3":       data.get("I_L3", 0),
                "I_N":        data.get("I_N", 0),
                "I_avg":      data.get("I_avg", 0),
                "Freq":       data.get("Freq", 0),
            },
            "page2": {
                "timestamp":  data.get("timestamp"),
                "status":     data.get("status"),
                "P_L1":       data.get("P_L1", 0),
                "P_L2":       data.get("P_L2", 0),
                "P_L3":       data.get("P_L3", 0),
                "P_Total":    data.get("P_Total", 0),
                "S_L1":       data.get("S_L1", 0),
                "S_L2":       data.get("S_L2", 0),
                "S_L3":       data.get("S_L3", 0),
                "S_Total":    data.get("S_Total", 0),
                "Q_L1":       data.get("Q_L1", 0),
                "Q_L2":       data.get("Q_L2", 0),
                "Q_L3":       data.get("Q_L3", 0),
                "Q_Total":    data.get("Q_Total", 0),
            },
            "page3": {
                "timestamp":  data.get("timestamp"),
                "status":     data.get("status"),
                "THDv_L1":    data.get("THDv_L1", 0),
                "THDv_L2":    data.get("THDv_L2", 0),
                "THDv_L3":    data.get("THDv_L3", 0),
                "THDi_L1":    data.get("THDi_L1", 0),
                "THDi_L2":    data.get("THDi_L2", 0),
                "THDi_L3":    data.get("THDi_L3", 0),
                "V_unb":      data.get("V_unb", 0),
                "U_unb":      data.get("U_unb", 0),
                "I_unb":      data.get("I_unb", 0),
                "PF_L1":      data.get("PF_L1", 0),
                "PF_L2":      data.get("PF_L2", 0),
                "PF_L3":      data.get("PF_L3", 0),
                "PF_Total":   data.get("PF_Total", 0),
                "PF_L1_type": data.get("PF_L1_type", "Lag"),
                "PF_L2_type": data.get("PF_L2_type", "Lag"),
                "PF_L3_type": data.get("PF_L3_type", "Lag"),
                "PF_Total_type": data.get("PF_Total_type", "Lag"),
            },
            "page4": {
                "timestamp":  data.get("timestamp"),
                "status":     data.get("status"),
                "kWh_Total":  data.get("kWh_Total", 0),
                "kVAh_Total": data.get("kVAh_Total", 0),
                "kvarh_Total":data.get("kvarh_Total", 0),
                "PF_Total":   data.get("PF_Total", 0),
            },
            "alerts": alerts,
            "systemStatus": {
                "connected":      state.real_client is not None and state.real_client.connected,
                "mode":           "simulate" if state.SIMULATE_MODE else "real",
                "simulate_mode":  state.SIMULATE_MODE,
                "status":         data.get("status", "NOT_CONNECTED"),
                "port":           state.real_client.port if state.real_client else None,
            },
            "logStatus": {
                "isLogging": state.is_logging,
                "logSizeKb": round(size_bytes / 1024, 2),
                "faultRecordCount": fault_record_count
            },
            "simulatorStatus": {
                "is_simulating": state.SIMULATE_MODE,
                "state": state.simulator_state
            }
        }
    except Exception as e:
        logger.error(f"Error in get_snapshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

