# Multi League Fantasy

A cross-league fantasy football app covering the Premier League, La Liga,
Serie A, Bundesliga, and Ligue 1. Users build a 15-player squad from any
of the five leagues, manage transfers within a budget, and earn points
using a scoring system modeled on Fantasy Premier League.

Built with Expo, TypeScript, and NativeWind (Tailwind for React Native).

## Features

- Squad screen with a dynamic pitch view that lays out any legal
  formation (3-4-3, 4-3-3, 4-4-2, and so on)
- Drag-and-drop substitutions: drag a bench player onto the pitch to
  swap them into the starting XI; invalid formations are rejected with
  a reason
- Transfer market with per-league filters, live player data from
  API-Football, and a graceful fallback to bundled sample data when no
  API key is configured
- Player detail view: tap any player to see season stats, a
  current-gameweek points breakdown, and a bar chart of their last five
  gameweeks
- Captain selection, with the armband automatically passed to a
  substitute if the captain is benched
- A scoring engine that mirrors FPL's rules (minutes played, goals
  weighted by position, assists, clean sheets, saves, penalties,
  cards, own goals) and a pipeline that scores a real fixture from
  API-Football's `/fixtures/players` endpoint
- Global squad/transfer state via Zustand, including budget tracking
  and a free-transfer counter with a points-hit penalty for extra
  transfers

## Getting started

```bash
npm install
npx expo install   # aligns native package versions with your installed SDK
npx expo start
```

The versions pinned in `package.json` are approximate. Run
`npx expo install` the first time you open the project so Expo can
resolve versions compatible with your SDK, particularly for
`react-native-screens`, `react-native-svg`, and
`react-native-safe-area-context`.

## Project structure

```
App.tsx                       App root: font loading, navigation theme, safe area
global.css                    Tailwind entry point (NativeWind v4)
tailwind.config.js            Color and font tokens

src/
  types.ts                    Player, League, Ranking, and related types
  theme/
    tokens.ts                 Colors as plain JS (for icon `color` props)
    useAppFonts.ts             Loads the Oswald and Vazirmatn font families
  lib/
    formation.ts               Formation validation and pitch-layout math
  data/
    sample.ts                  Sample squad, bench, market, and leaderboard data
    playerStats.ts              Sample season stats backing the player detail view
  api/
    config.ts                   API-Football key/base URL
    leagues.ts                  Maps the 5 leagues to API-Football league IDs
    types.ts                    Trimmed API response shapes
    client.ts                   Authenticated fetch wrapper
    players.ts                  Fetches a league's players
    fixtures.ts                 Fetches a fixture's score and player stats
    mapMatchStats.ts             Maps a fixture's raw stats to the scoring engine's input
    mappers.ts                   Maps raw player data to the app's MarketPlayer shape
    teamFixtures.ts              Looks up a club's most recent fixture
  scoring/
    calculatePoints.ts           Pure FPL-style scoring function
    calculateFixturePoints.ts     Scores every player in one fixture
  store/
    useTeamStore.ts               Squad, transfers, captaincy, and budget state
  hooks/
    usePlayers.ts                 Live transfer-market data with sample-data fallback
    useGameweekSync.ts            Syncs squad points from live fixtures
    useFixturePoints.ts            Scores a single fixture on demand
  components/                     PlayerChip, TopBar, LeagueChip, DraggableBenchCard,
                                   PlayerDetailModal
  screens/                        SquadScreen, TransfersScreen, LeagueScreen
  navigation/                     RootTabs, custom TabBar
```

## Design direction

A dark green-black background evokes a stadium under floodlights.
Numbers and stats (points, prices, player names) use the condensed
Oswald typeface for a scoreboard feel. Each league is represented by a
single colored ring around a player's avatar rather than a full-screen
color takeover.

## Connecting live data (API-Football)

1. Get a free key from [RapidAPI - API-Football](https://rapidapi.com/api-sports/api/api-football).
2. Copy `.env.example` to `.env` and add your key:
   ```
   EXPO_PUBLIC_RAPIDAPI_KEY=your_key_here
   ```
3. Restart `npx expo start` so Metro picks up the new environment variable.

Without a key, the transfer screen automatically falls back to the
sample data in `src/data/sample.ts` and shows a small banner noting
that the data isn't live.

API-Football has no concept of a fantasy "price" — that belongs to FPL
itself. `src/api/mappers.ts` derives a starting price from a player's
position, rating, and minutes played. This is a simple heuristic,
fully adjustable, and worth replacing with a calibrated model once you
have a full season of stats.

The "All Leagues" tab in the transfer market currently uses sample
data, since API-Football scopes each request to one league. Combining
all five live would mean five parallel requests or a backend
aggregator.

## Scoring engine

`src/scoring/calculatePoints.ts` implements FPL-style rules: minutes
played, goals (weighted by position), assists, clean sheets,
goalkeeper saves, penalties saved/missed, goals conceded (for
goalkeepers and defenders), cards, and own goals. It is a pure
function with no UI or API dependency, so it is straightforward to
unit test.

`src/scoring/calculateFixturePoints.ts` wires this engine to a real
match: it fetches a fixture and its player statistics from
API-Football, maps each player's raw stats into the scoring engine's
input shape, and returns every player's point breakdown for that
fixture. `useGameweekSync` uses this to update the store's player
points from each squad member's most recent match.

## Formation and substitutions

`src/lib/formation.ts` validates a starting XI against FPL's shape
rules (exactly one goalkeeper, three to five defenders, two to five
midfielders, one to three forwards, eleven players total) and computes
pitch coordinates for any valid formation. The store's `swapPlayers`
action uses this to reject substitutions that would produce an illegal
formation.

The Squad screen implements substitutions as a drag interaction: press
and drag a bench player onto the pitch, and releasing near a starting
player attempts to swap them in. A quick tap without dragging opens
the player detail view instead.

## Suggested next steps

1. Real backend for private leagues among friends, with account sync
   across devices.
2. Persist squad/transfer state locally (e.g. with AsyncStorage) so it
   survives an app restart.
3. Gameweek deadlines that lock transfers once matches begin.
4. Vice-captain selection, and FPL-style chips (Wildcard, Bench Boost,
   Triple Captain, Free Hit).
5. A live fixtures/results screen.
6. Unit tests for the scoring engine.
7. For production, proxy RapidAPI requests through your own backend
   instead of calling it directly from the client, since
   `EXPO_PUBLIC_*` variables are visible in the compiled app bundle.

## License

MIT — see [LICENSE](./LICENSE).
