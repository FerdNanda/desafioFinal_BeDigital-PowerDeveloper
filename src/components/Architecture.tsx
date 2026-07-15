import React, { useState } from "react";
import { Layers, Database, ArrowRight, Server, FileSpreadsheet, Eye, Sparkles, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function Architecture() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: "Origens dos Dados",
      subtitle: "Planilha & Legado",
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-400" />,
      desc: "Os operadores atualizam a planilha local (flexibilidade de digitação) enquanto o Sistema Legado (ERP/Sensores de Porto) registra eventos automatizados de forma assíncrona.",
      bullets: [
        "Planilha: Google Sheets / Excel integrada via Webhook de evento (onEdit).",
        "Legado: Banco legacional acessado via query de replicação ou APIs REST."
      ]
    },
    {
      id: 2,
      title: "Middleware Ingestão",
      subtitle: "Fila & Validação",
      icon: <Server className="w-6 h-6 text-blue-400" />,
      desc: "Centraliza as atualizações em filas de mensageria para desacoplamento e resiliência, normalizando os payloads para o mesmo esquema estruturado de dados.",
      bullets: [
        "Normalização de strings (ex: 'Porto de Santos' vs 'No Porto').",
        "Garantia de ordem de mensagens (FIFO) para evitar out-of-order state."
      ]
    },
    {
      id: 3,
      title: "Conciliador Core",
      subtitle: "Motor de Regras",
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      desc: "Analisa divergências em tempo real. Se os valores batem, consolida direto. Se houver conflito (ex: Status Porto no Legado mas Trânsito na Planilha), cria um alerta de Divergência na Torre.",
      bullets: [
        "Regra Temporal: Compara carimbos de data/hora (timestamps).",
        "Regra de Escopo: Determina que o Legado é mestre em liberação aduaneira e a planilha em observações locais."
      ]
    },
    {
      id: 4,
      title: "Banco Consolidado",
      subtitle: "PostgreSQL",
      icon: <Database className="w-6 h-6 text-indigo-400" />,
      desc: "Armazena a versão única da verdade histórica (Single Source of Truth). Registra o histórico completo de movimentações e resoluções para fins de auditoria (Compliance).",
      bullets: [
        "Esquema relacional íntegro para rastreabilidade.",
        "Tabela de trilha de auditoria (Audit Log) de decisões de operadores."
      ]
    },
    {
      id: 5,
      title: "API Gateway",
      subtitle: "Express / Node.js",
      icon: <Eye className="w-6 h-6 text-amber-400" />,
      desc: "Expõe endpoints seguros e de baixíssima latência para alimentação do Dashboard, e webhooks de saída para devolver dados corrigidos aos sistemas originais.",
      bullets: [
        "Barramento REST seguro para o dashboard.",
        "Sincronização reversa (Pushback) para atualizar a Planilha e o Legado após resoluções."
      ]
    }
  ];

  return (
    <div id="architecture-view" className="space-y-8">
      {/* Introduction Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium border border-indigo-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Decisão de Arquiteto Sênior
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4 font-sans">
            Arquitetura de Integração e Conciliação Ativa
          </h2>
          <p className="text-slate-300 leading-relaxed max-w-4xl text-base sm:text-lg">
            Para resolver o problema crônico de dados divergentes entre sistemas legados automatizados e planilhas operacionais flexíveis, projetamos uma <strong>arquitetura desacoplada e orientada a eventos</strong> baseada em um Middleware Inteligente de Conciliação com banco PostgreSQL central.
          </p>
        </div>
      </div>

      {/* Interactive Blueprint Flow Diagram */}
      <div className="bg-slate-955 border border-slate-800 rounded-2xl p-6 relative">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white font-sans">
              Diagrama de Fluxo e Ingestão de Dados
            </h3>
            <p className="text-slate-400 text-xs">
              Clique em cada etapa do pipeline para ver as decisões de engenharia aplicadas.
            </p>
          </div>
          <div className="text-slate-400 text-xs bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Simulação de Pipeline Ativo
          </div>
        </div>

        {/* The Pipeline visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                className={`cursor-pointer transition-all border rounded-xl p-5 relative flex flex-col justify-between ${
                  activeStep === step.id
                    ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-slate-850 rounded-lg border border-slate-800">
                      {step.icon}
                    </div>
                    <span className="text-2xl font-mono font-bold text-slate-700">0{step.id}</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">{step.title}</h4>
                  <p className="text-indigo-400 text-xs font-medium mb-2">{step.subtitle}</p>
                  <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Clique para detalhes</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                </div>
              </motion.div>
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center absolute text-slate-700 pointer-events-none" style={{ left: `${(idx + 1) * 20 - 1.5}%`, top: "45%" }}>
                  <ArrowRight className="w-5 h-5 text-slate-600 animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Selected Step Deep Dive Details */}
        <motion.div 
          layout
          className="mt-6 p-5 bg-slate-900/90 border border-indigo-500/20 rounded-xl"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 mt-1">
              {activeStep ? steps.find(s => s.id === activeStep)?.icon : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-base font-semibold text-white">
                {activeStep 
                  ? `Análise Profunda: ${steps.find(s => s.id === activeStep)?.title} (${steps.find(s => s.id === activeStep)?.subtitle})`
                  : "Por que escolhemos essa arquitetura? (Visão Geral)"}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {activeStep 
                  ? steps.find(s => s.id === activeStep)?.desc
                  : "Nossa arquitetura garante desacoplamento absoluto. Ao invés de conectar o dashboard diretamente à planilha e ao legado (gerando sobrecarga, lentidão e concorrência destrutiva), o Middleware age como árbitro isolador. Ele trata as instabilidades de rede dos sistemas legados de forma transparente, consolida as modificações em um banco de dados PostgreSQL estruturado e serve o front-end via APIs eficientes."}
              </p>
              
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                {(activeStep ? steps.find(s => s.id === activeStep)?.bullets : [
                  "Idempotência: Evita que requisições duplicadas estraguem a consistência dos contêineres.",
                  "Pushback Ativo: Resolvendo na Torre, o banco de dados original e a planilha recebem a correção via API de volta."
                ])?.map((bullet, bidx) => (
                  <div key={bidx} className="flex items-start gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rationale and Deep Dive Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5" />
            Idempotência e Filas
          </div>
          <h4 className="text-white font-semibold text-base">Desacoplamento e Alta Disponibilidade</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Se a planilha cair ou estiver aberta por outro usuário em modo de edição bloqueado, o Middleware armazena as requisições pendentes em uma fila de mensagens para reprocessá-las assim que o canal estiver livre. Isso previne qualquer perda de dados operacionais críticos de logística.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            <Layers className="w-5 h-5" />
            Consistência Eventual
          </div>
          <h4 className="text-white font-semibold text-base">Resolução Inteligente de Conflitos</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            O motor de regras valida as divergências baseando-se em marcas temporais. Se o sistema legacional atualizar uma geolocalização por satélite (GPS) às 10h15, e a planilha manual possuir um dado inserido às 10h00, o sistema prioriza o evento físico automatizado do GPS, notificando o operador.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm uppercase tracking-wider">
            <AlertCircle className="w-5 h-5" />
            Pushback (Sincronização Reversa)
          </div>
          <h4 className="text-white font-semibold text-base">Alinhamento entre as Fontes</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Ao clicar em resolver uma divergência na Torre de Controle, o Middleware não apenas salva no PostgreSQL central, mas dispara um webhook para injetar o valor acordado de volta na planilha através da API Google Sheets e atualiza a base do Sistema Legado, evitando re-divergências futuras.
          </p>
        </div>
      </div>
    </div>
  );
}
