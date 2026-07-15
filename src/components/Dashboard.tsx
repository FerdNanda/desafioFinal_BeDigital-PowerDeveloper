import React, { useState } from "react";
import { Container, DashboardStats } from "../types";
import { 
  Boxes, AlertTriangle, CheckCircle2, Percent, Search, Filter, 
  MapPin, Anchor, Truck, Clipboard, FileText, Compass, ChevronRight, HelpCircle
} from "lucide-react";

interface DashboardProps {
  containers: Container[];
  stats: DashboardStats;
  onRefresh: () => void;
  onTabChange: (tab: string) => void;
}

export default function Dashboard({ containers, stats, onRefresh, onTabChange }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  // Filter containers
  const filteredContainers = containers.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "todos" || 
                          (selectedStatus === "divergente" && c.isDivergent) ||
                          (selectedStatus === "sincronizado" && !c.isDivergent) ||
                          c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate container statuses for breakdown
  const statusCount = (status: string) => containers.filter(c => c.status === status).length;

  return (
    <div id="dashboard-view" className="space-y-6">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Containers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Contêineres Ativos</p>
            <h3 className="text-3xl font-bold text-white font-mono">{stats.totalContainers}</h3>
            <p className="text-slate-500 text-xs">Total sob monitoramento</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Active Divergences */}
        <div 
          onClick={() => onTabChange("resolver")}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all group"
        >
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Divergências Ativas</p>
            <h3 className={`text-3xl font-bold font-mono ${stats.divergentCount > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400"}`}>
              {stats.divergentCount}
            </h3>
            <p className="text-slate-500 text-xs group-hover:text-amber-400/80 transition-colors flex items-center gap-1">
              Resolver divergências <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className={`p-3 rounded-xl border transition-colors ${
            stats.divergentCount > 0 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/10" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Resolved Conflicts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Conflitos Resolvidos</p>
            <h3 className="text-3xl font-bold text-emerald-400 font-mono">{stats.resolvedCount}</h3>
            <p className="text-slate-500 text-xs">Aprovados pelo middleware</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Sync Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Índice de Sincronia</p>
            <h3 className="text-3xl font-bold text-white font-mono">{stats.syncRatio}%</h3>
            <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.syncRatio}%` }}
              ></div>
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/10">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Yard Map Simulation / Terminal Overview */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Status de Pátio e Logística de Contêineres
            </h3>
            <p className="text-slate-400 text-xs">Visão consolidada da localização atual de todos os contêineres.</p>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded bg-indigo-500"></span> No Porto
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded bg-blue-500"></span> Em Trânsito
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded bg-amber-500"></span> Retido
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded bg-emerald-500"></span> Liberado
            </span>
          </div>
        </div>

        {/* Map Grid Lanes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Lane 1: Porto */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-indigo-400" />
                No Porto
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                {statusCount("No Porto")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {containers.filter(c => c.status === "No Porto").map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedContainer(c)}
                  className={`p-2 rounded text-left border cursor-pointer transition-all ${
                    c.isDivergent 
                      ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500" 
                      : "bg-indigo-950/10 border-indigo-500/20 hover:border-indigo-500/50"
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-slate-300">{c.id}</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">{c.owner}</div>
                  {c.isDivergent && <div className="text-[8px] mt-1 text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded text-center font-semibold uppercase">Divergência</div>}
                </div>
              ))}
              {statusCount("No Porto") === 0 && (
                <span className="text-[11px] text-slate-600 italic col-span-2 text-center py-4">Pátio vazio</span>
              )}
            </div>
          </div>

          {/* Lane 2: Retido */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Retido (Alfandegário)
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                {statusCount("Retido")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {containers.filter(c => c.status === "Retido").map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedContainer(c)}
                  className={`p-2 rounded text-left border cursor-pointer transition-all ${
                    c.isDivergent 
                      ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500" 
                      : "bg-amber-950/10 border-amber-500/20 hover:border-amber-500/50"
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-slate-300">{c.id}</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">{c.owner}</div>
                  {c.isDivergent && <div className="text-[8px] mt-1 text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded text-center font-semibold uppercase">Divergência</div>}
                </div>
              ))}
              {statusCount("Retido") === 0 && (
                <span className="text-[11px] text-slate-600 italic col-span-2 text-center py-4">Nenhum contêiner retido</span>
              )}
            </div>
          </div>

          {/* Lane 3: Liberado */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Liberado / Desalfandegado
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                {statusCount("Liberado")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {containers.filter(c => c.status === "Liberado").map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedContainer(c)}
                  className={`p-2 rounded text-left border cursor-pointer transition-all ${
                    c.isDivergent 
                      ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500" 
                      : "bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/50"
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-slate-300">{c.id}</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">{c.owner}</div>
                  {c.isDivergent && <div className="text-[8px] mt-1 text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded text-center font-semibold uppercase">Divergência</div>}
                </div>
              ))}
              {statusCount("Liberado") === 0 && (
                <span className="text-[11px] text-slate-600 italic col-span-2 text-center py-4">Nenhum liberado pendente</span>
              )}
            </div>
          </div>

          {/* Lane 4: Trânsito / Entrega */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                Em Trânsito / Entrega
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                {statusCount("Em Trânsito") + statusCount("Entregue")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {containers.filter(c => c.status === "Em Trânsito" || c.status === "Entregue").map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedContainer(c)}
                  className={`p-2 rounded text-left border cursor-pointer transition-all ${
                    c.isDivergent 
                      ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500" 
                      : "bg-blue-950/10 border-blue-500/20 hover:border-blue-500/50"
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-slate-300">{c.id}</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">{c.owner}</div>
                  <div className="text-[8px] mt-1 text-slate-400 bg-slate-800 px-1 py-0.5 rounded text-center font-mono uppercase truncate">{c.status}</div>
                  {c.isDivergent && <div className="text-[8px] mt-1 text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded text-center font-semibold uppercase">Divergente</div>}
                </div>
              ))}
              {(statusCount("Em Trânsito") + statusCount("Entregue")) === 0 && (
                <span className="text-[11px] text-slate-600 italic col-span-2 text-center py-4">Nenhum caminhão na estrada</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Containers Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Filters and search header */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input 
              type="text"
              placeholder="Buscar por ID, armador ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <button 
              onClick={() => setSelectedStatus("todos")}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors shrink-0 ${
                selectedStatus === "todos" 
                  ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" 
                  : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800"
              }`}
            >
              Todos
            </button>
            <button 
              onClick={() => setSelectedStatus("divergente")}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors shrink-0 ${
                selectedStatus === "divergente" 
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30" 
                  : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800"
              }`}
            >
              Divergentes ({containers.filter(c => c.isDivergent).length})
            </button>
            <button 
              onClick={() => setSelectedStatus("sincronizado")}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors shrink-0 ${
                selectedStatus === "sincronizado" 
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                  : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800"
              }`}
            >
              Sincronizados ({containers.filter(c => !c.isDivergent).length})
            </button>
            {["No Porto", "Em Trânsito", "Retido", "Liberado", "Entregue"].map((st) => (
              <button 
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors shrink-0 ${
                  selectedStatus === st 
                    ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" 
                    : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="px-6 py-3 font-semibold">Identificação</th>
                <th className="px-6 py-3 font-semibold">Especificação</th>
                <th className="px-6 py-3 font-semibold">Status Consolidado</th>
                <th className="px-6 py-3 font-semibold">Localização Atual</th>
                <th className="px-6 py-3 font-semibold">Divergência</th>
                <th className="px-6 py-3 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredContainers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    Nenhum contêiner encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredContainers.map((container) => (
                  <tr 
                    key={container.id} 
                    className="hover:bg-slate-850/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        {container.id}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{container.owner}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div>{container.size} pés</div>
                      <div className="text-xs text-slate-500">{container.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        container.status === "No Porto" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                        container.status === "Em Trânsito" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        container.status === "Retido" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        container.status === "Liberado" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {container.status === "No Porto" && <Anchor className="w-3 h-3" />}
                        {container.status === "Em Trânsito" && <Truck className="w-3 h-3" />}
                        {container.status === "Retido" && <AlertTriangle className="w-3 h-3" />}
                        {container.status === "Liberado" && <CheckCircle2 className="w-3 h-3" />}
                        {container.status === "Entregue" && <CheckCircle2 className="w-3 h-3" />}
                        {container.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 flex items-center gap-1.5 text-xs sm:text-sm">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{container.location}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Última atualização: {new Date(container.lastSyncTime).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {container.isDivergent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          {Object.keys(container.divergences).join(", ")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Sincronizado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedContainer(container)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded transition-all"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal Component */}
      {selectedContainer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-slate-500">Detalhes do Contêiner</span>
                <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  {selectedContainer.id}
                  {selectedContainer.isDivergent && (
                    <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-sans font-semibold">
                      Divergência Ativa
                    </span>
                  )}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedContainer(null)}
                className="text-slate-400 hover:text-white font-sans text-xl p-1 hover:bg-slate-800 rounded transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Armador</span>
                  <p className="font-semibold text-slate-200">{selectedContainer.owner}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Tamanho</span>
                  <p className="font-semibold text-slate-200">{selectedContainer.size} pés</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Tipo</span>
                  <p className="font-semibold text-slate-200">{selectedContainer.type}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Sincronia</span>
                  <p className={`font-semibold ${selectedContainer.isDivergent ? "text-amber-400" : "text-emerald-400"}`}>
                    {selectedContainer.isDivergent ? "Conflito" : "Alinhado"}
                  </p>
                </div>
              </div>

              {/* Side-by-Side Sources comparisons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Legacy Source */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                  <div className="absolute top-3 right-3 text-[10px] text-slate-500 font-mono uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    SISTEMA LEGADO
                  </div>
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Dados Brutos Legado</h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-500 block">Status Registrado:</span>
                      <span className="font-semibold text-slate-200">{selectedContainer.legacyStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Localização:</span>
                      <span className="font-semibold text-slate-200">{selectedContainer.legacyLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Último Batimento API:</span>
                      <span className="font-mono text-slate-400">{new Date(selectedContainer.legacyLastUpdated).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Spreadsheet Source */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                  <div className="absolute top-3 right-3 text-[10px] text-slate-500 font-mono uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    PLANILHA LOCAL
                  </div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Entrada na Planilha</h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-500 block">Status na Planilha:</span>
                      <span className="font-semibold text-slate-200">{selectedContainer.spreadsheetStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Localização:</span>
                      <span className="font-semibold text-slate-200">{selectedContainer.spreadsheetLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Operador Responsável:</span>
                      <span className="font-semibold text-slate-200">{selectedContainer.spreadsheetOperator || "Não especificado"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Observação Operacional:</span>
                      <p className="text-slate-300 italic max-h-12 overflow-y-auto mt-0.5">
                        "{selectedContainer.spreadsheetNotes || "Sem notas."}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consolidated Outcome */}
              <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4" />
                  Estado de Verdade Atual na Torre (PostgreSQL Consolidado)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                  <div>
                    <span className="text-slate-500">Status Decidido:</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedContainer.status}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Localização Decidida:</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedContainer.location}</p>
                  </div>
                </div>
                <div className="mt-3.5 pt-3 border-t border-indigo-500/10 text-xs">
                  <span className="text-slate-500 block">Trilha de Auditoria (Histórico de Resolução):</span>
                  <p className="text-slate-300 mt-1">{selectedContainer.operatorNotes}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-between items-center">
              {selectedContainer.isDivergent ? (
                <button
                  onClick={() => {
                    setSelectedContainer(null);
                    onTabChange("resolver");
                  }}
                  className="bg-amber-500 text-slate-955 text-xs font-bold px-4 py-2 rounded hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  Ir para Tela de Resolução
                </button>
              ) : (
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Esta informação está 100% íntegra.
                </div>
              )}
              <button 
                onClick={() => setSelectedContainer(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-semibold rounded hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
