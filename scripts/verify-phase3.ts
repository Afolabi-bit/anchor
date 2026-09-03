import {
  computeBlockerCorrelations,
  MIN_PATTERN_SAMPLE_SIZE,
} from "../lib/insights-service";
import {
  generateProgressSummary,
  FIXED_PROGRESS_DISCLAIMER,
} from "../lib/progress-summary-service";
import { schema } from "../db";

function runPhase3Verification() {
  console.log("==================================================");
  console.log("PHASE 3 PATTERN SURFACING & PROGRESS VERIFICATION");
  console.log("==================================================");

  // 1. Verify Sample Size Threshold
  console.log(`1. Testing sample size threshold (${MIN_PATTERN_SAMPLE_SIZE})...`);

  // Sub-threshold test: only 2 stress logs on Friday
  const subThresholdCheckIns: any[] = [
    {
      id: "c1",
      date: "2026-08-14", // Friday
      type: "evening",
      status: "partial",
      blockerTags: ["stress"],
    },
    {
      id: "c2",
      date: "2026-08-21", // Friday
      type: "evening",
      status: "partial",
      blockerTags: ["stress"],
    },
  ];

  const subPatterns = computeBlockerCorrelations(subThresholdCheckIns);
  const stressFridaySub = subPatterns.find((p) => p.id === "pattern-stress-friday-evening");
  if (stressFridaySub) {
    throw new Error("FAILURE: Pattern surfaced with < 3 occurrences!");
  }
  console.log("[✓] PASS: No pattern surfaced when sample size < 3 occurrences.");

  // Threshold test: 3 stress logs on Friday evening
  const thresholdCheckIns: any[] = [
    ...subThresholdCheckIns,
    {
      id: "c3",
      date: "2026-08-28", // Friday
      type: "evening",
      status: "no",
      blockerTags: ["stress"],
    },
  ];

  const thresholdPatterns = computeBlockerCorrelations(thresholdCheckIns);
  const stressFriday = thresholdPatterns.find((p) => p.id === "pattern-stress-friday-evening");
  if (!stressFriday) {
    throw new Error("FAILURE: Pattern did not surface with >= 3 occurrences!");
  }
  console.log(`[✓] PASS: Pattern surfaced cleanly: "${stressFriday.title}"`);
  console.log(`    Observation: "${stressFriday.observation}"`);
  console.log(`    Evidence: "${stressFriday.evidence}"`);

  // 2. Verify Progress Summary Generation & Disclaimer
  console.log("\n2. Testing Progress Summary generator & disclaimers...");
  const dummyUser = { firstName: "Alex", email: "alex@anchor.test" };
  const dummyComm = { name: "Daily Sobriety & Meditation", why: "For my daughter" };
  const dummyJournals = [
    { content: "Deep personal journal reflection from private notebook" },
  ];

  // Test default privacy: journal notes excluded
  const defaultSummary = generateProgressSummary(
    dummyUser,
    dummyComm,
    thresholdCheckIns,
    dummyJournals,
    { includeJournalNotes: false }
  );

  if (defaultSummary.reflections.length !== 0) {
    throw new Error("PRIVACY BREACH: Journal reflections included by default!");
  }
  console.log("[✓] PASS: Reflections strictly excluded by default.");

  if (defaultSummary.disclaimer !== FIXED_PROGRESS_DISCLAIMER) {
    throw new Error("FAILURE: Fixed disclaimer mismatch!");
  }
  console.log(`[✓] PASS: Mandatory disclaimer present: "${defaultSummary.disclaimer}"`);

  // Test opt-in: journal notes included
  const optInSummary = generateProgressSummary(
    dummyUser,
    dummyComm,
    thresholdCheckIns,
    dummyJournals,
    { includeJournalNotes: true }
  );

  if (optInSummary.reflections.length === 0) {
    throw new Error("FAILURE: Opt-in reflections did not appear when explicitly requested!");
  }
  console.log(`[✓] PASS: Opt-in reflections populated when checked: "${optInSummary.reflections[0]}"`);

  console.log("==================================================");
  console.log("ALL PHASE 3 LOGIC & STATISTICAL CHECKS PASSED (100%)");
  console.log("==================================================");
}

runPhase3Verification();
