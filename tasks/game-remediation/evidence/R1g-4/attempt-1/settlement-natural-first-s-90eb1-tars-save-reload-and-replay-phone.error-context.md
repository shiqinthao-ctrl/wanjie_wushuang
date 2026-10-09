# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settlement.spec.ts >> natural first-stage timeout, zero stars, save reload and replay
- Location: tests\settlement.spec.ts:233:1

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
          - generic [ref=f2e26]: 金币 6099
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
  123 |       if (insetContact && !bossPresent) {
  124 |         const [minutes, seconds] = time!.split(':').map(Number), elapsed = minutes! * 60 + seconds!;
  125 |         direction = elapsed < 12 ? { x: -1, y: -1 } : elapsed < 14 ? { x: 1, y: 1 } : { x: 0, y: 0 };
  126 |       }
  127 |       if ((win || contactBoss) && bossPresent) {
  128 |         const actors = await visibleActors(page);
  129 |         duration = 180;
  130 |         if (actors.hero && actors.boss) {
  131 |           const dx = actors.boss.x - actors.hero.x, dy = actors.boss.y - actors.hero.y, distance = Math.hypot(dx, dy);
  132 |           const stopDistance = contactBoss ? 15 : 65;
  133 |           direction = distance < stopDistance ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance };
  134 |           if (distance >= stopDistance) lastDirection = direction;
  135 |           trackedFrames++; missingBoss = 0;
  136 |         } else {
  137 |           // A charge can leave the viewport on the opposite side of the hero.
  138 |           missingBoss++;
  139 |           direction = { x: -lastDirection.x, y: -lastDirection.y };
  140 |           if (missingBoss > 8) direction = lastDirection;
  141 |           duration = 300;
  142 |         }
  143 |         if (trackedFrames === 1) await page.screenshot({ path: info.outputPath('natural-boss-tracked.png') });
  144 |       }
  145 |       if (touch) {
  146 |         const box = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 500 }).catch(() => null); if (!box) continue;
  147 |         const origin = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
  148 |         const moved = { ...origin, x: origin.x + direction.x * 35, y: origin.y + direction.y * 35 };
  149 |         // The stick used to be released at the end of every step (`touchEnd` with an
  150 |         // empty list), so the bot stood still through its own bookkeeping. Hold it and
  151 |         // only re-send the move when the direction actually changes.
  152 |         if (!touchHeld) { await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] }); touchHeld = true; lastMoved = null; }
  153 |         if (!lastMoved || lastMoved.x !== moved.x || lastMoved.y !== moved.y) {
  154 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
  155 |           lastMoved = { ...moved };
  156 |         }
  157 |         for (const name of win ? ['炎龙斩', '赤龙降世', '地图互动'] : []) {
  158 |           const button = page.getByRole('button', { name, exact: true });
  159 |           if (!await button.isEnabled({ timeout: 200 }).catch(() => false)) continue;
  160 |           const action = await button.boundingBox({ timeout: 500 }).catch(() => null); if (!action) continue;
  161 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
  162 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [moved] });
  163 |           // That `touchEnd` drops the stick as well, so put it straight back.
  164 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved] });
  165 |         }
  166 |         await page.waitForTimeout(duration);
  167 |       } else {
  168 |         const keys = [direction.x > .25 ? 'd' : direction.x < -.25 ? 'a' : '', direction.y > .25 ? 's' : direction.y < -.25 ? 'w' : ''].filter(Boolean);
  169 |         if (keys.join() !== heldKeys.join()) {
  170 |           for (const key of heldKeys) await page.keyboard.up(key);
  171 |           for (const key of keys) await page.keyboard.down(key);
  172 |           heldKeys = keys;
  173 |         }
  174 |         if (win) { await page.keyboard.press('e'); await page.keyboard.press('r'); await page.keyboard.press('f'); }
  175 |         await page.waitForTimeout(duration);
  176 |       }
  177 |       timeline.push({ seconds: (Date.now() - started) / 1000, time, hp, boss: await page.getByLabel('首领生命').getAttribute('value', { timeout: 100 }).catch(() => null), direction });
  178 |     }
  179 |     // The loop exits with input still held; release it before touching the result UI.
  180 |     for (const key of heldKeys) await page.keyboard.up(key); heldKeys = [];
  181 |     if (touch && touchHeld) { await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); touchHeld = false; }
  182 |     const title = win ? '黄巾巨将已击败' : outcome === 'timeout' ? '首战时限已到' : '本局生命耗尽';
  183 |     await expect(result).toBeVisible();
  184 |     const actualTitle = await result.getByRole('heading', { level: 2 }).textContent();
  185 |     await expect(result.getByText('战果已保存', { exact: true })).toBeVisible();
  186 |     const stars = await result.getByLabel('本局星级').textContent();
  187 |     const actualWin = actualTitle === '黄巾巨将已击败';
  188 |     if (actualWin) expect(lootSeen).toBe(true);
  189 |     expect(stars).toMatch(actualWin ? /★{2,3}/ : /^☆☆☆$/);
  190 |     const gold = Number((await result.locator('.reward-grid dd').first().textContent())!.replace('+', ''));
  191 |     observed = { title: actualTitle, stars, gold, seconds: (Date.now() - started) / 1000, text: await result.textContent(), persistenceVerified: false };
  192 |     const box = await result.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0);
  193 |     expect(box!.x + box!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  194 |     expect(await result.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  195 |     await page.screenshot({ path: info.outputPath(`${imported ? 'imported-low-growth' : 'natural'}-${outcome}-result.png`) });
  196 |     await result.getByRole('button', { name: '再次挑战本关' }).click();
  197 |     await expect(result).toBeHidden(); await expect(page.locator('canvas')).toHaveCount(1);
  198 |     await expect(page.getByLabel('本局时间')).toHaveText(/00:0\d/);
  199 |     await page.getByRole('button', { name: '暂停', exact: true }).click();
  200 |     await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  201 |     await page.reload(); await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled();
  202 |     const save = await exportSave(page);
  203 |     expect(save.gold).toBe(baseline.gold - eventCost + gold);
  204 |     expect(save.stats.runs).toBe(baseline.stats.runs + 1);
  205 |     expect(save.modeStats.story!.runs).toBe(baseline.modeStats.story!.runs + 1);
  206 |     expect(save.chapters.ST001!.stars['ST001-01']).toBe((stars!.match(/★/g) || []).length);
  207 |     expect(save.accountXp + save.accountLv * 10000).toBeGreaterThan(baseline.accountXp + baseline.accountLv * 10000);
  208 |     if (actualWin) expect(save.inventory.gearInstances.filter(drop => drop.source === 'boss').length).toBeGreaterThanOrEqual(2);
  209 |     await page.reload(); expect(await exportSave(page)).toEqual(save);
  210 |     await writeFile(info.outputPath('saved-result.json'), JSON.stringify(save, null, 2));
  211 |     observed = { ...observed as object, persistenceVerified: true, replayVerified: true, completedSeconds: (Date.now() - started) / 1000 };
  212 |     if (imported) {
  213 |       await page.getByRole('button', { name: '存档', exact: true }).click();
  214 |       const original = page.waitForEvent('download');
  215 |       await page.getByRole('button', { name: '导出导入原件' }).click();
  216 |       expect(JSON.parse(await readFile((await (await original).path())!, 'utf8'))).toEqual(imported);
  217 |       await page.getByRole('button', { name: '使用 新征途 1', exact: true }).click();
  218 |       await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  219 |       expect(await exportSave(page)).toEqual(fresh);
  220 |     }
  221 |     expect(errors).toEqual([]);
  222 |     // Preserve the requested outcome gate, after collecting the actual saved result.
> 223 |     expect(actualTitle).toBe(title);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  224 |     expect(stars).toMatch(win ? /★{2,3}/ : /^☆☆☆$/);
  225 |   } finally {
  226 |     const path = info.outputPath('natural-settlement-input.json');
  227 |     await writeFile(path, JSON.stringify({ profile, outcome, strategy: insetContact ? 'inset-boss-contact' : contactBoss ? 'boss-contact' : win ? 'victory-chase' : outcome === 'timeout' ? 'stationary' : 'corner', observed, sampledMinHp, choices, timeline, errors, lootSeen, eventCost, trackedFrames }, null, 2));
  228 |     await info.attach('natural-settlement-input', { path, contentType: 'application/json' });
  229 |   }
  230 | }
  231 | test('natural complete first-stage victory, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'victory'); });
  232 | test('natural corner-contact defeat, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'defeat'); });
  233 | test('natural first-stage timeout, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'timeout'); });
  234 | 
  235 | test('supplemental imported low-growth save: natural-input HP defeat, reload and replay', async ({ page }, info) => {
  236 |   test.setTimeout(680_000);
  237 |   const imported: GameSave = structuredClone(fresh);
  238 |   imported.heroes.H001!.level = 1; imported.heroes.H001!.mastery = 0;
  239 |   imported.equipInst = {}; imported.runes = []; imported.build = { active: [], passive: [] };
  240 |   await finishNaturally(page, info, 'defeat', imported);
  241 | });
  242 | 
```