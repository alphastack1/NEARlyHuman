import { BaseError, ContractFunctionRevertedError, InsufficientFundsError } from 'viem';
import { ServiceError } from './chain';

/** Keep a failed preflight distinct from a balance shortfall or an accepted AI attempt. */
export function estimateError(error: unknown): ServiceError {
  const cause = error instanceof BaseError ? error.walk(e => e instanceof ContractFunctionRevertedError || e instanceof InsufficientFundsError) : error;
  if (cause instanceof InsufficientFundsError) return new ServiceError('Not enough ETH for this request.', 'balance', 409);
  if (cause instanceof ContractFunctionRevertedError) {
    switch (cause.data?.errorName) {
      case 'NotYourRooster': case 'ERC721NonexistentToken': return new ServiceError('This rooster changed. Choose it again before preparing.', 'ownership', 409);
      case 'RequestLocked': return new ServiceError('This rooster already has a day preparing.', 'pending', 409);
      case 'AdmissionPaused': return new ServiceError('Preparation is unavailable right now. Please try again later.', 'capacity', 503);
      case 'PriceUnavailable': return new ServiceError('The mint price is unavailable. Please try again shortly.', 'price', 503);
      case 'InvalidPermit': case 'WrongPayment': return new ServiceError('This estimate changed. Please try again.', 'quote_expired', 409);
      case 'InvalidDelivery': return new ServiceError('Review your supplies and try again.', 'delivery', 409);
      case 'Unplayable': return new ServiceError('This rooster cannot begin another day.', 'unplayable', 409);
    }
  }
  return new ServiceError('The estimate could not be checked. Please try again.', 'estimate', 503);
}
