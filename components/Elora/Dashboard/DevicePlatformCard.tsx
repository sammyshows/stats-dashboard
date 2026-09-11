import { useState } from 'react'
import AnimatedNumber from '../AnimatedNumber'

interface DeviceData {
  users7d: number
  users30d: number
  devices: { model: string; users: number }[]
}

export default function DevicePlatformCard({ platform, data, color, icon }: {
  platform: string
  data: DeviceData
  color: string
  icon: string
}) {
  const [showAll, setShowAll] = useState(false)
  const max = Math.max(...data.devices.map((d) => d.users), 1)
  const visible = showAll ? data.devices : data.devices.slice(0, 5)

  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">{icon}</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">{platform}</h3>
          <p className="text-[0.65rem] text-slate-500">active users · devices</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Last 7 days</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white tabular-nums">
              <AnimatedNumber value={data.users7d} />
            </span>
          </div>
        </div>
        <div>
          <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Last 30 days</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white tabular-nums">
              <AnimatedNumber value={data.users30d} />
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Top devices</span>
          <span className="text-[0.6rem] text-slate-500">{data.devices.length} total</span>
        </div>
        {data.devices.length === 0 ? (
          <p className="text-xs text-slate-500">No device data recorded this period.</p>
        ) : (
          <div className="space-y-2.5">
            {visible.map((d) => (
              <div key={d.model}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-300 line-clamp-1">{d.model}</span>
                  <span className="text-xs text-slate-400 tabular-nums font-medium">{d.users.toLocaleString()}</span>
                </div>
                <div className="elora-bar-track h-1.5">
                  <div
                    className="elora-bar-fill"
                    style={{ width: `${(d.users / max) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {data.devices.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 text-[0.65rem] text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            {showAll ? 'Show less' : `See more (${data.devices.length - 5} more)`}
          </button>
        )}
      </div>
    </div>
  )
}