export interface Container {
  id: string; // e.g., "CONT-1002"
  size: 20 | 40;
  type: "Reefer" | "Dry Van" | "Open Top" | "Flat Rack";
  owner: "Maersk" | "MSC" | "CMA CGM" | "Hapag-Lloyd" | "ONE";
  
  // Legacy system state
  legacyStatus: "No Porto" | "Em Trânsito" | "Retido" | "Liberado" | "Entregue";
  legacyLocation: string;
  legacyLastUpdated: string;
  
  // Spreadsheet state
  spreadsheetStatus: "No Porto" | "Em Trânsito" | "Retido" | "Liberado" | "Entregue";
  spreadsheetLocation: string;
  spreadsheetLastUpdated: string;
  spreadsheetOperator: string;
  spreadsheetNotes: string;
  
  // Consolidated / Approved state in Control Tower
  status: "No Porto" | "Em Trânsito" | "Retido" | "Liberado" | "Entregue";
  location: string;
  operatorNotes: string;
  lastSyncTime: string;
  
  // Divergence flags
  isDivergent: boolean;
  divergences: {
    status?: { legacy: string; spreadsheet: string };
    location?: { legacy: string; spreadsheet: string };
  };
  resolutionSource?: "legacy" | "spreadsheet" | "manual";
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  category: "INGESTÃO" | "VALIDAÇÃO" | "CONCILIAÇÃO" | "BANCO DE DADOS" | "SISTEMA";
  message: string;
}

export interface DashboardStats {
  totalContainers: number;
  divergentCount: number;
  resolvedCount: number;
  syncRatio: number; // percentage of synced data
  lastReconciliation: string;
}

export interface Material {
  id: string;
  name: string;
  category: "Reefer" | "Estrutural" | "Consumível";
  stockCurrent: number;
  stockMinimum: number;
  stockUnit: string;
  priceUnit: number;
  supplier: string;
  leadTimeDays: number;
  status: "Suficiente" | "Alerta (Mínimo)" | "Crítico (Falta)";
}

export interface PurchaseRequest {
  id: string;
  materialId: string;
  materialName: string;
  quantityRequested: number;
  unitPrice: number;
  totalPrice: number;
  dateRequested: string;
  status: "Aguardando Aprovação" | "Aprovado" | "Pedido Enviado" | "Entregue";
  leadTimeDays: number;
  estimatedArrivalDate: string;
}

export interface DrawingMaterial {
  pos: string;
  partId: string;
  description: string;
  um: string;
  qtyNeeded: number;
}

export interface Drawing {
  id: string; // e.g. "310-M-001"
  name: string; // e.g. "310-M-001_DutoValvulas.dwg"
  system: string; // e.g. "310"
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
    x: number;
    y: number;
  }[];
}

export interface JobbookRecord {
  id: string;
  partId: string;
  functionCode: string;
  description: string;
  sapCode: string;
  qtyDemanded: number;
  drawingRef: string;
  sendDate: string;
  location: string;
}


