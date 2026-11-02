"""Read-only captured LOCAL sandbox receipt/gas metadata; no keys or signing.
Fast sandbox GC prunes historical receipts; the campaign captures them at send.
"""
from pathlib import Path
import os
import json,urllib.request
BASE=Path(os.environ.get('NH_NEAR_WORK_DIR', str(Path(__file__).resolve().parents[3]/'TEMP/economy-v2-feasibility/near'))).resolve()
BASE.mkdir(parents=True,exist_ok=True)
def rpc(method,params):
    req=urllib.request.Request('http://127.0.0.1:3036',json.dumps({'jsonrpc':'2.0','id':'local-read','method':method,'params':params}).encode(),{'Content-Type':'application/json'})
    result=json.load(urllib.request.urlopen(req,timeout=30))
    if 'error'in result:raise RuntimeError(result['error'])
    return result['result']
all_tx=json.loads((BASE/'receipt-transactions.json').read_text())
labels=['receiver-reject','receiver-panic','receiver-drain-reject','receiver-accept','birth-insufficient-storage-rollback',
        'withdraw-while-ai-pending','birth-while-ai-pending','withdraw-dead','birth-from-dead-purse','injected-private-resolver-failure']
report=[]
for tx in all_tx:
    if tx['label']not in labels:continue
    rows=tx['receiptDetails']
    entry={'label':tx['label'],'gasBurnt':tx['gasBurnt'],'receipts':rows}
    report.append(entry)
(BASE/'receipt-gas.json').write_text(json.dumps({'scope':'Measured actual local sandbox receipt gas and recorded contract storage; narrowed custody probe, not full game estimates','rows':report},indent=2)+'\n')
print(json.dumps([{'label':r['label'],'totalTgas':r['gasBurnt']/1e12,'callbackTgas':[x['gasBurnt']/1e12 for x in r['receipts'] if 'nft_resolve_transfer'in x['methods']],
    'storage':r.get('recordedContractStorage')}for r in report],indent=2))
