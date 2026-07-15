import React from "react";
import { SystemLog } from "../types";
import { Terminal, RefreshCw, Trash2 } from "lucide-react";

interface LogsPanelProps {
  logs: SystemLog[];
  onResetLogs: () => void;
  isLoading: boolean;
}

export default function LogsPanel({ logs, onResetLogs, isLoading }: LogsPanelProps) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-semibold text-slate-200">Terminal de Integração (Logs do Middleware)</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          <button 
            onClick={onResetLogs}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Resetar Banco e Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Body */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600">
            Aguardando novas mensagens de integração...
          </div>
        ) : (
          logs.map((log) => {
            let levelColor = "text-blue-400";
            let bgBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            
            if (log.level === "warn") {
              levelColor = "text-amber-400";
              bgBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            } else if (log.level === "error") {
              levelColor = "text-rose-400";
              bgBadge = "bg-rose-500/10 text-rose-400 border-rose-500/20";
            } else if (log.level === "success") {
              levelColor = "text-emerald-400";
              bgBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            }

            return (
              <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/50 p-1 rounded transition-colors border-l-2 border-transparent hover:border-slate-800">
                <span className="text-slate-500 shrink-0 select-none">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 border ${bgBadge}`}>
                  {log.category}
                </span>
                <span className={`font-semibold shrink-0 uppercase text-[10px] ${levelColor}`}>
                  [{log.level}]
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
