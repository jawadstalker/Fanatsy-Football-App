import { MarketPlayer, Player, PitchPlayer, RankingRow } from "@/types";

export const STARTING: PitchPlayer[] = [
  { id: 1, name: "Alisson", club: "Liverpool", pos: "GK", league: "epl", price: 5.5, pts: 4, x: 50, y: 92 },
  { id: 2, name: "Van Dijk", club: "Liverpool", pos: "DEF", league: "epl", price: 6.0, pts: 6, x: 22, y: 72 },
  { id: 3, name: "Militão", club: "Real Madrid", pos: "DEF", league: "laliga", price: 5.0, pts: 5, x: 50, y: 72 },
  { id: 4, name: "Bastoni", club: "Inter", pos: "DEF", league: "seriea", price: 5.5, pts: 7, x: 78, y: 72 },
  { id: 5, name: "Bellingham", club: "Real Madrid", pos: "MID", league: "laliga", price: 10.5, pts: 9, x: 15, y: 50 },
  { id: 6, name: "Musiala", club: "Bayern", pos: "MID", league: "bundesliga", price: 9.0, pts: 8, x: 40, y: 48 },
  { id: 7, name: "Barcola", club: "PSG", pos: "MID", league: "ligue1", price: 7.5, pts: 6, x: 62, y: 48 },
  { id: 8, name: "Saka", club: "Arsenal", pos: "MID", league: "epl", price: 8.5, pts: 5, x: 86, y: 50 },
  { id: 9, name: "Haaland", club: "Man City", pos: "FWD", league: "epl", price: 14.5, pts: 12, x: 28, y: 25, captain: true },
  { id: 10, name: "Vinícius Jr", club: "Real Madrid", pos: "FWD", league: "laliga", price: 11.0, pts: 10, x: 50, y: 22 },
  { id: 11, name: "Lautaro", club: "Inter", pos: "FWD", league: "seriea", price: 9.0, pts: 7, x: 72, y: 25 },
];

export const BENCH: Player[] = [
  { id: 12, name: "Ederson", club: "Man City", pos: "GK", league: "epl", price: 5.0, pts: 2 },
  { id: 13, name: "Kimmich", club: "Bayern", pos: "DEF", league: "bundesliga", price: 6.5, pts: 5 },
  { id: 14, name: "Osimhen", club: "Napoli", pos: "FWD", league: "seriea", price: 8.5, pts: 0 },
  { id: 15, name: "Griezmann", club: "Atlético", pos: "MID", league: "laliga", price: 8.0, pts: 6 },
];

export const MARKET: MarketPlayer[] = [
  { id: 21, name: "Mbappé", club: "Real Madrid", pos: "FWD", league: "laliga", price: 15.0, form: 8.2 },
  { id: 22, name: "Kane", club: "Bayern", pos: "FWD", league: "bundesliga", price: 13.5, form: 7.6 },
  { id: 23, name: "Leão", club: "Milan", pos: "MID", league: "seriea", price: 8.0, form: 6.9 },
  { id: 24, name: "Dembélé", club: "PSG", pos: "MID", league: "ligue1", price: 9.5, form: 7.1 },
  { id: 25, name: "Salah", club: "Liverpool", pos: "MID", league: "epl", price: 12.5, form: 8.8 },
];

export const RANKINGS: RankingRow[] = [
  { rank: 1, prev: 1, name: "Penalty Master", pts: 812, gw: 71 },
  { rank: 2, prev: 4, name: "European Nights", pts: 799, gw: 65 },
  { rank: 3, prev: 2, name: "Double Haaland", pts: 793, gw: 58 },
  { rank: 4, prev: 3, name: "Iron Defense", pts: 780, gw: 62 },
  { rank: 5, prev: 6, name: "Your Captain", pts: 774, gw: 68 },
];
