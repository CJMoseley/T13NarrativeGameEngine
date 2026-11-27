const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function getEphemeralSecret() {
  if (process.env.REFREE_SECRET) return process.env.REFREE_SECRET;
  const secretPath = path.resolve(__dirname, '..', 'test-results', '.pw-secret');
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  throw new Error('Missing ephemeral Playwright Referee secret.');
}

test.describe('Milestone M2 Two-Client VTT & Companion E2E', () => {
  test('Referee and Player run full T13 tabletop session with reload recovery and snapshot restore', async ({ browser }) => {
    test.setTimeout(90000);
    const secret = getEphemeralSecret();
    const roomId = `m2-room-${Date.now().toString(36)}`;

    const refCtx = await browser.newContext();
    const playerCtx = await browser.newContext();
    const refPage = await refCtx.newPage();
    const playerPage = await playerCtx.newPage();

    try {
      await Promise.all([refPage.goto('/'), playerPage.goto('/')]);

      // 1. Referee elevates using PBKDF2/HMAC challenge-response -> ES256 JWT
      await refPage.locator('#authSecretInput').fill(secret);
      await refPage.locator('#btnElevateAuth').click();
      await expect(refPage.locator('#authStatusText')).toContainText('Authorized (Referee Elevated)', { timeout: 10000 });

      // Both clients join the shared authoritative room
      await refPage.locator('#roomIdInput').fill(roomId);
      await refPage.locator('#btnHostRoom').click();
      await expect(refPage.locator('#connectionStatus')).toContainText(roomId, { timeout: 10000 });

      await playerPage.locator('#roomIdInput').fill(roomId);
      await playerPage.locator('#btnJoinRoom').click();
      await expect(playerPage.locator('#connectionStatus')).toContainText(roomId, { timeout: 10000 });

      // Ensure both are on websocket transport
      const refTransport = await refPage.evaluate(() => window.__T13_COMPANION__.bridge.transportMode);
      const playerTransport = await playerPage.evaluate(() => window.__T13_COMPANION__.bridge.transportMode);
      expect(refTransport).toBe('websocket');
      expect(playerTransport).toBe('websocket');

      const playerActorId = await playerPage.evaluate(() => window.__T13_COMPANION__.bridge.actorId);

      // 2. Referee saves private secret note and spawns hidden token via UI / session commands
      await refPage.locator('a[data-panel="referee"]').click();
      const refConsole = refPage.locator('#refereeConsole');
      await refConsole.locator('button[data-ref-action="save-secret"]').click();

      await refPage.evaluate(() => {
        window.__T13_COMPANION__.getClient().sendCommand('VTT:SpawnToken', {
          id: 'hidden-ambush-token',
          name: 'Hidden Void Stalker',
          tokenType: 'creature',
          hidden: true,
          position: { x: 6, y: 0, z: 6 }
        });
      });

      // Verify Referee sees secret + hidden token, while Player NEVER sees either
      await expect.poll(async () => {
        return refPage.evaluate(() => Boolean(
          window.__T13_COMPANION__.getClient().projection?.refereeSecrets?.notes?.plot_hook &&
          window.__T13_COMPANION__.getClient().projection?.table?.tokens?.['hidden-ambush-token']
        ));
      }).toBe(true);

      const playerLeakCheck = await playerPage.evaluate(() => {
        const proj = window.__T13_COMPANION__.getClient().projection;
        return {
          hasSecrets: proj?.refereeSecrets !== undefined,
          hasHiddenToken: Boolean(proj?.table?.tokens?.['hidden-ambush-token'])
        };
      });
      expect(playerLeakCheck).toEqual({ hasSecrets: false, hasHiddenToken: false });

      // 3. Player creates Character + Insectoid Species Descendant, spawns token, moves token, rolls Test
      await playerPage.locator('a[data-panel="character"]').click();
      await playerPage.locator('#btnShowCreator').click();
      await playerPage.locator('#inputCharName').fill('Krix Chitin');
      await playerPage.locator('#selectCreationModel').selectOption('Detailed');
      await playerPage.locator('#selectSpeciesDescendant').selectOption('Insectoid');
      await playerPage.locator('#btnGenerateCatalyst').click();

      const charSheet = playerPage.locator('t13-character-sheet');
      await expect(charSheet).toBeVisible();
      await charSheet.locator('button[data-action="spawn-character-token"]').click();

      const charId = await playerPage.evaluate(() => window.__T13_COMPANION__.getActiveCharacterId());
      const expectedTokenId = `token-${charId}`;

      await expect.poll(async () => {
        return refPage.evaluate((tid) => Boolean(window.__T13_COMPANION__.getClient().projection?.table?.tokens?.[tid]), expectedTokenId);
      }).toBe(true);

      // Player moves their token and performs a T13 Dice Test
      await playerPage.evaluate((tid) => {
        window.__T13_COMPANION__.getClient().sendCommand('VTT:MoveToken', {
          tokenId: tid,
          position: { x: 3, y: 0, z: -2 }
        });
      }, expectedTokenId);

      await expect.poll(async () => {
        return refPage.evaluate((tid) => window.__T13_COMPANION__.getClient().projection?.table?.tokens?.[tid]?.position?.x, expectedTokenId);
      }).toBe(3);

      await charSheet.locator('button[data-action="perform-test"]').click();
      await expect(charSheet.locator('[data-role="test-outcome"]')).toBeVisible({ timeout: 8000 });

      // 4. Referee initializes deck, deals private card to Player, starts Ordeal & draws stage
      await refPage.evaluate((pActorId) => {
        const client = window.__T13_COMPANION__.getClient();
        client.sendCommand('Deck:Initialize', { deckCount: 1 });
        client.sendCommand('Card:Draw', { targetActorId: pActorId, count: 1, cardContext: 'Ordeal' });
        client.sendCommand('Ordeal:Start', { stakes: 'Medium', participants: [pActorId] });
        client.sendCommand('Ordeal:DrawStage', { cardCount: 2 });
      }, playerActorId);

      await playerPage.locator('a[data-panel="vtt"]').click();
      const playerHud = playerPage.locator('#cardOrdealHud');
      await expect(playerHud.locator('[data-role="private-hand"] t13-yarn-card')).toHaveCount(1, { timeout: 8000 });
      await expect(playerHud.locator('[data-panel="active-ordeal"]')).toContainText('Medium', { timeout: 8000 });

      // Player plays a card from their Ordeal pool using Full Action
      const poolChip = playerHud.locator('[data-panel="active-ordeal"] button[data-pool-kind="ordeal"]').first();
      await poolChip.click();
      await playerHud.locator('button[data-ordeal-action="full"]').click();

      await expect.poll(async () => {
        return playerPage.evaluate(() => {
          const st = window.__T13_COMPANION__.getClient().projection?.table?.activeOrdeal?.stages?.[0];
          return st ? st.progress : 0;
        });
      }).toBeGreaterThan(0);

      // 5. Synthetic avatar puppet frame sync from Player -> Referee
      await refPage.evaluate(() => {
        window.__LAST_PUPPET_EVENT = null;
        window.__T13_COMPANION__.getClient().on('puppet', (evt) => {
          window.__LAST_PUPPET_EVENT = evt;
        });
      });
      await playerPage.evaluate(() => {
        window.__T13_COMPANION__.getClient().sendPuppetFrame({ jawOpen: 0.72, viseme_aa: 0.85, headPitch: 0.12 });
      });
      await expect.poll(async () => {
        return refPage.evaluate(() => window.__LAST_PUPPET_EVENT?.frame?.jawOpen ?? 0);
      }).toBeCloseTo(0.72, 2);

      // 6. Player reloads page and recovers session state
      await playerPage.reload();
      await expect(playerPage.locator('#connectionStatus')).toContainText(roomId, { timeout: 10000 });
      await expect.poll(async () => {
        return playerPage.evaluate((tid) => {
          const p = window.__T13_COMPANION__.getClient().projection;
          return {
            hasToken: Boolean(p?.table?.tokens?.[tid]),
            handLen: p?.privateHand?.length ?? 0,
            hasSecrets: p?.refereeSecrets !== undefined
          };
        }, expectedTokenId);
      }).toEqual({ hasToken: true, handLen: 1, hasSecrets: false });

      // 7. Referee captures snapshot, mutates secret note, and restores snapshot across clients
      const restored = await refPage.evaluate(async () => {
        const b = window.__T13_COMPANION__.bridge;
        const snap = await b.fetchSnapshot();
        b.client.sendCommand('Referee:SetSecretNote', { key: 'temp_ephemeral', note: 'should_disappear' });
        await new Promise(r => setTimeout(r, 250));
        await b.restoreSnapshot(snap);
        await new Promise(r => setTimeout(r, 250));
        return b.client.projection?.refereeSecrets?.notes;
      });
      expect(restored?.plot_hook).toBeTruthy();
      expect(restored?.temp_ephemeral).toBeUndefined();
    } finally {
      await refCtx.close().catch(() => {});
      await playerCtx.close().catch(() => {});
    }
  });
});
