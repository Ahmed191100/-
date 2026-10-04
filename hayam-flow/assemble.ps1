# HAYAM — rough cut assembly (15.6s, reference rhythm)
# Needs ffmpeg on PATH. Run from this folder after s1..s5.mp4 are in ..\renders
#   .\assemble.ps1                 # video only (add music in CapCut)
#   .\assemble.ps1 -KeepAudio      # keep Omni's nylon/zip foley
param(
  [string]$Renders = (Join-Path $PSScriptRoot "..\renders"),
  [switch]$KeepAudio
)
$ErrorActionPreference = "Stop"

# Cut list: clip, in-point (s), length (s). Cuts land inside the motion,
# like the reference. Tweak in-points after you've watched the takes.
$cuts = @(
  @("s1", 0.4, 2.8),   # 0.0  – 2.8   smoothing the folded trousers
  @("s2", 0.3, 2.8),   # 2.8  – 5.6   waistband + drawstring
  @("s3", 0.4, 2.8),   # 5.6  – 8.4   zipper down
  @("s4", 0.3, 2.8),   # 8.4  – 11.2  cuff turn
  @("s5", 0.4, 2.8),   # 11.2 – 14.0  piping + pocket zip
  @("s1", 4.4, 1.6)    # 14.0 – 15.6  hands exit, clean full layout
)

$inputs = @(); $filters = @(); $labels = ""
for ($i = 0; $i -lt $cuts.Count; $i++) {
  $c = $cuts[$i]
  $file = Join-Path $Renders "$($c[0]).mp4"
  if (-not (Test-Path $file)) { throw "Missing $file" }
  $inputs += @("-i", $file)
  $end = $c[1] + $c[2]
  $filters += "[$($i):v]trim=start=$($c[1]):end=$end,setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1[v$i]"
  if ($KeepAudio) {
    $filters += "[$($i):a]atrim=start=$($c[1]):end=$end,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:d=0.04,afade=t=out:st=$($c[2]-0.04):d=0.04[a$i]"
    $labels += "[v$i][a$i]"
  } else {
    $labels += "[v$i]"
  }
}
$a = if ($KeepAudio) { 1 } else { 0 }
$filters += "$($labels)concat=n=$($cuts.Count):v=1:a=$a" + $(if ($KeepAudio) { "[v][a]" } else { "[v]" })

$out = Join-Path $Renders "HAYAM_master_9x16.mp4"
$map = @("-map", "[v]"); if ($KeepAudio) { $map += @("-map", "[a]", "-c:a", "aac", "-b:a", "192k") }
& ffmpeg -y @inputs -filter_complex ($filters -join ";") @map -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart $out
if ($LASTEXITCODE) { throw "ffmpeg failed" }

# 4:5 and 1:1 — centre crop, nudged slightly up to keep the garment centred
$aud = if ($KeepAudio) { @("-c:a", "copy") } else { @() }
& ffmpeg -y -i $out -vf "crop=1080:1350:0:(ih-1350)/2-60" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p @aud -movflags +faststart (Join-Path $Renders "HAYAM_4x5.mp4")
& ffmpeg -y -i $out -vf "crop=1080:1080:0:(ih-1080)/2-60" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p @aud -movflags +faststart (Join-Path $Renders "HAYAM_1x1.mp4")

Write-Host "Done -> $Renders (master 9:16, 4:5, 1:1)"
