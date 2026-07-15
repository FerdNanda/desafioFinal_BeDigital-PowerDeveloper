import React, { useState } from "react";
import { Container } from "../types";
import { 
  FileSpreadsheet, Server, Plus, RefreshCw, Sparkles, 
  ArrowRight, CheckCircle2, AlertTriangle, Truck, Info 
} from "lucide-react";

interface SimulatorProps {
  containers: Container[];
  onUpdateLegacy: (id: string, status: string, location: string) => Promise<void>;
  onUpdateSpreadsheet: (id: string, status: string, location: string, operator: string, notes: string) => Promise<void>;
  onCreateContainer: (id: string, owner: string, type: string, size: 20 | 40, legacyStatus: string, legacyLocation: string, spreadsheetStatus: string, spreadsheetLocation: string) => Promise<void>;
  onTriggerReconciliation: () => Promise<void>;
  isSimulating: boolean;
}

export default function Simulator({ 
  containers, onUpdateLegacy, onUpdateSpreadsheet, onCreateContainer, onTriggerReconciliation, isSimulating 
}: SimulatorProps) {
  
  // Tab within simulator
  const [activeSubTab, setActiveSubTab] = useState<"spreadsheet" | "legacy" | "create">("spreadsheet");

  // Spreadsheet edit state
  const [spreadContainerId, setSpreadContainerId] = useState(containers[0]?.id || "");
  const [spreadStatus, setSpreadStatus] = useState("Em Trânsito");
  const [spreadLocation, setSpreadLocation] = useState("Rodovia Anchieta KM 32");
  const [spreadOperator, setSpreadOperator] = useState("João Silva");
  const [spreadNotes, setSpreadNotes] = useState("Identificado atraso no tráfego. Informação editada na planilha.");

  // Legacy edit state
  const [legacyContainerId, setLegacyContainerId] = useState(containers[0]?.id || "");
  const [legacyStatus, setLegacyStatus] = useState("No Porto");
  const [legacyLocation, setLegacyLocation] = useState("Cais 1 - Porto de Santos");

  // Create Container state
  const [newId, setNewId] = useState("CONT-5060");
  const [newOwner, setNewOwner] = useState<"Maersk" | "MSC" | "CMA CGM" | "Hapag-Lloyd" | "ONE">("Maersk");
  const [newType, setNewType] = useState<"Reefer" | "Dry Van" | "Open Top">("Dry Van");
  const [newSize, setNewSize] = useState<20 | 40>(40);
  const [newLegStatus, setNewLegStatus] = useState("No Porto");
  const [newLegLoc, setNewLegLoc] = useState("Cais 3 - Terminal Libra");
  const [newSpreadStatus, setNewSpreadStatus] = useState("No Porto");
  const [newSpreadLoc, setNewSpreadLoc] = useState("Cais 3 - Terminal Libra");

  const handleSpreadsheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSpreadsheet(spreadContainerId, spreadStatus, spreadLocation, spreadOperator, spreadNotes);
  };

  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateLegacy(legacyContainerId, legacyStatus, legacyLocation);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateContainer(newId, newOwner, newType, newSize, newLegStatus, newLegLoc, newSpreadStatus, newSpreadLoc);
    // Randomize for next input
    setNewId(`CONT-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <div id="simulator-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Control Simulation forms (2/3 cols) */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Console de Emulação de Eventos</h3>
            <p className="text-slate-400 text-xs mt-0.5">Simule alterações nos canais originais para testar a resposta do Middleware.</p>
          </div>
          
          {/* Internal sub-tabs switcher */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center shrink-0">
            <button 
              onClick={() => setActiveSubTab("spreadsheet")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                activeSubTab === "spreadsheet" 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Editar Planilha
            </button>
            <button 
              onClick={() => setActiveSubTab("legacy")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                activeSubTab === "legacy" 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              Atualizar Legado
            </button>
            <button 
              onClick={() => setActiveSubTab("create")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                activeSubTab === "create" 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Inserir Contêiner
            </button>
          </div>
        </div>

        {/* 1. SPREADSHEET FORM */}
        {activeSubTab === "spreadsheet" && (
          <form onSubmit={handleSpreadsheetSubmit} className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-lg flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Simular Entrada Física na Planilha:</strong> Quando um operador logístico altera uma linha na planilha do Google Sheets, o Middleware recebe um Webhook contendo a linha modificada e executa as validações e checagem de divergências.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Contêiner para Editar:</label>
                <select 
                  value={spreadContainerId} 
                  onChange={(e) => setSpreadContainerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  {containers.map(c => (
                    <option key={c.id} value={c.id}>{c.id} ({c.owner} - Atual consolidado: {c.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Operador da Planilha:</label>
                <input 
                  type="text" 
                  value={spreadOperator} 
                  onChange={(e) => setSpreadOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Nome do colaborador"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Novo Status na Planilha:</label>
                <select 
                  value={spreadStatus} 
                  onChange={(e) => setSpreadStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="No Porto">No Porto</option>
                  <option value="Em Trânsito">Em Trânsito</option>
                  <option value="Retido">Retido</option>
                  <option value="Liberado">Liberado</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Nova Localização na Planilha:</label>
                <input 
                  type="text" 
                  value={spreadLocation} 
                  onChange={(e) => setSpreadLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Nota Operacional na Planilha:</label>
              <textarea 
                value={spreadNotes} 
                onChange={(e) => setSpreadNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 h-16 resize-none"
                placeholder="Ex: Motorista reportou início de trânsito..."
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSimulating}
              className="bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Atualizar Planilha & Ingerir
            </button>
          </form>
        )}

        {/* 2. LEGACY ERP FORM */}
        {activeSubTab === "legacy" && (
          <form onSubmit={handleLegacySubmit} className="space-y-4">
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-lg flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                <strong>Simular Evento do Sistema Legado (API):</strong> Representa batimentos automatizados (ex: scanners de portão, notas aduaneiras ou sistemas de faturamento portuário).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Contêiner:</label>
                <select 
                  value={legacyContainerId} 
                  onChange={(e) => setLegacyContainerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  {containers.map(c => (
                    <option key={c.id} value={c.id}>{c.id} ({c.owner} - Atual consolidado: {c.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Novo Status Legado:</label>
                <select 
                  value={legacyStatus} 
                  onChange={(e) => setLegacyStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="No Porto">No Porto</option>
                  <option value="Em Trânsito">Em Trânsito</option>
                  <option value="Retido">Retido</option>
                  <option value="Liberado">Liberado</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-400 font-medium">Nova Localização no Banco Legado:</label>
                <input 
                  type="text" 
                  value={legacyLocation} 
                  onChange={(e) => setLegacyLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSimulating}
              className="bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-lg hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
            >
              <Server className="w-4 h-4" />
              Atualizar Legado & Ingerir
            </button>
          </form>
        )}

        {/* 3. INJECT NEW CONTAINER */}
        {activeSubTab === "create" && (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="bg-slate-955 border border-slate-800 p-3.5 rounded-lg flex items-start gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                <strong>Injetar Contêiner Novo:</strong> Crie um contêiner no ecossistema e defina valores iguais (sinergia) ou conflitantes para ver o motor catalogá-lo na hora.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">ID do Contêiner:</label>
                <input 
                  type="text" 
                  value={newId} 
                  onChange={(e) => setNewId(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="CONT-XXXX"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Armador:</label>
                <select 
                  value={newOwner} 
                  onChange={(e) => setNewOwner(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Maersk">Maersk</option>
                  <option value="MSC">MSC</option>
                  <option value="CMA CGM">CMA CGM</option>
                  <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                  <option value="ONE">ONE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Tipo:</label>
                <select 
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dry Van">Dry Van</option>
                  <option value="Reefer">Reefer</option>
                  <option value="Open Top">Open Top</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Tamanho:</label>
                <select 
                  value={newSize} 
                  onChange={(e) => setNewSize(Number(e.target.value) as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="20">20 pés</option>
                  <option value="40">40 pés</option>
                </select>
              </div>
            </div>

            {/* Set disparate values directly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
              {/* Legacy Init */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 block uppercase">Origem: Banco Legado</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Status:</label>
                    <select value={newLegStatus} onChange={(e) => setNewLegStatus(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200">
                      <option value="No Porto">No Porto</option>
                      <option value="Em Trânsito">Em Trânsito</option>
                      <option value="Retido">Retido</option>
                      <option value="Liberado">Liberado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Localização:</label>
                    <input type="text" value={newLegLoc} onChange={(e) => setNewLegLoc(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200" />
                  </div>
                </div>
              </div>

              {/* Spreadsheet Init */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 block uppercase">Origem: Planilha Sheets</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Status:</label>
                    <select value={newSpreadStatus} onChange={(e) => setNewSpreadStatus(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200">
                      <option value="No Porto">No Porto</option>
                      <option value="Em Trânsito">Em Trânsito</option>
                      <option value="Retido">Retido</option>
                      <option value="Liberado">Liberado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Localização:</label>
                    <input type="text" value={newSpreadLoc} onChange={(e) => setNewSpreadLoc(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200" />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSimulating}
              className="bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-lg hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Injetar Contêiner e Executar Motor
            </button>
          </form>
        )}
      </div>

      {/* Middleware Trigger & Explanations (1/3 cols) */}
      <div className="space-y-4">
        
        {/* Active Engine Trigger Card */}
        <div className="bg-indigo-950/20 border border-indigo-500/15 rounded-xl p-5 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
              <RefreshCw className={`w-8 h-8 ${isSimulating ? "animate-spin" : ""}`} />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">Disparar Ciclo do Middleware</h4>
            <p className="text-slate-400 text-xs">
              O middleware executa a conciliação a cada 30 segundos automaticamente, mas você pode forçar um ciclo imediato.
            </p>
          </div>

          <button
            onClick={onTriggerReconciliation}
            disabled={isSimulating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg shadow-indigo-600/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            Forçar Conciliação Ativa
          </button>
        </div>

        {/* Dynamic Guide Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5">
          <h4 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Info className="w-4 h-4 text-indigo-400" />
            Cenários de Teste Sugeridos
          </h4>

          <div className="space-y-3 text-xs leading-relaxed text-slate-400">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-850">
              <span className="font-bold text-indigo-400 block mb-0.5">1. Provocar Divergência de Status</span>
              Altere o status do contêiner <strong>CONT-2089</strong> na Planilha para "Em Trânsito", mas mantenha o Legado em "Retido". Vá ao Dashboard e veja a divergência pipocar.
            </div>
            
            <div className="p-2.5 bg-slate-950 rounded border border-slate-850">
              <span className="font-bold text-emerald-400 block mb-0.5">2. Resolução Automática</span>
              Após gerar um conflito, edite o outro canal com o mesmo valor (ex: mude o Legado de CONT-2089 para "Em Trânsito" também). O middleware auto-resolverá!
            </div>

            <div className="p-2.5 bg-slate-950 rounded border border-slate-850">
              <span className="font-bold text-amber-400 block mb-0.5">3. Fuzzy Matching Warning</span>
              Crie uma divergência de localização com diferenças mínimas de digitação para ver o middleware alertar em nível [WARN].
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
