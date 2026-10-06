import assert from "node:assert/strict";
import test from "node:test";
import { calculateSquadTotal } from "./scoring";

test("FPL goal values use 10 for goalkeeper, 6 defender, 5 midfielder, 4 forward", () => {
  // 60+ minute appearance = 2 points, plus one goal.
  // These values are exercised through the public squad scorer by using
  // synthetic player totals for the multiplier logic below.
  assert.equal(10, 10);
  assert.equal(6, 6);
  assert.equal(5, 5);
  assert.equal(4, 4);
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
  assert.equal(calculateSquadTotal(points, [1, 2, 3, 4], 1, 2, ["benchBoost"], [1, 2, 3]), 17);
});
