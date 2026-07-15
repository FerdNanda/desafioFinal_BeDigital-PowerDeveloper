import React, { useState, useEffect } from "react";
import { Container, SystemLog, DashboardStats } from "./types";
import Dashboard from "./components/Dashboard";
import DivergenceResolver from "./components/DivergenceResolver";
import Simulator from "./components/Simulator";
import Architecture from "./components/Architecture";
import LogsPanel from "./components/LogsPanel";
import ProcurementFlowchart from "./components/ProcurementFlowchart";
import GoogleSheetsSync from "./components/GoogleSheetsSync";
import JobbookIntegration from "./components/JobbookIntegration";
import { 
  Compass, Radio, Layers, Server, FileSpreadsheet, 
  HelpCircle, RefreshCw, AlertTriangle, ShieldCheck, Database, Package
} from "lucide-react";

declare module "react/jsx-runtime" {
  export function jsx(type: any, props: any, key?: string | number): any;
  export function jsxs(type: any, props: any, key?: string | number): any;
  export function jsxDEV(type: any, props: any, key?: string | number, isStaticChildren?: boolean): any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Core Data States
  const [containers, setContainers] = useState<Container[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalContainers: 0,
    divergentCount: 0,
    resolvedCount: 0,
    syncRatio: 100,
    lastReconciliation: new Date().toISOString()
  });

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all states from Express server
  const fetchAllData = async (showSilently = false) => {
    if (!showSilently) setIsLoading(true);
    try {
      const [containersRes, logsRes, statsRes] = await Promise.all([
        fetch("/api/containers"),
        fetch("/api/logs"),
        fetch("/api/stats")
      ]);

      if (!containersRes.ok || !logsRes.ok || !statsRes.ok) {
        throw new Error("Erro ao obter dados do servidor do middleware.");
      }

      const containersData = await containersRes.json();
      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      setContainers(containersData);
      setLogs(logsData);
      setStats(statsData);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Erro de conexão com a API do Middleware. Certifique-se de que o servidor Node.js está rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  // On mount: fetch and start polling
  useEffect(() => {
    fetchAllData();
    
    // Poll updates every 3.5 seconds for true real-time feeling
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Action: Resolve divergence
  const handleResolveDivergence = async (
    containerId: string, 
    method: "legacy" | "spreadsheet" | "manual",
    manualData?: { status: string; location: string; notes: string }
  ) => {
    setIsResolving(true);
    try {
      const body = {
        containerId,
        method,
        resolvedStatus: manualData?.status,
        resolvedLocation: manualData?.location,
        operatorNotes: manualData?.notes
      };

      const res = await fetch("/api/containers/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error("Falha ao resolver divergência.");
      }

      await fetchAllData(true);
    } catch (err: any) {
      alert("Erro ao resolver divergência: " + err.message);
    } finally {
      setIsResolving(false);
    }
  };

  // Action: Update legacy data
  const handleUpdateLegacy = async (id: string, status: string, location: string) => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/containers/update-legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, location })
      });
      if (!res.ok) throw new Error("Erro ao atualizar base legada.");
      await fetchAllData(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Action: Update spreadsheet data
  const handleUpdateSpreadsheet = async (
    id: string, 
    status: string, 
    location: string, 
    operator: string, 
    notes: string
  ) => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/containers/update-spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, location, operator, notes })
      });
      if (!res.ok) throw new Error("Erro ao atualizar planilha.");
      await fetchAllData(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Action: Create Container
  const handleCreateContainer = async (
    id: string,
    owner: string,
    type: string,
    size: 20 | 40,
    legacyStatus: string,
    legacyLocation: string,
    spreadsheetStatus: string,
    spreadsheetLocation: string
  ) => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/containers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id, owner, type, size, legacyStatus, legacyLocation, spreadsheetStatus, spreadsheetLocation
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Erro ao criar contêiner.");
      }
      await fetchAllData(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Action: Trigger reconciliation manual
  const handleTriggerReconciliation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/reconciliation/run", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao acionar reconciliação.");
      await fetchAllData(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Action: Reset Database
  const handleResetDatabase = async () => {
    if (!confirm("Tem certeza que deseja resetar os bancos de simulação para o estado inicial?")) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao resetar ambiente.");
      await fetchAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* Top Header Grid Area */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 font-sans">
                Torre de Controle de Contêineres
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                  v2.4 - Estável
                </span>
              </h1>
              <p className="text-slate-400 text-xs hidden sm:block">Integração de Planilhas & Sistemas Legados em Tempo Real</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Connection Badge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Middleware Online (Porta 3000)
            </div>

            {/* Quick manual reload */}
            <button 
              onClick={() => fetchAllData()}
              className="p-2 hover:bg-slate-900 rounded-lg border border-slate-900 hover:border-slate-800 transition-all text-slate-400 hover:text-white"
              title="Sincronizar Manualmente"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Reset mock database */}
            <button 
              onClick={handleResetDatabase}
              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              Resetar Bancos
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Error message banner */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Global Navigation Tabs */}
        <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-slate-950 text-white shadow-md border border-slate-850"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4" />
            Painel Geral Torre
          </button>
          
          <button
            onClick={() => setActiveTab("resolver")}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === "resolver"
                ? "bg-slate-950 text-white shadow-md border border-slate-850"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Divergências
            {stats.divergentCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-955 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
                {stats.divergentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "simulator"
                ? "bg-slate-950 text-white shadow-md border border-slate-850"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            Simulador de Integração
          </button>

          <button
            onClick={() => setActiveTab("sheets")}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "sheets"
                ? "bg-slate-950 text-white shadow-md border border-slate-850"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 font-bold" />
            Sincronizador Planilha
          </button>

          <button
            onClick={() => setActiveTab("jobbook")}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "jobbook"
                ? "bg-slate-950 text-white shadow-md border border-slate-850"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            Jobbook & Desenhos
          </button>

          <button
            onClick={() => setActiveTab("materials")}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "materials"
                ? "bg-slate-950 text-white shadow-md border border-slate-850"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Package className="w-4 h-4 text-emerald-400" />
            Fluxo de Materiais
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "architecture"
                ? "bg-slate-950 text-white shadow-md border border-slate-850"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Arquitetura Técnica
          </button>
        </div>

        {/* Dynamic Views Display */}
        {isLoading && containers.length === 0 ? (
          <div className="flex-1 py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-slate-500 text-sm">Carregando dados da Torre de Controle...</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1">
            
            {/* 1. Dashboard Tab */}
            {activeTab === "dashboard" && (
              <Dashboard 
                containers={containers} 
                stats={stats} 
                onRefresh={() => fetchAllData(true)} 
                onTabChange={setActiveTab}
              />
            )}

            {/* 2. Divergence Resolver Tab */}
            {activeTab === "resolver" && (
              <DivergenceResolver 
                containers={containers}
                onResolve={handleResolveDivergence}
                isResolving={isResolving}
              />
            )}

            {/* 3. Simulator Tab */}
            {activeTab === "simulator" && (
              <Simulator 
                containers={containers}
                onUpdateLegacy={handleUpdateLegacy}
                onUpdateSpreadsheet={handleUpdateSpreadsheet}
                onCreateContainer={handleCreateContainer}
                onTriggerReconciliation={handleTriggerReconciliation}
                isSimulating={isSimulating}
              />
            )}

            {/* 3.5. Google Sheets Sync Tab */}
            {activeTab === "sheets" && (
              <GoogleSheetsSync 
                containers={containers}
                onRefresh={() => fetchAllData(true)}
              />
            )}

            {/* 3.6. Jobbook Integration Tab */}
            {activeTab === "jobbook" && (
              <JobbookIntegration />
            )}

            {/* 4. Materials Flow Tab */}
            {activeTab === "materials" && (
              <ProcurementFlowchart />
            )}

            {/* 5. Architecture View Tab */}
            {activeTab === "architecture" && (
              <Architecture />
            )}

            {/* Integrated Terminal logs displayed dynamically in functional tabs */}
            {activeTab !== "architecture" && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Monitoramento de Eventos Ativos
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Atualizando em tempo real</span>
                </div>
                <LogsPanel 
                  logs={logs} 
                  onResetLogs={handleResetDatabase} 
                  isLoading={isLoading} 
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-mono">
          <p>© 2026 Torre de Controle Logística S.A. Solução de Alta Disponibilidade.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> PostgreSQL Consolidado Ativo
            </span>
            <span className="text-slate-600">|</span>
            <span>Estágio de Conclusão: Desafio Concluído</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
