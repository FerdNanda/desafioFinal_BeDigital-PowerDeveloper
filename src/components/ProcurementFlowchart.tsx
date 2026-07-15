import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Material, PurchaseRequest } from "../types";
import { 
  Package, ShoppingCart, CheckCircle2, AlertTriangle, 
  ArrowRight, RefreshCw, Layers, TrendingDown, Clock, 
  Coins, Truck, Plus, ChevronRight, Play, Info, Eye
} from "lucide-react";

export default function ProcurementFlowchart() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [procurements, setProcurements] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>("auditoria");
  
  // Simulation Inputs
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [useQty, setUseQty] = useState<number>(1);
  const [orderQty, setOrderQty] = useState<number>(5);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [materialsRes, procurementsRes] = await Promise.all([
        fetch("/api/materials"),
        fetch("/api/procurements")
      ]);

      if (materialsRes.ok && procurementsRes.ok) {
        const mats = await materialsRes.json();
        const procs = await procurementsRes.json();
        setMaterials(mats);
        setProcurements(procs);

        // Pre-select first material in list for simulator
        if (mats.length > 0 && !selectedMaterialId) {
          setSelectedMaterialId(mats[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados de materiais:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 4 seconds to sync with other simulation events
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Action: Consume material
  const handleUseMaterial = async () => {
    if (!selectedMaterialId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/materials/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMaterialId, quantity: useQty })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao registrar consumo.");
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Initiate Purchase Order
  const handleCreateOrder = async (materialId: string, quantity: number) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/materials/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, quantity })
      });
      if (!res.ok) {
        alert("Erro ao iniciar solicitação de compra.");
      } else {
        await fetchData();
        setSelectedNode("aprovacao"); // Switch focus to approval phase
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Update request status
  const handleUpdateStatus = async (requestId: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/materials/update-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, status })
      });
      if (!res.ok) {
        alert("Erro ao atualizar status do pedido.");
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper stats
  const criticalItems = materials.filter(m => m.stockCurrent === 0);
  const warningItems = materials.filter(m => m.stockCurrent > 0 && m.stockCurrent < m.stockMinimum);
  const healthyItems = materials.filter(m => m.stockCurrent >= m.stockMinimum);

  const activeOrders = procurements.filter(p => p.status !== "Entregue");
  const pendingApprovals = procurements.filter(p => p.status === "Aguardando Aprovação");
  const approvedOrders = procurements.filter(p => p.status === "Aprovado");
  const sentOrders = procurements.filter(p => p.status === "Pedido Enviado");

  // Determine current active flow stage highlighting based on data
  const hasShortage = criticalItems.length > 0 || warningItems.length > 0;
  const hasPendingApproval = pendingApprovals.length > 0;
  const hasTransit = sentOrders.length > 0;

  return (
    <div id="materials-procurement-view" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Torre de Estoque & Fluxo de Aquisição (Procurement)
            </h2>
            <p className="text-slate-400 text-sm">
              Visibilidade de ponta a ponta: do nível crítico de insumos em tempo real à emissão automática de requisições de compras.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl text-xs flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {healthyItems.length} Saudáveis
              </span>
              <span className="text-slate-700">|</span>
              <span className={`flex items-center gap-1.5 font-semibold ${criticalItems.length > 0 ? "text-rose-400" : warningItems.length > 0 ? "text-amber-400" : "text-slate-400"}`}>
                <span className={`w-2 h-2 rounded-full ${criticalItems.length > 0 ? "bg-rose-400 animate-ping" : warningItems.length > 0 ? "bg-amber-400 animate-pulse" : "bg-slate-400"}`}></span>
                {criticalItems.length + warningItems.length} Alertas
              </span>
            </div>
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC INTERACTIVE FLOWCHART DIAGRAM */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col gap-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Fluxograma Dinâmico de Decisão e Abastecimento
            </h3>
            <p className="text-slate-500 text-xs">
              Clique em qualquer etapa do fluxo para inspecionar os detalhes e realizar ações de simulação correspondentes.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-850">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Linhas com fluxo tracejado indicam processos ativos no momento</span>
          </div>
        </div>

        {/* The flowchart diagram SVG + CSS Grid layout */}
        <div className="relative border border-slate-850/60 bg-slate-950/50 rounded-xl p-4 lg:p-8 min-h-[360px] flex flex-col justify-center items-center overflow-x-auto select-none">
          
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-y-16 md:gap-x-12 lg:gap-x-16 w-full max-w-5xl relative z-10">
            
            {/* NODE 1: AUDITORIA DE ESTOQUE */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedNode("auditoria")}
              className={`cursor-pointer rounded-xl p-4 border text-left transition-all ${
                selectedNode === "auditoria"
                  ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10"
                  : "bg-slate-900 border-slate-850 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] bg-slate-800 text-slate-400 font-semibold uppercase px-2 py-0.5 rounded">
                  ETAPA 1
                </span>
                <Package className={`w-5 h-5 ${selectedNode === "auditoria" ? "text-indigo-400" : "text-slate-400"}`} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Verificação de Níveis</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Monitoramento constante do estoque de peças e consumíveis de reposição.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded flex justify-between items-center">
                <span>Insumos cadastrados:</span>
                <span className="font-bold text-white">{materials.length}</span>
              </div>
            </motion.div>

            {/* NODE 2: DECISÃO ESTOQUE SAUDÁVEL */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedNode("disponivel")}
              className={`cursor-pointer rounded-xl p-4 border text-left transition-all relative ${
                selectedNode === "disponivel"
                  ? "bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/5"
                  : "bg-slate-900 border-slate-850 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold uppercase px-2 py-0.5 rounded border border-emerald-500/10">
                  Fluxo Verde
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Estoque Disponível</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Estoque acima do mínimo recomendado. Operação flui normalmente e sem risco.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded flex justify-between items-center">
                <span>Itens com saldo OK:</span>
                <span className="font-bold text-emerald-400">{healthyItems.length}</span>
              </div>
            </motion.div>

            {/* NODE 3: DECISÃO ALERTA DE COMPRA */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedNode("alerta")}
              className={`cursor-pointer rounded-xl p-4 border text-left transition-all ${
                selectedNode === "alerta"
                  ? "bg-amber-950/30 border-amber-500 shadow-md shadow-amber-500/5"
                  : hasShortage
                  ? "bg-slate-900/90 border-amber-500/30 shadow-sm hover:border-amber-500/50"
                  : "bg-slate-900 border-slate-850 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                  criticalItems.length > 0 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/10 animate-pulse" 
                    : "bg-amber-500/10 text-amber-400 border-amber-500/10"
                }`}>
                  {criticalItems.length > 0 ? "Estoque Crítico" : "Alerta de Estoque"}
                </span>
                <AlertTriangle className={`w-5 h-5 ${criticalItems.length > 0 ? "text-rose-400 animate-bounce" : "text-amber-400"}`} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Necessidade de Compra</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Saldo caiu abaixo do limite seguro. Sistema alerta necessidade de procurement.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded flex justify-between items-center">
                <span>Faltas / Alertas:</span>
                <span className={`font-bold ${criticalItems.length > 0 ? "text-rose-400" : "text-amber-400"}`}>
                  {criticalItems.length + warningItems.length}
                </span>
              </div>
            </motion.div>

            {/* NODE 4: SOLICITAÇÃO / REQUISIÇÃO */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedNode("aprovacao")}
              className={`cursor-pointer rounded-xl p-4 border text-left transition-all ${
                selectedNode === "aprovacao"
                  ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10"
                  : hasPendingApproval
                  ? "bg-slate-900/95 border-indigo-500/30"
                  : "bg-slate-900 border-slate-850 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-semibold uppercase px-2 py-0.5 rounded border border-indigo-500/10">
                  ETAPA 2 - COMPRAS
                </span>
                <Coins className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Aprovação de Orçamento</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Cotações disparadas. Liberação de verba pelo setor financeiro da Torre de Controle.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded flex justify-between items-center">
                <span>Aguardando Aprovação:</span>
                <span className="font-bold text-indigo-400">{pendingApprovals.length}</span>
              </div>
            </motion.div>

            {/* NODE 5: ENVIADO / EM FORNECEDOR */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedNode("enviado")}
              className={`cursor-pointer rounded-xl p-4 border text-left transition-all ${
                selectedNode === "enviado"
                  ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10"
                  : sentOrders.length > 0 || approvedOrders.length > 0
                  ? "bg-slate-900/95 border-indigo-500/30"
                  : "bg-slate-900 border-slate-850 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-semibold uppercase px-2 py-0.5 rounded border border-indigo-500/10">
                  ETAPA 3 - EMISSÃO
                </span>
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Pedido de Compra (PO)</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Pedido emitido formalmente e enviado ao parceiro de suprimentos homologado.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded flex justify-between items-center">
                <span>Pedidos Emitidos:</span>
                <span className="font-bold text-indigo-400">{approvedOrders.length + sentOrders.length}</span>
              </div>
            </motion.div>

            {/* NODE 6: RECEBIMENTO / ENTRADA NO ESTOQUE */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedNode("recebimento")}
              className={`cursor-pointer rounded-xl p-4 border text-left transition-all ${
                selectedNode === "recebimento"
                  ? "bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/5"
                  : hasTransit
                  ? "bg-slate-900/90 border-emerald-500/30 animate-pulse"
                  : "bg-slate-900 border-slate-850 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold uppercase px-2 py-0.5 rounded border border-emerald-500/10">
                  ETAPA 4 - LOGÍSTICA
                </span>
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Recebimento & Entrada</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Descarregamento do material, conferência da nota fiscal e atualização de saldo.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded flex justify-between items-center">
                <span>Aguardando Entrega:</span>
                <span className="font-bold text-emerald-400">{sentOrders.length}</span>
              </div>
            </motion.div>

          </div>

          {/* SVG Connector Lines Overlay */}
          <div className="absolute inset-0 pointer-events-none hidden md:block w-full h-full">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                </marker>
                <marker id="arrow-indigo" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
                </marker>
                <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Connectors will be drawn as dashed flowing lines depending on active processes */}
              
              {/* FLOW 1: Auditoria -> Disponível (Green if healthy items exist) */}
              <path 
                d="M 230 110 L 320 110" 
                stroke="#10b981" 
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#arrow-emerald)"
                strokeDasharray="4 4"
                className="animate-flow-dash"
              />
              
              {/* FLOW 2: Auditoria -> Necessidade (Yellow/Red if alert items exist) */}
              <path 
                d="M 230 140 L 320 220" 
                stroke={hasShortage ? "#f59e0b" : "#475569"} 
                strokeWidth={hasShortage ? "2" : "1"}
                fill="none"
                markerEnd={hasShortage ? "url(#arrow-indigo)" : "url(#arrow)"}
                strokeDasharray={hasShortage ? "4 4" : "none"}
                className={hasShortage ? "animate-flow-dash" : ""}
              />

              {/* FLOW 3: Necessidade -> Compras / Aprovação */}
              <path 
                d="M 660 170 L 230 260" 
                stroke={hasPendingApproval ? "#6366f1" : "#475569"} 
                strokeWidth={hasPendingApproval ? "2" : "1"}
                fill="none"
                markerEnd={hasPendingApproval ? "url(#arrow-indigo)" : "url(#arrow)"}
                strokeDasharray={hasPendingApproval ? "4 4" : "none"}
                className={hasPendingApproval ? "animate-flow-dash" : ""}
              />

              {/* FLOW 4: Aprovação -> Pedido PO */}
              <path 
                d="M 330 290 L 400 290" 
                stroke={approvedOrders.length > 0 ? "#6366f1" : "#475569"} 
                strokeWidth={approvedOrders.length > 0 ? "2" : "1"}
                fill="none"
                markerEnd={approvedOrders.length > 0 ? "url(#arrow-indigo)" : "url(#arrow)"}
                strokeDasharray={approvedOrders.length > 0 ? "4 4" : "none"}
                className={approvedOrders.length > 0 ? "animate-flow-dash" : ""}
              />

              {/* FLOW 5: Pedido PO -> Recebimento */}
              <path 
                d="M 660 290 L 730 290" 
                stroke={hasTransit ? "#10b981" : "#475569"} 
                strokeWidth={hasTransit ? "2" : "1"}
                fill="none"
                markerEnd={hasTransit ? "url(#arrow-emerald)" : "url(#arrow)"}
                strokeDasharray={hasTransit ? "4 4" : "none"}
                className={hasTransit ? "animate-flow-dash" : ""}
              />

              {/* FLOW 6: Recebimento -> back to Auditoria (Full Circle loop) */}
              <path 
                d="M 780 240 L 780 70 L 160 70 L 160 90" 
                stroke={hasTransit ? "#10b981" : "#475569"} 
                strokeWidth={hasTransit ? "1.5" : "1"}
                fill="none"
                markerEnd={hasTransit ? "url(#arrow-emerald)" : "url(#arrow)"}
                strokeDasharray={hasTransit ? "4 4" : "none"}
                className={hasTransit ? "animate-flow-dash" : ""}
              />
            </svg>
          </div>

        </div>
      </div>

      {/* DETAILED PHASE CONTROL PANEL AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE VIEW CONTROLS & SELECTIONS */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
          
          <AnimatePresence mode="wait">
            
            {/* AUDITORIA VIEW */}
            {selectedNode === "auditoria" && (
              <motion.div 
                key="auditoria"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Package className="w-5 h-5 text-indigo-400" />
                    Estoque Geral & Consumo de Materiais
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Verificação Diária de Saldo</span>
                </div>

                <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-850 space-y-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulador de Consumo Logístico</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Escolha um item de reparo de contêineres e simule sua utilização nas vistorias de pátio para ver o impacto no estoque.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase">Material a Usar</label>
                      <select 
                        value={selectedMaterialId} 
                        onChange={(e) => setSelectedMaterialId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.stockCurrent} {m.stockUnit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase">Quantidade Utilizada</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="20"
                        value={useQty}
                        onChange={(e) => setUseQty(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button 
                      onClick={handleUseMaterial}
                      disabled={actionLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Registrar Consumo
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planilha Atual de Insumos da Torre</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 font-semibold">Código</th>
                          <th className="py-2.5 font-semibold">Insumo</th>
                          <th className="py-2.5 font-semibold">Categoria</th>
                          <th className="py-2.5 font-semibold text-right">Mínimo</th>
                          <th className="py-2.5 font-semibold text-right">Disponível</th>
                          <th className="py-2.5 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {materials.map(m => (
                          <tr key={m.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 font-mono text-slate-400">{m.id}</td>
                            <td className="py-2.5 text-white font-medium">{m.name}</td>
                            <td className="py-2.5 text-slate-400">{m.category}</td>
                            <td className="py-2.5 text-right font-mono text-slate-400">{m.stockMinimum} {m.stockUnit}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-white">{m.stockCurrent} {m.stockUnit}</td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                m.status === "Suficiente"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                  : m.status === "Alerta (Mínimo)"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/15 animate-pulse"
                              }`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ESTOQUE DISPONÍVEL VIEW */}
            {selectedNode === "disponivel" && (
              <motion.div 
                key="disponivel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Fluxo Saudável - Sem Ação de Compra Requerida
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-mono">Status Verde</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Os seguintes materiais encontram-se em níveis adequados. Nenhuma requisição de compras ativa foi disparada para estes itens, otimizando o fluxo financeiro da empresa.
                </p>

                {healthyItems.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    Nenhum material está com saldo saudável no momento! Todos em situação de alerta ou falta crítica.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {healthyItems.map(m => (
                      <div key={m.id} className="bg-slate-950/40 p-4 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">{m.name}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">{m.category} | Fornecedor: {m.supplier}</p>
                          <div className="flex gap-2 mt-2 text-[10px] font-mono text-slate-400">
                            <span>Mínimo: <b className="text-white">{m.stockMinimum}</b></span>
                            <span>•</span>
                            <span>Atual: <b className="text-emerald-400">{m.stockCurrent}</b></span>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 p-2.5 rounded-lg text-emerald-400 text-xs font-bold">
                          {Math.round((m.stockCurrent / m.stockMinimum) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* NECESSIDADE DE COMPRA VIEW */}
            {selectedNode === "alerta" && (
              <motion.div 
                key="alerta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Necessidade de Compra Detectada
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono">Disparo do Procurement</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Os itens abaixo atingiram ou estão abaixo do estoque mínimo. A Torre de Controle sugere o início de uma solicitação de compra para reabastecimento imediato.
                </p>

                {criticalItems.length === 0 && warningItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/20 rounded-xl border border-slate-850">
                    Nenhum alerta de compra ativo. Todos os materiais estão plenamente abastecidos!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...criticalItems, ...warningItems].map(m => {
                      const isCritical = m.stockCurrent === 0;
                      return (
                        <div key={m.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          isCritical 
                            ? "bg-rose-950/10 border-rose-500/20" 
                            : "bg-amber-950/10 border-amber-500/20"
                        }`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-rose-500 animate-ping" : "bg-amber-500 animate-pulse"}`}></span>
                              <h4 className="text-xs font-bold text-white">{m.name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Categoria: {m.category} | Fornecedor Sugerido: <span className="text-indigo-400">{m.supplier}</span>
                            </p>
                            <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                              <span>Min recomendado: <b className="text-white">{m.stockMinimum} {m.stockUnit}</b></span>
                              <span>Estoque atual: <b className={isCritical ? "text-rose-400 font-bold" : "text-amber-400"}>{m.stockCurrent} {m.stockUnit}</b></span>
                              <span>Prazo entrega: <b className="text-white">{m.leadTimeDays} dias</b></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-850/40">
                            <span className="text-[10px] text-slate-400 font-mono px-2">Qtd Sugerida: <b>{m.stockMinimum * 2}</b></span>
                            <button 
                              onClick={() => handleCreateOrder(m.id, m.stockMinimum * 2)}
                              disabled={actionLoading}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow ${
                                isCritical
                                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10"
                                  : "bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-amber-600/10"
                              }`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Solicitar Compra
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* APROVAÇÃO DE ORÇAMENTO VIEW */}
            {selectedNode === "aprovacao" && (
              <motion.div 
                key="aprovacao"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Coins className="w-5 h-5 text-indigo-400" />
                    Requisições Aguardando Aprovação
                  </h3>
                  <span className="text-[11px] text-indigo-400 font-mono">Assinatura de Supply Chain</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  As ordens abaixo foram enviadas à diretoria financeira da Torre de Controle. Revise os custos e clique em aprovar para emitir o Pedido de Compra (PO) correspondente.
                </p>

                {pendingApprovals.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/20 rounded-xl border border-slate-850">
                    Nenhuma requisição aguardando aprovação orçamentária no momento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map(p => (
                      <div key={p.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono px-2 py-0.5 rounded font-semibold border border-indigo-500/10">
                              {p.id}
                            </span>
                            <h4 className="text-xs font-bold text-white">{p.materialName}</h4>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Quantidade: <b>{p.quantityRequested}</b> | Preço Unitário: R$ {p.unitPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-indigo-400 font-semibold">
                            Total da Ordem: R$ {p.totalPrice.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(p.id, "Aprovado")}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprovar Orçamento
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PEDIDO DE COMPRA EM EMISSÃO */}
            {selectedNode === "enviado" && (
              <motion.div 
                key="enviado"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <ShoppingCart className="w-5 h-5 text-indigo-400" />
                    Pedidos de Compra Aprovados (Emitir PO)
                  </h3>
                  <span className="text-[11px] text-indigo-400 font-mono">Etapa de Faturamento</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Os orçamentos foram aprovados pela Torre. Agora, o sistema precisa disparar o faturamento e enviar formalmente o pedido (Purchase Order) ao fornecedor parceiro.
                </p>

                {approvedOrders.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/20 rounded-xl border border-slate-850">
                    Nenhum pedido de compra aprovado aguardando emissão.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvedOrders.map(p => (
                      <div key={p.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                              {p.id}
                            </span>
                            <h4 className="text-xs font-bold text-white">{p.materialName}</h4>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Valor total: <b className="text-white font-mono">R$ {p.totalPrice.toFixed(2)}</b> | Prazo de entrega: <b className="text-white">{p.leadTimeDays} dias</b>
                          </p>
                        </div>

                        <button 
                          onClick={() => handleUpdateStatus(p.id, "Pedido Enviado")}
                          disabled={actionLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow shadow-indigo-600/20"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Enviar PO para Fornecedor
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* RECEBIMENTO E ENTRADA NO ESTOQUE */}
            {selectedNode === "recebimento" && (
              <motion.div 
                key="recebimento"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Truck className="w-5 h-5 text-emerald-400" />
                    Trânsito Logístico & Recebimento de Mercadorias
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-mono">Etapa 4 - Entrada de Nota Fiscal</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Os insumos abaixo foram encomendados e estão em transporte físico para o almoxarifado do porto. Quando o caminhão chegar, registre o recebimento para realimentar o estoque!
                </p>

                {sentOrders.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/20 rounded-xl border border-slate-850">
                    Nenhum insumo em transporte ou aguardando entrega no momento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentOrders.map(p => (
                      <div key={p.id} className="bg-slate-950/40 p-4 rounded-xl border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/10">
                              {p.id}
                            </span>
                            <h4 className="text-xs font-bold text-white">{p.materialName}</h4>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Quantidade a receber: <b className="text-emerald-400">{p.quantityRequested} unidades</b>
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Previsão de entrega: <b>{new Date(p.estimatedArrivalDate).toLocaleDateString()}</b></span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleUpdateStatus(p.id, "Entregue")}
                          disabled={actionLoading}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow shadow-emerald-600/25 animate-pulse"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmar Entrega
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: HISTORIC OF COMPRAS / REQUISITIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Histórico de Pedidos de Compras
            </h3>
            <p className="text-slate-500 text-[10px]">Acompanhamento em tempo real da carteira</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[340px] space-y-2.5 pr-1 select-none">
            {procurements.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs">
                Nenhum pedido de compra no histórico.
              </div>
            ) : (
              procurements.map(p => (
                <div key={p.id} className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 space-y-1.5 hover:border-slate-800 transition-colors">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">{p.id}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      p.status === "Aguardando Aprovação"
                        ? "text-indigo-400 bg-indigo-500/5 border border-indigo-500/10"
                        : p.status === "Aprovado"
                        ? "text-amber-400 bg-amber-500/5 border border-amber-500/10"
                        : p.status === "Pedido Enviado"
                        ? "text-sky-400 bg-sky-500/5 border border-sky-500/10"
                        : "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{p.materialName}</h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Qtd: <b>{p.quantityRequested}</b></span>
                    <span className="text-indigo-400 font-semibold">R$ {p.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
