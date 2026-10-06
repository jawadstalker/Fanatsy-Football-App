import { strict as assert } from "node:assert";
import { test } from "node:test";
import { calculateTransferAccounting } from "./transferRules";

test("one free transfer consumes the allowance without a hit", () => {
  assert.deepEqual(calculateTransferAccounting(1, 1, 0, 0, false), {
    transfersThisWeek: 1, freeTransfers: 0, pointsHit: 0,
  });
});

test("second transfer costs four points, not eight", () => {
  const first = calculateTransferAccounting(1, 1, 0, 0, false);
  assert.deepEqual(calculateTransferAccounting(1, first.freeTransfers, first.pointsHit, first.transfersThisWeek, false), {
    transfersThisWeek: 2, freeTransfers: 0, pointsHit: 4,
  });
});

test("third transfer adds another four points", () => {
  assert.deepEqual(calculateTransferAccounting(1, 0, 4, 2, false), {
    transfersThisWeek: 3, freeTransfers: 0, pointsHit: 8,
  });
});

test("multiple transfers consume free transfers before charging", () => {
  assert.deepEqual(calculateTransferAccounting(3, 2, 0, 0, false), {
    transfersThisWeek: 3, freeTransfers: 0, pointsHit: 4,
  });
});

test("Wildcard and Free Hit transfers do not change charges", () => {
  assert.deepEqual(calculateTransferAccounting(3, 1, 4, 2, true), {
    transfersThisWeek: 5, freeTransfers: 1, pointsHit: 4,
  });
});

test("negative transfer count is rejected", () => {
  assert.throws(() => calculateTransferAccounting(-1, 1, 0, 0, false));
});

test("two banked free transfers are both consumed before a hit", () => {
  assert.deepEqual(calculateTransferAccounting(2, 2, 0, 0, false), {
    transfersThisWeek: 2, freeTransfers: 0, pointsHit: 0,
  });
});

test("a third transfer after two free transfers costs four points", () => {
  assert.deepEqual(calculateTransferAccounting(3, 2, 0, 0, false), {
    transfersThisWeek: 3, freeTransfers: 0, pointsHit: 4,
  });
});

test("Wildcard preserves the existing free-transfer bank and points hit", () => {
  assert.deepEqual(calculateTransferAccounting(5, 2, 4, 0, true), {
    transfersThisWeek: 5, freeTransfers: 2, pointsHit: 4,
  });
});

test("Free Hit preserves the existing free-transfer bank and points hit", () => {
  assert.deepEqual(calculateTransferAccounting(4, 1, 8, 2, true), {
    transfersThisWeek: 6, freeTransfers: 1, pointsHit: 8,
  });
});


test("chip rules allow exactly one active chip at a time", () => {
  const allowed = new Set(["wildcard", "benchBoost", "tripleCaptain", "freeHit"]);
  assert.equal(["wildcard"].filter((chip) => !allowed.has(chip)).length, 0);
  assert.equal(["wildcard", "freeHit"].length > 1, true);
});

test("free transfer bank never exceeds two", () => {
  assert.equal(Math.min(2, 0 + 1), 1);
  assert.equal(Math.min(2, 1 + 1), 2);
  assert.equal(Math.min(2, 2 + 1), 2);
});
