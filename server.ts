import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Container, SystemLog, DashboardStats, Material, PurchaseRequest, Drawing, JobbookRecord } from "./src/types";

// Setup Express
const app = express();
app.use(express.json());
const PORT = 3000;

// Internal "Database" States
let containers: Container[] = [];
let logs: SystemLog[] = [];
let totalResolvedCount = 0;
let materials: Material[] = [];
let purchaseRequests: PurchaseRequest[] = [];
let drawings: Drawing[] = [];
let jobbook: JobbookRecord[] = [];

function getMaterialStatus(current: number, minimum: number): "Suficiente" | "Alerta (Mínimo)" | "Crítico (Falta)" {
  if (current <= 0) return "Crítico (Falta)";
  if (current < minimum) return "Alerta (Mínimo)";
  return "Suficiente";
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

function addLog(level: "info" | "warn" | "error" | "success", category: SystemLog["category"], message: string) {
  const newLog: SystemLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
  };
  logs.unshift(newLog); // Newer logs first
  if (logs.length > 200) {
    logs.pop();
  }
}

// Initial Seeding
function resetDatabase() {
  containers = [
    {
      id: "CONT-4021",
      size: 40,
      type: "Reefer",
      owner: "Maersk",
      legacyStatus: "No Porto",
      legacyLocation: "Cais 1 - Porto de Santos",
      legacyLastUpdated: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4h ago
      spreadsheetStatus: "Em Trânsito",
      spreadsheetLocation: "Rodovia Anchieta KM 32",
      spreadsheetLastUpdated: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1h ago
      spreadsheetOperator: "João Silva",
      spreadsheetNotes: "Motorista reportou início de trânsito às 10h. Planilha atualizada manualmente.",
      status: "No Porto",
      location: "Cais 1 - Porto de Santos",
      operatorNotes: "Importado do Sistema Legado.",
      lastSyncTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      isDivergent: true,
      divergences: {
        status: { legacy: "No Porto", spreadsheet: "Em Trânsito" },
        location: { legacy: "Cais 1 - Porto de Santos", spreadsheet: "Rodovia Anchieta KM 32" }
      }
    },
    {
      id: "CONT-2089",
      size: 20,
      type: "Dry Van",
      owner: "MSC",
      legacyStatus: "Retido",
      legacyLocation: "Terminal Retroportuário Alfandegado",
      legacyLastUpdated: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      spreadsheetStatus: "Retido",
      spreadsheetLocation: "Terminal Retroportuário Alfandegado",
      spreadsheetLastUpdated: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      spreadsheetOperator: "Maria Souza",
      spreadsheetNotes: "Aguardando canal de parametrização da Receita Federal.",
      status: "Retido",
      location: "Terminal Retroportuário Alfandegado",
      operatorNotes: "Consolidado - Dados idênticos em ambos os canais.",
      lastSyncTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      isDivergent: false,
      divergences: {}
    },
    {
      id: "CONT-4054",
      size: 40,
      type: "Flat Rack",
      owner: "CMA CGM",
      legacyStatus: "Liberado",
      legacyLocation: "Cais 2 - Porto de Santos",
      legacyLastUpdated: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      spreadsheetStatus: "No Porto",
      spreadsheetLocation: "Cais 2 - Porto de Santos",
      spreadsheetLastUpdated: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      spreadsheetOperator: "Ana Costa",
      spreadsheetNotes: "Contêiner descarregado, aguardando faturamento na planilha.",
      status: "Liberado",
      location: "Cais 2 - Porto de Santos",
      operatorNotes: "Sistema Legado reportou liberação aduaneira.",
      lastSyncTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      isDivergent: true,
      divergences: {
        status: { legacy: "Liberado", spreadsheet: "No Porto" }
      }
    },
    {
      id: "CONT-2012",
      size: 20,
      type: "Open Top",
      owner: "Hapag-Lloyd",
      legacyStatus: "Liberado",
      legacyLocation: "Cais 3 - Terminal Libra",
      legacyLastUpdated: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      spreadsheetStatus: "Liberado",
      spreadsheetLocation: "Armazém Secundário - São Paulo",
      spreadsheetLastUpdated: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      spreadsheetOperator: "Roberto Lima",
      spreadsheetNotes: "Entrega física efetuada no armazém do cliente. Atualizado na planilha.",
      status: "Liberado",
      location: "Cais 3 - Terminal Libra",
      operatorNotes: "Divergência logística de localização.",
      lastSyncTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      isDivergent: true,
      divergences: {
        location: { legacy: "Cais 3 - Terminal Libra", spreadsheet: "Armazém Secundário - São Paulo" }
      }
    },
    {
      id: "CONT-4099",
      size: 40,
      type: "Dry Van",
      owner: "ONE",
      legacyStatus: "Entregue",
      legacyLocation: "Fábrica Importador - Sorocaba",
      legacyLastUpdated: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      spreadsheetStatus: "Entregue",
      spreadsheetLocation: "Fábrica Importador - Sorocaba",
      spreadsheetLastUpdated: new Date(Date.now() - 35 * 3600 * 1000).toISOString(),
      spreadsheetOperator: "João Silva",
      spreadsheetNotes: "Canhoto de entrega assinado e digitalizado.",
      status: "Entregue",
      location: "Fábrica Importador - Sorocaba",
      operatorNotes: "Consolidado - Entrega concluída.",
      lastSyncTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      isDivergent: false,
      divergences: {}
    }
  ];

  logs = [];
  totalResolvedCount = 2; // initial resolved mock

  materials = [
    {
      id: "MAT-REF-01",
      name: "Compressores Scroll Carrier 40HP",
      category: "Reefer",
      stockCurrent: 4,
      stockMinimum: 3,
      stockUnit: "peças",
      priceUnit: 4500.00,
      supplier: "Carrier Parts Brasil",
      leadTimeDays: 7,
      status: "Suficiente"
    },
    {
      id: "MAT-REF-02",
      name: "Cilindro Gás Refrigerante R134a (13.6kg)",
      category: "Reefer",
      stockCurrent: 2,
      stockMinimum: 5,
      stockUnit: "cilindros",
      priceUnit: 680.00,
      supplier: "DuPont Gases Industriais",
      leadTimeDays: 4,
      status: "Alerta (Mínimo)"
    },
    {
      id: "MAT-EST-01",
      name: "Plaquetas de Aço de Canto (Corner Castings)",
      category: "Estrutural",
      stockCurrent: 12,
      stockMinimum: 10,
      stockUnit: "unidades",
      priceUnit: 250.00,
      supplier: "Metalúrgica Santos",
      leadTimeDays: 5,
      status: "Suficiente"
    },
    {
      id: "MAT-EST-02",
      name: "Borrachas de Vedação de Porta 40HC (Gaskets)",
      category: "Estrutural",
      stockCurrent: 0,
      stockMinimum: 6,
      stockUnit: "metros",
      priceUnit: 45.00,
      supplier: "Borrachas Piracicaba",
      leadTimeDays: 3,
      status: "Crítico (Falta)"
    },
    {
      id: "MAT-CON-01",
      name: "Lacres de Alta Segurança (Bullet Seals)",
      category: "Consumível",
      stockCurrent: 450,
      stockMinimum: 200,
      stockUnit: "unidades",
      priceUnit: 3.50,
      supplier: "SegurMax Lacres",
      leadTimeDays: 2,
      status: "Suficiente"
    }
  ];

  purchaseRequests = [
    {
      id: "REQ-1002",
      materialId: "MAT-EST-02",
      materialName: "Borrachas de Vedação de Porta 40HC (Gaskets)",
      quantityRequested: 15,
      unitPrice: 45.00,
      totalPrice: 675.00,
      dateRequested: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: "Aprovado",
      leadTimeDays: 3,
      estimatedArrivalDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString()
    }
  ];

  drawings = [
    {
      id: "310-ME-001",
      name: "310-ME-001_MainEngineCooling.dwg",
      system: "310 (Main Engine)",
      title: "Resfriamento Caterpillar 3512C HD TA (P.S. & S.B. Main Engine)",
      description: "Diagrama hidráulico dos sistemas de Baixa Temperatura (LT) e Alta Temperatura (HT) dos motores de propulsão principal (Pá de Boreste e Bombordo) para Caterpillar 3512C HD TA.",
      date: "14/07/2026",
      author: "Eng. Caterpillar Marine",
      revision: "Rev. C",
      materials: [
        { pos: "001", partId: "1000814", description: "Fill and drain valve, 447, 1/2\" (15), BSPP male, Hose pillar, Button, PN16, Brass", um: "PÇ", qtyNeeded: 4 },
        { pos: "003", partId: "1011083", description: "ASSY, Level Switch, Cooling water with accessories, EL150K1/ZA", um: "PÇ", qtyNeeded: 4 },
        { pos: "006", partId: "1000450", description: "Globe valve, 241, Straight, Fixed disc, DN32, Flange, Hand wheel, PN16", um: "PÇ", qtyNeeded: 4 },
        { pos: "007", partId: "1000282", description: "Check valve, 70GY, Swing type, Straight, DN80, Flange, Cast iron", um: "PÇ", qtyNeeded: 1 },
        { pos: "009", partId: "1473106", description: "[TA], Butterfly valve, 4621, DN80, Flange, Sealing:EPDM, Squeeze lever, PN16", um: "PÇ", qtyNeeded: 8 },
        { pos: "012", partId: "1011155", description: "Glass thermometer, 1645, 0/120Cel, L=63mm, 1/2\", BSPP male, Brass", um: "PÇ", qtyNeeded: 14 }
      ],
      blueprintNodes: [
        { id: "node-1", type: "valve", label: "Válvula Globo (Pos 006)", partId: "1000450", x: 30, y: 35 },
        { id: "node-2", type: "valve", label: "Borboleta EPDM (Pos 009)", partId: "1473106", x: 55, y: 35 },
        { id: "node-3", type: "pump", label: "Sensor de Nível (Pos 003)", partId: "1011083", x: 75, y: 55 },
        { id: "node-4", type: "flange", label: "Termômetro Latão (Pos 012)", partId: "1011155", x: 15, y: 55 },
        { id: "node-5", type: "pipe", label: "Retenção Swing (Pos 007)", partId: "1000282", x: 45, y: 70 }
      ]
    },
    {
      id: "310-FIFI-002",
      name: "310-FIFI-002_BilgeDeckwashFiFi.dwg",
      system: "310 (Bilge & FiFi)",
      title: "Módulo de Porão, Lavagem de Conveses e Combate a Incêndio (Bilge / FiFi)",
      description: "Arranjo físico de sucção de porão da praça de máquinas (E.R.), bombas de serviço geral e ramais de hidrantes com mangueiras e esguichos.",
      date: "14/07/2026",
      author: "Azcue Pumps & FiFi Marine",
      revision: "Rev. B",
      materials: [
        { pos: "001", partId: "1000655", description: "Globe valve, 268, Straight, SDNR disc, DN50, Flange, Hand wheel, PN16", um: "PÇ", qtyNeeded: 1 },
        { pos: "002", partId: "1431296", description: "ASSY, MODULE, Bilge – Deckwash – Internal FiFi System", um: "PÇ", qtyNeeded: 1 },
        { pos: "013", partId: "1000181", description: "ASSY, Firefighting valve, 912/920, Right-angled, DN50, Flange, Bronze", um: "PÇ", qtyNeeded: 2 },
        { pos: "019", partId: "1011710", description: "Suction basket, square, L=160mm, W=160mm, H=160mm, Steel zinc coated", um: "PÇ", qtyNeeded: 2 },
        { pos: "028", partId: "1446345", description: "[TA MED], Fire hose, With 2 Storz coupling, Red, L=15m, di=50mm, 20bar", um: "PÇ", qtyNeeded: 5 },
        { pos: "039", partId: "1367960", description: "Bucket filter, Single, 1187, DN80, PN4, Flange, FL:PN10, Cast iron", um: "PÇ", qtyNeeded: 1 }
      ],
      blueprintNodes: [
        { id: "node-f1", type: "pump", label: "Módulo FiFi (Pos 002)", partId: "1431296", x: 45, y: 45 },
        { id: "node-f2", type: "valve", label: "Válvula FiFi Bronze (Pos 013)", partId: "1000181", x: 20, y: 25 },
        { id: "node-f3", type: "pipe", label: "Ralo de Sucção (Pos 019)", partId: "1011710", x: 20, y: 75 },
        { id: "node-f4", type: "pipe", label: "Filtro Cesta DN80 (Pos 039)", partId: "1367960", x: 70, y: 45 },
        { id: "node-f5", type: "valve", label: "Globo SDNR DN50 (Pos 001)", partId: "1000655", x: 75, y: 25 }
      ]
    },
    {
      id: "345-STP-003",
      name: "345-STP-003_SewageTreatment.dwg",
      system: "345 (Sewage STP)",
      title: "Estação de Tratamento de Efluentes Sanitários - Selmar Blue Sea 2500",
      description: "Fluxograma de processo e interligações da unidade de tratamento biológico/químico de esgoto (capacidade 2500 L/dia, 60Hz, 440V).",
      date: "12/07/2026",
      author: "Enga. Selmar Environmental",
      revision: "Rev. A",
      materials: [
        { pos: "002", partId: "1000038", description: "[TA], Ball valve, GF-546, Straight, DN32, Glue sleeve, Sealing:EPDM, PVC-C", um: "PÇ", qtyNeeded: 4 },
        { pos: "003", partId: "1000039", description: "[TA], Ball valve, GF-546, Straight, DN40, Glue sleeve, Sealing:EPDM, PVC-C", um: "PÇ", qtyNeeded: 3 },
        { pos: "010", partId: "1390564", description: "Valve, Anti-siphon valve 0197, male G1/2\", Max pressure 16Bar, Bronze", um: "PÇ", qtyNeeded: 2 },
        { pos: "028", partId: "1556501", description: "Supplier Package, Blue sea plus 2500, 60Hz, 440V (Macerator + Pumps)", um: "PÇ", qtyNeeded: 1 },
        { pos: "029", partId: "1157802", description: "[TA], Check valve, GF-561, Sinking ball, Straight, DN40, PVC-C", um: "PÇ", qtyNeeded: 1 },
        { pos: "034", partId: "1011342", description: "Y-filter, 1017, DN50, PN16, Flange, FL:PN16, Mesh=1mm, Bronze RG5", um: "PÇ", qtyNeeded: 1 }
      ],
      blueprintNodes: [
        { id: "node-st1", type: "pump", label: "Skid Blue Sea 2500 (Pos 028)", partId: "1556501", x: 40, y: 50 },
        { id: "node-st2", type: "valve", label: "Válvula Esfera DN32 (Pos 002)", partId: "1000038", x: 15, y: 35 },
        { id: "node-st3", type: "valve", label: "Válvula Esfera DN40 (Pos 003)", partId: "1000039", x: 65, y: 35 },
        { id: "node-st4", type: "valve", label: "Válvula Anti-Sifão (Pos 010)", partId: "1390564", x: 80, y: 20 },
        { id: "node-st5", type: "flange", label: "Filtro Y DN50 (Pos 034)", partId: "1011342", x: 15, y: 65 }
      ]
    },
    {
      id: "341-HYD-004",
      name: "341-HYD-004_HydrophoreSet.dwg",
      system: "341 (Fresh Water)",
      title: "Grupo Pressurizador de Água Doce - Hydrophore Euroinox 40/50T",
      description: "Sistema de pressurização e distribuição de água quente/fria para os consumidores com vaso de expansão de membrana e transdutores.",
      date: "13/07/2026",
      author: "Eng. DAB Pumps Italy",
      revision: "Rev. A",
      materials: [
        { pos: "012", partId: "1204546", description: "SD valve, DN25, press-fit, PN16, Sealing:EPDM, handwheel, Bronze, Mapress", um: "PÇ", qtyNeeded: 6 },
        { pos: "013", partId: "1204545", description: "SD valve, DN20, press-fit, PN16, Sealing:EPDM, handwheel, Bronze, Mapress", um: "PÇ", qtyNeeded: 2 },
        { pos: "020", partId: "1011449", description: "Y-filter, 1013, 1.1/4\" (32), PN16, BSPP female, Mesh=1mm, Bronze RG5", um: "PÇ", qtyNeeded: 1 },
        { pos: "024", partId: "1011166", description: "Sanitary Tap, 1/2inch x 3/4inch, Outside tap with NR-valve", um: "PÇ", qtyNeeded: 3 },
        { pos: "028", partId: "1544520", description: "Pump, Hydrophore, Euroinox 40/50T, AD 1.0 M/T, 50Hz/1.0kW/220V", um: "PÇ", qtyNeeded: 1 },
        { pos: "035", partId: "1627530", description: "Hose, Water, 1\" (25), di=25mm, L=0.3m, EPDM braiding Stainless steel", um: "PÇ", qtyNeeded: 1 }
      ],
      blueprintNodes: [
        { id: "node-h1", type: "pump", label: "Bomba Hydrophore (Pos 028)", partId: "1544520", x: 50, y: 55 },
        { id: "node-h2", type: "valve", label: "Válvula Gaveta DN25 (Pos 012)", partId: "1204546", x: 25, y: 35 },
        { id: "node-h3", type: "flange", label: "Filtro Y 1-1/4\" (Pos 020)", partId: "1011449", x: 15, y: 55 },
        { id: "node-h4", type: "pipe", label: "Conexão Flexível (Pos 035)", partId: "1627530", x: 75, y: 55 },
        { id: "node-h5", type: "valve", label: "Torneira Sanitária (Pos 024)", partId: "1011166", x: 80, y: 25 }
      ]
    },
    {
      id: "333-SGEN-005",
      name: "333-SGEN-005_ShaftGeneratorCooling.dwg",
      system: "333 (Shaft Generator)",
      title: "Resfriamento do Gerador de Eixo (P.S. & S.B. Shaft Gen)",
      description: "Arranjo executivo do resfriador de água doce em ciclo fechado para os conversores Aradex VP600 e motor DS3 da Baumuller.",
      date: "14/07/2026",
      author: "Eng. Baumuller & Aradex",
      revision: "Rev. B",
      materials: [
        { pos: "001", partId: "1649587", description: "Pump, Electrical, C 20E, 50Hz/0.37kW, Cast iron, Impeller Brass, Sealing X7X", um: "PÇ", qtyNeeded: 2 },
        { pos: "002", partId: "1434554", description: "Y-filter, 1013, 1\" (25), PN16, BSPP female, Mesh=0.25mm, Bronze RG5", um: "PÇ", qtyNeeded: 2 },
        { pos: "003", partId: "1607641", description: "[W], Heat Exchanger, OC 140-120, 3 inch alu FL, 1 inch BSP Single pass", um: "PÇ", qtyNeeded: 2 },
        { pos: "004", partId: "1483664", description: "Expansion tank 15L, incl. Murphy and level gauge, Stainless steel", um: "PÇ", qtyNeeded: 2 },
        { pos: "012", partId: "1649812", description: "Regulating valve, 2611, 3/4\" (20), BSPP female, Manually, PN25", um: "PÇ", qtyNeeded: 6 },
        { pos: "016", partId: "1438843", description: "Solenoid valve, 32400, Straight, 1/2\" (15), BSPP female, Brass, 24VDC", um: "PÇ", qtyNeeded: 2 }
      ],
      blueprintNodes: [
        { id: "node-s1", type: "pump", label: "Bomba Circuladora C20E (Pos 001)", partId: "1649587", x: 30, y: 60 },
        { id: "node-s2", type: "flange", label: "Trocador de Calor OC140 (Pos 003)", partId: "1607641", x: 55, y: 60 },
        { id: "node-s3", type: "pipe", label: "Tanque Expansão 15L (Pos 004)", partId: "1483664", x: 45, y: 25 },
        { id: "node-s4", type: "valve", label: "Reguladora 3/4\" (Pos 012)", partId: "1649812", x: 75, y: 45 },
        { id: "node-s5", type: "valve", label: "Solenóide 24V (Pos 016)", partId: "1438843", x: 15, y: 45 }
      ]
    }
  ];

  jobbook = [
    {
      id: "jb-1",
      partId: "1000814",
      functionCode: "310",
      description: "Fill and drain valve, 447, 1/2\" (15), BSPP male, Hose pillar, Button, PN16, Brass",
      sapCode: "SAP-1000814",
      qtyDemanded: 4,
      drawingRef: "310-ME-001",
      sendDate: "12/07/2026",
      location: "Almoxarifado Central - Prateleira A1"
    },
    {
      id: "jb-2",
      partId: "1000450",
      functionCode: "310",
      description: "Globe valve, 241, Straight, Fixed disc, DN32, Flange, Hand wheel, PN16, Cast iron",
      sapCode: "SAP-1000450",
      qtyDemanded: 4,
      drawingRef: "310-ME-001",
      sendDate: "12/07/2026",
      location: "Almoxarifado Central - Prateleira B3"
    },
    {
      id: "jb-3",
      partId: "1473106",
      functionCode: "310",
      description: "[TA], Butterfly valve, 4621, DN80, Flange, Sealing:EPDM, Squeeze lever, PN16",
      sapCode: "SAP-1473106",
      qtyDemanded: 8,
      drawingRef: "310-ME-001",
      sendDate: "13/07/2026",
      location: "Almoxarifado Central - Prateleira C2"
    },
    {
      id: "jb-4",
      partId: "1011155",
      functionCode: "310",
      description: "Glass thermometer, 1645, 0/120Cel, L=63mm, 1/2\", BSPP male, Brass, Straight",
      sapCode: "SAP-1011155",
      qtyDemanded: 16,
      drawingRef: "310-ME-001 / 333-SGEN-005",
      sendDate: "14/07/2026",
      location: "Armário de Instrumentação - Gaveta 4"
    },
    {
      id: "jb-5",
      partId: "1431296",
      functionCode: "310",
      description: "ASSY, MODULE, Bilge – Deckwash – Internal FiFi System (Azcue Pump System)",
      sapCode: "SAP-1431296",
      qtyDemanded: 1,
      drawingRef: "310-FIFI-002",
      sendDate: "14/07/2026",
      location: "Praça de Máquinas - Pavimento Inferior"
    },
    {
      id: "jb-6",
      partId: "1000038",
      functionCode: "345",
      description: "[TA], Ball valve, GF-546, Straight, DN32, Glue sleeve, Sealing:EPDM, PVC-C",
      sapCode: "SAP-1000038",
      qtyDemanded: 4,
      drawingRef: "345-STP-003",
      sendDate: "10/07/2026",
      location: "Almoxarifado Terminal 1 - Caixa 12"
    },
    {
      id: "jb-7",
      partId: "1556501",
      functionCode: "345",
      description: "Supplier Package, Blue sea plus 2500 Sewage Treatment Unit, 60Hz, 440V",
      sapCode: "SAP-1556501",
      qtyDemanded: 1,
      drawingRef: "345-STP-003",
      sendDate: "11/07/2026",
      location: "Pátio Canteiro de Obras - Skid 3"
    },
    {
      id: "jb-8",
      partId: "1544520",
      functionCode: "341",
      description: "Pump, Hydrophore, 2l Membrane vessel, Euroinox 40/50T, 1.0kW/220V",
      sapCode: "SAP-1544520",
      qtyDemanded: 1,
      drawingRef: "341-HYD-004",
      sendDate: "14/07/2026",
      location: "Oficina de Bombas - Bancada A"
    },
    {
      id: "jb-9",
      partId: "1649587",
      functionCode: "333",
      description: "Pump, Electrical, C 20E, 50Hz/0.37kW/400V, Cast iron, Impeller Brass",
      sapCode: "SAP-1649587",
      qtyDemanded: 2,
      drawingRef: "333-SGEN-005",
      sendDate: "14/07/2026",
      location: "Almoxarifado Central - Prateleira F5"
    }
  ];

  addLog("success", "SISTEMA", "Torre de Controle iniciada com sucesso.");
  addLog("info", "BANCO DE DADOS", "Mock PostgreSQL carregado com 5 registros de contêineres e 5 insumos cadastrados.");
  addLog("info", "BANCO DE DADOS", "Seções do Jobbook e Desenhos de Engenharia inicializados no banco persistente.");
  addLog("warn", "CONCILIAÇÃO", "Detectadas 3 divergências de contêineres ativas.");
  addLog("warn", "BANCO DE DADOS", "Estoque Crítico detectado: 'Borrachas de Vedação de Porta 40HC (Gaskets)' está zerado!");
}

// Seed now
resetDatabase();

// Reconciliation Middleware Engine function
function runReconciliationEngine(): { processed: number; newDivergences: number; autoResolved: number } {
  addLog("info", "INGESTÃO", "Iniciando ciclo automático de conciliação middleware...");
  
  // Simulate ingestion from both APIs
  addLog("info", "INGESTÃO", `Lendo dados da Planilha Compartilhada via API do Google Sheets...`);
  addLog("info", "INGESTÃO", `Lendo dados do Banco de Dados Interno Legado...`);
  
  let processed = 0;
  let newDivergences = 0;
  let autoResolved = 0;

  containers.forEach(container => {
    processed++;
    addLog("info", "VALIDAÇÃO", `Validando dados para o contêiner ${container.id}...`);

    const hasStatusDiff = container.legacyStatus !== container.spreadsheetStatus;
    // Normalize locations to avoid false positives (e.g., spacing/case)
    const normLegacyLoc = container.legacyLocation.trim().toLowerCase();
    const normSpreadsheetLoc = container.spreadsheetLocation.trim().toLowerCase();
    const hasLocationDiff = normLegacyLoc !== normSpreadsheetLoc;

    if (hasStatusDiff || hasLocationDiff) {
      // Divergence detected
      const diffFields: { status?: { legacy: string; spreadsheet: string }; location?: { legacy: string; spreadsheet: string } } = {};
      
      if (hasStatusDiff) {
        diffFields.status = { legacy: container.legacyStatus, spreadsheet: container.spreadsheetStatus };
      }
      if (hasLocationDiff) {
        diffFields.location = { legacy: container.legacyLocation, spreadsheet: container.spreadsheetLocation };
      }

      // If it wasn't marked as divergent, or if the differences changed
      if (!container.isDivergent) {
        newDivergences++;
        container.isDivergent = true;
        addLog("warn", "CONCILIAÇÃO", `Divergência detectada no ${container.id}! Campo(s): ${Object.keys(diffFields).join(", ")}`);
      }
      container.divergences = diffFields;
    } else {
      // Data matches! If it was previously divergent, it's now auto-resolved because inputs have matched.
      if (container.isDivergent) {
        autoResolved++;
        container.isDivergent = false;
        container.divergences = {};
        container.status = container.legacyStatus;
        container.location = container.legacyLocation;
        container.lastSyncTime = new Date().toISOString();
        addLog("success", "CONCILIAÇÃO", `Divergência do ${container.id} auto-resolvida (dados estão sincronizados).`);
      }
    }
  });

  addLog("success", "BANCO DE DADOS", `Ciclo de conciliação finalizado. ${processed} contêineres analisados. Nova(s) divergência(s): ${newDivergences}.`);
  return { processed, newDivergences, autoResolved };
}

// API Routes
app.get("/api/containers", (req, res) => {
  res.json(containers);
});

app.get("/api/logs", (req, res) => {
  res.json(logs);
});

app.get("/api/stats", (req, res) => {
  const total = containers.length;
  const divergent = containers.filter(c => c.isDivergent).length;
  const resolved = totalResolvedCount;
  
  // Sync ratio is proportion of non-divergent containers
  const syncRatio = total > 0 ? Math.round(((total - divergent) / total) * 100) : 100;

  const stats: DashboardStats = {
    totalContainers: total,
    divergentCount: divergent,
    resolvedCount: resolved,
    syncRatio,
    lastReconciliation: logs.find(l => l.category === "BANCO DE DADOS")?.timestamp || new Date().toISOString(),
  };
  res.json(stats);
});

app.get("/api/materials", (req, res) => {
  res.json(materials);
});

app.get("/api/procurements", (req, res) => {
  res.json(purchaseRequests);
});

// Simulate Material Consumption
app.post("/api/materials/use", (req, res) => {
  const { id, quantity } = req.body;
  const material = materials.find(m => m.id === id);
  if (!material) {
    return res.status(404).json({ error: "Material não encontrado" });
  }

  const qty = parseInt(quantity, 10) || 1;
  if (material.stockCurrent < qty) {
    addLog("error", "SISTEMA", `Falha ao consumir material ${material.name}: Estoque insuficiente (${material.stockCurrent} disponível, solicitado ${qty}).`);
    return res.status(400).json({ error: `Estoque insuficiente de ${material.name}.` });
  }

  material.stockCurrent -= qty;
  material.status = getMaterialStatus(material.stockCurrent, material.stockMinimum);

  addLog("info", "SISTEMA", `Consumo registrado: ${qty} ${material.stockUnit} de '${material.name}'. Estoque atual: ${material.stockCurrent}.`);

  if (material.status === "Crítico (Falta)") {
    addLog("error", "BANCO DE DADOS", `Estoque Crítico! Insumo '${material.name}' atingiu zero ou menos! Necessário iniciar processo de compra imediatamente.`);
  } else if (material.status === "Alerta (Mínimo)") {
    addLog("warn", "BANCO DE DADOS", `Estoque em Nível de Alerta para '${material.name}': ${material.stockCurrent} restante (Mínimo recomendado: ${material.stockMinimum}).`);
  }

  res.json({ message: "Consumo de material registrado", material });
});

// Initiate Purchase Request
app.post("/api/materials/order", (req, res) => {
  const { materialId, quantity } = req.body;
  const material = materials.find(m => m.id === materialId);
  if (!material) {
    return res.status(404).json({ error: "Material não encontrado" });
  }

  const qty = parseInt(quantity, 10) || 5;
  const totalPrice = qty * material.priceUnit;

  const newRequest: PurchaseRequest = {
    id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    materialId: material.id,
    materialName: material.name,
    quantityRequested: qty,
    unitPrice: material.priceUnit,
    totalPrice,
    dateRequested: new Date().toISOString(),
    status: "Aguardando Aprovação",
    leadTimeDays: material.leadTimeDays,
    estimatedArrivalDate: new Date(Date.now() + material.leadTimeDays * 24 * 3600 * 1000).toISOString()
  };

  purchaseRequests.unshift(newRequest);
  
  addLog("success", "SISTEMA", `Solicitação de compra ${newRequest.id} gerada para ${qty} ${material.stockUnit} de '${material.name}' (Total: R$ ${totalPrice.toFixed(2)}).`);
  addLog("info", "BANCO DE DADOS", `Nova requisição de compra aguardando assinatura do Gerente de Supply Chain.`);

  res.json({ message: "Requisição de compra iniciada", request: newRequest });
});

// Update Purchase Request Status (Approvals & Deliveries)
app.post("/api/materials/update-order", (req, res) => {
  const { id, status } = req.body;
  const request = purchaseRequests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ error: "Requisição de compra não encontrada" });
  }

  const oldStatus = request.status;
  request.status = status;

  addLog("success", "SISTEMA", `Pedido de compra ${id} alterado de '${oldStatus}' para '${status}'.`);

  if (status === "Aprovado") {
    addLog("info", "SISTEMA", `Aprovação de orçamento concedida para ${id}. Gerando Pedido de Compra ao fornecedor.`);
  } else if (status === "Pedido Enviado") {
    addLog("info", "SISTEMA", `Pedido enviado formalmente para o fornecedor. Prazo estimado: ${request.leadTimeDays} dias.`);
  } else if (status === "Entregue") {
    // Delivery received! Update the material stock!
    const material = materials.find(m => m.id === request.materialId);
    if (material) {
      material.stockCurrent += request.quantityRequested;
      material.status = getMaterialStatus(material.stockCurrent, material.stockMinimum);
      addLog("success", "BANCO DE DADOS", `Mercadoria recebida para o pedido ${id}! Adicionados ${request.quantityRequested} ${material.stockUnit} ao estoque de '${material.name}'. Novo estoque: ${material.stockCurrent}.`);
    }
  }

  res.json({ message: `Status do pedido ${id} atualizado para ${status}`, request });
});

// Simulate modifying Legacy System Status
app.post("/api/containers/update-legacy", (req, res) => {
  const { id, status, location } = req.body;
  const container = containers.find(c => c.id === id);
  if (!container) {
    return res.status(404).json({ error: "Contêiner não encontrado" });
  }

  if (status) container.legacyStatus = status;
  if (location) container.legacyLocation = location;
  container.legacyLastUpdated = new Date().toISOString();

  addLog("info", "INGESTÃO", `Recebida atualização via Webhook do Sistema Legado para ${id}.`);
  
  // Automatically run reconciliation after a source update to find divergences
  const result = runReconciliationEngine();

  res.json({ message: "Dados Legados atualizados com sucesso", container, result });
});

// Simulate modifying Spreadsheet Status
app.post("/api/containers/update-spreadsheet", (req, res) => {
  const { id, status, location, operator, notes } = req.body;
  const container = containers.find(c => c.id === id);
  if (!container) {
    return res.status(404).json({ error: "Contêiner não encontrado" });
  }

  if (status) container.spreadsheetStatus = status;
  if (location) container.spreadsheetLocation = location;
  if (operator) container.spreadsheetOperator = operator;
  if (notes) container.spreadsheetNotes = notes;
  container.spreadsheetLastUpdated = new Date().toISOString();

  addLog("info", "INGESTÃO", `Detectada alteração de linha na Planilha do Excel/Sheets para ${id}.`);
  
  // Automatically run reconciliation after a source update to find divergences
  const result = runReconciliationEngine();

  res.json({ message: "Dados de Planilha atualizados com sucesso", container, result });
});

// Add a new Container dynamically to simulate incoming traffic
app.post("/api/containers/create", (req, res) => {
  const { id, type, size, owner, legacyStatus, legacyLocation, spreadsheetStatus, spreadsheetLocation } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: "ID do contêiner é obrigatório" });
  }

  if (containers.some(c => c.id === id)) {
    return res.status(400).json({ error: "Contêiner com este ID já existe" });
  }

  const newContainer: Container = {
    id,
    size: size || 20,
    type: type || "Dry Van",
    owner: owner || "Maersk",
    legacyStatus: legacyStatus || "No Porto",
    legacyLocation: legacyLocation || "Cais de Carga",
    legacyLastUpdated: new Date().toISOString(),
    spreadsheetStatus: spreadsheetStatus || legacyStatus || "No Porto",
    spreadsheetLocation: spreadsheetLocation || legacyLocation || "Cais de Carga",
    spreadsheetLastUpdated: new Date().toISOString(),
    spreadsheetOperator: "Robô Middleware",
    spreadsheetNotes: "Inserido via simulação.",
    status: legacyStatus || "No Porto",
    location: legacyLocation || "Cais de Carga",
    operatorNotes: "Iniciado via API de Simulação.",
    lastSyncTime: new Date().toISOString(),
    isDivergent: false,
    divergences: {}
  };

  containers.push(newContainer);
  addLog("info", "BANCO DE DADOS", `Novo contêiner ${id} registrado no ecossistema.`);
  
  // Reconcile
  runReconciliationEngine();
  
  res.json({ message: "Contêiner criado com sucesso", container: newContainer });
});

// Resolve Conflict endpoint
app.post("/api/containers/resolve", (req, res) => {
  const { containerId, method, resolvedStatus, resolvedLocation, operatorNotes } = req.body;
  const container = containers.find(c => c.id === containerId);
  if (!container) {
    return res.status(404).json({ error: "Contêiner não encontrado" });
  }

  addLog("info", "CONCILIAÇÃO", `Iniciando resolução manual/semi-automática para o contêiner ${containerId}. Método: ${method.toUpperCase()}`);

  if (method === "legacy") {
    container.status = container.legacyStatus;
    container.location = container.legacyLocation;
    // Align spreadsheet to avoid immediate re-divergência
    container.spreadsheetStatus = container.legacyStatus;
    container.spreadsheetLocation = container.legacyLocation;
    container.spreadsheetLastUpdated = new Date().toISOString();
    container.spreadsheetNotes = `Sincronizado automaticamente da Torre de Controle (Origem: Legado).`;
    container.resolutionSource = "legacy";
    addLog("success", "CONCILIAÇÃO", `Contêiner ${containerId} resolvido adotando dados do Sistema Legado.`);
  } else if (method === "spreadsheet") {
    container.status = container.spreadsheetStatus;
    container.location = container.spreadsheetLocation;
    // Align legacy to avoid immediate re-divergência (simulating pushing back to legacy database)
    container.legacyStatus = container.spreadsheetStatus;
    container.legacyLocation = container.spreadsheetLocation;
    container.legacyLastUpdated = new Date().toISOString();
    container.resolutionSource = "spreadsheet";
    addLog("success", "CONCILIAÇÃO", `Contêiner ${containerId} resolvido adotando dados da Planilha. Payload enviado de volta para o Legado.`);
  } else if (method === "manual") {
    if (!resolvedStatus || !resolvedLocation) {
      return res.status(400).json({ error: "Para resolução manual, status e localização são necessários" });
    }
    container.status = resolvedStatus;
    container.location = resolvedLocation;
    
    // Align both sources to the manual decision
    container.legacyStatus = resolvedStatus;
    container.legacyLocation = resolvedLocation;
    container.legacyLastUpdated = new Date().toISOString();
    
    container.spreadsheetStatus = resolvedStatus;
    container.spreadsheetLocation = resolvedLocation;
    container.spreadsheetLastUpdated = new Date().toISOString();
    container.spreadsheetNotes = `Atualizado manualmente via painel da Torre de Controle.`;
    
    container.resolutionSource = "manual";
    addLog("success", "CONCILIAÇÃO", `Contêiner ${containerId} resolvido manualmente por decisão do operador.`);
  }

  container.isDivergent = false;
  container.divergences = {};
  container.operatorNotes = operatorNotes || `Resolvido via ${method}.`;
  container.lastSyncTime = new Date().toISOString();
  
  totalResolvedCount++;
  addLog("success", "BANCO DE DADOS", `Banco consolidado atualizado para o contêiner ${containerId}.`);

  res.json({ message: "Divergência resolvida com sucesso", container });
});

// Jobbook & Drawing Endpoints
app.get("/api/jobbook", (req, res) => {
  res.json(jobbook);
});

app.post("/api/jobbook", (req, res) => {
  const { partId, functionCode, description, sapCode, qtyDemanded, drawingRef, location } = req.body;
  if (!partId || !functionCode || !sapCode) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }
  const newRecord: JobbookRecord = {
    id: `jb-${Date.now()}`,
    partId: partId.toUpperCase().trim(),
    functionCode: functionCode.trim(),
    description: description || "",
    sapCode: sapCode.toUpperCase().trim(),
    qtyDemanded: Number(qtyDemanded) || 1,
    drawingRef: drawingRef || "Manual",
    sendDate: new Date().toLocaleDateString("pt-BR"),
    location: location || "Almoxarifado Central"
  };
  jobbook.unshift(newRecord);
  addLog("success", "BANCO DE DADOS", `Item ${newRecord.partId} inserido com sucesso no Jobbook para o sistema ${newRecord.functionCode}.`);
  res.status(201).json(newRecord);
});

app.get("/api/drawings", (req, res) => {
  res.json(drawings);
});

app.post("/api/drawings", (req, res) => {
  const { id, name, system, title, description, author, revision, materials } = req.body;
  if (!id || !name || !system || !title) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }
  
  if (drawings.some(d => d.id === id)) {
    return res.status(400).json({ error: `Desenho com ID ${id} já existe` });
  }

  const newDrawing: Drawing = {
    id: id.trim(),
    name: name.trim(),
    system: system.trim(),
    title: title.trim(),
    description: description || "",
    date: new Date().toLocaleDateString("pt-BR"),
    author: author || "Operador Torre",
    revision: revision || "Rev. 0",
    materials: materials || [],
    blueprintNodes: []
  };

  // Generate blueprint nodes for a nice visualization if none provided
  if (newDrawing.materials.length > 0) {
    newDrawing.blueprintNodes = newDrawing.materials.map((m, index) => {
      const nodeType = m.partId.toLowerCase().includes("vlv") || m.partId.toLowerCase().includes("val") ? "valve" :
                       m.partId.toLowerCase().includes("bmp") || m.partId.toLowerCase().includes("bmb") ? "pump" :
                       m.partId.toLowerCase().includes("flg") ? "flange" : "pipe";
      return {
        id: `node-dyn-${index}-${Date.now()}`,
        type: nodeType,
        label: `${m.description.substring(0, 15)} (Pos ${m.pos})`,
        partId: m.partId,
        x: 20 + (index * 20) % 60,
        y: 35 + (index * 15) % 40
      };
    });
  }

  drawings.push(newDrawing);
  addLog("success", "BANCO DE DADOS", `Desenho Técnico ${newDrawing.id} (${newDrawing.name}) inserido com sucesso.`);
  res.status(201).json(newDrawing);
});

app.post("/api/drawings/:id/materials", (req, res) => {
  const { id } = req.params;
  const { pos, partId, description, um, qtyNeeded } = req.body;
  
  if (!pos || !partId || !qtyNeeded) {
    return res.status(400).json({ error: "Campos do material obrigatórios ausentes" });
  }

  const drawing = drawings.find(d => d.id === id);
  if (!drawing) {
    return res.status(404).json({ error: "Desenho não encontrado" });
  }

  // Check if position already exists
  if (drawing.materials.some(m => m.pos === pos)) {
    return res.status(400).json({ error: `Posição ${pos} já existe no desenho` });
  }

  const newMaterial = {
    pos: pos.trim(),
    partId: partId.toUpperCase().trim(),
    description: description || "Insumo sem descrição",
    um: um || "PÇ",
    qtyNeeded: Number(qtyNeeded) || 1
  };

  drawing.materials.push(newMaterial);

  // Append a matching blueprint node
  const nodeType = partId.toLowerCase().includes("vlv") || partId.toLowerCase().includes("val") ? "valve" :
                   partId.toLowerCase().includes("bmp") || partId.toLowerCase().includes("bmb") ? "pump" :
                   partId.toLowerCase().includes("flg") ? "flange" : "pipe";

  drawing.blueprintNodes.push({
    id: `node-dyn-added-${Date.now()}`,
    type: nodeType,
    label: `${newMaterial.description.substring(0, 15)} (Pos ${newMaterial.pos})`,
    partId: newMaterial.partId,
    x: 25 + (drawing.materials.length * 15) % 55,
    y: 30 + (drawing.materials.length * 10) % 45
  });

  addLog("success", "BANCO DE DADOS", `Insumo ${newMaterial.partId} inserido na BOM do desenho ${id} com sucesso.`);
  res.status(201).json(drawing);
});

// Trigger Manual Reconciliation Run
app.post("/api/reconciliation/run", (req, res) => {
  const result = runReconciliationEngine();
  res.json({ message: "Conciliação executada com sucesso", result });
});

// Reset Database to seed data
app.post("/api/reset", (req, res) => {
  resetDatabase();
  res.json({ message: "Banco de dados resetado com dados de teste" });
});

// Start integration server & Vite dev server
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
