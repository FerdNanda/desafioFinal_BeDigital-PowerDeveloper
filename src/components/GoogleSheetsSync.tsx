import React, { useState, useEffect } from "react";
import { Container } from "../types";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  FileSpreadsheet, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  ArrowRight, 
  HelpCircle, 
  Copy, 
  Sparkles,
  Search,
  ExternalLink
} from "lucide-react";

// Initialize Firebase if not already initialized
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");

interface GoogleSheetsSyncProps {
  containers: Container[];
  onRefresh: () => void;
}

interface ParsedRow {
  id: string;
  status: string;
  location: string;
  operator: string;
  notes: string;
}

export default function GoogleSheetsSync({ containers, onRefresh }: GoogleSheetsSyncProps) {
  // Google Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Spreadsheet configuration state
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");
  const [range, setRange] = useState<string>("Sheet1!A1:E20");
  const [isFetching, setIsFetching] = useState(false);
  const [rawSheetData, setRawSheetData] = useState<any[][] | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const [sheetName, setSheetName] = useState<string>("");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    processed: number;
    updated: number;
    errors: string[];
  } | null>(null);

  // Error/Success banners
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Active sync simulator fallback
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAccessToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setStatusError(null);
    setStatusSuccess(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        setStatusSuccess(`Login realizado com sucesso! Conectado como ${result.user.displayName}`);
      } else {
        throw new Error("Não foi possível obter o Token de Acesso do Google.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setStatusError("A janela popup de login do Google foi fechada ou bloqueada pelo navegador antes de completar a autenticação. Você pode tentar novamente habilitando popups na barra de endereço ou simplesmente usar o 'Modo de Demonstração (Sem Login)' abaixo para testar todo o sistema de sincronização offline imediatamente!");
      } else {
        setStatusError(`Falha na autenticação com o Google: ${err.message || err}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setAccessToken(null);
      setRawSheetData(null);
      setParsedRows([]);
      setSyncResult(null);
      setStatusSuccess("Sessão encerrada com sucesso.");
    } catch (err: any) {
      setStatusError(`Erro ao sair: ${err.message}`);
    }
  };

  // Helper to load sample data for immediate test
  const handleLoadDemoData = () => {
    setIsDemoMode(true);
    setStatusError(null);
    setStatusSuccess("Dados de planilha demo carregados com sucesso! Siga para a etapa de conciliação.");
    setSpreadsheetId("demo_mode_control_tower_sheet_1");
    setSheetName("Planilha Operacional - Porto de Santos");
    
    const demoRows: ParsedRow[] = [
      {
        id: "CONT-4021",
        status: "Em Trânsito",
        location: "Rodovia Anchieta KM 32",
        operator: "Roberto Lima (Demo)",
        notes: "Motorista iniciou viagem às 11h30 rumo ao armazém de transbordo."
      },
      {
        id: "CONT-4054",
        status: "No Porto",
        location: "Cais 2 - Porto de Santos",
        operator: "Carla Antunes (Demo)",
        notes: "Aguardando guindaste STS para posicionamento aduaneiro."
      },
      {
        id: "CONT-2012",
        status: "Liberado",
        location: "Armazém Secundário - São Paulo",
        operator: "Luiz Silva (Demo)",
        notes: "Entrega recebida e vistoriada no galpão central do cliente."
      }
    ];
    setParsedRows(demoRows);
    setRawSheetData([
      ["ID do Contêiner", "Status", "Localização", "Operador", "Notas"],
      ["CONT-4021", "Em Trânsito", "Rodovia Anchieta KM 32", "Roberto Lima (Demo)", "Motorista iniciou viagem às 11h30 rumo ao armazém de transbordo."],
      ["CONT-4054", "No Porto", "Cais 2 - Porto de Santos", "Carla Antunes (Demo)", "Aguardando guindaste STS para posicionamento aduaneiro."],
      ["CONT-2012", "Liberado", "Armazém Secundário - São Paulo", "Luiz Silva (Demo)", "Entrega recebida e vistoriada no galpão central do cliente."]
    ]);
  };

  const fetchGoogleSheetData = async () => {
    if (!accessToken && !isDemoMode) {
      setStatusError("Você precisa entrar com sua conta do Google para ler dados de planilhas reais.");
      return;
    }

    if (!spreadsheetId.trim()) {
      setStatusError("Por favor, informe o ID da planilha do Google Sheets.");
      return;
    }

    setIsFetching(true);
    setStatusError(null);
    setStatusSuccess(null);
    setSyncResult(null);

    try {
      const sanitizedId = spreadsheetId.trim();
      const encodedRange = encodeURIComponent(range);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sanitizedId}/values/${encodedRange}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.values || data.values.length === 0) {
        throw new Error("A planilha está vazia ou o intervalo selecionado não possui dados.");
      }

      setRawSheetData(data.values);
      parseSheetValues(data.values);
      setSheetName("Planilha Google Sheets Ativa");
      setStatusSuccess(`Lidos ${data.values.length - 1} registros da planilha com sucesso!`);
    } catch (err: any) {
      console.error("Sheets API error:", err);
      setStatusError(`Erro ao buscar dados do Google Sheets: ${err.message}. Verifique se o ID está correto e se o arquivo está compartilhado com permissão de leitura.`);
    } finally {
      setIsFetching(false);
    }
  };

  const parseSheetValues = (rows: any[][]) => {
    const headers = rows[0].map(h => String(h).toLowerCase().trim());
    
    // Find column indexes with smart mapping
    const mapping: Record<string, number> = {
      id: -1,
      status: -1,
      location: -1,
      operator: -1,
      notes: -1
    };

    headers.forEach((header, idx) => {
      if (header.includes("id") || header.includes("contêiner") || header.includes("conteiner") || header.includes("container") || header.includes("código") || header.includes("codigo")) {
        mapping.id = idx;
      } else if (header.includes("status") || header.includes("situação") || header.includes("situacao") || header.includes("estado")) {
        mapping.status = idx;
      } else if (header.includes("localização") || header.includes("localizacao") || header.includes("local") || header.includes("posição") || header.includes("posicao")) {
        mapping.location = idx;
      } else if (header.includes("operador") || header.includes("responsável") || header.includes("responsavel") || header.includes("autor")) {
        mapping.operator = idx;
      } else if (header.includes("notas") || header.includes("observações") || header.includes("observacoes") || header.includes("comentário") || header.includes("comentario")) {
        mapping.notes = idx;
      }
    });

    // Fallbacks if no headers matched
    if (mapping.id === -1) mapping.id = 0;
    if (mapping.status === -1) mapping.status = 1 < headers.length ? 1 : 0;
    if (mapping.location === -1) mapping.location = 2 < headers.length ? 2 : 0;
    if (mapping.operator === -1) mapping.operator = 3 < headers.length ? 3 : 0;
    if (mapping.notes === -1) mapping.notes = 4 < headers.length ? 4 : 0;

    setColumnMapping(mapping);

    const parsed: ParsedRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[mapping.id]) continue;

      parsed.push({
        id: String(row[mapping.id] || "").trim().toUpperCase(),
        status: String(row[mapping.status] || "No Porto").trim(),
        location: String(row[mapping.location] || "Cais de Carga").trim(),
        operator: String(row[mapping.operator] || "Planilha Google").trim(),
        notes: String(row[mapping.notes] || "Carregado via integração direta do Google Sheets.").trim()
      });
    }

    setParsedRows(parsed);
  };

  const handleSyncWithPostgreSQL = async () => {
    if (parsedRows.length === 0) return;

    setIsSyncing(true);
    setStatusError(null);
    setStatusSuccess(null);
    
    let processed = 0;
    let updated = 0;
    const errors: string[] = [];

    try {
      // Loop and update spreadsheet data in central database
      for (const row of parsedRows) {
        processed++;
        const response = await fetch("/api/containers/update-spreadsheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: row.id,
            status: row.status,
            location: row.location,
            operator: row.operator,
            notes: row.notes
          })
        });

        if (response.ok) {
          updated++;
        } else {
          const err = await response.json().catch(() => ({}));
          errors.push(`Erro no contêiner ${row.id}: ${err.error || "Erro desconhecido"}`);
        }
      }

      setSyncResult({ processed, updated, errors });
      
      if (errors.length === 0) {
        setStatusSuccess(`Conciliação concluída! ${updated} contêineres atualizados na Torre. O Middleware de Conciliação recalculou as divergências.`);
      } else {
        setStatusError(`Conciliação parcial: ${updated} sincronizados, ${errors.length} falhas.`);
      }

      // Refresh parent containers list
      onRefresh();
    } catch (err: any) {
      console.error("Sync error:", err);
      setStatusError(`Erro grave na sincronização: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="google-sheets-sync" className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Integração Homologada pela Google
            </div>
            <h2 className="text-2xl font-bold text-white font-sans flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
              Sincronizador Google Sheets
            </h2>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Consolide em tempo real as planilhas de campo mantidas por colaboradores. 
              Substitua digitação manual e planilhas offline por um barramento de conciliação seguro e automatizado.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLoadDemoData}
              className="px-4 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 hover:bg-slate-750 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Sessão de Demonstração (Sem Login)
            </button>

            {user ? (
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} referrerPolicy="no-referrer" alt={user.displayName || "Google User"} className="w-7 h-7 rounded-full border border-emerald-500/50" />
                ) : (
                  <div className="w-7 h-7 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-mono">CONECTADO</p>
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user.displayName || user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-red-500/15 hover:text-red-400 text-slate-400 rounded-lg transition-colors ml-1"
                  title="Desconectar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                Conectar Conta Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {statusError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 animate-pulse" />
          <span>{statusError}</span>
        </div>
      )}

      {statusSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{statusSuccess}</span>
        </div>
      )}

      {/* Form and Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Parâmetros da Planilha
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Identificação e limites da planilha de dados de campo.</p>
          </div>

          {/* Spreadsheet ID */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-medium">ID da Planilha Google (Google Spreadsheet ID):</label>
            <div className="relative">
              <input 
                type="text" 
                value={spreadsheetId} 
                onChange={(e) => {
                  setSpreadsheetId(e.target.value);
                  setIsDemoMode(false);
                }}
                placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74Ogv..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
              <FileSpreadsheet className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              O código alfanumérico longo que aparece na URL da sua planilha entre <code className="text-slate-400 bg-slate-950 px-1 py-0.5 rounded font-mono">/d/</code> e <code className="text-slate-400 bg-slate-950 px-1 py-0.5 rounded font-mono">/edit</code>.
            </p>
          </div>

          {/* Range Selection */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-medium">Intervalo de Leitura (Range):</label>
            <input 
              type="text" 
              value={range} 
              onChange={(e) => setRange(e.target.value)}
              placeholder="Ex: Sheet1!A1:E20"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Recomendado manter a primeira linha contendo os cabeçalhos das colunas (<code className="text-slate-400 bg-slate-950 px-1 py-0.5 rounded font-mono">ID</code>, <code className="text-slate-400 bg-slate-950 px-1 py-0.5 rounded font-mono">Status</code>, <code className="text-slate-400 bg-slate-950 px-1 py-0.5 rounded font-mono">Localização</code>).
            </p>
          </div>

          <button
            onClick={fetchGoogleSheetData}
            disabled={isFetching || (!accessToken && !isDemoMode)}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/10 disabled:opacity-40"
          >
            {isFetching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Carregar Dados da Planilha
          </button>

          {!accessToken && !isDemoMode && (
            <p className="text-[10px] text-center text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg leading-normal font-medium">
              ⚠️ Conecte sua conta do Google acima para ler planilhas reais, ou use a "Sessão de Demonstração" para rodar com dados locais simulados instantaneamente.
            </p>
          )}
        </div>

        {/* Template Design Details / Column Specs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Especificações e Cabeçalho Recomendado
            </h3>
            <p className="text-slate-400 text-xs leading-normal">
              Nossa inteligência de ingestão analisa os títulos das suas colunas na primeira linha da planilha de forma dinâmica. Para garantir compatibilidade ideal, monte as colunas conforme o modelo sugerido:
            </p>

            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800">
                    <th className="p-2.5 text-slate-300">ID do Contêiner</th>
                    <th className="p-2.5 text-slate-300">Status</th>
                    <th className="p-2.5 text-slate-300">Localização</th>
                    <th className="p-2.5 text-slate-300">Operador</th>
                    <th className="p-2.5 text-slate-300">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-900 text-slate-500">
                    <td className="p-2.5 text-emerald-400 font-bold">CONT-4021</td>
                    <td className="p-2.5">Em Trânsito</td>
                    <td className="p-2.5">Rodovia Anchieta KM 32</td>
                    <td className="p-2.5">João Silva</td>
                    <td className="p-2.5">Início do transporte terrestre...</td>
                  </tr>
                  <tr className="text-slate-500">
                    <td className="p-2.5 text-emerald-400 font-bold">CONT-4054</td>
                    <td className="p-2.5">No Porto</td>
                    <td className="p-2.5">Cais 2 - Porto de Santos</td>
                    <td className="p-2.5">Ana Costa</td>
                    <td className="p-2.5">Descarregado do navio Maersk...</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-850">
              <p className="font-semibold text-slate-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Mapeador Flexível Ativado:
              </p>
              <p className="text-slate-400">
                O algoritmo aceita variações idiomáticas e maiúsculas/minúsculas como: 
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px] mx-1">conteiner</code>, 
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px] mx-1">local</code>, 
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px] mx-1">observacoes</code> ou 
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px] mx-1">responsavel</code>.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
            <span>Deseja criar uma planilha em sua conta do Google para testar agora mesmo?</span>
            <a 
              href="https://sheets.new" 
              target="_blank" 
              rel="noreferrer" 
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1 shrink-0"
            >
              Criar Planilhas Google <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Row Data and Reconciliation Preview Panel */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider font-mono bg-emerald-400/5 border border-emerald-400/20 px-2.5 py-1 rounded-full uppercase">
                {sheetName}
              </span>
              <h3 className="text-base font-bold text-white font-sans mt-2">
                Revisão de Registros Encontrados na Planilha
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Compare as informações antes de sincronizar e salvar as decisões de conciliação.</p>
            </div>

            <button
              onClick={handleSyncWithPostgreSQL}
              disabled={isSyncing}
              className="bg-indigo-600 text-white hover:bg-indigo-500 px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Sincronizar {parsedRows.length} linhas com PostgreSQL
            </button>
          </div>

          {/* Results Summary and Key Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Linhas Carregadas</span>
              <p className="text-2xl font-mono font-bold text-white mt-1">{parsedRows.length}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Contêineres Cadastrados</span>
              <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                {parsedRows.filter(r => containers.some(c => c.id === r.id)).length}
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Novos Contêineres</span>
              <p className="text-2xl font-mono font-bold text-indigo-400 mt-1">
                {parsedRows.filter(r => !containers.some(c => c.id === r.id)).length}
              </p>
            </div>
          </div>

          {/* Detailed Row List */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono font-semibold">
                  <th className="p-3.5">Contêiner</th>
                  <th className="p-3.5">Dados na Planilha Google</th>
                  <th className="p-3.5">Status na Torre de Controle</th>
                  <th className="p-3.5">Divergência / Comparativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {parsedRows.map((row) => {
                  const dbContainer = containers.find(c => c.id === row.id);
                  const isNew = !dbContainer;
                  
                  // Evaluate if data is different from central db
                  const hasStatusDiff = dbContainer && dbContainer.status !== row.status;
                  const hasLocationDiff = dbContainer && dbContainer.location.trim().toLowerCase() !== row.location.trim().toLowerCase();
                  const isDivergent = hasStatusDiff || hasLocationDiff;

                  return (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* ID with Owner Tag */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-white text-sm">{row.id}</span>
                          <div>
                            {dbContainer ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                                Armador: {dbContainer.owner}
                              </span>
                            ) : (
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                                Novo Registro
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sheet Values */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1.5 font-sans">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-medium">Status:</span>
                            <span className="text-white font-semibold bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">
                              {row.status}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-slate-500 shrink-0">Local:</span>
                            <span className="text-slate-300 font-medium break-all">{row.location}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 space-y-0.5">
                            <p>🧑‍💻 Operador: {row.operator}</p>
                            <p className="italic">"{row.notes}"</p>
                          </div>
                        </div>
                      </td>

                      {/* DB Status */}
                      <td className="p-3.5 align-top">
                        {dbContainer ? (
                          <div className="space-y-1.5 font-sans">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Status:</span>
                              <span className="text-slate-300 font-semibold bg-slate-900 px-1.5 py-0.5 rounded text-[11px] border border-slate-800">
                                {dbContainer.status}
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5 text-[11px]">
                              <span className="text-slate-500 shrink-0">Local:</span>
                              <span className="text-slate-400 break-all">{dbContainer.location}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">🕒 Atual: {new Date(dbContainer.lastSyncTime).toLocaleTimeString()}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic font-sans text-xs">Sem dados históricos</span>
                        )}
                      </td>

                      {/* Discrepancy Evaluation */}
                      <td className="p-3.5 align-top">
                        {isNew ? (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/15">
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            Cadastrar no PostgreSQL
                          </div>
                        ) : isDivergent ? (
                          <div className="space-y-1 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              Divergência de Ingestão
                            </span>
                            <div className="text-[10px] text-slate-400 space-y-0.5 font-sans">
                              {hasStatusDiff && <p>• Mudança de status: "{dbContainer.status}" ➔ "{row.status}"</p>}
                              {hasLocationDiff && <p>• Nova localização pendente de reconciliação</p>}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Dados Alinhados
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
