import { calculatePoints, MatchStats } from "../calculatePoints";

function baseStats(overrides: Partial<MatchStats> = {}): MatchStats {
  return {
    minutesPlayed: 90,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    goalsConceded: 0,
    saves: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    yellowCards: 0,
    redCards: 0,
    ownGoals: 0,
    ...overrides,
  };
}

describe("calculatePoints — minutes", () => {
  it("awards 0 points for not playing", () => {
    expect(calculatePoints(baseStats({ minutesPlayed: 0 }), "MID").minutes).toBe(0);
  });

  it("awards 1 point for under 60 minutes", () => {
    expect(calculatePoints(baseStats({ minutesPlayed: 45 }), "MID").minutes).toBe(1);
  });

  it("awards 2 points for 60+ minutes", () => {
    expect(calculatePoints(baseStats({ minutesPlayed: 60 }), "MID").minutes).toBe(2);
  });
});

describe("calculatePoints — goals, weighted by position", () => {
  it("gives a forward 4 points per goal", () => {
    const p = calculatePoints(baseStats({ goals: 1 }), "FWD");
    expect(p.goals).toBe(4);
  });

  it("gives a midfielder 5 points per goal", () => {
    expect(calculatePoints(baseStats({ goals: 1 }), "MID").goals).toBe(5);
  });

  it("gives a defender 6 points per goal", () => {
    expect(calculatePoints(baseStats({ goals: 1 }), "DEF").goals).toBe(6);
  });

  it("gives a goalkeeper 6 points per goal", () => {
    expect(calculatePoints(baseStats({ goals: 1 }), "GK").goals).toBe(6);
  });

  it("scales with multiple goals (hat-trick)", () => {
    expect(calculatePoints(baseStats({ goals: 3 }), "FWD").goals).toBe(12);
  });
});

describe("calculatePoints — assists", () => {
  it("awards 3 points per assist regardless of position", () => {
    expect(calculatePoints(baseStats({ assists: 2 }), "DEF").assists).toBe(6);
  });
});

describe("calculatePoints — clean sheets", () => {
  it("awards a defender 4 points for a clean sheet played 60+ minutes", () => {
    const p = calculatePoints(baseStats({ cleanSheet: true, minutesPlayed: 90 }), "DEF");
    expect(p.cleanSheet).toBe(4);
  });

  it("does not award a clean sheet if played under 60 minutes", () => {
    const p = calculatePoints(baseStats({ cleanSheet: true, minutesPlayed: 45 }), "DEF");
    expect(p.cleanSheet).toBe(0);
  });

  it("awards a midfielder only 1 point for a clean sheet", () => {
    const p = calculatePoints(baseStats({ cleanSheet: true }), "MID");
    expect(p.cleanSheet).toBe(1);
  });

  it("awards a forward 0 points for a clean sheet", () => {
    const p = calculatePoints(baseStats({ cleanSheet: true }), "FWD");
    expect(p.cleanSheet).toBe(0);
  });
});

describe("calculatePoints — goalkeeper saves", () => {
  it("awards 1 point per 3 saves, rounded down", () => {
    expect(calculatePoints(baseStats({ saves: 6 }), "GK").saves).toBe(2);
    expect(calculatePoints(baseStats({ saves: 8 }), "GK").saves).toBe(2);
  });

  it("does not award saves to outfield players", () => {
    expect(calculatePoints(baseStats({ saves: 9 }), "DEF").saves).toBe(0);
  });
});

describe("calculatePoints — penalties", () => {
  it("awards 5 points for a penalty save", () => {
    expect(calculatePoints(baseStats({ penaltiesSaved: 1 }), "GK").penalties).toBe(5);
  });

  it("deducts 2 points for a penalty miss", () => {
    expect(calculatePoints(baseStats({ penaltiesMissed: 1 }), "FWD").penalties).toBe(-2);
  });
});

describe("calculatePoints — goals conceded", () => {
  it("deducts 1 point per 2 goals conceded for a goalkeeper", () => {
    expect(calculatePoints(baseStats({ goalsConceded: 4 }), "GK").goalsConceded).toBe(-2);
  });

  it("deducts 1 point per 2 goals conceded for a defender", () => {
    expect(calculatePoints(baseStats({ goalsConceded: 3 }), "DEF").goalsConceded).toBe(-1);
  });

  it("does not penalize midfielders or forwards for goals conceded", () => {
    expect(calculatePoints(baseStats({ goalsConceded: 5 }), "MID").goalsConceded).toBe(0);
    expect(calculatePoints(baseStats({ goalsConceded: 5 }), "FWD").goalsConceded).toBe(0);
  });
});

describe("calculatePoints — cards and own goals", () => {
  it("deducts 1 point per yellow card", () => {
    expect(calculatePoints(baseStats({ yellowCards: 1 }), "MID").cards).toBe(-1);
  });

  it("deducts 3 points for a red card", () => {
    expect(calculatePoints(baseStats({ redCards: 1 }), "MID").cards).toBe(-3);
  });

  it("deducts 2 points per own goal", () => {
    expect(calculatePoints(baseStats({ ownGoals: 1 }), "DEF").ownGoals).toBe(-2);
  });
});

describe("calculatePoints — total", () => {
  it("sums every category correctly for a strong forward performance", () => {
    const p = calculatePoints(
      baseStats({ minutesPlayed: 90, goals: 2, assists: 1, yellowCards: 1 }),
      "FWD"
    );
    // 2 (minutes) + 8 (2 goals x4) + 3 (assist) - 1 (yellow) = 12
    expect(p.total).toBe(12);
  });

  it("sums a clean-sheet defender's total correctly", () => {
    const p = calculatePoints(
      baseStats({ minutesPlayed: 90, cleanSheet: true, assists: 1 }),
      "DEF"
    );
    // 2 (minutes) + 4 (clean sheet) + 3 (assist) = 9
    expect(p.total).toBe(9);
  });

  it("respects an explicit bonus value", () => {
    const p = calculatePoints(baseStats({ minutesPlayed: 90, bonus: 3 }), "MID");
    expect(p.bonus).toBe(3);
    expect(p.total).toBe(5); // 2 (minutes) + 3 (bonus)
  });
});
