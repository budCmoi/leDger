param(
    [string]$Configuration = "Release",
    [string]$RuntimeIdentifier = "win-x64",
    [string]$NodeVersion = "20.19.5",
    [switch]$SelfContained
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptRoot "..")
$OutputRoot = Join-Path $RepoRoot "artifacts/windows/LeDger.Desktop"
$DesktopProject = Join-Path $RepoRoot "desktop/LeDger.Desktop/LeDger.Desktop.csproj"
$NodeArchiveName = "node-v$NodeVersion-win-x64.zip"
$NodeArchiveUrl = "https://nodejs.org/dist/v$NodeVersion/$NodeArchiveName"
$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("ledger-desktop-" + [System.Guid]::NewGuid().ToString("N"))
$NodeExtractRoot = Join-Path $TempRoot "node"

function Copy-IfExists {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (Test-Path $Source) {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
        Copy-Item -Recurse -Force $Source $Destination
    }
}

try {
    Push-Location $RepoRoot

    Write-Host "[1/5] Build backend"
    npm run build --workspace backend

    Write-Host "[2/5] Build frontend"
    npm run build --workspace frontend

    Write-Host "[3/5] Publish C# desktop shell"
    $publishArgs = @(
        "publish",
        $DesktopProject,
        "-c", $Configuration,
        "-r", $RuntimeIdentifier,
        "-o", $OutputRoot,
        "--self-contained", $(if ($SelfContained) { "true" } else { "false" })
    )
    dotnet @publishArgs

    Write-Host "[4/5] Copy runtime assets"
    New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
    Copy-IfExists (Join-Path $RepoRoot "backend/dist") (Join-Path $OutputRoot "backend/dist")
    Copy-IfExists (Join-Path $RepoRoot "frontend/dist") (Join-Path $OutputRoot "frontend/dist")
    Copy-IfExists (Join-Path $RepoRoot "node_modules") (Join-Path $OutputRoot "node_modules")
    Copy-IfExists (Join-Path $RepoRoot "backend/.env") (Join-Path $OutputRoot "backend/.env")
    Copy-IfExists (Join-Path $RepoRoot ".env") (Join-Path $OutputRoot ".env")

    Write-Host "[5/5] Bundle portable Node runtime"
    New-Item -ItemType Directory -Force -Path $NodeExtractRoot | Out-Null
    $NodeArchivePath = Join-Path $TempRoot $NodeArchiveName
    Invoke-WebRequest -Uri $NodeArchiveUrl -OutFile $NodeArchivePath
    Expand-Archive -LiteralPath $NodeArchivePath -DestinationPath $NodeExtractRoot -Force
    $ExtractedNode = Get-ChildItem -Path $NodeExtractRoot -Filter node.exe -Recurse | Select-Object -First 1
    if (-not $ExtractedNode) {
        throw "node.exe introuvable apres extraction de l archive Node."
    }

    $RuntimeDir = Join-Path $OutputRoot "runtime"
    New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
    Copy-Item -Force $ExtractedNode.FullName (Join-Path $RuntimeDir "node.exe")

    Write-Host "Publication Windows terminee : $OutputRoot"
    Write-Host "Executable : $(Join-Path $OutputRoot 'LeDger.Desktop.exe')"
}
finally {
    Pop-Location
    if (Test-Path $TempRoot) {
        Remove-Item -Recurse -Force $TempRoot
    }
}