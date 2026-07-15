# 🚢 Torre de Controle de Contêineres, Insumos & Engenharia

Uma plataforma integradora de alto desempenho desenvolvida para consolidar dados logísticos, resolver divergências de planilhas e rastrear o fluxo de engenharia (**Jobbook & Desenhos DWG**) em tempo real.

O sistema foi desenhado de forma amigável tanto para a equipe técnica de engenharia quanto para os operadores e gestores de materiais de campo.

---

## 💡 O que é esta aplicação? 

Imagine que a nossa operação lida com várias planilhas e sistemas diferentes que nem sempre conversam entre si: de um lado temos a movimentação de **contêineres**, de outro a compra de **materiais**, e de outro os desenhos técnicos (**DWG**) feitos pelos projetistas com as listas de peças obrigatórias (**Jobbook**).

Esta **Torre de Controle** centraliza tudo isso em um só lugar. Ela funciona como um "painel de bordo inteligente" que:
1. **Identifica Divergências Automaticamente:** Mostra na hora se o que está registrado no papel bate com o que está no sistema físico ou nas planilhas de contêineres.
2. **Integra Desenhos Técnicos (DWG) com Materiais (BOM):** Permite ver os fluxogramas dos tubos, bombas e válvulas de forma interativa diretamente na tela, ajudando a saber onde cada material será aplicado no campo.
3. **Sincroniza com Google Sheets:** Permite importar e exportar os dados reais para planilhas da nuvem com poucos cliques.
4. **Simplifica a Busca de Materiais:** Permite pesquisar qualquer código de peça (*Part Number*) ou código SAP e descobrir em qual gaveta do almoxarifado ele está ou em qual desenho técnico ele foi planejado.

---

## 🛠️ Principais Módulos do Sistema

*   **📊 Dashboard Central:** Visão executiva das divergências ativas, contêineres pendentes e alertas críticos de estoque de insumos (ex: Gaskets e materiais abaixo do mínimo).
*   **📦 Gestão de Contêineres:** Tabela dinâmica de rastreamento com ações rápidas para resolver divergências, registrar vistorias e editar metadados operacionais.
*   **🗺️ Jobbook & Desenhos Técnicos (DWG):**
    *   **Visualizador Interativo:** Renderização de diagramas hidráulicos e plantas de tubulações com nós pulsantes clicáveis (Válvulas, Bombas, Flanges).
    *   **BOM (Bill of Materials):** Lista dinâmica de insumos necessários para cada desenho de engenharia.
    *   **Inserção Dinâmica:** Botões dedicados para cadastrar novos desenhos (`.dwg`) ou adicionar novos itens à lista de materiais diretamente na Torre de Controle.
*   **📑 Sincronização Google Sheets:** Módulo para autenticar com sua conta do Google e puxar dados de planilhas de forma segura ou testar no Modo de Demonstração Offline.
*   **⛓️ Fluxo de Suprimentos:** Visualização interativa passo-a-passo do processo de aquisição e requisições de compras ativas.

---

## 💻 Como Rodar o Projeto Localmente

Certifique-se de ter o **Node.js** instalado em sua máquina e siga os passos abaixo para iniciar a Torre de Controle:

1.  **Instalar todas as dependências:**
    ```bash
    npm install
    ```
2.  **Iniciar a aplicação em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```
3.  **Acessar a interface no seu navegador:**
    Abra [http://localhost:3000](http://localhost:3000)

---

## 📂 Dados de Engenharia Reais Integrados

O sistema já vem alimentado com dados técnicos e listas de peças extraídos diretamente de projetos de engenharia reais:

1.  **Caterpillar 3512C HD TA (Desenho `310-ME-001`):** Diagrama hidráulico e lista de materiais (BOM) dos sistemas de água de resfriamento LT e HT dos motores principais.
2.  **Módulo Bilge & FiFi (Desenho `310-FIFI-002`):** Sistema de sucção de porão e hidrantes de combate a incêndio com bombas Azcue.
3.  **Estação Selmar Blue Sea 2500 (Desenho `345-STP-003`):** Planta de tubulação e lista de conexões da estação de tratamento de esgoto de 2500 L/dia.
4.  **Grupo Hydrophore DAB Euroinox 40/50T (Desenho `341-HYD-004`):** Sistema de pressurização e bombas de água doce para a tripulação.
5.  **Cooling Shaft Generator Baumuller (Desenho `333-SGEN-005`):** Circuito de resfriamento de ciclo fechado para os inversores Aradex e motor síncrono.

---

## ⚙️ Estrutura Técnica do Código

Para os membros mais técnicos da equipe, o projeto está estruturado de forma moderna e modular:

```text
├── server.ts             # Servidor Express (API, rotas de dados e banco mockado)
├── src/
│   ├── App.tsx           # Layout principal e gerenciamento de abas/navegação
│   ├── main.tsx          # Inicialização do React + Vite
│   ├── index.css         # Configurações de estilo global e temas Tailwind v4
│   ├── types.ts          # Interfaces TypeScript unificadas para contêineres e desenhos
│   └── components/       # Componentes de interface modulares:
│       ├── JobbookIntegration.tsx  # Painel de DWG, fluxogramas e lista de materiais (BOM)
│       ├── ContainerTable.tsx      # Rastreamento de divergências de contêineres
│       ├── GoogleSheetsSync.tsx    # Integração segura com planilhas Google
│       ├── ProcurementFlowchart.tsx # Fluxograma de Suprimentos
│       └── LogsPanel.tsx           # Painel de auditoria do sistema em tempo real
```

---

## 🔒 Segurança & Boas Práticas

*   **API Proxied:** Todas as chamadas sensíveis e integrações externas passam de forma segura pelo servidor backend (`/api/*`), evitando que chaves de acesso fiquem expostas no navegador dos usuários.
*   **Design Responsivo:** Construído com **Tailwind CSS**, permitindo que engenheiros visualizem os fluxogramas de forma clara em telas grandes de escritórios, ou que operadores de pátio verifiquem informações de contêineres diretamente do celular.
