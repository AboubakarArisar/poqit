param(
    [string]$IdentityName = 'pindaricoders.poqit',
    [string]$Publisher = 'CN=B5494106-381D-4BA7-9AD2-55A096587C06',
    [string]$PublisherDisplayName = 'pindaricoders'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($IdentityName -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') {
    throw 'IdentityName must be the exact package identity from Microsoft Partner Center.'
}
if (-not $Publisher.StartsWith('CN=')) {
    throw 'Publisher must be the exact CN= publisher value from Microsoft Partner Center.'
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$config = Get-Content -LiteralPath (Join-Path $projectRoot 'apps/desktop/src-tauri/tauri.conf.json') -Raw | ConvertFrom-Json
if ($config.version -notmatch '^\d+\.\d+\.\d+$') {
    throw 'The Tauri version must contain exactly three numeric components.'
}
$version = "$($config.version).0"
$outputDir = Join-Path $projectRoot 'outputs'
$output = Join-Path $outputDir "POQIT_$($version)_x64.msix"
if (Test-Path -LiteralPath $output) {
    throw "Package already exists: $output. Increase the app version before repackaging."
}

$sdkRoots = @(
    (Join-Path $projectRoot '.toolchains/Windows Kits/10/bin'),
    (Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10/bin')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$makeAppx = $sdkRoots | ForEach-Object {
    Get-ChildItem -LiteralPath $_ -Directory | Sort-Object Name -Descending | ForEach-Object {
        Join-Path $_.FullName 'x64/makeappx.exe'
    }
} | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $makeAppx) { throw 'Windows SDK MakeAppx.exe was not found.' }

$previousCargoHome = $env:CARGO_HOME
$previousRustupHome = $env:RUSTUP_HOME
$previousPath = $env:PATH
Push-Location $projectRoot
try {
    $localCargo = Join-Path $projectRoot '.toolchains/cargo/bin/cargo.exe'
    if (Test-Path -LiteralPath $localCargo) {
        $env:CARGO_HOME = Join-Path $projectRoot '.toolchains/cargo'
        $env:RUSTUP_HOME = Join-Path $projectRoot '.toolchains/rustup'
        $env:PATH = (Split-Path $localCargo -Parent) + [IO.Path]::PathSeparator + $env:PATH
    }
    & npm.cmd run tauri --workspace @poqit/desktop -- build --no-bundle
    if ($LASTEXITCODE -ne 0) { throw "Tauri release build failed with exit code $LASTEXITCODE." }
} finally {
    Pop-Location
    $env:CARGO_HOME = $previousCargoHome
    $env:RUSTUP_HOME = $previousRustupHome
    $env:PATH = $previousPath
}

$exe = Join-Path $projectRoot 'apps/desktop/src-tauri/target/release/poqit.exe'
if (-not (Test-Path -LiteralPath $exe)) { throw "Tauri executable was not produced: $exe" }

$temporaryRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
$stage = Join-Path $temporaryRoot ("poqit-msix-" + [guid]::NewGuid().ToString('N'))
if (-not ([IO.Path]::GetFullPath($stage)).StartsWith($temporaryRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'The MSIX staging path escaped the temporary directory.'
}

New-Item -ItemType Directory -Path (Join-Path $stage 'Assets') -Force | Out-Null
try {
    Copy-Item -LiteralPath $exe -Destination (Join-Path $stage 'poqit.exe')

    Add-Type -AssemblyName System.Drawing
    $iconPath = Join-Path $projectRoot 'assets/App-icon.png'
    $source = [System.Drawing.Image]::FromFile($iconPath)
    try {
        foreach ($asset in @(
            @{ Name = 'Square44x44Logo'; Size = 44 },
            @{ Name = 'Square150x150Logo'; Size = 150 },
            @{ Name = 'StoreLogo'; Size = 50 }
        )) {
            foreach ($scale in @(1, 2, 4)) {
                $size = $asset.Size * $scale
                $bitmap = New-Object System.Drawing.Bitmap($size, $size)
                $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                try {
                    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.Clear([System.Drawing.Color]::Transparent)
                    $graphics.DrawImage($source, 0, 0, $size, $size)
                    $suffix = if ($scale -eq 1) { '' } else { ".scale-$($scale * 100)" }
                    $bitmap.Save((Join-Path $stage "Assets/$($asset.Name)$suffix.png"), [System.Drawing.Imaging.ImageFormat]::Png)
                } finally {
                    $graphics.Dispose()
                    $bitmap.Dispose()
                }
            }
        }
    } finally {
        $source.Dispose()
    }

    $identityXml = [System.Security.SecurityElement]::Escape($IdentityName)
    $publisherXml = [System.Security.SecurityElement]::Escape($Publisher)
    $displayXml = [System.Security.SecurityElement]::Escape($PublisherDisplayName)
    $manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:uap10="http://schemas.microsoft.com/appx/manifest/uap/windows10/10"
         xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
         IgnorableNamespaces="uap uap10 rescap">
  <Identity Name="$identityXml" Publisher="$publisherXml" Version="$version" ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>POQIT</DisplayName>
    <PublisherDisplayName>$displayXml</PublisherDisplayName>
    <Description>Keep files, links, images and text nearby.</Description>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Resources><Resource Language="en-us" /></Resources>
  <Dependencies><TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0" /></Dependencies>
  <Applications>
    <Application Id="POQIT" Executable="poqit.exe" uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL">
      <uap:VisualElements DisplayName="POQIT" Description="Keep what matters nearby" BackgroundColor="transparent"
                          Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png" />
    </Application>
  </Applications>
  <Capabilities><rescap:Capability Name="runFullTrust" /></Capabilities>
</Package>
"@
    [IO.File]::WriteAllText((Join-Path $stage 'AppxManifest.xml'), $manifest, (New-Object System.Text.UTF8Encoding($false)))
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    & $makeAppx pack /d $stage /p $output
    if ($LASTEXITCODE -ne 0) { throw "MakeAppx failed with exit code $LASTEXITCODE." }
    Write-Output "Store submission package created: $output"
} finally {
    $resolvedStage = [IO.Path]::GetFullPath($stage)
    if ($resolvedStage.StartsWith($temporaryRoot, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path $resolvedStage -Leaf) -match '^poqit-msix-[0-9a-f]{32}$' -and
        (Test-Path -LiteralPath $resolvedStage)) {
        Remove-Item -LiteralPath $resolvedStage -Recurse -Force
    }
}
