import re

file_path = "app/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add recharts imports
import_statement = "import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';\n"
content = re.sub(r'import { useEffect, useState } from \'react\';', f'import {{ useEffect, useState }} from \'react\';\n{import_statement}', content)

# 2. Add chart sub-components logic before default export
chart_components = """
// Chart Sub-components
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const time = new Date(label).toLocaleTimeString('th-TH');
    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
        <p className="text-gray-300 text-xs mb-2 whitespace-nowrap">{time}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4 text-sm font-medium">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white">{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

"""
content = re.sub(r'const HISTORY_SIZE = 60;', chart_components + 'const HISTORY_SIZE = 60;', content)

# 3. Add viewMode state to Home component
content = re.sub(r'const \[history, setHistory\] = useState<HistoryPoint\[\]>\(\[\]\);',
                 'const [history, setHistory] = useState<HistoryPoint[]>([]);\n  const [viewMode1, setViewMode1] = useState<\'cards\' | \'charts\'>(\'cards\');\n  const [viewMode2, setViewMode2] = useState<\'cards\' | \'charts\'>(\'cards\');', content)

# 4. Update Page1Content parameters and pass history
content = re.sub(r'<Page1Content data=\{page1\} />', r'<Page1Content data={page1} history={history} viewMode={viewMode1} setViewMode={setViewMode1} />', content)

# 5. Update Page2Content parameters
content = re.sub(r'<Page2Content data=\{page2\} />', r'<Page2Content data={page2} history={history} viewMode={viewMode2} setViewMode={setViewMode2} />', content)


# 6. Re-write Page1Content definition
page1_def = """function Page1Content({ data, history, viewMode, setViewMode }: { data: Page1Data; history: HistoryPoint[]; viewMode: 'cards'|'charts'; setViewMode: (mode: 'cards'|'charts') => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">📊 ภาพรวมและพารามิเตอร์พื้นฐาน</h2>
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button onClick={() => setViewMode('cards')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Cards</button>
          <button onClick={() => setViewMode('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'charts' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Charts</button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Voltage */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">🔌 แรงดันไฟฟ้า (Voltage)</h3>
            <div className="space-y-2">
              <VoltageRow label="V_LN1" value={data.V_LN1} unit="V" />
              <VoltageRow label="V_LN2" value={data.V_LN2} unit="V" />
              <VoltageRow label="V_LN3" value={data.V_LN3} unit="V" />
              <div className="border-t border-gray-600 pt-1 mt-1 mb-2">
                <VoltageRow label="V_LN_avg" value={data.V_LN_avg} unit="V" />
              </div>
              <VoltageRow label="V_LL12" value={data.V_LL12} unit="V" />
              <VoltageRow label="V_LL23" value={data.V_LL23} unit="V" />
              <VoltageRow label="V_LL31" value={data.V_LL31} unit="V" />
              <div className="border-t border-gray-600 pt-1 mt-1">
                <VoltageRow label="V_LL_avg" value={data.V_LL_avg} unit="V" />
              </div>
            </div>
          </div>

          {/* Current */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">⚡ กระแสไฟฟ้า (Current)</h3>
            <div className="space-y-3">
              <CurrentRow label="I_L1" value={data.I_L1} unit="A" />
              <CurrentRow label="I_L2" value={data.I_L2} unit="A" />
              <CurrentRow label="I_L3" value={data.I_L3} unit="A" />
              <CurrentRow label="I_N" value={data.I_N} unit="A" />
              <div className="border-t border-gray-600 pt-2 mt-2">
                <CurrentRow label="I_avg" value={data.I_avg} unit="A" />
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">📊 ความถี่ (Frequency)</h3>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-400">{data.Freq.toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-2">Hz</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 กราฟแนวโน้มแรงดันเฉลี่ย (V_LN_avg)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#9ca3af" tickFormatter={() => ''} tick={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(0)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" name="Voltage Avg" dataKey="voltageAvg" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
           </div>
           
           <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 กราฟแนวโน้มกระแสเฉลี่ย (I_avg)</h3>
             <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#9ca3af" tickFormatter={() => ''} tick={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(2)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" name="Current Avg" dataKey="currentAvg" stroke="#f472b6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
           </div>
        </div>
      )}
    </div>
  );
}"""
content = re.sub(
    r'function Page1Content\(\{ data \}: \{ data: Page1Data \}\) \{\s+return \(\s+<div className="space-y-6">\s+<h2.*?<p className="text-gray-400 text-sm mt-2">Hz</p>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+\);\s+\}',
    page1_def,
    content,
    flags=re.DOTALL
)


# 7. Re-write Page2Content definition
page2_def = """function Page2Content({ data, history, viewMode, setViewMode }: { data: Page2Data; history: HistoryPoint[]; viewMode: 'cards'|'charts'; setViewMode: (mode: 'cards'|'charts') => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">⚡ กำลังไฟฟ้า (Power)</h2>
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button onClick={() => setViewMode('cards')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Cards</button>
          <button onClick={() => setViewMode('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'charts' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Charts</button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Power */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">💡 กำลังไฟฟ้าจริง (Active Power)</h3>
            <div className="space-y-3">
              <PowerRow label="P_L1" value={data.P_L1} unit="kW" />
              <PowerRow label="P_L2" value={data.P_L2} unit="kW" />
              <PowerRow label="P_L3" value={data.P_L3} unit="kW" />
              <div className="border-t border-gray-700 pt-3 mt-3">
                <PowerRow label="P_Total" value={data.P_Total} unit="kW" bold />
              </div>
            </div>
          </div>

          {/* Apparent Power */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">📈 กำลังไฟฟ้าปรากฏ (Apparent Power)</h3>
            <div className="space-y-3">
              <PowerRow label="S_L1" value={data.S_L1} unit="kVA" />
              <PowerRow label="S_L2" value={data.S_L2} unit="kVA" />
              <PowerRow label="S_L3" value={data.S_L3} unit="kVA" />
              <div className="border-t border-gray-700 pt-3 mt-3">
                <PowerRow label="S_Total" value={data.S_Total} unit="kVA" bold />
              </div>
            </div>
          </div>

          {/* Reactive Power */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">⚡ กำลังไฟฟ้ารีแอคตีฟ (Reactive Power)</h3>
            <div className="space-y-3">
              <PowerRow label="Q_L1" value={data.Q_L1} unit="kvar" />
              <PowerRow label="Q_L2" value={data.Q_L2} unit="kvar" />
              <PowerRow label="Q_L3" value={data.Q_L3} unit="kvar" />
              <div className="border-t border-gray-700 pt-3 mt-3">
                <PowerRow label="Q_Total" value={data.Q_Total} unit="kvar" bold />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 lg:col-span-2">
            <h3 className="text-gray-200 font-medium mb-4">📈 กราฟแนวโน้มกำลังไฟฟ้ารวม (Total Power)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#9ca3af" tickFormatter={() => ''} tick={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(2)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" name="Power Total (kW)" dataKey="powerTotal" stroke="#a78bfa" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

content = re.sub(
    r'function Page2Content\(\{ data \}: \{ data: Page2Data \}\) \{\s+return \(\s+<div className="space-y-6">\s+<h2.*?<PowerRow label="Q_Total" value=\{data\.Q_Total\} unit="kvar" bold />\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+\);\s+\}',
    page2_def,
    content,
    flags=re.DOTALL
)

with open(file_path, "w") as f:
    f.write(content)

