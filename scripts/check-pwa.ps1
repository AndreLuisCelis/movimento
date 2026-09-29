# Validates the full PWA surface against a running server (docs/PWA.md).
#
#   powershell -File scripts/check-pwa.ps1                  # :3000
#   powershell -File scripts/check-pwa.ps1 -BaseUrl http://192.168.1.21:3000
#
# Exit code 0 = every expectation met; 1 = something failed.
param([string]$BaseUrl = 'http://localhost:3000')
$ErrorActionPreference = 'Continue'
$failures = 0

function Report([string]$name, [bool]$ok, [string]$detail = '') {
  if (-not $ok) { $script:failures++ }
  $mark = 'FAIL'
  if ($ok) { $mark = 'OK  ' }
  if ($detail) { $detail = "  $detail" }
  Write-Output ("{0}  {1}{2}" -f $mark, $name, $detail)
}

function StatusOf($err) {
  try { return [int]$err.Exception.Response.StatusCode } catch { return 0 }
}

function HeaderOf($err, [string]$name) {
  try { return [string]$err.Exception.Response.Headers[$name] } catch { return '' }
}

# Invoke-WebRequest hands back byte[] for some content types on PS 5.1.
function TextOf($content) {
  if ($content -is [byte[]]) { return [Text.Encoding]::UTF8.GetString($content) }
  return [string]$content
}

# Requests we expect to succeed, plus the content type they must carry.
$expect200 = [ordered]@{
  '/'                      = 'text/html'
  '/manifest.webmanifest'  = 'application/manifest+json'
  '/icon.svg'              = 'image/svg+xml'
  '/favicon.ico'           = 'image/x-icon'
  '/apple-icon.png'        = 'image/png'
  '/icons/icon-192.png'    = 'image/png'
  '/icons/icon-512.png'    = 'image/png'
  '/icons/maskable-512.png'= 'image/png'
  '/sw.js'                 = 'application/javascript'
  '/offline.html'          = 'text/html'
}

foreach ($u in $expect200.Keys) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing "$BaseUrl$u" -TimeoutSec 120
    $ct = [string]$r.Headers['Content-Type']
    $typeOk = $ct -like ($expect200[$u] + '*')
    Report "$u => 200 + $($expect200[$u])" ($r.StatusCode -eq 200 -and $typeOk) "got $($r.StatusCode), $ct, len=$($r.Content.Length)"
  } catch {
    Report "$u => 200" $false $_.Exception.Message
  }
}

# /favicon.svg is intentionally redirected (permanent) so cached Vite shells
# keep resolving it. PS 5.1 does not follow 308 and, for that reason, may hand
# back the response object instead of throwing — handle both paths.
$code = 0
$loc = ''
try {
  $r = Invoke-WebRequest -UseBasicParsing "$BaseUrl/favicon.svg" -MaximumRedirection 0 -TimeoutSec 30
  $code = [int]$r.StatusCode
  $loc = [string]$r.Headers['Location']
} catch {
  $code = StatusOf $_
  $loc = HeaderOf $_ 'Location'
}
Report '/favicon.svg => 308 -> /icon.svg' ($code -eq 308 -and $loc -eq '/icon.svg') "got $code, Location=$loc"

# URLs that only ever belonged to the legacy Vite build must stay 404 so a
# stale cached shell fails loudly instead of half-loading.
foreach ($u in '/@vite/client', '/src/main.tsx') {
  try {
    $r = Invoke-WebRequest -UseBasicParsing "$BaseUrl$u" -TimeoutSec 30
    Report "$u => 404" $false "got $($r.StatusCode)"
  } catch {
    $code = StatusOf $_
    Report "$u => 404" ($code -eq 404) "got $code"
  }
}

# Document head: installability markers.
try {
  $r = Invoke-WebRequest -UseBasicParsing "$BaseUrl/" -TimeoutSec 120
  $html = TextOf $r.Content
  foreach ($needle in @(
      'rel="manifest"',
      '/manifest.webmanifest',
      '/icon.svg',
      'favicon.ico',
      'apple-touch-icon',
      'name="theme-color"',
      'name="apple-mobile-web-app-capable"',
      'name="mobile-web-app-capable"',
      '/_next/static'
    )) {
    Report "head contains $needle" ($html -like "*$needle*")
  }
} catch {
  Report 'GET / (head inspection)' $false $_.Exception.Message
}

# Manifest body must advertise the icons the install prompt picks from.
try {
  $r = Invoke-WebRequest -UseBasicParsing "$BaseUrl/manifest.webmanifest" -TimeoutSec 30
  $json = (TextOf $r.Content) | ConvertFrom-Json
  foreach ($src in '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png') {
    Report "manifest icon $src" (@($json.icons | Where-Object { $_.src -eq $src }).Count -eq 1)
  }
  Report "manifest display=standalone" ($json.display -eq 'standalone') "got $($json.display)"
  Report "manifest scope=/ + start_url=/" ($json.scope -eq '/' -and $json.start_url -eq '/') "got scope=$($json.scope), start_url=$($json.start_url)"
} catch {
  Report 'manifest body' $false $_.Exception.Message
}

$summary = "$failures CHECK(S) FAILED"
if ($failures -eq 0) { $summary = 'ALL CHECKS PASSED' }
Write-Output "=== $summary ==="
if ($failures -eq 0) { exit 0 }
exit 1
