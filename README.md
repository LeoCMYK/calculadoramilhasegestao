# Calculadora M&G — Diagnóstico de gastos para milhas

Página única (`index.html`) com o fluxo de 3 fases:

1. **Captura** — usuário digita o gasto médio mensal no cartão.
2. **Modal de lead** — coleta Nome, E-mail e WhatsApp (mesma URL).
3. **Resultado** — diagnóstico calculado por faixa de gasto.

O cálculo segue a *Tabela de Parâmetros Definitiva* (Gold / Platinum / Visa Infinite /
Mastercard Black) e as fórmulas do documento oficial.

## Captação de leads (Google Sheets)

Ao enviar o modal, o front-end faz um `POST` direto para um **Web App do Google Apps
Script**, que grava cada lead como uma linha na planilha. Sem servidor próprio.

```
Navegador (index.html)  ──POST──▶  Google Apps Script (Web App)  ──▶  Planilha
```

### Como configurar

1. Crie uma planilha no Google Sheets.
2. **Extensões → Apps Script**, cole o conteúdo de [`google-apps-script.gs`](google-apps-script.gs) e salve.
3. **Implantar → Nova implantação → App da Web**:
   - *Executar como:* **Eu**
   - *Quem pode acessar:* **Qualquer pessoa**
4. Autorize e copie a **URL do app da Web** (termina em `/exec`).
5. No `index.html`, cole essa URL na constante `LEAD_ENDPOINT` (dentro do `<script>`).
6. Faça commit/push — a planilha passa a receber os leads.

### Dados gravados por lead

`Data/Hora · Nome · E-mail · WhatsApp · Gasto mensal · Cartão · Pontos totais ·
Viagens internacionais · Viagens nacionais`

### Notas

- O envio usa `mode: "no-cors"`, então o navegador não lê a resposta — mas a linha é
  gravada normalmente. Para testar o endpoint diretamente, faça um `POST` por `curl`.
- Para atualizar o código do Apps Script mantendo a **mesma URL**: Implantar →
  *Gerenciar implantações* → editar → *Nova versão* → Implantar.

## Hospedagem

Site estático — pode ser servido por GitHub Pages, Vercel, Netlify ou qualquer host
de arquivos estáticos. Não há mais função serverless no projeto.
