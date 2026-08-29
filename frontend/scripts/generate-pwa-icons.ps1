Add-Type -AssemblyName System.Drawing

$source = Join-Path $PSScriptRoot "..\public\top-logo-transparent.png"
$destination = Join-Path $PSScriptRoot "..\public\icons"
New-Item -ItemType Directory -Force -Path $destination | Out-Null

function New-TopIcon {
  param(
    [int]$Size,
    [string]$Name,
    [double]$Scale = 0.82
  )

  $canvas = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)),
    ([System.Drawing.Color]::FromArgb(255, 9, 12, 28)),
    ([System.Drawing.Color]::FromArgb(255, 39, 31, 81)),
    42
  )
  $graphics.FillRectangle($background, 0, 0, $Size, $Size)
  $background.Dispose()

  $sourceImage = [System.Drawing.Image]::FromFile($source)
  $targetSize = [int]($Size * $Scale)
  $offset = [int](($Size - $targetSize) / 2)
  $graphics.DrawImage($sourceImage, (New-Object System.Drawing.Rectangle($offset, $offset, $targetSize, $targetSize)))
  $sourceImage.Dispose()
  $graphics.Dispose()

  $canvas.Save((Join-Path $destination $Name), [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
}

New-TopIcon -Size 180 -Name "apple-touch-icon.png"
New-TopIcon -Size 192 -Name "top-icon-192.png"
New-TopIcon -Size 512 -Name "top-icon-512.png"
New-TopIcon -Size 512 -Name "top-icon-maskable-512.png" -Scale 0.66
