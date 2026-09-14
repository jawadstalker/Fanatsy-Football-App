import { League } from "@/types";

// Kept in sync with tailwind.config.js `theme.extend.colors`.
// Use these when a color is needed in JS (e.g. icon `color` props),
// use the Tailwind classes (bg-surface, text-ink, etc.) everywhere else.
export const colors = {
  base: "#0D1512",
  surface: "#141F19",
  elevated: "#1B2A21",
  line: "#28372C",
  turf: "#79B34C",
  turfDim: "#3E5A34",
  gold: "#E3B34B",
  ink: "#F3F4EE",
  muted: "#8FA093",
  danger: "#D9695A",
};

export const LEAGUES: League[] = [
  { id: "epl", label: "Premier League", color: "#3D195B" },
  { id: "laliga", label: "La Liga", color: "#EE8707" },
  { id: "seriea", label: "Serie A", color: "#0068A8" },
  { id: "bundesliga", label: "Bundesliga", color: "#D3010C" },
  { id: "ligue1", label: "Ligue 1", color: "#DAE025" },
];

export const leagueColor = (id: string): string =>
  LEAGUES.find((l) => l.id === id)?.color ?? colors.muted;
