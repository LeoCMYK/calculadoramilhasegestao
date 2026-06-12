/**
 * Função Serverless (Vercel) — Captação de leads da calculadora.
 *
 * Recebe { nome, email, whatsapp, gasto_mensal, ... } do formulário (Fase 2)
 * e repassa para RD Station (Conversions API) e Mautic (form submit).
 *
 * Os SEGREDOS ficam em Environment Variables na Vercel — nunca no código:
 *   RD_TOKEN                 -> Token público da API do RD Station
 *   RD_CONVERSION_IDENTIFIER -> nome do evento de conversão (ex.: calculadora-milhas)
 *   MAUTIC_BASE_URL          -> https://seu-mautic.com.br (sem barra no final)
 *   MAUTIC_FORM_ID           -> ID numérico do formulário no Mautic
 *   MAUTIC_FORM_NAME         -> alias do formulário no Mautic
 *
 * Ajuste FIELD_ALIASES abaixo para baterem com os aliases dos campos
 * do SEU formulário no Mautic.
 */

// Mapeie cada dado do lead para o ALIAS do campo correspondente no Mautic.
var FIELD_ALIASES = {
  email: "email",
  name: "nome",
  phone: "telefone",
  spend: "gasto_mensal"
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Body — a Vercel normalmente já entrega req.body como objeto.
  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  var nome = String(body.nome || "").trim();
  var email = String(body.email || "").trim();
  var whatsapp = String(body.whatsapp || "").trim();
  var gasto = body.gasto_mensal != null ? body.gasto_mensal : "";

  // Validação mínima — e-mail é o identificador do lead nos dois CRMs.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }

  var results = {};

  // ----------------------- RD Station -----------------------
  // Conversions API: cria/atualiza o contato e registra a conversão.
  try {
    if (process.env.RD_TOKEN) {
      var rdResp = await fetch(
        "https://api.rd.services/platform/conversions?api_key=" +
          encodeURIComponent(process.env.RD_TOKEN),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "CONVERSION",
            event_family: "CDP",
            payload: {
              conversion_identifier:
                process.env.RD_CONVERSION_IDENTIFIER || "calculadora-milhas",
              name: nome,
              email: email,
              personal_phone: whatsapp,
              // Campo customizado: crie no RD com o identificador "gasto_mensal_cartao".
              cf_gasto_mensal_cartao: gasto,
              available_for_mailing: true
            }
          })
        }
      );
      results.rd = { status: rdResp.status, ok: rdResp.ok };
      if (!rdResp.ok) results.rd.body = await safeText(rdResp);
    } else {
      results.rd = { skipped: "RD_TOKEN não configurado" };
    }
  } catch (e) {
    results.rd = { error: String(e) };
  }

  // ------------------------- Mautic --------------------------
  // Submissão pública de formulário — dispara as automações do form.
  try {
    if (process.env.MAUTIC_BASE_URL && process.env.MAUTIC_FORM_ID) {
      var formId = String(process.env.MAUTIC_FORM_ID);
      var params = new URLSearchParams();
      params.set("mauticform[formId]", formId);
      params.set("mauticform[formName]", process.env.MAUTIC_FORM_NAME || "");
      params.set("mauticform[return]", "");
      params.set("mauticform[" + FIELD_ALIASES.email + "]", email);
      params.set("mauticform[" + FIELD_ALIASES.name + "]", nome);
      params.set("mauticform[" + FIELD_ALIASES.phone + "]", whatsapp);
      params.set("mauticform[" + FIELD_ALIASES.spend + "]", String(gasto));

      var base = process.env.MAUTIC_BASE_URL.replace(/\/+$/, "");
      var mResp = await fetch(base + "/form/submit?formId=" + formId, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      results.mautic = { status: mResp.status, ok: mResp.ok };
    } else {
      results.mautic = { skipped: "MAUTIC_BASE_URL/MAUTIC_FORM_ID não configurados" };
    }
  } catch (e) {
    results.mautic = { error: String(e) };
  }

  return res.status(200).json({ ok: true, results: results });
};

async function safeText(resp) {
  try { return await resp.text(); } catch (e) { return null; }
}
