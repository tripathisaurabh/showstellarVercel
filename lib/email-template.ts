type BuildBrandedEmailTemplateArgs = {
  siteUrl: string
  title: string
  body: string
  intro?: string
  buttonText?: string
  buttonHref?: string
  footerText?: string
  mascotPath?: string | null
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function toAssetUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl).toString()
}

export function buildBrandedEmailTemplate({
  siteUrl,
  title,
  body,
  intro,
  buttonText,
  buttonHref,
  footerText,
  mascotPath = '/illustrations/feedback/verification-star.svg',
}: BuildBrandedEmailTemplateArgs) {
  const logoUrl = toAssetUrl(siteUrl, '/logo.png')
  const mascotUrl = mascotPath ? toAssetUrl(siteUrl, mascotPath) : null

  return `
    <div style="background:#ffffff;padding:40px 16px;font-family:Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 12px 32px rgba(0,23,57,0.08);border:1px solid rgba(0,23,57,0.08);">
        <div style="margin-bottom:18px;">
          <img src="${escapeHtml(logoUrl)}" alt="ShowStellar" style="height:50px;width:auto;display:inline-block;" />
        </div>
        ${mascotUrl ? `<img src="${escapeHtml(mascotUrl)}" alt="" style="height:60px;width:60px;display:block;margin:0 auto 10px;" />` : ''}
        <h2 style="color:#001739;margin:0 0 12px;font-size:24px;line-height:1.3;font-weight:700;">${escapeHtml(title)}</h2>
        ${intro ? `<p style="margin:0 0 14px;color:#1a1a1a;font-size:14px;line-height:1.7;">${escapeHtml(intro)}</p>` : ''}
        <p style="margin:0;color:#1a1a1a;font-size:14px;line-height:1.75;white-space:pre-line;">${escapeHtml(body)}</p>
        ${buttonHref && buttonText ? `
          <a
            href="${escapeHtml(buttonHref)}"
            style="display:inline-block;margin-top:22px;padding:12px 24px;background:#001739;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;"
          >
            ${escapeHtml(buttonText)}
          </a>
        ` : ''}
        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#1a1a1a;">
          ${escapeHtml(footerText ?? 'If you did not request this email, you can safely ignore it.')}
        </p>
      </div>
    </div>
  `
}
