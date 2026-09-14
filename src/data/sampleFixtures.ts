import { Fixture } from "@/types";

export const SAMPLE_FIXTURES: Fixture[] = [
  { id: 901, league: "epl", homeTeam: "Man City", awayTeam: "Liverpool", homeGoals: 2, awayGoals: 1, date: "2026-09-07T14:00:00Z", status: "finished" },
  { id: 902, league: "epl", homeTeam: "Arsenal", awayTeam: "Chelsea", homeGoals: null, awayGoals: null, date: "2026-09-21T14:00:00Z", status: "scheduled" },
  { id: 903, league: "laliga", homeTeam: "Real Madrid", awayTeam: "Barcelona", homeGoals: 3, awayGoals: 2, date: "2026-09-06T19:00:00Z", status: "finished" },
  { id: 904, league: "laliga", homeTeam: "Atletico Madrid", awayTeam: "Sevilla", homeGoals: null, awayGoals: null, date: "2026-09-20T19:00:00Z", status: "scheduled" },
  { id: 905, league: "seriea", homeTeam: "Inter", awayTeam: "Napoli", homeGoals: 1, awayGoals: 1, date: "2026-09-07T18:45:00Z", status: "finished" },
  { id: 906, league: "seriea", homeTeam: "Milan", awayTeam: "Juventus", homeGoals: null, awayGoals: null, date: "2026-09-21T18:45:00Z", status: "scheduled" },
  { id: 907, league: "bundesliga", homeTeam: "Bayern", awayTeam: "Dortmund", homeGoals: 4, awayGoals: 0, date: "2026-09-06T16:30:00Z", status: "finished" },
  { id: 908, league: "bundesliga", homeTeam: "Leverkusen", awayTeam: "RB Leipzig", homeGoals: null, awayGoals: null, date: "2026-09-20T16:30:00Z", status: "scheduled" },
  { id: 909, league: "ligue1", homeTeam: "PSG", awayTeam: "Marseille", homeGoals: 2, awayGoals: 0, date: "2026-09-07T19:00:00Z", status: "finished" },
  { id: 910, league: "ligue1", homeTeam: "Monaco", awayTeam: "Lyon", homeGoals: null, awayGoals: null, date: "2026-09-21T19:00:00Z", status: "scheduled" },
];
