import asyncio
import os
import sys

# Change dir to backend to simulate environment
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from ai_analyzer import generate_power_summary

async def test_ai():
    data = {
        'timestamp': '2026-03-04T06:30:00Z',
        'status': 'OK',
        'is_aggregated': False,
        'samples_count': 1,
        'V_LN1': 220.0,
        'I_L1': 10.0,
        'P_Total': 2200.0,
        'Freq': 50.0
    }
    result = await generate_power_summary(data)
    print("Result:", result)

if __name__ == "__main__":
    asyncio.run(test_ai())
