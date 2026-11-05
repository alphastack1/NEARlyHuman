import type { GameNetwork, GameNetworkId } from '../../chain/networks';
import { Icon } from '../Icons';

export function NetworkMark() {
  return <span className="life-network-mark" aria-hidden="true"><i/><i/><i/></span>;
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
    <div className="life-network-options" aria-label="Game networks">
      {networks.map(network => <button key={network.id} type="button" className="life-network-option" aria-pressed={network.id === currentId} disabled={disabled} onClick={() => onSelect(network)}>
        <NetworkMark/>
        <span className="life-network-identity"><strong className="life-network-brand">{network.ecosystem === 'near' ? 'NEAR' : 'Robinhood'}</strong><small>{network.ecosystem === 'near' ? 'Meteor & NEAR wallets' : 'Rabby / MetaMask'}</small></span>
        <span className="life-network-environment" data-network={network.environment}>{network.environment === 'testnet' ? 'Testnet' : 'Mainnet'}</span>
        <span className="life-network-selection" aria-hidden="true">{network.id === currentId ? <Icon name="check" size={16}/> : <i className="life-network-chevron"/>}</span>
      </button>)}
    </div>
    {loading && <div className="life-network-loading" role="status"><Icon name="wallet" size={16}/><span>Opening networks…</span></div>}
    {!loading && onRetry && (discoveryFailed || networks.length === 0) && <button className="life-text-button" disabled={disabled} onClick={onRetry}>Try networks again</button>}
    <p className="life-small-note life-network-explanation">Each network has its own roosters.</p>
    <a className="life-text-button" href="/docs/worlds-wallets" target="_blank" rel="noopener noreferrer">Wallets &amp; test funds <span aria-hidden="true">↗</span></a>
    {onClose && <button className="life-text-button" disabled={disabled} onClick={onClose}>Back</button>}
  </>;
}
