$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$extensions = @('.html', '.css', '.js', '.md', '.json')
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $extensions -contains $_.Extension.ToLowerInvariant() -and $_.FullName -notmatch '[\\/](\.venv|\.github|scripts)[\\/]'
}
$replacement = [char]0xFFFD
$mojibake = @(
  ([string]([char]0x00E2) + [char]0x20AC),
  ([string]([char]0x00E2) + [char]0x20AC + [char]0x2122),
  ([string]([char]0x00E2) + [char]0x20AC + [char]0x0153),
  ([string]([char]0x00E2) + [char]0x20AC + [char]0xFFFD),
  ([string]([char]0x00E2) + [char]0x2013),
  ([string]([char]0x00E2) + [char]0x2014),
  ([string]([char]0x00C2)),
  ([string]([char]0x00C3))
)
$brokenLink = '[?]'
$localhost = 'http://127.0.0.1:5500'
$utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
$failures = [System.Collections.Generic.List[string]]::new()

foreach ($file in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  try { $text = $utf8Strict.GetString($bytes) }
  catch { $failures.Add("Invalid UTF-8: $($file.FullName)"); continue }

  if ($text.Contains($replacement)) { $failures.Add("Replacement character: $($file.FullName)") }
  foreach ($signature in $mojibake) {
    if ($text.Contains($signature)) { $failures.Add("Mojibake '$signature': $($file.FullName)") }
  }
  if ($text.Contains($brokenLink) -or $text.Contains($localhost)) {
    $failures.Add("Broken link fragment: $($file.FullName)")
  }
  if ($file.Extension -ieq '.html' -and $text -notmatch '(?i)<meta\s+charset=["'']utf-8["'']') {
    $failures.Add("Missing UTF-8 charset declaration: $($file.FullName)")
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  exit 1
}
Write-Output "Content integrity passed for $($files.Count) source files."
