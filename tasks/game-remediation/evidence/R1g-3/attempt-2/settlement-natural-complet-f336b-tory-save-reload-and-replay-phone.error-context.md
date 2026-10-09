# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settlement.spec.ts >> natural complete first-stage victory, save reload and replay
- Location: tests\settlement.spec.ts:215:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "黄巾巨将已击败"
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
          - generic [ref=f2e26]: 金币 6123
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
  107 |         // viewports that produced 629-1441 Boss DPS - a 2.3x spread, wider than
  108 |         // the 60-90s window it is supposed to validate - so the outcome was a
  109 |         // coin flip on the shuffle, not a measurement of the stage. A player
  110 |         // picks synergies; the defeat paths keep the blind pick on purpose.
  111 |         const index = win || insetContact ? offered.map((label, index) => ({ index, rank: rank(label) })).sort((a, b) => a.rank - b.rank)[0]!.index : 0;
  112 |         choices.push({ time, offered, picked: offered[index]! });
  113 |         await options.nth(index).click(); continue;
  114 |       }
  115 |       if (await chest.isVisible()) { await chest.locator('.level-option').first().click(); continue; }
  116 |       if (await loot.isVisible()) { lootSeen = true; await loot.getByRole('button').first().click(); continue; }
  117 |       const reward = page.getByRole('button', { name: /宝箱 领取$/ }).first();
  118 |       if (win && await reward.isVisible() && await reward.isEnabled()) { await reward.click({ timeout: 1500 }); continue; }
  119 |       const bossPresent = await page.getByLabel('首领状态').isVisible();
  120 |       let direction = win ? { x: [1, 0, -1, 0][step % 4]!, y: [0, 1, 0, -1][step % 4]! } : outcome === 'timeout' ? { x: 0, y: 0 } : { x: -1, y: -1 };
  121 |       let duration = 1000;
  122 |       if (insetContact && !bossPresent) {
  123 |         const [minutes, seconds] = time!.split(':').map(Number), elapsed = minutes! * 60 + seconds!;
  124 |         direction = elapsed < 12 ? { x: -1, y: -1 } : elapsed < 14 ? { x: 1, y: 1 } : { x: 0, y: 0 };
  125 |       }
  126 |       if ((win || contactBoss) && bossPresent) {
  127 |         const actors = await visibleActors(page);
  128 |         duration = 180;
  129 |         if (actors.hero && actors.boss) {
  130 |           const dx = actors.boss.x - actors.hero.x, dy = actors.boss.y - actors.hero.y, distance = Math.hypot(dx, dy);
  131 |           const stopDistance = contactBoss ? 15 : 65;
  132 |           direction = distance < stopDistance ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance };
  133 |           if (distance >= stopDistance) lastDirection = direction;
  134 |           trackedFrames++; missingBoss = 0;
  135 |         } else {
  136 |           // A charge can leave the viewport on the opposite side of the hero.
  137 |           missingBoss++;
  138 |           direction = { x: -lastDirection.x, y: -lastDirection.y };
  139 |           if (missingBoss > 8) direction = lastDirection;
  140 |           duration = 300;
  141 |         }
  142 |         if (trackedFrames === 1) await page.screenshot({ path: info.outputPath('natural-boss-tracked.png') });
  143 |       }
  144 |       if (touch) {
  145 |         const box = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 500 }).catch(() => null); if (!box) continue;
  146 |         const origin = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
  147 |         const moved = { ...origin, x: origin.x + direction.x * 35, y: origin.y + direction.y * 35 };
  148 |         await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
  149 |         await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
  150 |         for (const name of win ? ['炎龙斩', '赤龙降世', '地图互动'] : []) {
  151 |           const button = page.getByRole('button', { name, exact: true });
  152 |           if (!await button.isEnabled({ timeout: 200 }).catch(() => false)) continue;
  153 |           const action = await button.boundingBox({ timeout: 500 }).catch(() => null); if (!action) continue;
  154 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
  155 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [moved] });
  156 |         }
  157 |         await page.waitForTimeout(duration); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  158 |       } else {
  159 |         const keys = [direction.x > .25 ? 'd' : direction.x < -.25 ? 'a' : '', direction.y > .25 ? 's' : direction.y < -.25 ? 'w' : ''].filter(Boolean);
  160 |         for (const key of keys) await page.keyboard.down(key);
  161 |         if (win) { await page.keyboard.press('e'); await page.keyboard.press('r'); await page.keyboard.press('f'); }
  162 |         await page.waitForTimeout(duration); for (const key of keys) await page.keyboard.up(key);
  163 |       }
  164 |       timeline.push({ seconds: (Date.now() - started) / 1000, time, hp, boss: await page.getByLabel('首领生命').getAttribute('value', { timeout: 100 }).catch(() => null), direction });
  165 |     }
  166 |     const title = win ? '黄巾巨将已击败' : outcome === 'timeout' ? '首战时限已到' : '本局生命耗尽';
  167 |     await expect(result).toBeVisible();
  168 |     const actualTitle = await result.getByRole('heading', { level: 2 }).textContent();
  169 |     await expect(result.getByText('战果已保存', { exact: true })).toBeVisible();
  170 |     const stars = await result.getByLabel('本局星级').textContent();
  171 |     const actualWin = actualTitle === '黄巾巨将已击败';
  172 |     if (actualWin) expect(lootSeen).toBe(true);
  173 |     expect(stars).toMatch(actualWin ? /★{2,3}/ : /^☆☆☆$/);
  174 |     const gold = Number((await result.locator('.reward-grid dd').first().textContent())!.replace('+', ''));
  175 |     observed = { title: actualTitle, stars, gold, seconds: (Date.now() - started) / 1000, text: await result.textContent(), persistenceVerified: false };
  176 |     const box = await result.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0);
  177 |     expect(box!.x + box!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  178 |     expect(await result.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  179 |     await page.screenshot({ path: info.outputPath(`${imported ? 'imported-low-growth' : 'natural'}-${outcome}-result.png`) });
  180 |     await result.getByRole('button', { name: '再次挑战本关' }).click();
  181 |     await expect(result).toBeHidden(); await expect(page.locator('canvas')).toHaveCount(1);
  182 |     await expect(page.getByLabel('本局时间')).toHaveText(/00:0\d/);
  183 |     await page.getByRole('button', { name: '暂停', exact: true }).click();
  184 |     await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  185 |     await page.reload(); await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled();
  186 |     const save = await exportSave(page);
  187 |     expect(save.gold).toBe(baseline.gold - eventCost + gold);
  188 |     expect(save.stats.runs).toBe(baseline.stats.runs + 1);
  189 |     expect(save.modeStats.story!.runs).toBe(baseline.modeStats.story!.runs + 1);
  190 |     expect(save.chapters.ST001!.stars['ST001-01']).toBe((stars!.match(/★/g) || []).length);
  191 |     expect(save.accountXp + save.accountLv * 10000).toBeGreaterThan(baseline.accountXp + baseline.accountLv * 10000);
  192 |     if (actualWin) expect(save.inventory.gearInstances.filter(drop => drop.source === 'boss').length).toBeGreaterThanOrEqual(2);
  193 |     await page.reload(); expect(await exportSave(page)).toEqual(save);
  194 |     await writeFile(info.outputPath('saved-result.json'), JSON.stringify(save, null, 2));
  195 |     observed = { ...observed as object, persistenceVerified: true, replayVerified: true, completedSeconds: (Date.now() - started) / 1000 };
  196 |     if (imported) {
  197 |       await page.getByRole('button', { name: '存档', exact: true }).click();
  198 |       const original = page.waitForEvent('download');
  199 |       await page.getByRole('button', { name: '导出导入原件' }).click();
  200 |       expect(JSON.parse(await readFile((await (await original).path())!, 'utf8'))).toEqual(imported);
  201 |       await page.getByRole('button', { name: '使用 新征途 1', exact: true }).click();
  202 |       await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  203 |       expect(await exportSave(page)).toEqual(fresh);
  204 |     }
  205 |     expect(errors).toEqual([]);
  206 |     // Preserve the requested outcome gate, after collecting the actual saved result.
> 207 |     expect(actualTitle).toBe(title);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  208 |     expect(stars).toMatch(win ? /★{2,3}/ : /^☆☆☆$/);
  209 |   } finally {
  210 |     const path = info.outputPath('natural-settlement-input.json');
  211 |     await writeFile(path, JSON.stringify({ profile, outcome, strategy: insetContact ? 'inset-boss-contact' : contactBoss ? 'boss-contact' : win ? 'victory-chase' : outcome === 'timeout' ? 'stationary' : 'corner', observed, sampledMinHp, choices, timeline, errors, lootSeen, eventCost, trackedFrames }, null, 2));
  212 |     await info.attach('natural-settlement-input', { path, contentType: 'application/json' });
  213 |   }
  214 | }
  215 | test('natural complete first-stage victory, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'victory'); });
  216 | test('natural corner-contact defeat, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'defeat'); });
  217 | test('natural first-stage timeout, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'timeout'); });
  218 | 
  219 | test('supplemental imported low-growth save: natural-input HP defeat, reload and replay', async ({ page }, info) => {
  220 |   test.setTimeout(680_000);
  221 |   const imported: GameSave = structuredClone(fresh);
  222 |   imported.heroes.H001!.level = 1; imported.heroes.H001!.mastery = 0;
  223 |   imported.equipInst = {}; imported.runes = []; imported.build = { active: [], passive: [] };
  224 |   await finishNaturally(page, info, 'defeat', imported);
  225 | });
  226 | 
```