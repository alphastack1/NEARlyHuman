"""Two extra LOCAL transactions for the defined newborn-storage uncertainty."""
import json
import receipts as r
r.outcomes=json.loads((r.BASE/'receipt-transactions.json').read_text())
r.raw_outcomes=json.loads((r.BASE/'receipt-raw-outcomes.json').read_text())
r.CORE=r.outcomes[0]['receiver']
token=r.success(r.call('probe_seed',{'owner_id':r.ROOT,'amount':'250000000','alive':True,'ai_pending':False},label='seed-storage-probe250'))
before=r.rpc('query',{'request_type':'view_account','finality':'optimistic','account_id':r.CORE})
state=r.snapshot(token)
born=r.call('mint_from_purse',{'token_id':token,'expected_nonce':state['nonce']},deposit=10**23,label='birth-storage-measurement')
child=r.success(born)
after=r.rpc('query',{'request_type':'view_account','finality':'optimistic','account_id':r.CORE})
assert int(r.snapshot(token)['purse'])==0
assert len(r.events(born,'ft_burn'))==1 and len(r.events(born,'nft_mint'))==1
config=r.rpc('EXPERIMENTAL_protocol_config',{'finality':'optimistic'})
rate=int(config['runtime_config']['storage_amount_per_byte'])
delta=after['storage_usage']-before['storage_usage']
result={'scope':'Actual local custody-probe newborn storage delta, excludes full biological/garden state',
    'beforeBytes':before['storage_usage'],'afterBytes':after['storage_usage'],'addedBytes':delta,'yoctoNearPerByte':str(rate),
    'storageStakeDeltaYoctoNear':str(delta*rate),'gasBurnt':r.outcomes[-1]['gasBurnt'],'child':child,
    'sourceAfter':r.snapshot(token),'externalTestNearSpent':0}
(r.BASE/'receipt-storage.json').write_text(json.dumps(result,indent=2)+'\n')
report=json.loads((r.BASE/'receipt-results.json').read_text())
report['campaignTransactions']=report['transactions'];report['transactions']=len(r.outcomes);report['additionalStorageProbe']=result
report['totalGasBurnt']=sum(t['gasBurnt']for t in r.outcomes)
(r.BASE/'receipt-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(result,indent=2))
