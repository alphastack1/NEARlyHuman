"""LOCAL near-sandbox receipts only. Never reads developer-wallet credentials.
The only signer is the ephemeral validator key generated in sandbox-home.
"""
from pathlib import Path
import os
import base64,hashlib,json,struct,time,urllib.request
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

BASE=Path(os.environ.get('NH_NEAR_WORK_DIR', str(Path(__file__).resolve().parents[3]/'TEMP/economy-v2-feasibility/near'))).resolve()
BASE.mkdir(parents=True,exist_ok=True)
RPC=os.environ.get('NH_NEAR_RPC','http://127.0.0.1:3036')
from urllib.parse import urlparse
assert urlparse(RPC).scheme=='http' and urlparse(RPC).hostname in ('127.0.0.1','::1'), 'Local literal-loopback RPC only'
ALPHABET='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
def b58decode(s):
    n=0
    for c in s:n=n*58+ALPHABET.index(c)
    return b'\0'*(len(s)-len(s.lstrip('1')))+(n.to_bytes((n.bit_length()+7)//8,'big') if n else b'')
def b58encode(b):
    n=int.from_bytes(b,'big');s=''
    while n:n,r=divmod(n,58);s=ALPHABET[r]+s
    return '1'*(len(b)-len(b.lstrip(b'\0')))+s
def rpc(method,params):
    data=json.dumps({'jsonrpc':'2.0','id':'local-probe','method':method,'params':params}).encode()
    req=urllib.request.Request(RPC,data,{'Content-Type':'application/json'})
    result=json.load(urllib.request.urlopen(req,timeout=45))
    if 'error'in result:raise RuntimeError(json.dumps(result['error']))
    return result['result']

status=rpc('status',[])
assert status['chain_id'].startswith('test-chain-'),'Refuse non-sandbox chain'
genesis=json.loads((BASE/'sandbox-home/genesis.json').read_text())
assert status['chain_id']==genesis['chain_id'],'Refuse a different sandbox home'
key=json.loads((BASE/'sandbox-home/validator_key.json').read_text())
assert key['account_id']=='test.near','Refuse unexpected local signer'
secret=Ed25519PrivateKey.from_private_bytes(b58decode(key['secret_key'].split(':')[1])[:32])
public=key['public_key'];pk=b'\0'+b58decode(public.split(':')[1])
RUN=str(time.time_ns())[-8:]
ROOT='test.near';CORE='game'+RUN+'.test.near';RECEIVER='recv'+RUN+'.test.near'
u32=lambda n:struct.pack('<I',n)
u64=lambda n:struct.pack('<Q',n)
u128=lambda n:n.to_bytes(16,'little')
vec=lambda b:u32(len(b))+b
string=lambda s:vec(s.encode())
fn=lambda name,args,gas=100_000_000_000_000,deposit=0:b'\2'+string(name)+vec(json.dumps(args,separators=(',',':')).encode())+u64(gas)+u128(deposit)
outcomes=[]
raw_outcomes=[]
nonces={}
def send(signer,receiver,actions,label):
    access=rpc('query',{'request_type':'view_access_key','finality':'optimistic','account_id':signer,'public_key':public})
    nonce=max(access['nonce'],nonces.get(signer,0))+1
    raw=string(signer)+pk+u64(nonce)+string(receiver)+b58decode(access['block_hash'])+u32(len(actions))+b''.join(actions)
    signed=raw+b'\0'+secret.sign(hashlib.sha256(raw).digest())
    outcome=rpc('broadcast_tx_commit',[base64.b64encode(signed).decode()])
    nonces[signer]=nonce
    receipts=outcome['receipts_outcome']
    # Fast sandbox GC may prune old outcomes quickly; preserve each response now.
    detail=[]
    for receipt in receipts:
        d=rpc('EXPERIMENTAL_receipt',{'receipt_id':receipt['id']})
        actions=d.get('receipt',{}).get('Action',{}).get('actions',[])
        calls=[a['FunctionCall']for a in actions if 'FunctionCall'in a]
        detail.append({'id':receipt['id'],'executor':receipt['outcome']['executor_id'],
            'methods':[a['method_name']for a in calls],'gasAttached':[a['gas']for a in calls],
            'gasBurnt':receipt['outcome']['gas_burnt'],'status':receipt['outcome']['status']})
    raw_outcomes.append({'label':label,'outcome':outcome})
    (BASE/'receipt-raw-outcomes.json').write_text(json.dumps(raw_outcomes,indent=2)+'\n')
    summary={'label':label,'hash':outcome['transaction']['hash'],'signer':signer,'receiver':receiver,'status':outcome['status'],
        'gasBurnt':sum(x['outcome']['gas_burnt'] for x in receipts)+outcome['transaction_outcome']['outcome']['gas_burnt'],
        'receiptCount':len(receipts),'logs':[l for x in receipts for l in x['outcome']['logs']],
        'receiptStatuses':[x['outcome']['status'] for x in receipts],'receiptDetails':detail}
    outcomes.append(summary)
    (BASE/'receipt-transactions.json').write_text(json.dumps(outcomes,indent=2)+'\n')
    print(json.dumps({'label':label,'status':outcome['status'],'gas':summary['gasBurnt'],'receipts':len(receipts)}),flush=True)
    return outcome
def success(o):
    assert 'SuccessValue'in o['status'],o['status']
    raw=base64.b64decode(o['status']['SuccessValue'])
    return json.loads(raw) if raw else None
def fail(o,text):
    assert 'Failure'in o['status'],o['status']
    assert text in json.dumps(o['status']),o['status']
def call(method,args,*,signer=ROOT,deposit=0,gas=100_000_000_000_000,label=None):
    return send(signer,CORE,[fn(method,args,gas,deposit)],label or method)
def view(method,args):
    r=rpc('query',{'request_type':'call_function','finality':'optimistic','account_id':CORE,'method_name':method,'args_base64':base64.b64encode(json.dumps(args).encode()).decode()})
    return json.loads(bytes(r['result']))
def snapshot(token):return view('probe_status',{'token_id':token})
def events(outcome,event):
    return [json.loads(l[11:]) for x in outcome['receipts_outcome'] for l in x['outcome']['logs'] if l.startswith('EVENT_JSON:') and json.loads(l[11:]).get('event')==event]

if __name__=='__main__':
    # Only sandbox test.near's newly created children. Existing accounts are not reused.
    for account,wasm in [(CORE,'receipt-probe.wasm'),(RECEIVER,'receiver-probe.wasm')]:
        actions=[b'\0',b'\3'+u128(100*10**24),b'\5'+pk+u64(0)+b'\1',b'\1'+vec((BASE/wasm).read_bytes()),fn('new',{})]
        success(send(ROOT,account,actions,'create-deploy-'+account))
    for owner in [ROOT,RECEIVER]:
        success(call('storage_deposit',{'account_id':owner,'registration_only':True},deposit=10**22,label='register-'+owner))
    token=success(call('probe_seed',{'owner_id':ROOT,'amount':'300000000','alive':True,'ai_pending':False},label='seed300'))
    initial=snapshot(token);assert initial['issued']=='300000000' and initial['purse']=='300000000'
    seed_tx=outcomes[-1];assert len([l for l in seed_tx['logs'] if '"event":"ft_mint"'in l])==1
    denied=call('nft_transfer_call',{'receiver_id':RECEIVER,'token_id':token,'approval_id':None,'memo':None,'msg':'accept'},deposit=1,label='default-transfercall-disabled')
    fail(denied,'transfer-call not enabled');assert snapshot(token)==initial
    success(call('probe_configure',{'enable_transfer_call':True,'fail_resolver':False}))
    transfers=[]
    for mode in ['reject','panic','drain-reject','accept']:
        before=snapshot(token)
        o=call('nft_transfer_call',{'receiver_id':RECEIVER,'token_id':token,'approval_id':None,'memo':None,'msg':mode},deposit=1,gas=180_000_000_000_000,label='receiver-'+mode)
        success(o);after=snapshot(token)
        expected=RECEIVER if mode=='accept' else ROOT
        assert after['owner']==expected and not after['transfer_pending'],(mode,after)
        assert after['purse']==before['purse'] and after['vault']==before['vault']
        if mode=='drain-reject':
            r=rpc('query',{'request_type':'call_function','finality':'optimistic','account_id':RECEIVER,'method_name':'attack_failed','args_base64':'e30='})
            assert json.loads(bytes(r['result'])) is True
            assert any('transfer unresolved'in json.dumps(x) for x in o['receipts_outcome'])
        transfers.append({'mode':mode,'before':before,'after':after,'gasBurnt':outcomes[-1]['gasBurnt']})
    # Give original owner its accepted NFT back through a direct current-owner call.
    success(call('nft_transfer',{'receiver_id':ROOT,'token_id':token,'approval_id':None,'memo':None},signer=RECEIVER,deposit=1))
    before=snapshot(token)
    low=call('mint_from_purse',{'token_id':token,'expected_nonce':before['nonce']},deposit=0,label='birth-insufficient-storage-rollback')
    fail(low,'attach birth storage deposit');assert snapshot(token)==before
    assert events(low,'ft_burn')==[] and events(low,'nft_mint')==[]
    # Admit only the probe lock, withdraw old earnings, then birth while pending.
    success(call('begin_day_probe',{'token_id':token},deposit=1))
    success(call('withdraw',{'token_id':token,'amount':'1000000'},deposit=1,label='withdraw-while-ai-pending'))
    before=snapshot(token)
    birth=call('mint_from_purse',{'token_id':token,'expected_nonce':before['nonce']},deposit=10**23,label='birth-while-ai-pending')
    child=success(birth);after=snapshot(token)
    assert after['issued']==before['issued'] and int(after['purse'])==int(before['purse'])-250000000 and after['ai_pending']
    assert len(events(birth,'ft_burn'))==1 and len(events(birth,'nft_mint'))==1
    assert events(birth,'ft_burn')[0]['data'][0]['amount']=='250000000'
    dead=success(call('probe_seed',{'owner_id':ROOT,'amount':'300000000','alive':False,'ai_pending':False},label='seed-dead300'))
    success(call('withdraw',{'token_id':dead,'amount':'1000000'},deposit=1,label='withdraw-dead'))
    d=snapshot(dead)
    success(call('mint_from_purse',{'token_id':dead,'expected_nonce':d['nonce']},deposit=10**23,label='birth-from-dead-purse'))
    # Last fixture deliberately strands a tentative lock after resolver failure.
    stuck=success(call('probe_seed',{'owner_id':ROOT,'amount':'100000000','alive':True,'ai_pending':False},label='seed-callback-failure100'))
    success(call('probe_configure',{'enable_transfer_call':True,'fail_resolver':True}))
    broken=call('nft_transfer_call',{'receiver_id':RECEIVER,'token_id':stuck,'approval_id':None,'memo':None,'msg':'accept'},deposit=1,gas=180_000_000_000_000,label='injected-private-resolver-failure')
    fail(broken,'injected resolver failure');locked=snapshot(stuck)
    assert locked['transfer_pending'] and locked['purse']=='100000000'
    denied=call('withdraw',{'token_id':stuck,'amount':'1000000'},signer=RECEIVER,deposit=1,label='stranded-lock-still-blocks-drain')
    fail(denied,'transfer unresolved')
    report={'scope':'Actual LOCAL near-sandbox receipts; no developer wallet/testnet/mainnet actions','sandbox':status['version'],'chainId':status['chain_id'],
        'transactions':len(outcomes),'transfers':transfers,'pendingBirth':{'source':snapshot(token),'child':snapshot(child)},'deadSource':snapshot(dead),
        'rollback':'Low-storage failed receipt preserved source purse/supply/nonce/ownership and emitted no mint/burn',
        'events':'Successful birth emits exactly one FT burn250 and one NFT mint',
        'unresolvedCallbackFailure':locked,'recovery':'No public time-based unlock; this fixture remains locked, supporting default transfer-call OFF',
        'totalGasBurnt':sum(o['gasBurnt'] for o in outcomes),'externalTestNearSpent':0}
    (BASE/'receipt-results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'complete':True,'transactions':len(outcomes),'externalTestNearSpent':0}),flush=True)
