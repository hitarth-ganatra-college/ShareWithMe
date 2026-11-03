export interface BundleInput {
  title?: string;
  html: string;
  css: string;
  js: string;
  showWatermark?: boolean;
}

export function bundleProject({
  title = 'ShareWithMe Project',
  html,
  css,
  js,
  showWatermark = true,
}: BundleInput): string {
  const trimmedHtml = (html || '').trim();
  const trimmedCss = (css || '').trim();
  const trimmedJs = (js || '').trim();

  // Floating watermark banner (stylish, non-intrusive, dismissible)
  const watermarkHtml = showWatermark
    ? `
<div id="swm-floating-badge" style="
  position: fixed;
  bottom: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 9999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2147483647;
  user-select: none;
">
  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
  <span>Hosted on <a href="/" target="_blank" style="color:#60a5fa; text-decoration:none; font-weight:600;">ShareWithMe</a></span>
  <button onclick="document.getElementById('swm-floating-badge').remove();" style="
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 13px;
    padding: 0 0 0 4px;
    line-height: 1;
  " title="Close badge">&times;</button>
</div>`
    : '';

  const hasDoctypeOrHtml =
    /<!doctype\s+html/i.test(trimmedHtml) || /<html/i.test(trimmedHtml);

  if (hasDoctypeOrHtml) {
    let result = trimmedHtml;

    // Inject CSS into <head> or before </head>
    if (trimmedCss) {
      const styleTag = `\n<style data-source="sharewithme">\n${trimmedCss}\n</style>\n`;
      if (/<\/head>/i.test(result)) {
        result = result.replace(/<\/head>/i, `${styleTag}</head>`);
      } else if (/<head>/i.test(result)) {
        result = result.replace(/<head>/i, `<head>${styleTag}`);
      } else {
        result = styleTag + result;
      }
    }

    // Inject JS and watermark before </body> or at the end
    const scriptTag = trimmedJs
      ? `\n<script data-source="sharewithme">\n${trimmedJs}\n</script>\n`
      : '';
    const injections = watermarkHtml + scriptTag;

    if (/<\/body>/i.test(result)) {
      result = result.replace(/<\/body>/i, `${injections}</body>`);
    } else {
      result = result + injections;
    }

    return result;
  }

  // Wrap partial HTML in a clean HTML5 boilerplate
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${trimmedCss ? `<style data-source="sharewithme">\n${trimmedCss}\n</style>` : ''}
</head>
<body>
  ${trimmedHtml}
  ${watermarkHtml}
  ${trimmedJs ? `<script data-source="sharewithme">\n${trimmedJs}\n</script>` : ''}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
