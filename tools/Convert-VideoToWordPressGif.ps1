param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [string]$OutputPath,

    [ValidateRange(1, 30)]
    [int]$Fps = 8,

    [ValidateRange(320, 1920)]
    [int]$Width = 960,

    [ValidateRange(240, 1920)]
    [int]$Height = 540
)

$ErrorActionPreference = 'Stop'

function Get-CommandPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        return $null
    }

    return $command.Source
}

function Run-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Write-Host ''
    Write-Host ('> ' + $FilePath + ' ' + ($Arguments -join ' '))

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE."
    }
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $inputDirectory = Split-Path -Path $resolvedInput -Parent
    $inputBaseName = [System.IO.Path]::GetFileNameWithoutExtension($resolvedInput)
    $OutputPath = Join-Path $inputDirectory ($inputBaseName + '.gif')
}

$resolvedOutputDirectory = Split-Path -Path $OutputPath -Parent
if (-not [string]::IsNullOrWhiteSpace($resolvedOutputDirectory) -and -not (Test-Path -LiteralPath $resolvedOutputDirectory)) {
    New-Item -ItemType Directory -Path $resolvedOutputDirectory | Out-Null
}

$ffmpegPath = Get-CommandPath -Name 'ffmpeg'
if ($null -eq $ffmpegPath) {
    throw @"
ffmpeg was not found in PATH.

Install it with winget:
  winget install Gyan.FFmpeg

Then restart VS Code or your terminal and run this script again.
"@
}

$gifskiPath = Get-CommandPath -Name 'gifski'
$scaleFilter = "fps=$Fps,scale='min(iw,${Width})':'min(ih,${Height})':force_original_aspect_ratio=decrease:flags=lanczos,pad=${Width}:${Height}:(ow-iw)/2:(oh-ih)/2:white"

Write-Host "Input:  $resolvedInput"
Write-Host "Output: $OutputPath"
Write-Host "FPS:    $Fps"
Write-Host "Canvas: ${Width}x${Height}"

if ($gifskiPath) {
    $tempRoot = Join-Path $env:TEMP ('dtbk-gif-' + [guid]::NewGuid().ToString('N'))
    $framesDirectory = Join-Path $tempRoot 'frames'
    New-Item -ItemType Directory -Path $framesDirectory -Force | Out-Null

    try {
        Run-NativeCommand -FilePath $ffmpegPath -Arguments @(
            '-y',
            '-i', $resolvedInput,
            '-vf', $scaleFilter,
            (Join-Path $framesDirectory 'frame-%04d.png')
        )

        $framePattern = Join-Path $framesDirectory 'frame-*.png'
        Run-NativeCommand -FilePath $gifskiPath -Arguments @(
            '--fps', $Fps.ToString(),
            '--width', $Width.ToString(),
            '--height', $Height.ToString(),
            '--output', $OutputPath,
            $framePattern
        )
    }
    finally {
        if (Test-Path -LiteralPath $tempRoot) {
            Remove-Item -LiteralPath $tempRoot -Recurse -Force
        }
    }
}
else {
    $palettePath = Join-Path $env:TEMP ('dtbk-palette-' + [guid]::NewGuid().ToString('N') + '.png')

    try {
        Run-NativeCommand -FilePath $ffmpegPath -Arguments @(
            '-y',
            '-i', $resolvedInput,
            '-vf', ($scaleFilter + ',palettegen'),
            $palettePath
        )

        Run-NativeCommand -FilePath $ffmpegPath -Arguments @(
            '-y',
            '-i', $resolvedInput,
            '-i', $palettePath,
            '-lavfi', ($scaleFilter + '[x];[x][1:v]paletteuse'),
            $OutputPath
        )
    }
    finally {
        if (Test-Path -LiteralPath $palettePath) {
            Remove-Item -LiteralPath $palettePath -Force
        }
    }
}

Write-Host ''
Write-Host "GIF created: $OutputPath"
