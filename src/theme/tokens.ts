import { League } from "@/types";

// Shared visual language for the fantasy matchday experience.
export const colors = {
  base: "#08110D",
  surface: "#101C15",
  elevated: "#17271D",
  line: "#26382C",
  turf: "#A3E635",
  turfDim: "#52752D",
  gold: "#F4C96B",
  ink: "#F4F7F1",
  muted: "#91A397",
  danger: "#F07868",
};

export const LEAGUES: League[] = [
  { id: "epl", label: "Premier League", color: "#8B5CF6" },
  { id: "laliga", label: "La Liga", color: "#F59E0B" },
  { id: "seriea", label: "Serie A", color: "#38BDF8" },
  { id: "bundesliga", label: "Bundesliga", color: "#F87171" },
  { id: "ligue1", label: "Ligue 1", color: "#D9E65B" },
];

export const leagueColor = (id: string): string =>
  LEAGUES.find((l) => l.id === id)?.color ?? colors.muted;
