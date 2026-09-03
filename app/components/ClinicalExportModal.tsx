"use client";

/**
 * @deprecated Renamed to ProgressSummaryExportModal to avoid ungrounded clinical claims.
 * Please use ProgressSummaryExportModal directly.
 */
import ProgressSummaryExportModal from "./ProgressSummaryExportModal";

export default function ClinicalExportModal(props: any) {
  return (
    <ProgressSummaryExportModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      report={props.report}
      includeJournalNotes={props.includeJournalNotes || false}
      onToggleIncludeJournalNotes={props.onToggleIncludeJournalNotes || (() => {})}
    />
  );
}
