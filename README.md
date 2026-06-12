# Calculadora M&G — Diagnóstico de gastos para milhas

Página única (`index.html`) com o fluxo de 3 fases:

1. **Captura** — usuário digita o gasto médio mensal no cartão.
2. **Modal de lead** — coleta Nome, E-mail e WhatsApp (mesma URL).
3. **Resultado** — diagnóstico calculado por faixa de gasto.

O cálculo segue a *Tabela de Parâmetros Definitiva* (Gold / Platinum / Visa Infinite /
Mastercard Black) e as fórmulas do documento oficial.

## Captação de leads (RD Station + Mautic)

Ao enviar o modal, o front-end faz `POST /api/lead`. A função serverless
[`api/lead.js`](api/lead.js) recebe o lead e repassa para os dois CRMs **a partir do
servidor** — os tokens/credenciais ficam em variáveis de ambiente, nunca no navegador.

```
Navegador (index.html)  ──POST /api/lead──▶  Vercel Function  ──▶  RD Station (Conversions API)
                                                              └──▶  Mautic (form submit)
```

### Deploy na Vercel

1. Acesse <https://vercel.com> e faça login com o GitHub.
2. **Add New > Project** e importe o repositório `Calculadora-M-G`.
3. Não precisa configurar build (projeto estático + função em `/api`). Clique em **Deploy**.
4. Em **Project Settings > Environment Variables**, adicione (veja [`.env.example`](.env.example)):

   | Variável | Valor |
   |---|---|
   | `RD_TOKEN` | Token público da API do RD Station |
   | `RD_CONVERSION_IDENTIFIER` | `calculadora-milhas` (ou outro nome) |
   | `MAUTIC_BASE_URL` | `https://seu-mautic.com.br` (sem barra final) |
   | `MAUTIC_FORM_ID` | ID numérico do formulário no Mautic |
   | `MAUTIC_FORM_NAME` | alias do formulário no Mautic |

5. Faça um **Redeploy** para aplicar as variáveis.

### Onde encontrar cada valor

- **RD Station — token público:** RD Station Marketing > **Integrações** > **Token de API** > *Token público*.
- **RD Station — campo de gasto:** crie um campo personalizado com o identificador
  `gasto_mensal_cartao` (a função envia em `cf_gasto_mensal_cartao`).
- **Mautic — Form ID e alias:** Mautic > **Forms**. O ID aparece na URL de edição do form;
  o **Alias** é uma coluna na lista de formulários.
- **Mautic — aliases dos campos:** abra o formulário e confira o *alias* de cada campo
  (E-mail, Nome, Telefone, Gasto). Ajuste o objeto `FIELD_ALIASES` no topo de
  [`api/lead.js`](api/lead.js) para corresponder.

### Teste local

A função `/api/lead` só roda na Vercel (ou via `vercel dev`). Abrindo o `index.html`
direto ou pelo GitHub Pages, o cálculo e o fluxo funcionam normalmente, mas o envio do
lead falha silenciosamente (registrado no console) — é esperado fora da Vercel.
