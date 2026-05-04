# Generate PWA icon PNGs (192/512 + maskable) via System.Drawing.
# Source: simple "A" letter on rose period color (#c44d6e).
# Run: pwsh scripts/generate-icons.ps1

param(
  [string]$OutDir = "$(Split-Path -Parent $PSScriptRoot)\public\icons"
)

Add-Type -AssemblyName System.Drawing

function New-IconPng {
  param(
    [int]$Size,
    [string]$Path,
    [double]$LetterScale = 0.55
  )
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # Background: rose period color
  $bg = [System.Drawing.Color]::FromArgb(255, 196, 77, 110)
  $g.Clear($bg)

  # Letter "A" centered, bold, white
  $fontSize = [single]($Size * $LetterScale)
  $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold)
  $brush = [System.Drawing.Brushes]::White
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
  $g.DrawString('A', $font, $brush, $rect, $format)

  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  Write-Host "  Created: $Path ($([math]::Round((Get-Item $Path).Length / 1024, 1)) KB)"
}

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

Write-Host "Generating PWA icons in $OutDir"
New-IconPng -Size 192 -Path "$OutDir\icon-192.png"
New-IconPng -Size 512 -Path "$OutDir\icon-512.png"
New-IconPng -Size 512 -Path "$OutDir\icon-maskable-512.png" -LetterScale 0.45
Write-Host "Done."
