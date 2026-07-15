import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Search, 
  FileSpreadsheet, 
  Layers, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Plus, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  Filter, 
  FileText, 
  Cpu, 
  Wrench,
  Check,
  TrendingUp,
  Sliders,
  HelpCircle
} from "lucide-react";

// Types for Drawings and Jobbook
interface DrawingMaterial {
  pos: string;
  partId: string;
  description: string;
  um: string;
  qtyNeeded: number;
}

interface Drawing {
  id: string; // e.g. 310-M-001
  name: string; // e.g. 310-M-001_DutoValvulas.dwg
  system: string; // e.g. 310
  title: string;
  description: string;
  date: string;
  author: string;
  revision: string;
  materials: DrawingMaterial[];
  blueprintNodes: {
    id: string;
    type: "valve" | "pump" | "pipe" | "flange";
    label: string;
    partId: string;
    x: number; // percentage
    y: number; // percentage
  }[];
}

interface JobbookRecord {
  id: string; // unique db row id
  partId: string;
  functionCode: string; // e.g. 310 (system)
  description: string;
  sapCode: string;
  qtyDemanded: number; // Total system quantity
  drawingRef: string;
  sendDate: string;
  location: string;
}

export default function JobbookIntegration() {
  // Static dataset for drawings matching the user's description
  const [drawings, setDrawings] = useState<Drawing[]>([
    {
      id: "310-M-001",
      name: "310-M-001_DutoValvulas.dwg",
      system: "310",
      title: "Diagrama Hidráulico de Controle - Injeção 310",
      description: "Planta de montagem, corte e isométrico de válvulas globo do coletor de recalque principal para alimentação do setor Norte.",
      date: "14/07/2026",
      author: "Eng. Maurício Santos",
      revision: "Rev. B",
      materials: [
        { pos: "01", partId: "VLV-GLB-400X", description: "Válvula Globo de Vedação Interna 2\" Flangeada A105 CL300", um: "PÇ", qtyNeeded: 1 },
        { pos: "02", partId: "CON-ELL-90D", description: "Cotovelo 90º Forjado Alta Pressão 3000# SW 2\"", um: "PÇ", qtyNeeded: 4 },
        { pos: "03", partId: "FLG-WNR-A105", description: "Flange Neck Carbon Steel ASTM A105 Cl 150 RF 2\"", um: "PÇ", qtyNeeded: 3 },
      ],
      blueprintNodes: [
        { id: "node-1", type: "valve", label: "Válvula Globo (Pos 01)", partId: "VLV-GLB-400X", x: 30, y: 45 },
        { id: "node-2", type: "flange", label: "Flange de Entrada (Pos 03)", partId: "FLG-WNR-A105", x: 15, y: 45 },
        { id: "node-3", type: "flange", label: "Flange de Saída (Pos 03)", partId: "FLG-WNR-A105", x: 45, y: 45 },
        { id: "node-4", type: "pipe", label: "Cotovelo Recalque (Pos 02)", partId: "CON-ELL-90D", x: 60, y: 25 },
        { id: "node-5", type: "pipe", label: "Cotovelo Retorno (Pos 02)", partId: "CON-ELL-90D", x: 75, y: 65 }
      ]
    },
    {
      id: "333-I-002",
      name: "333-I-002_GrupoMotoBombas.dwg",
      system: "333",
      title: "Arranjo Físico e Lista de Materiais - Sistema de Bombeamento 333",
      description: "Desenho executivo da estação de recalque secundário, contendo grupo motobomba e conexões auxiliares.",
      date: "12/07/2026",
      author: "Dra. Carolina Alencar",
      revision: "Rev. A",
      materials: [
        { pos: "01", partId: "BMP-CNT-150HP", description: "Bomba Centrífuga Autoescorvante 150HP Monobloco trifásica", um: "PÇ", qtyNeeded: 2 },
        { pos: "02", partId: "VAL-RET-SWG", description: "Válvula de Retenção Swing Check Cl 150 4\" Flangeada", um: "PÇ", qtyNeeded: 1 },
        { pos: "03", partId: "JUN-EXP-NEO", description: "Junta de Expansão de Neoprene com Flanges de Aço 4\"", um: "PÇ", qtyNeeded: 2 },
      ],
      blueprintNodes: [
        { id: "node-b1", type: "pump", label: "Bomba Principal (Pos 01)", partId: "BMP-CNT-150HP", x: 25, y: 60 },
        { id: "node-b2", type: "pump", label: "Bomba Reserva (Pos 01)", partId: "BMP-CNT-150HP", x: 55, y: 60 },
        { id: "node-b3", type: "valve", label: "Retenção Swing (Pos 02)", partId: "VAL-RET-SWG", x: 40, y: 30 },
        { id: "node-b4", type: "flange", label: "Acoplamento Neoprene (Pos 03)", partId: "JUN-EXP-NEO", x: 75, y: 30 }
      ]
    },
    {
      id: "310-M-002",
      name: "310-M-002_DistribuiçãoSecundaria.dwg",
      system: "310",
      title: "Isométrico de Tubulação Acessória - Sistema 310",
      description: "Arranjo geométrico de conexões e suportes para as ramificações secundárias da linha de água no bloco industrial.",
      date: "14/07/2026",
      author: "Eng. Maurício Santos",
      revision: "Rev. A",
      materials: [
        { pos: "01", partId: "VLV-GLB-400X", description: "Válvula Globo de Vedação Interna 2\" Flangeada A105 CL300", um: "PÇ", qtyNeeded: 4 },
        { pos: "02", partId: "CON-ELL-90D", description: "Cotovelo 90º Forjado Alta Pressão 3000# SW 2\"", um: "PÇ", qtyNeeded: 2 },
      ],
      blueprintNodes: [
        { id: "node-s1", type: "valve", label: "Globo Setorizado A (Pos 01)", partId: "VLV-GLB-400X", x: 20, y: 35 },
        { id: "node-s2", type: "valve", label: "Globo Setorizado B (Pos 01)", partId: "VLV-GLB-400X", x: 50, y: 35 },
        { id: "node-s3", type: "pipe", label: "Desvio Curvo (Pos 02)", partId: "CON-ELL-90D", x: 80, y: 55 }
      ]
    },
    {
      id: "310-M-003",
      name: "310-M-003_ColetorSuporte.dwg",
      system: "310",
      title: "Desenho de Suportação do Coletor - Sistema 310",
      description: "Esquema mecânico de fixação e suspensão das tubulações pesadas no teto estrutural do galpão.",
      date: "13/07/2026",
      author: "Téc. Lucas Pereira",
      revision: "Rev. 0",
      materials: [
        { pos: "01", partId: "VLV-GLB-400X", description: "Válvula Globo de Vedação Interna 2\" Flangeada A105 CL300", um: "PÇ", qtyNeeded: 3 },
        { pos: "02", partId: "SUP-HGR-PIPE", description: "Suporte Tipo Hanger para Linhas Metálicas Suspensas de 2\"", um: "PÇ", qtyNeeded: 6 },
      ],
      blueprintNodes: [
        { id: "node-su1", type: "valve", label: "Válvula Geral (Pos 01)", partId: "VLV-GLB-400X", x: 40, y: 40 },
        { id: "node-su2", type: "pipe", label: "Suporte Tipo Hanger (Pos 02)", partId: "SUP-HGR-PIPE", x: 15, y: 70 },
        { id: "node-su3", type: "pipe", label: "Suporte Tipo Hanger (Pos 02)", partId: "SUP-HGR-PIPE", x: 65, y: 70 }
      ]
    }
  ]);

  // Central Jobbook spreadsheet dataset (simulating Google Planilhas database/API)
  const [jobbook, setJobbook] = useState<JobbookRecord[]>([
    {
      id: "jb-1",
      partId: "VLV-GLB-400X",
      functionCode: "310",
      description: "Válvula Globo de Vedação Interna 2\" Flangeada A105 CL300",
      sapCode: "SAP-2094851",
      qtyDemanded: 8, // Demanded total for the system (exactly as user explained: "mandando 8 unidades... para esse desenho a gente consome uma, e sobra sete")
      drawingRef: "310-M-001 / -002 / -003",
      sendDate: "10/07/2026",
      location: "Almoxarifado Central - Prateleira B3"
    },
    {
      id: "jb-2",
      partId: "CON-ELL-90D",
      functionCode: "310",
      description: "Cotovelo 90º Forjado Alta Pressão 3000# SW 2\"",
      sapCode: "SAP-1049582",
      qtyDemanded: 10,
      drawingRef: "310-M-001 / -002",
      sendDate: "10/07/2026",
      location: "Almoxarifado Central - Prateleira F1"
    },
    {
      id: "jb-3",
      partId: "FLG-WNR-A105",
      functionCode: "310",
      description: "Flange Neck Carbon Steel ASTM A105 Cl 150 RF 2\"",
      sapCode: "SAP-5502948",
      qtyDemanded: 6,
      drawingRef: "310-M-001",
      sendDate: "12/07/2026",
      location: "Almoxarifado Terminal 1"
    },
    {
      id: "jb-4",
      partId: "BMP-CNT-150HP",
      functionCode: "333",
      description: "Bomba Centrífuga Autoescorvante 150HP Monobloco trifásica",
      sapCode: "SAP-8947211",
      qtyDemanded: 2, // Total demanded in Jobbook (matches drawing 333-I-002: 2 units. "tá batendo!")
      drawingRef: "333-I-002",
      sendDate: "13/07/2026",
      location: "Canteiro de Montagem 3"
    },
    {
      id: "jb-5",
      partId: "VAL-RET-SWG",
      functionCode: "333",
      description: "Válvula de Retenção Swing Check Cl 150 4\" Flangeada",
      sapCode: "SAP-4493019",
      qtyDemanded: 1,
      drawingRef: "333-I-002",
      sendDate: "13/07/2026",
      location: "Canteiro de Montagem 3"
    },
    {
      id: "jb-6",
      partId: "JUN-EXP-NEO",
      functionCode: "333",
      description: "Junta de Expansão de Neoprene com Flanges de Aço 4\"",
      sapCode: "SAP-3382941",
      qtyDemanded: 2,
      drawingRef: "333-I-002",
      sendDate: "13/07/2026",
      location: "Canteiro de Montagem 3"
    }
  ]);

  // Active UI States
  const [selectedDrawingId, setSelectedDrawingId] = useState<string>("310-M-001");
  const [searchPartId, setSearchPartId] = useState<string>("");
  const [filterSystem, setFilterSystem] = useState<string>("");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // New item creation in Jobbook
  const [isAddingToJobbook, setIsAddingToJobbook] = useState(false);
  const [newPartId, setNewPartId] = useState("");
  const [newSystem, setNewSystem] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSap, setNewSap] = useState("");
  const [newQty, setNewQty] = useState(1);

  // New Drawing State
  const [isAddingDrawing, setIsAddingDrawing] = useState(false);
  const [newDrgId, setNewDrgId] = useState("");
  const [newDrgName, setNewDrgName] = useState("");
  const [newDrgSystem, setNewDrgSystem] = useState("");
  const [newDrgTitle, setNewDrgTitle] = useState("");
  const [newDrgDesc, setNewDrgDesc] = useState("");
  const [newDrgAuthor, setNewDrgAuthor] = useState("");
  const [newDrgRevision, setNewDrgRevision] = useState("Rev. A");

  // New Material State (BOM Insertion)
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMatPos, setNewMatPos] = useState("");
  const [newMatPartId, setNewMatPartId] = useState("");
  const [newMatDesc, setNewMatDesc] = useState("");
  const [newMatUm, setNewMatUm] = useState("PÇ");
  const [newMatQty, setNewMatQty] = useState(1);

  // Status logs for actions done in this tab
  const [notifications, setNotifications] = useState<{id: string, text: string, type: "success" | "info" | "warn"}[]>([]);

  const addNotification = (text: string, type: "success" | "info" | "warn" = "info") => {
    const id = Math.random().toString();
    setNotifications(prev => [{id, text, type}, ...prev.slice(0, 4)]);
  };

  const activeDrawing = drawings.find(d => d.id === selectedDrawingId) || drawings[0];

  // Load from Express PostgreSQL simulation database
  const loadDatabaseData = async () => {
    setIsDbLoading(true);
    try {
      const [drgRes, jbRes] = await Promise.all([
        fetch("/api/drawings"),
        fetch("/api/jobbook")
      ]);
      if (drgRes.ok && jbRes.ok) {
        const drawingsData = await drgRes.json();
        const jobbookData = await jbRes.json();
        if (drawingsData && drawingsData.length > 0) setDrawings(drawingsData);
        if (jobbookData && jobbookData.length > 0) setJobbook(jobbookData);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do banco:", err);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Auto-filter by drawing system on drawing load to help user align context
  useEffect(() => {
    if (activeDrawing) {
      setFilterSystem(activeDrawing.system);
    }
  }, [selectedDrawingId, drawings]);

  // Handles copying Part ID from drawing's material list or blueprint node to Jobbook query
  const handleSelectPart = (partId: string) => {
    setSearchPartId(partId);
    addNotification(`Part Number "${partId}" copiado e pesquisado no Jobbook!`, "success");
    
    // Find the blueprint node matching this part to pulse it
    if (activeDrawing && activeDrawing.blueprintNodes) {
      const node = activeDrawing.blueprintNodes.find(n => n.partId === partId);
      if (node) {
        setActiveNodeId(node.id);
        setTimeout(() => setActiveNodeId(null), 3000);
      }
    }
  };

  // Add new part to the Jobbook (POST to central backend database)
  const handleAddJobbookRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartId || !newSystem || !newDesc || !newSap) {
      addNotification("Por favor, preencha todos os campos para registrar no Jobbook.", "warn");
      return;
    }

    try {
      const res = await fetch("/api/jobbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: newPartId.trim().toUpperCase(),
          functionCode: newSystem.trim(),
          description: newDesc.trim(),
          sapCode: newSap.trim().toUpperCase(),
          qtyDemanded: Number(newQty) || 1,
          drawingRef: activeDrawing ? activeDrawing.id : "Manual",
          location: "Almoxarifado Central"
        })
      });

      if (!res.ok) throw new Error("Erro de rede ao salvar no banco.");

      await loadDatabaseData();
      setIsAddingToJobbook(false);
      setNewPartId("");
      setNewDesc("");
      setNewSap("");
      setNewQty(1);
      addNotification(`Part Number ${newPartId.toUpperCase()} adicionado ao Jobbook com sucesso!`, "success");
    } catch (err) {
      addNotification("Erro ao registrar no banco de dados do Jobbook.", "warn");
    }
  };

  // Add brand new Technical Drawing (POST to central backend database)
  const handleAddDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrgId || !newDrgName || !newDrgSystem || !newDrgTitle) {
      addNotification("Por favor, preencha os campos obrigatórios do desenho.", "warn");
      return;
    }

    try {
      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newDrgId.trim().toUpperCase(),
          name: newDrgName.trim(),
          system: newDrgSystem.trim(),
          title: newDrgTitle.trim(),
          description: newDrgDesc.trim(),
          author: newDrgAuthor.trim() || "Operador Torre",
          revision: newDrgRevision.trim() || "Rev. A",
          materials: []
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro de rede.");
      }

      await loadDatabaseData();
      setSelectedDrawingId(newDrgId.trim().toUpperCase());
      setIsAddingDrawing(false);
      setNewDrgId("");
      setNewDrgName("");
      setNewDrgSystem("");
      setNewDrgTitle("");
      setNewDrgDesc("");
      setNewDrgAuthor("");
      addNotification(`Desenho Técnico ${newDrgId.toUpperCase()} inserido com sucesso!`, "success");
    } catch (err: any) {
      addNotification(err.message || "Erro ao registrar desenho técnico.", "warn");
    }
  };

  // Add material to drawing BOM (POST to central backend database)
  const handleAddMaterialToDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatPos || !newMatPartId || !newMatQty) {
      addNotification("Preencha POS, Part ID e Quantidade para inserir.", "warn");
      return;
    }

    try {
      const res = await fetch(`/api/drawings/${activeDrawing.id}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pos: newMatPos.trim(),
          partId: newMatPartId.trim().toUpperCase(),
          description: newMatDesc.trim() || "Insumo inserido manualmente",
          um: newMatUm.trim(),
          qtyNeeded: Number(newMatQty) || 1
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro de rede.");
      }

      await loadDatabaseData();
      setIsAddingMaterial(false);
      setNewMatPos("");
      setNewMatPartId("");
      setNewMatDesc("");
      setNewMatUm("PÇ");
      setNewMatQty(1);
      addNotification(`Material ${newMatPartId.trim().toUpperCase()} inserido no desenho ${activeDrawing.id}!`, "success");
    } catch (err: any) {
      addNotification(err.message || "Erro ao registrar material no desenho.", "warn");
    }
  };

  // Export spreadsheet simulation
  const handleExportReconciliation = () => {
    addNotification("Relatório de conciliação do Jobbook exportado para planilha Google Sheets com sucesso!", "success");
  };

  // Computation Logic: Total system consumption across ALL drawings for a selected Part ID
  const computePartAllocation = (partId: string, system: string) => {
    // Find jobbook record for this part
    const jbRecord = jobbook.find(j => j.partId.toUpperCase() === partId.toUpperCase() && j.functionCode === system);
    
    // Calculate total needed by all drawings for this system
    const systemDrawings = drawings.filter(d => d.system === system);
    const allocationsDetail = systemDrawings.map(d => {
      const mat = d.materials.find(m => m.partId.toUpperCase() === partId.toUpperCase());
      return {
        drawingId: d.id,
        drawingName: d.name,
        qty: mat ? mat.qtyNeeded : 0
      };
    }).filter(a => a.qty > 0);

    const totalConsumed = allocationsDetail.reduce((sum, item) => sum + item.qty, 0);
    const demanded = jbRecord ? jbRecord.qtyDemanded : 0;
    const balance = demanded - totalConsumed;

    return {
      jbRecord,
      allocationsDetail,
      totalConsumed,
      demanded,
      balance,
      isPerfectMatch: balance === 0,
      hasSurplus: balance > 0,
      hasShortage: balance < 0
    };
  };

  // Filtered Jobbook list
  const filteredJobbook = jobbook.filter(record => {
    const matchesSearch = searchPartId ? record.partId.toUpperCase().includes(searchPartId.toUpperCase()) || record.sapCode.toUpperCase().includes(searchPartId.toUpperCase()) || record.description.toLowerCase().includes(searchPartId.toLowerCase()) : true;
    const matchesSystem = filterSystem ? record.functionCode === filterSystem : true;
    return matchesSearch && matchesSystem;
  });

  // Calculate allocation for currently focused search item
  const selectedPartAllocation = searchPartId ? computePartAllocation(searchPartId, activeDrawing.system) : null;

  return (
    <div id="jobbook-integration" className="space-y-6">
      
      {/* Upper informational bar */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold border border-indigo-500/20">
              <Compass className="w-3.5 h-3.5" />
              Módulo de Engenharia Industrial
            </div>
            <h2 className="text-2xl font-bold text-white font-sans">
              Conciliação de Desenhos Técnicos & Jobbook
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Compare as listas de materiais (BOM) contidas nos desenhos de projeto com os lotes de suprimentos (Jobbook) enviados para a obra. Identifique saldos remanescentes e códigos SAP.
            </p>
          </div>

          <button
            onClick={handleExportReconciliation}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <Download className="w-4 h-4" />
            Exportar Consolidação
          </button>
        </div>

        {/* Notifications container */}
        {notifications.length > 0 && (
          <div className="mt-4 border-t border-slate-800 pt-3 flex flex-wrap gap-2 animate-fade-in">
            {notifications.map(n => (
              <span 
                key={n.id} 
                className={`text-[10px] px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 ${
                  n.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  n.type === "warn" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-slate-950 text-slate-300 border border-slate-800"
                }`}
              >
                {n.type === "success" && <Check className="w-3 h-3 text-emerald-400" />}
                {n.type === "warn" && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                {n.type === "info" && <Info className="w-3 h-3 text-indigo-400" />}
                {n.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main split-screen container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Section: Drawing blueprint & Material list (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            
            {/* Drawing Selector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider font-bold">Arquivo DWG do Projeto</span>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <select 
                    value={selectedDrawingId}
                    onChange={(e) => setSelectedDrawingId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm font-bold font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[280px]"
                  >
                    {drawings.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.id})
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setIsAddingDrawing(!isAddingDrawing)}
                    className="ml-2 px-2.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Inserir DWG
                  </button>
                </div>
              </div>

              {/* Drawing system indicator badges */}
              <div className="flex items-center gap-2">
                <div className="bg-indigo-500/15 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-right">
                  <p className="text-[9px] text-slate-500 font-mono">CÓD. SISTEMA</p>
                  <p className="text-xs font-bold text-indigo-400 font-mono">SISTEMA {activeDrawing ? activeDrawing.system : "N/D"}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
                  <p className="text-[9px] text-slate-500 font-mono">REVISÃO</p>
                  <p className="text-xs font-bold text-white font-mono">{activeDrawing ? activeDrawing.revision : "N/D"}</p>
                </div>
              </div>
            </div>

            {/* Inserir Novo Desenho Form */}
            {isAddingDrawing && (
              <form onSubmit={handleAddDrawing} className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3 animate-in slide-in-from-top-3 duration-200">
                <div className="flex justify-between items-center pb-1 border-b border-slate-900">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    Inserir Novo Desenho Técnico (DWG)
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingDrawing(false)}
                    className="text-slate-500 hover:text-white text-xs font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Código Desenho (ID):</label>
                    <input 
                      type="text" 
                      value={newDrgId} 
                      onChange={(e) => {
                        setNewDrgId(e.target.value);
                        // Auto populate filename first part
                        if (e.target.value) {
                          const parts = e.target.value.split("-");
                          if (parts[0] && !newDrgSystem) {
                            setNewDrgSystem(parts[0]);
                          }
                        }
                      }}
                      placeholder="Ex: 310-M-004"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Nome do Arquivo .DWG:</label>
                    <input 
                      type="text" 
                      value={newDrgName} 
                      onChange={(e) => setNewDrgName(e.target.value)}
                      placeholder="Ex: 310-M-004_Suportes.dwg"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Sistema (Function Code):</label>
                    <input 
                      type="text" 
                      value={newDrgSystem} 
                      onChange={(e) => setNewDrgSystem(e.target.value)}
                      placeholder="Ex: 310"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-400">Título / Descritivo Geral do Desenho:</label>
                    <input 
                      type="text" 
                      value={newDrgTitle} 
                      onChange={(e) => setNewDrgTitle(e.target.value)}
                      placeholder="Ex: Desenho Executivo de Distribuição de Suportes"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Responsável / Projetista:</label>
                    <input 
                      type="text" 
                      value={newDrgAuthor} 
                      onChange={(e) => setNewDrgAuthor(e.target.value)}
                      placeholder="Ex: Eng. Maurício Santos"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Descrição Detalhada:</label>
                    <input 
                      type="text" 
                      value={newDrgDesc} 
                      onChange={(e) => setNewDrgDesc(e.target.value)}
                      placeholder="Detalhes sobre a planta industrial, ramificações..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Revisão:</label>
                    <input 
                      type="text" 
                      value={newDrgRevision} 
                      onChange={(e) => setNewDrgRevision(e.target.value)}
                      placeholder="Ex: Rev. A"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingDrawing(false)}
                    className="px-2.5 py-1 text-slate-400 text-xs hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded"
                  >
                    Salvar Desenho no Banco
                  </button>
                </div>
              </form>
            )}

            {/* Drawing Summary & Author */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <h4 className="text-sm font-bold text-white font-sans">{activeDrawing.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{activeDrawing.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                <span>Responsável: {activeDrawing.author}</span>
                <span>Data Emissão: {activeDrawing.date}</span>
              </div>
            </div>

            {/* Interactive Blueprint Vector Simulation */}
            <div className="relative bg-slate-950 rounded-xl border border-slate-850 h-56 w-full overflow-hidden flex flex-col justify-between p-3 select-none">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
              
              {/* CAD blueprint lines */}
              <svg className="absolute inset-0 w-full h-full text-indigo-900/30" pointerEvents="none">
                <line x1="10%" y1="45%" x2="90%" y2="45%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="60%" y1="45%" x2="60%" y2="25%" stroke="currentColor" strokeWidth="2" />
                <line x1="60%" y1="25%" x2="75%" y2="25%" stroke="currentColor" strokeWidth="2" />
                <line x1="75%" y1="25%" x2="75%" y2="65%" stroke="currentColor" strokeWidth="2" strokeDasharray="2" />
              </svg>

              <div className="relative flex justify-between items-center text-[10px] text-slate-500 font-mono border-b border-slate-900 pb-1">
                <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 animate-pulse text-indigo-500" /> CAD Diagrama de Fluxo Dinâmico</span>
                <span>ISO VIEW 1-A</span>
              </div>

              {/* Dynamic Blueprint CAD Interactive Nodes */}
              <div className="relative flex-1">
                {activeDrawing.blueprintNodes.map((node) => {
                  const isNodeActive = activeNodeId === node.id || searchPartId.toUpperCase() === node.partId.toUpperCase();
                  
                  return (
                    <button
                      key={node.id}
                      onClick={() => handleSelectPart(node.partId)}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg flex flex-col items-center gap-1 group transition-all ${
                        isNodeActive 
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20 scale-110 z-10" 
                          : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                      }`}
                      title={`Clique para buscar ${node.partId}`}
                    >
                      {node.type === "valve" && <Wrench className={`w-3.5 h-3.5 ${isNodeActive ? "animate-bounce" : ""}`} />}
                      {node.type === "pump" && <Cpu className="w-3.5 h-3.5" />}
                      {node.type === "flange" && <Sliders className="w-3.5 h-3.5" />}
                      {node.type === "pipe" && <Layers className="w-3.5 h-3.5" />}
                      <span className="text-[8px] font-mono whitespace-nowrap hidden group-hover:block bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 absolute -bottom-5">
                        {node.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative text-[9px] text-slate-600 font-mono text-center">
                💡 Clique nos componentes interativos do desenho para copiá-los e localizá-los no Jobbook.
              </div>
            </div>

            {/* Bill of Materials (Lista de Materiais do Desenho) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Lista de Materiais do Desenho (BOM)
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">{activeDrawing.materials.length} itens</span>
                  <button
                    onClick={() => setIsAddingMaterial(!isAddingMaterial)}
                    className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 rounded text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Inserir Item BOM
                  </button>
                </div>
              </div>

              {/* Inserir Material na BOM Form */}
              {isAddingMaterial && (
                <form onSubmit={handleAddMaterialToDrawing} className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-3 animate-in slide-in-from-top-3 duration-200">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-900">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      Inserir Item na BOM do Desenho {activeDrawing.id}
                    </p>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingMaterial(false)}
                      className="text-slate-500 hover:text-white text-xs font-bold"
                    >
                      ×
                  </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">POS (Item Nº):</label>
                      <input 
                        type="text" 
                        value={newMatPos} 
                        onChange={(e) => setNewMatPos(e.target.value)}
                        placeholder="Ex: 04"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Part ID / Part Number:</label>
                      <input 
                        type="text" 
                        value={newMatPartId} 
                        onChange={(e) => setNewMatPartId(e.target.value)}
                        placeholder="Ex: FLG-WNR-A105"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">U.M. (Unid. Medida):</label>
                      <input 
                        type="text" 
                        value={newMatUm} 
                        onChange={(e) => setNewMatUm(e.target.value)}
                        placeholder="Ex: PÇ"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Qtd Requerida:</label>
                      <input 
                        type="number" 
                        value={newMatQty} 
                        onChange={(e) => setNewMatQty(Number(e.target.value))}
                        min="1"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Descritivo Completo do Material:</label>
                    <input 
                      type="text" 
                      value={newMatDesc} 
                      onChange={(e) => setNewMatDesc(e.target.value)}
                      placeholder="Ex: Flange Cego Aço Carbono ASTM A105 2 polegadas"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingMaterial(false)}
                      className="px-2.5 py-1 text-slate-400 text-xs hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded"
                    >
                      Salvar Item na BOM
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-mono">
                      <th className="p-3">POS</th>
                      <th className="p-3">PART ID / PART NUMBER</th>
                      <th className="p-3">DESCRITIVO DO MATERIAL</th>
                      <th className="p-3">U.M.</th>
                      <th className="p-3 text-right">QTD REQUERIDA</th>
                      <th className="p-3 text-center">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {activeDrawing.materials.map((mat) => {
                      const isSelected = searchPartId.toUpperCase() === mat.partId.toUpperCase();
                      
                      return (
                        <tr 
                          key={mat.pos} 
                          onClick={() => handleSelectPart(mat.partId)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-indigo-600/10 text-white" 
                              : "hover:bg-slate-900/50"
                          }`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-500">{mat.pos}</td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-indigo-400 bg-indigo-450/5 border border-indigo-500/10 px-2 py-0.5 rounded text-[11px]">
                              {mat.partId}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-[11px] max-w-[220px] truncate" title={mat.description}>
                            {mat.description}
                          </td>
                          <td className="p-3 font-mono text-slate-400 text-[11px]">{mat.um}</td>
                          <td className="p-3 font-mono text-right font-bold text-white">{mat.qtyNeeded}</td>
                          <td className="p-3 text-center">
                            <button
                              className={`text-[10px] px-2 py-1 rounded font-semibold transition-all ${
                                isSelected 
                                  ? "bg-indigo-600 text-white" 
                                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              {isSelected ? "Selecionado" : "Copiar & Buscar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* Right Section: Jobbook Database Simulator & Conciliator (5 columns) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Jobbook Records Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Database className="w-4.5 h-4.5 text-emerald-400" />
                  Banco de Dados do Jobbook (Central)
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Lotes de remessa do almoxarifado integrados ao PostgreSQL.</p>
              </div>

              <button
                onClick={() => setIsAddingToJobbook(!isAddingToJobbook)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Registrador
              </button>
            </div>

            {/* Quick Add Form */}
            {isAddingToJobbook && (
              <form onSubmit={handleAddJobbookRecord} className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3 animate-in slide-in-from-top-3 duration-200">
                <p className="text-xs font-bold text-white flex items-center gap-1"><Plus className="w-3.5 h-3.5 text-indigo-400" /> Cadastrar novo Part ID no Jobbook</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Part ID / Part Number:</label>
                    <input 
                      type="text" 
                      value={newPartId} 
                      onChange={(e) => setNewPartId(e.target.value)}
                      placeholder="Ex: VLV-GLB-400X"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Sistema / Function Code:</label>
                    <input 
                      type="text" 
                      value={newSystem} 
                      onChange={(e) => setNewSystem(e.target.value)}
                      placeholder="Ex: 310"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Descrição do Material:</label>
                  <input 
                    type="text" 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Descrição para identificação na lista..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Código SAP:</label>
                    <input 
                      type="text" 
                      value={newSap} 
                      onChange={(e) => setNewSap(e.target.value)}
                      placeholder="Ex: SAP-123456"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Quantidade Alocada (System Qty):</label>
                    <input 
                      type="number" 
                      value={newQty} 
                      onChange={(e) => setNewQty(Number(e.target.value))}
                      min="1"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingToJobbook(false)}
                    className="px-2.5 py-1 text-slate-400 text-xs hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded"
                  >
                    Salvar no PostgreSQL
                  </button>
                </div>
              </form>
            )}

            {/* Filtering Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-mono">FILTRAR POR SISTEMA</label>
                <div className="relative">
                  <select 
                    value={filterSystem}
                    onChange={(e) => setFilterSystem(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Todos os Sistemas</option>
                    <option value="310">Sistema 310 (Válvulas)</option>
                    <option value="333">Sistema 333 (Bombas)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-mono">BUSCAR PART ID / SAP</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchPartId} 
                    onChange={(e) => setSearchPartId(e.target.value)}
                    placeholder="Ex: VLV-GLB-400X..."
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded pl-2.5 pr-7 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                  {searchPartId && (
                    <button 
                      onClick={() => setSearchPartId("")}
                      className="absolute right-2 top-2 text-slate-500 hover:text-white text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Jobbook Table Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Remessas listadas ({filteredJobbook.length})</span>
                {filterSystem && <span>Sistema ativo: {filterSystem}</span>}
              </div>

              <div className="overflow-y-auto max-h-[220px] border border-slate-850 rounded-xl bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 sticky top-0">
                      <th className="p-2.5">SISTEMA</th>
                      <th className="p-2.5">PART ID</th>
                      <th className="p-2.5">CÓD. SAP</th>
                      <th className="p-2.5 text-right">QTD REQUERIDA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {filteredJobbook.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                          Nenhum registro encontrado no Jobbook com os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      filteredJobbook.map((record) => {
                        const isSelected = searchPartId.toUpperCase() === record.partId.toUpperCase();
                        
                        return (
                          <tr 
                            key={record.id} 
                            onClick={() => {
                              setSearchPartId(record.partId);
                              setFilterSystem(record.functionCode);
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? "bg-emerald-600/10 text-emerald-300 font-bold" 
                                : "hover:bg-slate-900/40"
                            }`}
                          >
                            <td className="p-2.5 text-indigo-400 font-bold">{record.functionCode}</td>
                            <td className="p-2.5">
                              <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                {record.partId}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400 text-[11px]">{record.sapCode}</td>
                            <td className="p-2.5 text-right text-white font-bold">{record.qtyDemanded}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Allocation reconciliation calculator / math validation (as requested by user) */}
          {selectedPartAllocation && (
            <div className="bg-slate-900 border border-emerald-500/10 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
              
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
                    Conciliador Automático de Saldo
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Recalcula em tempo real a suficiência do suprimento para o sistema.</p>
                </div>
                
                <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  {selectedPartAllocation.jbRecord?.sapCode || "Sem Código SAP"}
                </span>
              </div>

              {/* Status breakdown panel */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Part Number Pesquisado:</span>
                  <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{searchPartId}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Nome do Sistema no Desenho:</span>
                  <span className="font-mono font-bold text-indigo-400">Sistema {activeDrawing.system}</span>
                </div>

                <div className="border-t border-slate-900 pt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <p className="text-[9px] text-slate-500 font-mono">QTD JOBBOOK</p>
                    <p className="text-lg font-bold text-white font-mono mt-0.5">{selectedPartAllocation.demanded}</p>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <p className="text-[9px] text-slate-500 font-mono">REQUERIDO HOJE</p>
                    <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                      {activeDrawing.materials.find(m => m.partId.toUpperCase() === searchPartId.toUpperCase())?.qtyNeeded || 0}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    selectedPartAllocation.balance < 0 ? "bg-red-500/10" : "bg-emerald-500/10"
                  }`}>
                    <p className="text-[9px] text-slate-500 font-mono">SALDO SISTEMA</p>
                    <p className={`text-lg font-bold font-mono mt-0.5 ${
                      selectedPartAllocation.balance < 0 ? "text-red-400" : "text-emerald-400"
                    }`}>
                      {selectedPartAllocation.balance}
                    </p>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                {selectedPartAllocation.demanded > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Uso Alocado por este desenho</span>
                      <span>
                        {Math.min(100, Math.round(((activeDrawing.materials.find(m => m.partId.toUpperCase() === searchPartId.toUpperCase())?.qtyNeeded || 0) / selectedPartAllocation.demanded) * 100))}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, ((activeDrawing.materials.find(m => m.partId.toUpperCase() === searchPartId.toUpperCase())?.qtyNeeded || 0) / selectedPartAllocation.demanded) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Share Breakdown across other drawings - EXACTLY as the user explained! */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Consumo Compartilhado (Outros Desenhos deste Sistema):</p>
                
                <div className="space-y-1.5">
                  {selectedPartAllocation.allocationsDetail.map((alloc) => {
                    const isCurrent = alloc.drawingId === activeDrawing.id;
                    return (
                      <div 
                        key={alloc.drawingId}
                        className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                          isCurrent 
                            ? "bg-indigo-600/10 border-indigo-500/30 text-white" 
                            : "bg-slate-950 border-slate-850 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <div>
                            <p className="font-bold font-mono">{alloc.drawingId}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{alloc.drawingName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-white">{alloc.qty}</span>
                          <span className="text-[10px] text-slate-500 font-mono ml-1">PÇ</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Balance Verdict Badge */}
              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                {selectedPartAllocation.isPerfectMatch ? (
                  <div className="flex items-start gap-2 text-emerald-400 text-xs leading-normal">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Suficiência Confirmada (Tá Batendo!)</span>
                      <p className="text-slate-500 mt-0.5 text-[10px]">A quantidade enviada no Jobbook atende perfeitamente à demanda deste desenho.</p>
                    </div>
                  </div>
                ) : selectedPartAllocation.hasSurplus ? (
                  <div className="flex items-start gap-2 text-amber-400 text-xs leading-normal">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Saldo de Sistema Disponível</span>
                      <p className="text-slate-400 mt-0.5 text-[10px]">
                        Este desenho consome <strong className="text-white">{activeDrawing.materials.find(m => m.partId.toUpperCase() === searchPartId.toUpperCase())?.qtyNeeded || 0} unidade(s)</strong>. 
                        As restantes <strong className="text-white">{selectedPartAllocation.balance} unidade(s)</strong> do lote de {selectedPartAllocation.demanded} estão disponíveis para os outros desenhos relacionados ao sistema.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-red-400 text-xs leading-normal">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Déficit de Atendimento</span>
                      <p className="text-slate-500 mt-0.5 text-[10px]">As requisições somadas dos desenhos ultrapassam o lote enviado pelo suprimento no Jobbook.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {!selectedPartAllocation && (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Nenhum componente selecionado</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Selecione um Part Number na Lista de Materiais do Desenho Técnico para recalcular o saldo do Jobbook automaticamente.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
