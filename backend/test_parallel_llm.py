#!/usr/bin/env python3
"""
Test script สำหรับ Parallel LLM Mode
รัน: python test_parallel_llm.py
"""

import asyncio
import sys
import time
from ai_analyzer import (
    generate_power_summary,
    generate_power_summary_parallel,
    _get_or_init_parallel_router
)

# Sample PM2230 data
TEST_DATA = {
    "timestamp": "2026-03-06T10:30:00",
    "status": "OK",
    "is_aggregated": True,
    "samples_count": 6,
    "V_LN1": 230.5,
    "V_LN2": 229.8,
    "V_LN3": 231.2,
    "V_LN_avg": 230.5,
    "V_LL12": 399.2,
    "V_LL23": 398.5,
    "V_LL31": 400.1,
    "V_LL_avg": 399.3,
    "I_L1": 12.5,
    "I_L2": 11.8,
    "I_L3": 12.2,
    "I_N": 0.5,
    "I_avg": 12.17,
    "Freq": 50.02,
    "P_L1": 2.85,
    "P_L2": 2.72,
    "P_L3": 2.81,
    "P_Total": 8.38,
    "S_L1": 2.88,
    "S_L2": 2.71,
    "S_L3": 2.82,
    "S_Total": 8.41,
    "Q_L1": 0.42,
    "Q_L2": 0.38,
    "Q_L3": 0.40,
    "Q_Total": 1.20,
    "THDv_L1": 2.1,
    "THDv_L2": 2.3,
    "THDv_L3": 2.0,
    "THDi_L1": 5.5,
    "THDi_L2": 5.8,
    "THDi_L3": 5.6,
    "V_unb": 0.8,
    "U_unb": 0.7,
    "I_unb": 2.1,
    "PF_L1": 0.95,
    "PF_L2": 0.96,
    "PF_L3": 0.95,
    "PF_Total": 0.95,
    "kWh_Total": 15243.5,
    "kVAh_Total": 16042.2,
    "kvarh_Total": 5241.8
}


async def test_sequential():
    """ทดสอบ Sequential Mode (แบบเดิม)"""
    print("\n" + "="*70)
    print("🔄 TEST 1: Sequential Mode (Mistral → DashScope)")
    print("="*70)
    
    start_time = time.time()
    result = await generate_power_summary(TEST_DATA)
    elapsed = time.time() - start_time
    
    print(f"\n⏱️  Time: {elapsed:.2f} seconds")
    print(f"📦 Cached: {result.get('is_cached', False)}")
    print(f"🔑 Cache Key: {result.get('cache_key', 'N/A')}")
    print(f"📝 Summary preview (first 500 chars):\n{result['summary'][:500]}...")
    
    return elapsed


async def test_parallel():
    """ทดสอบ Parallel Mode (ใหม่)"""
    print("\n" + "="*70)
    print("⚡ TEST 2: Parallel Mode (Mistral + DashScope พร้อมกัน)")
    print("="*70)
    
    # Check if parallel mode is available
    router = _get_or_init_parallel_router()
    if not router or len(router.providers) < 2:
        print("\n❌ Parallel mode not available (need at least 2 providers)")
        print("   Please check your API keys in .env file")
        return None
    
    print(f"\n✅ Available providers: {list(router.providers.keys())}")
    
    strategies = ["quality", "fastest", "ensemble"]
    results = {}
    
    for strategy in strategies:
        print(f"\n--- Testing strategy: '{strategy}' ---")
        
        start_time = time.time()
        result = await generate_power_summary_parallel(
            TEST_DATA,
            selection_strategy=strategy
        )
        elapsed = time.time() - start_time
        
        results[strategy] = {
            "time": elapsed,
            "provider": result.get("provider", "unknown"),
            "quality_score": result.get("quality_score", 0),
            "providers_compared": result.get("providers_compared", 0)
        }
        
        print(f"⏱️  Time: {elapsed:.2f} seconds")
        print(f"🤖 Selected: {result.get('provider', 'unknown')}")
        print(f"⭐ Quality Score: {result.get('quality_score', 0):.1f}/100")
        print(f"📊 Providers Compared: {result.get('providers_compared', 0)}")
        
        if result.get("all_results"):
            print("📋 All Results:")
            for r in result["all_results"]:
                if r["success"]:
                    print(f"   - {r['provider']}: score={r.get('quality_score', 0):.1f}, time={r['latency']:.2f}s")
    
    return results


async def test_comparison():
    """เปรียบเทียบ Sequential vs Parallel"""
    print("\n" + "="*70)
    print("📊 TEST 3: Performance Comparison")
    print("="*70)
    
    # Sequential
    seq_times = []
    for i in range(2):  # รัน 2 ครั้ง (ครั้งแรก cold start)
        start = time.time()
        await generate_power_summary(TEST_DATA)
        seq_times.append(time.time() - start)
    
    seq_time = min(seq_times)  # เอาค่าที่เร็วที่สุด (หลัง cold start)
    
    # Parallel (quality strategy)
    router = _get_or_init_parallel_router()
    if router and len(router.providers) >= 2:
        start = time.time()
        result = await generate_power_summary_parallel(TEST_DATA, "quality")
        par_time = time.time() - start
        
        print(f"\n🔄 Sequential Mode: {seq_time:.2f}s")
        print(f"⚡ Parallel Mode: {par_time:.2f}s")
        print(f"\n📈 Speedup: {seq_time/par_time:.2f}x")
        print(f"   (Sequential ช้ากว่า {(seq_time-par_time):.2f} วินาที)")
        
        if result.get("all_results"):
            print("\n🏆 Provider Performance:")
            sorted_results = sorted(
                [r for r in result["all_results"] if r["success"]],
                key=lambda x: x["latency"]
            )
            for i, r in enumerate(sorted_results, 1):
                print(f"   {i}. {r['provider']}: {r['latency']:.2f}s (score: {r.get('quality_score', 0):.1f})")
    else:
        print("\n⚠️  Cannot compare: Parallel mode not available")


async def main():
    print("🚀 PM2000 Parallel LLM Test")
    print("="*70)
    print("\nThis test will compare Sequential vs Parallel AI generation modes.")
    print("Make sure you have both MISTRAL_API_KEY and DASHSCOPE_API_KEY set.")
    
    try:
        # Test 1: Sequential
        seq_time = await test_sequential()
        
        # Test 2: Parallel
        par_results = await test_parallel()
        
        # Test 3: Comparison
        await test_comparison()
        
        print("\n" + "="*70)
        print("✅ All tests completed!")
        print("="*70)
        
        print("\n💡 To use Parallel Mode in production:")
        print("   POST /api/v1/ai-summary-parallel?strategy=quality")
        print("\n   Strategies:")
        print("   - quality: เลือกคำตอบที่มีคุณภาพสูงสุด (แนะนำ)")
        print("   - fastest: เลือกตัวที่ตอบเร็วที่สุด")
        print("   - ensemble: รวมผลลัพธ์จากหลายตัว")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
