# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settlement.spec.ts >> natural first-stage timeout, zero stars, save reload and replay
- Location: tests\settlement.spec.ts:245:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "首战时限已到"
Received: "本局生命耗尽"
```

# Page snapshot

```yaml
- main [ref=f2e3]:
  - generic [ref=f2e4]:
    - generic [ref=f2e5]: 万
    - generic [ref=f2e6]:
      - strong [ref=f2e7]: 万界无双
      - generic [ref=f2e8]: 乱世之中，自成无双
    - button "设置" [ref=f2e9] [cursor=pointer]
  - generic [ref=f2e10]:
    - generic [ref=f2e11]:
      - generic [ref=f2e12]: 第一章 / 乱世荒原
      - img "赤焰战神" [ref=f2e13]
      - generic [ref=f2e14]:
        - generic [ref=f2e15]: 近战 · 炎刃
        - heading "赤焰战神" [level=1] [ref=f2e16]
        - paragraph [ref=f2e17]: 贴近敌群，以斩击和炎龙突进破阵。
    - generic [ref=f2e18]:
      - text: 下一站 · ST001-01
      - heading "边境清剿" [level=2] [ref=f2e19]
      - paragraph [ref=f2e20]: 在 06:00 前击败黄巾巨将并领取战利品。
      - generic "征途选择" [ref=f2e21]:
        - button "经典征途" [pressed] [ref=f2e22] [cursor=pointer]
        - button "进化征途" [ref=f2e23] [cursor=pointer]
      - generic [ref=f2e24]:
        - paragraph [ref=f2e25]:
          - text: 新征途 1
          - generic [ref=f2e26]: 金币 6087
        - button "存档" [ref=f2e27] [cursor=pointer]
      - generic [ref=f2e28]:
        - generic [ref=f2e29]: Lv.6
        - generic [ref=f2e30]: 赤焰战神
        - generic [ref=f2e31]: 火灵同行
      - generic "出征属性" [ref=f2e32]:
        - generic [ref=f2e33]:
          - term [ref=f2e34]: 生命
          - definition [ref=f2e35]: "785"
        - generic [ref=f2e36]:
          - term [ref=f2e37]: 攻击
          - definition [ref=f2e38]: "180"
        - generic [ref=f2e39]:
          - term [ref=f2e40]: 暴击
          - definition [ref=f2e41]: 11.2%
      - button "进入战场预览" [active] [ref=f2e42] [cursor=pointer]:
        - text: 进入战场预览
        - generic [aria-hidden] [ref=f2e43]: →
      - paragraph [ref=f2e44]: 可完整挑战首关，结算后保存装备与成长奖励。其余内容正在迁移。
  - generic [ref=f2e45]:
    - text: 万界无双
    - generic [ref=f2e46]: 移动版 · 开发预览
```

# Test source

```ts
  135 |           trackedFrames++; missingBoss = 0;
  136 |         } else {
  137 |           // R1g-4 step 1b: the Boss really does leave the viewport, so this branch is the
  138 |           // right *detection*. Its charge is a 776px dash (`FirstBoss` L100) launched from
  139 |           // ~65px away, and every tested viewport's half-diagonal is smaller - 734px on
  140 |           // desktop, 452px on narrow - so the Boss is off-screen after most charges. A
  141 |           // diagnostic run lost 72 of 202 boss-phase steps (36%) this way with
  142 |           // `heroMiss = 0`: the colour constants are not at fault (a sprite-fidelity check
  143 |           // locates the Boss at 608px against a threshold of 6, centroid error <=2.7px).
  144 |           // Reversing is a deliberate *commitment* - it holds one bearing for 8 steps, and
  145 |           // travel time is what closes a 776px gap. Replacing it with a per-step bearing
  146 |           // sweep was measured and is worse (118 vs 130 tracked frames, 1,010 vs 1,191
  147 |           // Boss DPS, 73% vs 93% cleared), because a sweep changes bearing every step and
  148 |           // orbits in place. Do not re-tune this without a direction cue to aim at; the
  149 |           // real fix is a game-side off-screen indicator, which the HUD does not have.
  150 |           missingBoss++;
  151 |           direction = { x: -lastDirection.x, y: -lastDirection.y };
  152 |           if (missingBoss > 8) direction = lastDirection;
  153 |           duration = 300;
  154 |         }
  155 |         if (trackedFrames === 1) await page.screenshot({ path: info.outputPath('natural-boss-tracked.png') });
  156 |       }
  157 |       if (touch) {
  158 |         const box = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 500 }).catch(() => null); if (!box) continue;
  159 |         const origin = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
  160 |         const moved = { ...origin, x: origin.x + direction.x * 35, y: origin.y + direction.y * 35 };
  161 |         // The stick used to be released at the end of every step (`touchEnd` with an
  162 |         // empty list), so the bot stood still through its own bookkeeping. Hold it and
  163 |         // only re-send the move when the direction actually changes.
  164 |         if (!touchHeld) { await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] }); touchHeld = true; lastMoved = null; }
  165 |         if (!lastMoved || lastMoved.x !== moved.x || lastMoved.y !== moved.y) {
  166 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
  167 |           lastMoved = { ...moved };
  168 |         }
  169 |         for (const name of win ? ['炎龙斩', '赤龙降世', '地图互动'] : []) {
  170 |           const button = page.getByRole('button', { name, exact: true });
  171 |           if (!await button.isEnabled({ timeout: 200 }).catch(() => false)) continue;
  172 |           const action = await button.boundingBox({ timeout: 500 }).catch(() => null); if (!action) continue;
  173 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
  174 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [moved] });
  175 |           // That `touchEnd` drops the stick as well, so put it straight back.
  176 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved] });
  177 |         }
  178 |         await page.waitForTimeout(duration);
  179 |       } else {
  180 |         const keys = [direction.x > .25 ? 'd' : direction.x < -.25 ? 'a' : '', direction.y > .25 ? 's' : direction.y < -.25 ? 'w' : ''].filter(Boolean);
  181 |         if (keys.join() !== heldKeys.join()) {
  182 |           for (const key of heldKeys) await page.keyboard.up(key);
  183 |           for (const key of keys) await page.keyboard.down(key);
  184 |           heldKeys = keys;
  185 |         }
  186 |         if (win) { await page.keyboard.press('e'); await page.keyboard.press('r'); await page.keyboard.press('f'); }
  187 |         await page.waitForTimeout(duration);
  188 |       }
  189 |       timeline.push({ seconds: (Date.now() - started) / 1000, time, hp, boss: await page.getByLabel('首领生命').getAttribute('value', { timeout: 100 }).catch(() => null), direction });
  190 |     }
  191 |     // The loop exits with input still held; release it before touching the result UI.
  192 |     for (const key of heldKeys) await page.keyboard.up(key); heldKeys = [];
  193 |     if (touch && touchHeld) { await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); touchHeld = false; }
  194 |     const title = win ? '黄巾巨将已击败' : outcome === 'timeout' ? '首战时限已到' : '本局生命耗尽';
  195 |     await expect(result).toBeVisible();
  196 |     const actualTitle = await result.getByRole('heading', { level: 2 }).textContent();
  197 |     await expect(result.getByText('战果已保存', { exact: true })).toBeVisible();
  198 |     const stars = await result.getByLabel('本局星级').textContent();
  199 |     const actualWin = actualTitle === '黄巾巨将已击败';
  200 |     if (actualWin) expect(lootSeen).toBe(true);
  201 |     expect(stars).toMatch(actualWin ? /★{2,3}/ : /^☆☆☆$/);
  202 |     const gold = Number((await result.locator('.reward-grid dd').first().textContent())!.replace('+', ''));
  203 |     observed = { title: actualTitle, stars, gold, seconds: (Date.now() - started) / 1000, text: await result.textContent(), persistenceVerified: false };
  204 |     const box = await result.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0);
  205 |     expect(box!.x + box!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  206 |     expect(await result.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  207 |     await page.screenshot({ path: info.outputPath(`${imported ? 'imported-low-growth' : 'natural'}-${outcome}-result.png`) });
  208 |     await result.getByRole('button', { name: '再次挑战本关' }).click();
  209 |     await expect(result).toBeHidden(); await expect(page.locator('canvas')).toHaveCount(1);
  210 |     await expect(page.getByLabel('本局时间')).toHaveText(/00:0\d/);
  211 |     await page.getByRole('button', { name: '暂停', exact: true }).click();
  212 |     await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  213 |     await page.reload(); await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled();
  214 |     const save = await exportSave(page);
  215 |     expect(save.gold).toBe(baseline.gold - eventCost + gold);
  216 |     expect(save.stats.runs).toBe(baseline.stats.runs + 1);
  217 |     expect(save.modeStats.story!.runs).toBe(baseline.modeStats.story!.runs + 1);
  218 |     expect(save.chapters.ST001!.stars['ST001-01']).toBe((stars!.match(/★/g) || []).length);
  219 |     expect(save.accountXp + save.accountLv * 10000).toBeGreaterThan(baseline.accountXp + baseline.accountLv * 10000);
  220 |     if (actualWin) expect(save.inventory.gearInstances.filter(drop => drop.source === 'boss').length).toBeGreaterThanOrEqual(2);
  221 |     await page.reload(); expect(await exportSave(page)).toEqual(save);
  222 |     await writeFile(info.outputPath('saved-result.json'), JSON.stringify(save, null, 2));
  223 |     observed = { ...observed as object, persistenceVerified: true, replayVerified: true, completedSeconds: (Date.now() - started) / 1000 };
  224 |     if (imported) {
  225 |       await page.getByRole('button', { name: '存档', exact: true }).click();
  226 |       const original = page.waitForEvent('download');
  227 |       await page.getByRole('button', { name: '导出导入原件' }).click();
  228 |       expect(JSON.parse(await readFile((await (await original).path())!, 'utf8'))).toEqual(imported);
  229 |       await page.getByRole('button', { name: '使用 新征途 1', exact: true }).click();
  230 |       await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  231 |       expect(await exportSave(page)).toEqual(fresh);
  232 |     }
  233 |     expect(errors).toEqual([]);
  234 |     // Preserve the requested outcome gate, after collecting the actual saved result.
> 235 |     expect(actualTitle).toBe(title);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  236 |     expect(stars).toMatch(win ? /★{2,3}/ : /^☆☆☆$/);
  237 |   } finally {
  238 |     const path = info.outputPath('natural-settlement-input.json');
  239 |     await writeFile(path, JSON.stringify({ profile, outcome, strategy: insetContact ? 'inset-boss-contact' : contactBoss ? 'boss-contact' : win ? 'victory-chase' : outcome === 'timeout' ? 'stationary' : 'corner', observed, sampledMinHp, choices, timeline, errors, lootSeen, eventCost, trackedFrames }, null, 2));
  240 |     await info.attach('natural-settlement-input', { path, contentType: 'application/json' });
  241 |   }
  242 | }
  243 | test('natural complete first-stage victory, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'victory'); });
  244 | test('natural corner-contact defeat, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'defeat'); });
  245 | test('natural first-stage timeout, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'timeout'); });
  246 | 
  247 | test('supplemental imported low-growth save: natural-input HP defeat, reload and replay', async ({ page }, info) => {
  248 |   test.setTimeout(680_000);
  249 |   const imported: GameSave = structuredClone(fresh);
  250 |   imported.heroes.H001!.level = 1; imported.heroes.H001!.mastery = 0;
  251 |   imported.equipInst = {}; imported.runes = []; imported.build = { active: [], passive: [] };
  252 |   await finishNaturally(page, info, 'defeat', imported);
  253 | });
  254 | 
```