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

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
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

function formatBodyHtml(body: string) {
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const urlMatch = line.match(/^(Profile|Link|Website):\s*(https?:\/\/\S+)$/i)
      if (urlMatch) {
        const label = escapeHtml(urlMatch[1])
        const href = escapeHtml(urlMatch[2])
        return `<li style="margin:0 0 8px 0;line-height:1.7;"><strong style="color:#001739;">${label}:</strong> <a href="${href}" style="color:#001739;text-decoration:underline;word-break:break-word;">${href}</a></li>`
      }

      const keyValueMatch = line.match(/^([^:]+):\s*(.+)$/)
      if (keyValueMatch) {
        const label = escapeHtml(keyValueMatch[1].trim())
        const value = escapeHtml(keyValueMatch[2].trim())
        return `<li style="margin:0 0 8px 0;line-height:1.7;"><strong style="color:#001739;">${label}:</strong> <span style="color:#1a1a1a;">${value}</span></li>`
      }

      return `<li style="margin:0 0 8px 0;line-height:1.7;color:#1a1a1a;">${escapeHtml(line)}</li>`
    })
    .join('')
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
  const publicSite = isPublicHttpUrl(siteUrl) && !siteUrl.includes('localhost')
  const logoUrl = 'https://showstellar.com/headerlogo.png'
  const mascotUrl = mascotPath && publicSite ? toAssetUrl(siteUrl, mascotPath) : null
  const bodyHtml = formatBodyHtml(body)

  return `
    <div style="background:#f8f9fc;padding:32px 16px;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(0,23,57,0.08);border:1px solid rgba(0,23,57,0.08);">
        <div style="height:8px;background:#001739;"></div>
        <div style="padding:32px 28px 28px 28px;">
          <div style="text-align:center;margin-bottom:22px;">
            <img
              src="${escapeHtml(logoUrl)}"
              alt="ShowStellar"
              style="display:block;margin:0 auto 10px;max-width:180px;width:100%;height:auto;object-fit:contain;"
            />
            ${mascotUrl ? `<img src="${escapeHtml(mascotUrl)}" alt="" style="height:52px;width:52px;display:block;margin:0 auto 6px;" />` : ''}
            <h2 style="color:#001739;margin:0;font-size:26px;line-height:1.25;font-weight:700;">${escapeHtml(title)}</h2>
            ${intro ? `<p style="margin:10px 0 0;color:#1a1a1a;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>` : ''}
          </div>

          <div style="background:#f8f9fc;border:1px solid rgba(0,23,57,0.08);border-radius:16px;padding:18px 18px 10px 18px;">
            <ul style="margin:0;padding:0;list-style:none;font-size:14px;line-height:1.7;color:#1a1a1a;">
              ${bodyHtml}
            </ul>
          </div>

          ${buttonHref && buttonText ? `
            <div style="text-align:center;margin-top:24px;">
              <a
                href="${escapeHtml(buttonHref)}"
                style="display:inline-block;padding:13px 24px;background:#001739;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 10px 20px rgba(0,23,57,0.12);"
              >
                ${escapeHtml(buttonText)}
              </a>
            </div>
          ` : ''}

          <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#5b6475;text-align:center;">
            ${escapeHtml(footerText ?? 'If you did not request this email, you can safely ignore it.')}
          </p>
        </div>
      </div>
    </div>
  `
}
