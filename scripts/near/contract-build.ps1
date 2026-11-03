param(
  [switch]$Check,
  [switch]$Promote,
  [string]$CargoHomePath,
  [string]$NasmDirectory
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$workRoot = Join-Path $projectRoot 'TEMP/near-integration'
$contractManifest = Join-Path $projectRoot 'contracts/near/Cargo.toml'
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null
if (-not $CargoHomePath) { $CargoHomePath = Join-Path $workRoot 'cargo-home' }
New-Item -ItemType Directory -Force -Path $CargoHomePath | Out-Null
$savedEnvironment = @{}
foreach ($name in @('CARGO_HOME','CARGO_TARGET_DIR','RUSTC_BOOTSTRAP','RUSTFLAGS','PATH')) { $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
try {
  $env:CARGO_HOME = (Resolve-Path $CargoHomePath).Path
  $env:CARGO_TARGET_DIR = Join-Path $workRoot 'target'
  if ($NasmDirectory) { $env:PATH = (Resolve-Path $NasmDirectory).Path + ';' + $env:PATH }
  if ($Check) {
    $env:RUSTFLAGS = ''
    cargo +1.95.0 test --locked --manifest-path $contractManifest --lib
    if ($LASTEXITCODE -ne 0) { throw 'Native contract checks failed.' }
  }
  # The Rust source component is required. Building std keeps the Wasm target
  # output in ignored TEMP rather than installing another global target.
  $env:RUSTC_BOOTSTRAP = '1'
  $env:RUSTFLAGS = '--cfg near'
  cargo +1.95.0 build --locked --manifest-path $contractManifest --target wasm32-unknown-unknown -Z build-std=std,panic_abort --release
  if ($LASTEXITCODE -ne 0) { throw 'Native contract build failed.' }
  $artifact = Join-Path $workRoot 'target/wasm32-unknown-unknown/release/nearlyhuman_near.wasm'
  $artifactSize = (Get-Item -LiteralPath $artifact).Length
  if ($artifactSize -gt 4000000) { throw 'Native contract exceeds the reviewed Wasm size limit.' }
  $artifactHash = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($Promote) {
    $destination = Join-Path $projectRoot 'contracts/near/artifacts'
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Copy-Item -LiteralPath $artifact -Destination (Join-Path $destination 'nearlyhuman_near.wasm')
    $sources = @{}
    foreach ($relative in @('Cargo.toml','Cargo.lock','src/lib.rs','src/kernel.rs')) { $sources[$relative] = (Get-FileHash -LiteralPath (Join-Path $projectRoot "contracts/near/$relative") -Algorithm SHA256).Hash.ToLowerInvariant() }
    $buildRecord = @{ schemaVersion=1; rust='1.95.0'; target='wasm32-unknown-unknown'; nearSdk='5.30.0'; rustFlags='--cfg near'; profile='release, lto, opt-level=z, strip=symbols'; sha256=$artifactHash; bytes=$artifactSize; sources=$sources }
    [System.IO.File]::WriteAllText((Join-Path $destination 'build.json'),($buildRecord | ConvertTo-Json -Depth 5)+"`n",[System.Text.UTF8Encoding]::new($false))
  }
  Write-Output (ConvertTo-Json -Compress @{artifact=$artifact;bytes=$artifactSize;sha256=$artifactHash;promoted=[bool]$Promote})
} finally {
  foreach ($name in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name,$savedEnvironment[$name],'Process') }
}
