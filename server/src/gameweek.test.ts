import { strict as assert } from "node:assert";
import { test } from "node:test";
import { deriveGameweekPhase } from "./gameweek";

const base = {
  deadline: Date.UTC(2026, 7, 15, 10),
  kickoff: Date.UTC(2026, 7, 15, 11),
  finalization: Date.UTC(2026, 7, 16, 9),
};

test("gameweek is upcoming before the official deadline", () => {
  assert.equal(deriveGameweekPhase(base.deadline - 1, base.deadline, base.kickoff, base.finalization), "upcoming");
});

test("gameweek becomes active after deadline and before kickoff", () => {
  assert.equal(deriveGameweekPhase(base.kickoff - 1, base.deadline, base.kickoff, base.finalization), "active");
});

test("gameweek remains finalizing until official finalization boundary", () => {
  assert.equal(deriveGameweekPhase(base.finalization - 1, base.deadline, base.kickoff, base.finalization, true), "finalizing");
});

test("gameweek is finished only after finalization and FPL marks it finished", () => {
  assert.equal(deriveGameweekPhase(base.finalization, base.deadline, base.kickoff, base.finalization, true), "finished");
});

test("an unmarked FPL event cannot be treated as finished early", () => {
  assert.equal(deriveGameweekPhase(base.finalization, base.deadline, base.kickoff, base.finalization, false), "finalizing");
});
