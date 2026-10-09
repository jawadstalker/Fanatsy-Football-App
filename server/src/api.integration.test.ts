import { strict as assert } from "node:assert";
import { after, test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Server } from "node:http";

// Isolate auth and store persistence so these tests never touch developer data.
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fantasy-api-integration-"));
process.env.DATA_FILE = path.join(tempDir, "integration-data.json");
process.env.PORT = "0";

const { app } = require("./index") as { app: import("express").Express };
let server: Server;
let baseUrl = "";

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("HTTP API integration: health, auth, league lifecycle and guarded squad actions", async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true });

  const unauthorized = await fetch(`${baseUrl}/api/leagues`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Should fail" }),
  });
  assert.equal(unauthorized.status, 401);

  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "integration_user", password: "test-password-123" }),
  });
  assert.equal(registration.status, 201);
  const user = await registration.json() as { id: string; token: string };
  assert.ok(user.id);
  assert.ok(user.token);
  const authHeaders = {
    authorization: `Bearer ${user.token}`,
    "content-type": "application/json",
  };

  const leagueResponse = await fetch(`${baseUrl}/api/leagues`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ name: "Integration League" }),
  });
  assert.equal(leagueResponse.status, 201);
  const league = await leagueResponse.json() as { code: string };
  assert.match(league.code, /^[A-Z0-9]{6}$/);

  const joinResponse = await fetch(`${baseUrl}/api/leagues/${league.code}/join`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ managerName: "Test Manager" }),
  });
  assert.equal(joinResponse.status, 201);
  const team = await joinResponse.json() as { id: string; managerName: string };
  assert.ok(team.id);
  assert.equal(team.managerName, "Test Manager");

  const invalidSquad = await fetch(`${baseUrl}/api/leagues/${league.code}/teams/${team.id}/squad`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ squadPlayerIds: [1, 2] }),
  });
  assert.equal(invalidSquad.status, 400);

  const transferWithoutSquad = await fetch(`${baseUrl}/api/leagues/${league.code}/teams/${team.id}/transfers`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ outgoingPlayerId: 1, incomingPlayer: { id: 2 } }),
  });
  assert.equal(transferWithoutSquad.status, 400);
  assert.match((await transferWithoutSquad.json() as { error: string }).error, /complete squad/i);

  const scoringWithoutSquad = await fetch(`${baseUrl}/api/leagues/${league.code}/teams/${team.id}/calculate-points`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ gameweek: 1 }),
  });
  assert.equal(scoringWithoutSquad.status, 400);
  assert.match((await scoringWithoutSquad.json() as { error: string }).error, /15-player squad/i);

  const standingsResponse = await fetch(`${baseUrl}/api/leagues/${league.code}/standings`);
  assert.equal(standingsResponse.status, 200);
  const standings = await standingsResponse.json() as Array<{ id: string }>;
  assert.equal(standings.length, 1);
  assert.equal(standings[0].id, team.id);
});
