import { isValidFormation, assignPitchCoordinates, countByPosition } from "../formation";
import { Position, SquadPlayer } from "@/types";

let nextId = 1;
function player(pos: Position, overrides: Partial<SquadPlayer> = {}): SquadPlayer {
  return {
    id: nextId++,
    name: `Player ${nextId}`,
    club: "Test FC",
    pos,
    league: "epl",
    price: 5,
    pts: 0,
    isStarting: true,
    ...overrides,
  };
}

function makeXI(gk: number, def: number, mid: number, fwd: number): SquadPlayer[] {
  return [
    ...Array.from({ length: gk }, () => player("GK")),
    ...Array.from({ length: def }, () => player("DEF")),
    ...Array.from({ length: mid }, () => player("MID")),
    ...Array.from({ length: fwd }, () => player("FWD")),
  ];
}

describe("isValidFormation", () => {
  it("accepts a standard 4-4-2", () => {
    expect(isValidFormation(makeXI(1, 4, 4, 2)).ok).toBe(true);
  });

  it("accepts a valid 3-4-3", () => {
    expect(isValidFormation(makeXI(1, 3, 4, 3)).ok).toBe(true);
  });

  it("accepts a valid 5-3-2", () => {
    expect(isValidFormation(makeXI(1, 5, 3, 2)).ok).toBe(true);
  });

  it("rejects a squad without exactly 11 players", () => {
    const result = isValidFormation(makeXI(1, 4, 4, 1)); // 10 players
    expect(result.ok).toBe(false);
  });

  it("rejects zero goalkeepers", () => {
    const result = isValidFormation(makeXI(0, 5, 4, 2));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/goalkeeper/i);
  });

  it("rejects two goalkeepers", () => {
    const result = isValidFormation(makeXI(2, 4, 4, 1));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/goalkeeper/i);
  });

  it("rejects fewer than 3 defenders", () => {
    const result = isValidFormation(makeXI(1, 2, 5, 3));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/defender/i);
  });

  it("rejects more than 5 defenders", () => {
    const result = isValidFormation(makeXI(1, 6, 3, 1));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/defender/i);
  });

  it("rejects zero forwards", () => {
    const result = isValidFormation(makeXI(1, 5, 5, 0));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/forward/i);
  });

  it("rejects more than 3 forwards", () => {
    const result = isValidFormation(makeXI(1, 3, 3, 4));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/forward/i);
  });
});

describe("countByPosition", () => {
  it("counts each position correctly", () => {
    const counts = countByPosition(makeXI(1, 4, 4, 2));
    expect(counts).toEqual({ GK: 1, DEF: 4, MID: 4, FWD: 2 });
  });
});

describe("assignPitchCoordinates", () => {
  it("places the sole goalkeeper at the center of the GK row", () => {
    const positioned = assignPitchCoordinates(makeXI(1, 4, 4, 1));
    const gk = positioned.find((p) => p.pos === "GK")!;
    expect(gk.x).toBe(50);
    expect(gk.y).toBe(92);
  });

  it("spreads a row of players across distinct x positions", () => {
    const positioned = assignPitchCoordinates(makeXI(1, 4, 4, 1));
    const defXs = positioned.filter((p) => p.pos === "DEF").map((p) => p.x);
    expect(new Set(defXs).size).toBe(4); // all distinct
    defXs.forEach((x) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
    });
  });

  it("keeps every player within one row's y coordinate", () => {
    const positioned = assignPitchCoordinates(makeXI(1, 3, 5, 2));
    const midYs = positioned.filter((p) => p.pos === "MID").map((p) => p.y);
    expect(new Set(midYs)).toEqual(new Set([48]));
  });

  it("returns the same number of players it was given", () => {
    const xi = makeXI(1, 5, 3, 2);
    expect(assignPitchCoordinates(xi)).toHaveLength(xi.length);
  });
});
