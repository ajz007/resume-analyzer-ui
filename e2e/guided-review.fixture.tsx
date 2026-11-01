import { useState } from "react";
import { createRoot } from "react-dom/client";
import { fromBackendResult } from "../src/analysis/adapters/fromBackend";
import { normalizeAnalysisResponse } from "../src/analysis/normalizeAnalysisResponse";
import type { ReviewReport } from "../src/api/reviewReport";
import type {
  ReviewSessionResponse,
  ReviewSessionTransport,
} from "../src/api/reviewSession";
import ReviewReportView from "../src/components/reports/ReviewReportView";
import "../src/index.css";

// Isolated fictional data. This page never calls an analysis or model endpoint.
const report: ReviewReport = {
  schemaVersion: "3",
  scope: "SELECTED_PASSAGES",
  priorities: [
    {
      title: "Clarify implementation",
      reason: "Describe supported implementation work.",
      editIds: ["e1"],
    },
  ],
  edits: [
    {
      id: "e1",
      operation: "replace",
      section: "Example employer",
      before: "Built APIs.",
      after: "Built Java APIs.",
      insertAfter: "",
      reason: "Make the supported technology clear.",
      sourceQuotes: ["Built Java APIs."],
      requirementIds: ["R1"],
    },
  ],
  sections: [{ heading: "Example employer", editIds: ["e1"], retained: [] }],
  questions: [
    {
      id: "q1",
      question: "What Terraform work did you personally implement?",
      why: "Clarify scope without assuming duration.",
      editIds: [],
      requirementIds: ["R1"],
    },
  ],
  outcomes: {
    clearerNow: ["Technology used"],
    needsConfirmation: ["Terraform scope"],
    stillUnresolved: ["Four years of Terraform experience is not established."],
  },
};
function result(id: string, locked = false) {
  return {
    ...normalizeAnalysisResponse(
      fromBackendResult({
        meta: { mode: "JOB_MATCH", jobDescriptionProvided: true },
        locked,
        summary: {
          overallAssessment:
            "Relevant implementation evidence. Terraform duration needs clarification.",
        },
        matchScore: 72,
        ats: { score: 82 },
        report: locked
          ? {
              schemaVersion: "3",
              scope: "SELECTED_PASSAGES",
              priorities: report.priorities,
            }
          : report,
        jobRequirementProfile: {
          topPriorities: [
            {
              id: "R1",
              priority: "Terraform: four years",
              whyItMatters: "Role expectation.",
              evidenceExpected: "Personal scope and duration.",
            },
          ],
        },
        jobMatchScoring: {
          score: 72,
          requirementScores: [
            {
              requirementId: "R1",
              requirement: "Terraform: four years",
              matchStatus: "PARTIAL",
              weight: 100,
              score: 72,
              evidence: "Terraform integration.",
              gap: "Duration unconfirmed.",
            },
          ],
        },
      }),
    ),
    analysisId: id,
  };
}

function Fixture() {
  const [id, setId] = useState("example-a");
  const [readOnly, setReadOnly] = useState(false);
  const [locked, setLocked] = useState(false);
  const [transport] = useState(() => {
    let response: ReviewSessionResponse = {
      session: { version: 0, excludedIds: [], answers: [], attempts: 0 },
      report: structuredClone(report),
    };
    if (new URLSearchParams(location.search).has("pending"))
      response.session.pending = {
        requestId: "pending-example",
        startedAt: "2026-11-01T00:00:00Z",
      };
    const snapshot = () => structuredClone(response);
    return {
      load: async () => {
        if (new URLSearchParams(location.search).has("load-error"))
          throw Error("Offline");
        return snapshot();
      },
      saveChoices: async (_version, excludedIds) => {
        if (new URLSearchParams(location.search).has("save-error"))
          throw Error("Offline");
        response.session = {
          ...response.session,
          version: response.session.version + 1,
          excludedIds,
        };
        return snapshot();
      },
      answer: async (request) => {
        const action =
          request.kind === "none"
            ? "no_change"
            : request.kind === "not_sure"
              ? "needs_detail"
              : "add_evidence";
        const edit =
          action === "add_evidence"
            ? {
                ...report.edits![0],
                id: `answer-${response.session.answers.length}`,
                operation: "add" as const,
                before: "",
                after: "Implemented Terraform for a personal project.",
                confirmedAnswerId: request.requestId,
              }
            : undefined;
        response.session = {
          ...response.session,
          version: response.session.version + 1,
          attempts: response.session.attempts + 1,
          answers: [
            ...response.session.answers,
            {
              id: request.requestId,
              requestId: request.requestId,
              questionId: request.questionId,
              requirementId: request.requirementId,
              question: "Terraform experience?",
              text: request.answer,
              kind: request.kind,
              createdAt: "2026-11-01T00:00:00Z",
              edit,
              delta: {
                action,
                passage: edit?.after ?? "",
                section: "Personal project",
                insertAfter: "",
                sourceQuote: "",
                answerQuote: request.answer,
                explanation:
                  action === "add_evidence"
                    ? "Your confirmed project adds implementation evidence."
                    : action === "needs_detail"
                      ? "More detail is needed before adding a passage."
                      : "No new experience was confirmed.",
                establishes: edit ? "Personal project implementation." : "",
                stillUnproven: "Four years of professional Terraform use.",
                nextQuestion:
                  action === "needs_detail"
                    ? "What did you personally build?"
                    : "",
              },
            },
          ],
        };
        if (edit)
          response.report = {
            ...response.report,
            edits: [...response.report.edits!, edit],
          };
        return snapshot();
      },
    } satisfies ReviewSessionTransport;
  });
  return (
    <main className="min-h-screen bg-stone-50 px-3 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <aside className="space-y-2 border-b pb-4">
          <p>Fictional browser test · no AI calls</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setId("example-b")}>Switch analysis</button>
            <button onClick={() => setReadOnly(!readOnly)}>
              Toggle shared view
            </button>
            <button onClick={() => setLocked(!locked)}>
              Toggle locked view
            </button>
          </div>
        </aside>
        <ReviewReportView
          result={result(id, locked)}
          readOnly={readOnly}
          sessionTransport={id === "example-a" ? transport : undefined}
          localPreview={id !== "example-a"}
        />
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
