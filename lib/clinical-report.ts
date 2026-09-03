/**
 * @deprecated Renamed to @/lib/progress-summary-service to remove ungrounded clinical claims.
 * Please import from "@/lib/progress-summary-service" directly.
 */
export {
  generateProgressSummary as generateClinicalSummary,
  type ProgressSummaryData as ClinicalSummaryData,
  FIXED_PROGRESS_DISCLAIMER,
} from "@/lib/progress-summary-service";
