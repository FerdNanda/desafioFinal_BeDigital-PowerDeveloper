import React, { useState } from "react";
import { Container } from "../types";
import { 
  AlertTriangle, FileSpreadsheet, Server, ChevronRight, CheckCircle2,
  Lock, Settings, ShieldAlert, ArrowRight, UserCheck, HelpCircle
} from "lucide-react";

interface DivergenceResolverProps {
  containers: Container[];
  onResolve: (containerId: string, method: "legacy" | "spreadsheet" | "manual", manualData?: { status: string; location: string; notes: string }) => Promise<void>;
  isResolving: boolean;
}

export default function DivergenceResolver({ containers, onResolve, isResolving }: DivergenceResolverProps) {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  
  // Manual edit form state
  const [manualStatus, setManualStatus] = useState<string>("");
  const [manualLocation, setManualLocation] = useState<string>("");
  const [manualNotes, setManualNotes] = useState<string>("");

  const divergentContainers = containers.filter(c => c.isDivergent);

  const startManualResolution = (container: Container) => {
    setSelectedContainer(container);
    setManualStatus(container.legacyStatus);
    setManualLocation(container.spreadsheetLocation); // default merge hypothesis
    setManualNotes("Resolvido manualmente após averiguação física com o armador.");
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContainer) return;

    await onResolve(selectedContainer.id, "manual", {
      status: manualStatus,
      location: manualLocation,
      notes: manualNotes,
    });
    setSelectedContainer(null);
  };

  return (
    <div id="divergence-resolver-view" className="space-y-6">
      
      {/* Alert Header Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-lg shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Consiliação Pendente</h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Encontradas <strong>{divergentContainers.length} divergências ativas</strong> no ecossistema logístico. Decida o fluxo correto de cada informação para sincronizá-los.
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 shrink-0 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          Trilha Segura SSL & AuditLog Ativo
        </div>
      </div>

      {/* Main List of Divergences */}
      <div className="space-y-4">
        {divergentContainers.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl py-16 px-6 text-center space-y-3">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Excelente Trabalho!</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Todas as informações da Planilha de Colaboradores e do Sistema Legado estão 100% conciliadas no PostgreSQL central.
            </p>
          </div>
        ) : (
          divergentContainers.map((container) => (
            <div 
              key={container.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all space-y-4"
            >
              {/* Header Container ID & Details */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-mono font-bold px-2.5 py-1 rounded">
                    {container.owner}
                  </span>
                  <h4 className="font-mono font-bold text-white text-lg">{container.id}</h4>
                  <span className="text-xs text-slate-400 font-sans">({container.size} pés • {container.type})</span>
                </div>
                <div className="text-xs font-mono text-amber-400 bg-amber-400/5 border border-amber-400/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Divergência Detectada
                </div>
              </div>

              {/* Compare Sources Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Legacy Data Column */}
                <div className="bg-slate-950 p-4 rounded-lg border border-indigo-500/10 space-y-3 relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20">
                    <Server className="w-3 h-3" />
                    SISTEMA LEGADO ERP
                  </div>
                  <h5 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dados Ingeridos do Legado</h5>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500">Status Registrado:</span>
                      <span className={`font-semibold ${container.divergences.status ? "text-amber-400 bg-amber-500/10 px-1.5 rounded" : "text-slate-300"}`}>
                        {container.legacyStatus}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500">Localização:</span>
                      <span className={`font-semibold text-right ${container.divergences.location ? "text-amber-400 bg-amber-500/10 px-1.5 rounded" : "text-slate-300"}`}>
                        {container.legacyLocation}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>Último Sinal:</span>
                      <span className="font-mono">{new Date(container.legacyLastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Spreadsheet Data Column */}
                <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/10 space-y-3 relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20">
                    <FileSpreadsheet className="w-3 h-3" />
                    PLANILHA COLABORADOR
                  </div>
                  <h5 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Entrada Física na Planilha</h5>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500">Status Registrado:</span>
                      <span className={`font-semibold ${container.divergences.status ? "text-amber-400 bg-amber-500/10 px-1.5 rounded" : "text-slate-300"}`}>
                        {container.spreadsheetStatus}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500">Localização:</span>
                      <span className={`font-semibold text-right ${container.divergences.location ? "text-amber-400 bg-amber-500/10 px-1.5 rounded" : "text-slate-300"}`}>
                        {container.spreadsheetLocation}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>Atualizado por:</span>
                      <span className="font-semibold text-slate-400">{container.spreadsheetOperator || "Operador"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons to Resolve */}
              <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-indigo-400">Divergência em:</span> {Object.keys(container.divergences).join(", ")}
                  <p className="text-[10px] text-slate-500 mt-0.5">Clique em um dos botões para alinhar a informação e atualizar a outra fonte automaticamente.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isResolving}
                    onClick={() => onResolve(container.id, "legacy")}
                    className="flex-1 sm:flex-initial bg-slate-800 text-indigo-300 hover:bg-slate-700/80 hover:text-indigo-200 border border-indigo-500/20 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Server className="w-3.5 h-3.5" />
                    Adotar Legado
                  </button>
                  <button
                    disabled={isResolving}
                    onClick={() => onResolve(container.id, "spreadsheet")}
                    className="flex-1 sm:flex-initial bg-slate-800 text-emerald-300 hover:bg-slate-700/80 hover:text-emerald-200 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Adotar Planilha
                  </button>
                  <button
                    disabled={isResolving}
                    onClick={() => startManualResolution(container)}
                    className="flex-1 sm:flex-initial bg-indigo-600 text-white hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Fusão Manual
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Resolution Form Modal Drawer */}
      {selectedContainer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-slate-500">Fusão Manual & Arbitragem</span>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  Resolvendo {selectedContainer.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedContainer(null)}
                className="text-slate-400 hover:text-white text-xl p-1 hover:bg-slate-800 rounded transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div className="text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold">Valores Conflitantes originais:</span>
                <p className="text-slate-500">Legado: <span className="text-indigo-400 font-mono font-medium">{selectedContainer.legacyStatus}</span> em <span className="text-indigo-400">{selectedContainer.legacyLocation}</span></p>
                <p className="text-slate-500">Planilha: <span className="text-emerald-400 font-mono font-medium">{selectedContainer.spreadsheetStatus}</span> em <span className="text-emerald-400">{selectedContainer.spreadsheetLocation}</span></p>
              </div>

              {/* Custom Status */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-medium">Status Aprovado para o PostgreSQL:</label>
                <select 
                  value={manualStatus} 
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="No Porto">No Porto</option>
                  <option value="Em Trânsito">Em Trânsito</option>
                  <option value="Retido">Retido</option>
                  <option value="Liberado">Liberado</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>

              {/* Custom Location */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-medium">Localização Oficial Conciliada:</label>
                <input 
                  type="text" 
                  value={manualLocation} 
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Auditor notes */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-medium">Justificativa / Nota do Operador (Compliance):</label>
                <textarea 
                  value={manualNotes} 
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 h-24 resize-none"
                  placeholder="Justifique o motivo de adotar estes valores customizados..."
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedContainer(null)}
                  className="bg-slate-800 text-slate-300 px-4 py-2.5 text-xs font-semibold rounded hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isResolving}
                  className="bg-indigo-600 text-white px-5 py-2.5 text-xs font-bold rounded hover:bg-indigo-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Consolidar & Alinhar Fontes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
