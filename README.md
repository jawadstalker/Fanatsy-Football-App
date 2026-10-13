<p align="center">
  <img src="logo.png" alt="Multi League Fantasy logo" width="160" />
</p>

<h1 align="center">Multi League Fantasy</h1>

<p align="center">
  A dark-mode fantasy football app for building a squad across five major European leagues.
</p>

<p align="center">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-SDK%2052-4630EB?logo=expo&logoColor=white" />
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.76-20232A?logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white" />
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

Multi League Fantasy is a cross-league fantasy football application covering the **Premier League, La Liga, Serie A, Bundesliga, and Ligue 1**. Managers can assemble a 15-player squad, manage transfers and captaincy, follow fixtures, review player statistics, and compete in private mini-leagues.

The app is built with **Expo, React Native, TypeScript, NativeWind, and Zustand**. Its visual design uses a dark green-black palette with pitch-green and gold accents.

> **Project status:** Active development. Some screens use bundled sample data when live data or backend configuration is unavailable. Features described as implemented should not be assumed to have passed a production build or device-level testing unless separately verified.

## Contents

- [Features](#features)
- [Three-dimensional kit preview](#three-dimensional-kit-preview)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Project structure](#project-structure)
- [Squad management](#squad-management)
- [Scoring and live data](#scoring-and-live-data)
- [Official FPL player statistics](#official-fpl-player-statistics)
- [Private mini-leagues](#private-mini-leagues)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

## Features

### Squad and formation management

- Build a 15-player squad across the five supported leagues.
- View the starting XI on a football-pitch layout with formation-aware player positioning.
- Validate formations using goalkeeper, defender, midfielder, forward, and starting-player constraints.
- Move a bench player into the starting XI using drag-and-drop substitution interactions.
- Set a captain by tapping the star and set a vice-captain by long-pressing a starting player.
- View squad value, remaining budget, gameweek points, transfer costs, and synchronization status.
- Persist squad and team-management state locally with AsyncStorage through Zustand persistence.

### Player details and statistics

- Open a player detail panel from the squad and supported player-selection screens.
- Review season statistics, a gameweek points breakdown, and a recent-gameweek chart.
- View official FPL Bonus, BPS, and points when the backend returns a unique player match.
- Hide official values when the player cannot be matched unambiguously rather than displaying guessed values.

### Transfers and fixtures

- Browse the transfer market with league filters.
- Retrieve player and fixture data through API-Football when configured.
- Fall back to bundled sample data when live API data is unavailable.
- Track free transfers and point deductions for additional transfers.
- View fixtures and results filtered by league.

### Chips and gameweek rules

- **Wildcard:** make transfers without the usual points hit for that gameweek.
- **Bench Boost:** include bench-player points in the gameweek total.
- **Triple Captain:** apply the chip's captain multiplier.
- **Free Hit:** temporarily use a different squad for one gameweek, with a saved squad snapshot.
- Lock transfers, substitutions, captaincy changes, and chip activation after the configured gameweek deadline.

The exact rules and data lifecycle are implemented in the client-side store and configuration. They should be compared against the current official FPL rules before production release.

### Private mini-leagues

- Create a private league and generate a join code.
- Join a league with its code and a manager name.
- Submit gameweek points and view league standings.
- Use the optional backend in the `server/` directory.

The current join-code flow is a development-level membership mechanism, not secure user authentication.

### Visual design

- Dark green-black interface with turf-green and gold accents.
- Oswald display typography and Vazirmatn font support.
- Compact player cards and league-specific visual accents.
- Club-coloured shirt icons on the squad pitch.
- A procedural Three.js jersey preview in the player details panel.

## Three-dimensional kit preview

The player detail panel includes a **procedurally generated 3D shirt**, rendered with Three.js and React Three Fiber. The model rotates slowly and uses a club-colour palette, with simple shirt details and optional stripes.

The squad pitch uses lightweight **2D shirt illustrations** instead of rendering a separate 3D scene for every player. This keeps the formation view simpler and reduces the rendering workload.

Current kit-preview scope:

- Concept jersey geometry generated in code; no external 3D model file is required for the current prototype.
- Club-colour presets for selected clubs, with league-colour fallbacks.
- A rotating preview in the player details panel.
- Simple shirt icons on the squad pitch.

**Important:** these are concept designs, not verified replicas of official club kits. Accurate current-season patterns, sponsor marks, badges, shirt numbers, and licensing have not been implemented. Three-dimensional rendering and native platform compatibility still need to be tested in the target Expo environment.

## Technology stack

| Area | Technology |
| --- | --- |
| Mobile app | Expo SDK 52, React Native 0.76 |
| Language | TypeScript |
| Styling | NativeWind, Tailwind CSS |
| Navigation | React Navigation |
| State management | Zustand |
| Local persistence | AsyncStorage |
| Icons and vector graphics | Lucide React Native, React Native SVG |
| 3D kit preview | Three.js, React Three Fiber, Expo GL |
| Football data | API-Football integration |
| Optional backend | Node.js / TypeScript under `server/` |
| Tests | Jest, jest-expo |

## Getting started

### Requirements

- Node.js compatible with the installed Expo SDK.
- npm.
- Expo Go or a development build compatible with the project's native dependencies.
- API keys and a backend URL only if you want the related live-data features.

### Install dependencies

Clone the repository and install the packages:

```bash
git clone https://github.com/jawadstalker/Fanatsy-Football-App.git
cd Fanatsy-Football-App
npm install
```

Because the app uses native Expo modules, check package compatibility with the project's Expo SDK before changing dependency versions. If Expo reports version mismatches, use the SDK-compatible versions recommended by Expo.

Start the development server:

```bash
npx expo start
```

Available npm scripts:

```bash
npm start
npm run android
npm run ios
npm run web
npm test
```

The 3D preview relies on native graphics support. Validate it on the intended platform and Expo runtime; a successful Metro start alone does not guarantee that the 3D view renders correctly on every device or on web.

## Environment configuration

Create a local `.env` file based on `.env.example`. Do not commit real API keys or private credentials.

### API-Football

Configure the environment variable expected by the client:

```env
EXPO_PUBLIC_RAPIDAPI_KEY=your_key_here
```

Use a valid API-Football key and confirm the required RapidAPI headers and subscription limits. Variables prefixed with `EXPO_PUBLIC_` are embedded in the client bundle and must **not** be treated as secrets. For a production app, proxy authenticated provider requests through a backend.

Without a configured key or when requests fail, parts of the app use bundled sample data.

### Optional private-leagues backend

Set the backend URL to the server instance you control:

```env
EXPO_PUBLIC_BACKEND_URL=http://your-server-host:port
```

Use the correct reachable address for your device. On a physical phone, `localhost` refers to the phone itself, not your development computer.

Review the backend's own configuration and README before deploying it. Do not expose an unauthenticated development backend to the public internet.

## Project structure

```text
.
├── App.tsx
├── app.json
├── global.css
├── tailwind.config.js
├── package.json
├── server/
└── src/
    ├── api/
    │   ├── backendClient.ts
    │   ├── client.ts
    │   ├── config.ts
    │   ├── fixtures.ts
    │   ├── leagueFixtures.ts
    │   ├── leagues.ts
    │   ├── mapMatchStats.ts
    │   ├── mappers.ts
    │   ├── players.ts
    │   ├── teamFixtures.ts
    │   └── types.ts
    ├── components/
    │   ├── DraggableBenchCard.tsx
    │   ├── PlayerChip.tsx
    │   ├── PlayerDetailModal.tsx
    │   ├── PlayerKit3D.tsx
    │   └── ...
    ├── config/
    │   ├── backend.ts
    │   └── gameweek.ts
    ├── data/
    │   ├── playerStats.ts
    │   ├── sample.ts
    │   └── sampleFixtures.ts
    ├── hooks/
    │   ├── useFixturePoints.ts
    │   ├── useGameweekSync.ts
    │   ├── useLeagueFixtures.ts
    │   └── usePlayers.ts
    ├── lib/
    │   └── formation.ts
    ├── navigation/
    ├── scoring/
    │   ├── calculateFixturePoints.ts
    │   └── calculatePoints.ts
    ├── screens/
    ├── store/
    │   ├── useLeagueStore.ts
    │   └── useTeamStore.ts
    └── theme/
        ├── tokens.ts
        └── useAppFonts.ts
```

This is a high-level map of the main app modules; inspect the repository for the complete current file list.

## Squad management

The formation utility in `src/lib/formation.ts` validates the starting XI and calculates player positions. The squad store in `src/store/useTeamStore.ts` manages team selection, transfers, budget, captaincy, chips, and persisted state.

The Squad screen uses `PlayerChip` to display each starter's shirt icon, name, points, and captain/vice-captain controls. Selecting a player opens `PlayerDetailModal`, which contains the club-coloured Three.js kit preview and player statistics.

The 3D shirt is a visual prototype. It does not represent a full animated player model: there is no player body, movement rig, or match animation.

## Scoring and live data

The scoring modules separate point calculation from UI:

- `src/scoring/calculatePoints.ts` contains the FPL-style scoring calculation.
- `src/scoring/calculateFixturePoints.ts` connects fixture player statistics to the scoring engine.
- `src/hooks/useGameweekSync.ts` synchronizes the squad's fixture-derived points.
- `src/api/` contains API-Football request and mapping logic.

**Fixture-derived points are not the same as official live FPL points.** The Squad screen labels this distinction and reports the last successful synchronization time for that screen's current session. A fixture sync should not be interpreted as a complete official FPL points feed.

## Official FPL player statistics

The player detail component requests official FPL live statistics through `getOfficialFplLiveStats()` in `src/api/backendClient.ts`. The app can display Bonus, BPS, and total FPL points when the returned data contains exactly one matching player based on the current name-and-team matching logic.

- Official data is retrieved through the backend endpoint, not inferred from the app's fixture scoring.
- If no unique match is found, the UI hides those values instead of guessing.
- The current matching approach uses normalized names and team names; persistent official player IDs would be more reliable.
- Availability depends on backend configuration, upstream API access, and the selected gameweek.

Do not rely on these values as a guaranteed real-time feed until the backend and provider response have been tested end to end.

## Private mini-leagues

The optional backend lives in `server/`; the client API wrapper is `src/api/backendClient.ts` and league state is managed in `src/store/useLeagueStore.ts`.

The current flow supports creating a league, joining by code, submitting gameweek points, and viewing standings. League standings reflect the data available to the configured backend; they are not automatically equivalent to official global FPL rankings.

Before production, add proper user authentication and authorization, validate requests server-side, use a persistent database, apply rate limiting, and protect deployment secrets.

## Testing

Run the available Jest suite with:

```bash
npm test
```

A CI workflow is configured under `.github/workflows/` to install dependencies and run the test suite on relevant GitHub events. Check the latest GitHub Actions run for the actual status; the presence of a workflow does not by itself mean the current branch passes.

The 3D kit preview also needs platform-specific verification on Android, iOS, and any intended web target.

## Known limitations

- Some player, fixture, and season-stat screens fall back to sample data when live requests are unavailable.
- API-Football data and official FPL data are separate sources with different coverage and scoring semantics.
- Fixture-derived squad points must not be presented as official FPL live points.
- Official FPL player matching currently depends on normalized player and team names rather than stable official IDs.
- The configured gameweek and deadline are client-side configuration, not a complete automatic official calendar.
- Private-league join codes are not a substitute for account authentication.
- The 3D jersey is a procedural concept preview, not a licensed, accurate reproduction of each current club kit.
- Expo GL / React Three Fiber compatibility and rendering performance have not yet been confirmed on every target platform.
- The current project should be treated as an actively developed prototype until automated tests, device testing, and deployment checks are verified.

## Roadmap

- [ ] Verify dependency compatibility and run the app on Android and iOS.
- [ ] Test the Three.js jersey preview on physical devices and profile its rendering performance.
- [ ] Improve procedural shirt geometry, materials, sleeve details, and front/back viewing.
- [ ] Add stable official player IDs for reliable statistics matching.
- [ ] Replace manually maintained gameweek settings with a trusted fixtures source.
- [ ] Improve authentication and authorization for private leagues.
- [ ] Move backend persistence to a production database.
- [ ] Add server-side validation, rate limiting, and secure provider API proxying.
- [ ] Expand automated tests and confirm the latest CI run is green.

## License

This project is released under the MIT License. See [LICENSE](./LICENSE).
