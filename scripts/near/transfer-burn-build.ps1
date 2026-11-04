param([switch]$Check,[switch]$Promote,[string]$CargoHomePath,[string]$TargetDirectory,[string]$NasmDirectory)
$ErrorActionPreference='Stop'
$projectRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$workRoot=Join-Path $projectRoot 'TEMP/near-v3'
$manifest=Join-Path $projectRoot 'contracts/near-v3/Cargo.toml'
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null
if(-not $CargoHomePath){$CargoHomePath=Join-Path $workRoot 'cargo-home'}
if(-not $TargetDirectory){$TargetDirectory=Join-Path $workRoot 'target'}
New-Item -ItemType Directory -Force -Path $CargoHomePath,$TargetDirectory | Out-Null
$saved=@{}
foreach($name in @('CARGO_HOME','CARGO_TARGET_DIR','RUSTC_BOOTSTRAP','RUSTFLAGS','PATH')){$saved[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
try{
 $env:CARGO_HOME=(Resolve-Path $CargoHomePath).Path;$env:CARGO_TARGET_DIR=(Resolve-Path $TargetDirectory).Path
 if($NasmDirectory){$env:PATH=(Resolve-Path $NasmDirectory).Path+';'+$env:PATH}
 if($Check){$env:RUSTFLAGS='';cargo +1.95.0 test --locked --manifest-path $manifest --lib;if($LASTEXITCODE-ne 0){throw 'Native burn checks failed'}}
 $env:RUSTC_BOOTSTRAP='1';$env:RUSTFLAGS='--cfg near'
 cargo +1.95.0 build --locked --manifest-path $manifest --target wasm32-unknown-unknown -Z build-std=std,panic_abort --release
 if($LASTEXITCODE-ne 0){throw 'Native burn Wasm build failed'}
 $artifact=Join-Path $TargetDirectory 'wasm32-unknown-unknown/release/nearlyhuman_near_v3.wasm'
 if((Get-Item -LiteralPath $artifact).Length-gt 4000000){throw 'Native Wasm exceeds reviewed size bound'}
 $sha=(Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
 $record=@{schemaVersion=1;rust='1.95.0';nearSdk='5.30.0';target='wasm32-unknown-unknown';rustFlags='--cfg near';sha256=$sha;bytes=(Get-Item -LiteralPath $artifact).Length;layout='Unchanged Contract Borsh fields; burn extension under versioned 0xFF raw keys';sources=@{}}
 foreach($file in @('Cargo.toml','Cargo.lock','src/lib.rs','src/transfer_burn.rs','../near/src/kernel.rs')){$record.sources[$file]=(Get-FileHash -LiteralPath (Join-Path $projectRoot "contracts/near-v3/$file") -Algorithm SHA256).Hash.ToLowerInvariant()}
 if($Promote){$destination=Join-Path $projectRoot 'contracts/near-v3/artifacts';New-Item -ItemType Directory -Force -Path $destination | Out-Null;Copy-Item -LiteralPath $artifact -Destination (Join-Path $destination 'nearlyhuman_near_v3.wasm');[IO.File]::WriteAllText((Join-Path $destination 'build.json'),($record|ConvertTo-Json -Depth 5)+"`n",[Text.UTF8Encoding]::new($false))}
 Write-Output(ConvertTo-Json -Compress @{artifact=$artifact;sha256=$sha;bytes=$record.bytes;promoted=[bool]$Promote})
}finally{foreach($name in $saved.Keys){[Environment]::SetEnvironmentVariable($name,$saved[$name],'Process')}}
