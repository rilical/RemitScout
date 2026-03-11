/**
 * Re-export from canonical location in backend/shared/discovery/.
 * Kept here for backward compatibility with existing plane-b imports.
 */
export {
  getDiscoveryScanById,
  approveDiscoveryScan,
  dismissDiscoveryScan,
  applyDiscoveryScan,
} from '../../../shared/discovery/discovery-review'
export type {
  DiscoveryScanReviewStatus,
  DiscoveryScanApplyStatus,
  DiscoveryScanRow,
  DiscoveryApplyOutcome,
} from '../../../shared/discovery/discovery-review'
