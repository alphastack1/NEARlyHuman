param([switch]$Check,[switch]$Promote)
$ErrorActionPreference='Stop'
$projectRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$manifest=Join-Path $projectRoot 'contracts/near/Cargo.toml'
$target=Join-Path $projectRoot 'TEMP/build/near'
New-Item -ItemType Directory -Force -Path $target | Out-Null
$saved=@{}
foreach($name in @('CARGO_TARGET_DIR','RUSTC_BOOTSTRAP','RUSTFLAGS')){$saved[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
try{
 $env:CARGO_TARGET_DIR=$target
 if($Check){$env:RUSTFLAGS='';cargo +1.95.0 test --locked --manifest-path $manifest --lib;if($LASTEXITCODE-ne 0){throw 'Native contract tests failed'}}
 $env:RUSTC_BOOTSTRAP='1';$env:RUSTFLAGS='--cfg near'
 cargo +1.95.0 build --locked --manifest-path $manifest --target wasm32-unknown-unknown -Z build-std=std,panic_abort --release
 if($LASTEXITCODE-ne 0){throw 'Native Wasm build failed'}
 $crate=(Select-String -LiteralPath $manifest -Pattern '^name\s*=\s*"([^"]+)"' | Select-Object -First 1).Matches[0].Groups[1].Value.Replace('-','_')
 $artifact=Join-Path $target "wasm32-unknown-unknown/release/$crate.wasm"
 $sha=(Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
 $build=Get-Content -LiteralPath (Join-Path $projectRoot 'contracts/near/artifacts/build.json') -Raw | ConvertFrom-Json
 if($sha-ne $build.sha256){throw 'Build differs from the recorded deployed Wasm; review a new release before replacing it'}
 if($Promote){Copy-Item -LiteralPath $artifact -Destination (Join-Path $projectRoot 'contracts/near/artifacts/game.wasm')}
 Write-Output (ConvertTo-Json -Compress @{pass=$true;sha256=$sha;bytes=(Get-Item -LiteralPath $artifact).Length})
}finally{foreach($name in $saved.Keys){[Environment]::SetEnvironmentVariable($name,$saved[$name],'Process')}}
