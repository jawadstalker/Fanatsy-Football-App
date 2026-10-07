export const LEAGUE_API_IDS = { epl: 39, laliga: 140, seriea: 135, bundesliga: 78, ligue1: 61 } as const;
export const CURRENT_SEASON = 2026;
const API_HOST = "api-football-v1.p.rapidapi.com";
const API_BASE_URL = `https://${API_HOST}/v3`;

type CacheEntry<T> = { expiresAt: number; value: T };
const cache = new Map<string, CacheEntry<unknown>>();
const FIXTURE_CACHE_MS = 10 * 60 * 1000;
const PLAYER_STATS_CACHE_MS = 60 * 60 * 1000;

async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const value = await loader();
  cache.set(key, { expiresAt: Date.now() + ttl, value });
  return value;
}

type Position = "GK" | "DEF" | "MID" | "FWD";
type PlayerStats = {
  player: { id: number; name?: string };
  statistics: Array<{
    games: { minutes?: number | null; position?: string | null };
    goals: { total?: number | null; assists?: number | null; saves?: number | null };
    penalty: { saved?: number | null; missed?: number | null };
    cards: { yellow?: number | null; red?: number | null };
  }>;
};
type Fixture = {
  fixture: { id: number; status?: { short?: string }; round?: string | null };
  teams: { home: { id: number; name?: string }; away: { id: number; name?: string } };
  goals: { home: number | null; away: number | null };
};
const POSITIONS: Record<string, Position> = { Goalkeeper:"GK", Defender:"DEF", Midfielder:"MID", Attacker:"FWD" };
const GOALS: Record<Position, number> = { GK:10, DEF:6, MID:5, FWD:4 };
const CLEAN: Record<Position, number> = { GK:4, DEF:4, MID:1, FWD:0 };

type FplLiveElement = {
  id: number;
  stats?: { minutes?: number; total_points?: number; bps?: number; bonus?: number; defensive_contribution?: number };
};
type FplLiveResponse = { elements: FplLiveElement[] };
type FplPlayer = { id:number; first_name?:string; second_name?:string; web_name?:string; team:number };
type FplTeam = { id:number; name:string };

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function playerKey(name: string, team: string): string {
  return `${normalize(name)}:${normalize(team)}`;
}

async function fplLive(gameweek: number): Promise<Map<number, FplLiveElement["stats"]>> {
  return cached(`fpl-live:${gameweek}`, 5 * 60 * 1000, async () => {
    const response = await fetch(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`);
    if (!response.ok) throw new Error(`FPL live endpoint failed (${response.status})`);
    const body = await response.json() as FplLiveResponse;
    return new Map(body.elements.map((element) => [element.id, element.stats ?? {}]));
  });
}

async function fplPlayerMap(): Promise<Map<string, number>> {
  return cached("fpl-player-map", 60 * 60 * 1000, async () => {
    const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
    if (!response.ok) throw new Error(`FPL bootstrap endpoint failed (${response.status})`);
    const body = await response.json() as { elements: FplPlayer[]; teams: FplTeam[] };
    const teams = new Map(body.teams.map((team) => [team.id, team.name]));
    const map = new Map<string, number>();
    for (const player of body.elements) {
      const team = teams.get(player.team);
      if (!team) continue;
      const names = [
        `${player.first_name ?? ""} ${player.second_name ?? ""}`,
        player.web_name ?? "",
      ].filter(Boolean);
      for (const name of names) {
        const key = playerKey(name, team);
        const existing = map.get(key);
        if (existing != null && existing !== player.id) {
          map.delete(key);
        } else {
          map.set(key, player.id);
        }
      }
    }
    return map;
  });
}

async function apiGet<T>(path:string, query:Record<string,string|number>):Promise<T> {
  const key=process.env.RAPIDAPI_KEY;
  if(!key) throw new Error("RAPIDAPI_KEY is not set on the server");
  const params=new URLSearchParams(Object.entries(query).map(([k,v])=>[k,String(v)]));
  const r=await fetch(`${API_BASE_URL}${path}?${params}`,{headers:{"x-rapidapi-key":key,"x-rapidapi-host":API_HOST}});
  const body=await r.json() as T;
  if(!r.ok) throw new Error(`API-Football request failed (${r.status})`);
  return body;
}

export function score(s:PlayerStats["statistics"][number],pos:Position,conceded:number){
  const min=s.games.minutes??0;if(min<=0)return 0;
  return (min>=60?2:1)+(s.goals.total??0)*GOALS[pos]+(s.goals.assists??0)*3+
    (conceded===0&&min>=60?CLEAN[pos]:0)+(pos==="GK"?Math.floor((s.goals.saves??0)/3):0)+
    (s.penalty.saved??0)*5-(s.penalty.missed??0)*2-(pos==="GK"||pos==="DEF"?Math.floor(conceded/2):0)+
    (s.cards.yellow??0)*-1+(s.cards.red??0)*-3;
}

async function fixtures(league:number,gameweek:number){
  return cached(`fixtures:${league}:${CURRENT_SEASON}:${gameweek}`, FIXTURE_CACHE_MS, async () => {
    const data=await apiGet<{response:Fixture[]}>( "/fixtures",{league,season:CURRENT_SEASON});
    return data.response.filter((fixture) => {
      const match=fixture.fixture.round?.match(/(\\d+)\\s*$/);
      return match ? Number(match[1]) === gameweek : false;
    });
  });
}

export async function calculateServerGameweekPoints(ids:number[],gameweek:number){
  const totals=new Map<number,number>();
  const fplStats = await fplLive(gameweek);
  const fplMap = await fplPlayerMap();

  for(const league of Object.values(LEAGUE_API_IDS)){
    const fs=await fixtures(league,gameweek);
    await Promise.all(fs.map(async f=>{
      if(!["FT","AET","PEN"].includes(f.fixture.status?.short??""))return;
      const data=await cached(`fixture-stats:${f.fixture.id}`, PLAYER_STATS_CACHE_MS, () =>
        apiGet<{response:Array<{team:{id:number;name?:string};players:PlayerStats[]} }>(
          "/fixtures/players",{fixture:f.fixture.id}
        )
      );
      const conceded:Record<number,number>={[f.teams.home.id]:f.goals.away??0,[f.teams.away.id]:f.goals.home??0};

      for(const block of data.response) for(const p of block.players){
        if(!ids.includes(p.player.id))continue;
        const s=p.statistics[0]; if(!s || (s.games.minutes ?? 0) <= 0)continue;
        const pos=POSITIONS[s.games.position??""]; if(!pos)continue;

        const isEpl = league === LEAGUE_API_IDS.epl;
        if (isEpl) {
          const apiTeamName = block.team.name ?? (block.team.id === f.teams.home.id ? f.teams.home.name : f.teams.away.name);
          const fullName = p.player.name ?? "";
          const fplId = apiTeamName && fullName ? fplMap.get(playerKey(fullName, apiTeamName)) : undefined;

          // Never silently use approximate API-Football scoring for EPL.
          // A missing/ambiguous mapping means the official FPL result is unavailable.
          if (fplId == null) {
            throw new Error(`Stable FPL mapping missing for EPL player "${fullName}" at "${apiTeamName ?? "unknown team"}" (API-Football id ${p.player.id})`);
          }

          const official = fplStats.get(fplId);
          if (!official || typeof official.total_points !== "number") {
            throw new Error(`Official FPL live points missing for FPL player ${fplId} (API-Football id ${p.player.id})`);
          }

          totals.set(p.player.id, (totals.get(p.player.id) ?? 0) + official.total_points);
        } else {
          totals.set(p.player.id,(totals.get(p.player.id)??0)+score(s,pos,conceded[block.team.id]??0));
        }
      }
    }));
  }
  return totals;
}

export function calculateSquadTotal(points:Map<number,number>,ids:number[],captainId:number|null|undefined,viceId:number|null|undefined,chips:string[],startingIds:number[]=[]){
  const starting=startingIds.length===11?startingIds:ids;
  const captainPlayed=captainId!=null&&points.has(captainId);
  const vicePlayed=viceId!=null&&points.has(viceId);
  const effective=captainPlayed?captainId:(vicePlayed?viceId:null);
  const multiplier=chips.includes("tripleCaptain")&&effective===captainId?3:2;
  const scored=chips.includes("benchBoost")?ids:starting;
  return scored.reduce((sum,id)=>sum+(id===effective?(points.get(id)??0)*multiplier:(points.get(id)??0)),0);
}
