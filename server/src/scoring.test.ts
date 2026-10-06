import assert from "node:assert/strict";
import test from "node:test";
import { calculateSquadTotal, score } from "./scoring";

test("FPL goal values use 10 for goalkeeper, 6 defender, 5 midfielder, 4 forward", () => {
  const base = { games: { minutes: 60 }, goals: { total: 1, assists: 0, saves: 0 }, penalty: { saved: 0, missed: 0 }, cards: { yellow: 0, red: 0 } };
  assert.equal(score(base, "GK", 0), 12);
  assert.equal(score(base, "DEF", 0), 8);
  assert.equal(score(base, "MID", 0), 7);
  assert.equal(score(base, "FWD", 0), 6);
});

test("triple captain multiplies the effective captain by three", () => {
  const points = new Map([[1, 10], [2, 6], [3, 5]]);
  assert.equal(calculateSquadTotal(points, [1, 2, 3], 1, 2, ["tripleCaptain"], [1, 2]), 36);
});

test("vice captain replaces a captain who did not play", () => {
  const points = new Map([[2, 6], [3, 5]]);
  assert.equal(calculateSquadTotal(points, [1, 2, 3], 1, 2, [], [1, 2]), 17);
});

test("bench boost includes all 15 players", () => {
  const points = new Map([[1, 2], [2, 3], [3, 4], [4, 5]]);
  assert.equal(calculateSquadTotal(points, [1, 2, 3, 4], 1, 2, ["benchBoost"], [1, 2, 3]), 16);
});
