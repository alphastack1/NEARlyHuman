import type { GameNetwork, GameNetworkId } from '../../chain/networks';
import { Icon } from '../Icons';

export function NetworkMark() {
  return <span className="v2-network-mark" aria-hidden="true"><i/><i/><i/></span>;
}

/** Only actual served deployments are supplied here; catalog entries alone never
 * become a connection or transaction target. */
export function NetworkPicker({ networks, currentId, disabled = false, loading = false, discoveryFailed = false, onRetry, onSelect, onClose }: {
  networks: readonly GameNetwork[];
  currentId?: GameNetworkId;
  disabled?: boolean;
  loading?: boolean;
  discoveryFailed?: boolean;
  onRetry?: () => void;
  onSelect: (network: GameNetwork) => void;
  onClose?: () => void;
}) {
  return <>
    <div className="v2-network-options" aria-label="Game networks">
      {networks.map(network => <button key={network.id} type="button" className="v2-network-option" aria-pressed={network.id === currentId} disabled={disabled} onClick={() => onSelect(network)}>
        <NetworkMark/>
        <strong className="v2-network-brand">{network.ecosystem === 'near' ? 'NEAR' : 'Robinhood'}</strong>
        <span className="v2-network-environment" data-network={network.environment}>{network.environment === 'testnet' ? 'Testnet' : 'Mainnet'}</span>
        <span className="v2-network-selection" aria-hidden="true">{network.id === currentId ? <Icon name="check" size={16}/> : <i className="v2-network-chevron"/>}</span>
      </button>)}
    </div>
    {loading && <div className="v2-network-loading" role="status"><Icon name="wallet" size={16}/><span>Opening networks…</span></div>}
    {!loading && onRetry && (discoveryFailed || networks.length === 0) && <button className="v2-text-button" disabled={disabled} onClick={onRetry}>Try networks again</button>}
    <p className="v2-small-note v2-network-explanation">Each network has its own roosters.</p>
    <a className="v2-text-button" href="/docs/worlds-wallets" target="_blank" rel="noopener noreferrer">Wallets &amp; test funds <span aria-hidden="true">↗</span></a>
    {onClose && <button className="v2-text-button" disabled={disabled} onClick={onClose}>Back</button>}
  </>;
}
