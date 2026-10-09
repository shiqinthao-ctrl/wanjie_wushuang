# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settlement.spec.ts >> natural first-stage timeout, zero stars, save reload and replay
- Location: tests\settlement.spec.ts:211:1

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
          - generic [ref=f2e26]: 金币 6086
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
  101 |       if (await level.isVisible()) {
  102 |         const options = level.locator('.level-option'), offered = await options.allTextContents();
  103 |         const priorities = ['风神祝福', '持续强化', '范围强化', '冷却缩减', '火神祝福', '技能倍率', '火焰冲刺', '陨石雨', '龙卷风', '烈焰刀', '火球术', '火焰领域'];
  104 |         const rank = (label: string) => { const index = priorities.findIndex(name => label.includes(name)); return index < 0 ? priorities.length : index; };
  105 |         const index = insetContact ? offered.map((label, index) => ({ index, rank: rank(label) })).sort((a, b) => a.rank - b.rank)[0]!.index : 0;
  106 |         choices.push({ time, offered, picked: offered[index]! });
  107 |         await options.nth(index).click(); continue;
  108 |       }
  109 |       if (await chest.isVisible()) { await chest.locator('.level-option').first().click(); continue; }
  110 |       if (await loot.isVisible()) { lootSeen = true; await loot.getByRole('button').first().click(); continue; }
  111 |       const reward = page.getByRole('button', { name: /宝箱 领取$/ }).first();
  112 |       if (win && await reward.isVisible() && await reward.isEnabled()) { await reward.click({ timeout: 1500 }); continue; }
  113 |       const bossPresent = await page.getByLabel('首领状态').isVisible();
  114 |       let direction = win ? { x: [1, 0, -1, 0][step % 4]!, y: [0, 1, 0, -1][step % 4]! } : outcome === 'timeout' ? { x: 0, y: 0 } : { x: -1, y: -1 };
  115 |       let duration = 1000;
  116 |       if (insetContact && !bossPresent) {
  117 |         const [minutes, seconds] = time!.split(':').map(Number), elapsed = minutes! * 60 + seconds!;
  118 |         direction = elapsed < 12 ? { x: -1, y: -1 } : elapsed < 14 ? { x: 1, y: 1 } : { x: 0, y: 0 };
  119 |       }
  120 |       if ((win || contactBoss) && bossPresent) {
  121 |         const actors = await visibleActors(page);
  122 |         duration = 180;
  123 |         if (actors.hero && actors.boss) {
  124 |           const dx = actors.boss.x - actors.hero.x, dy = actors.boss.y - actors.hero.y, distance = Math.hypot(dx, dy);
  125 |           const stopDistance = contactBoss ? 15 : 65;
  126 |           direction = distance < stopDistance ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance };
  127 |           if (distance >= stopDistance) lastDirection = direction;
  128 |           trackedFrames++; missingBoss = 0;
  129 |         } else {
  130 |           // A charge can leave the viewport on the opposite side of the hero.
  131 |           missingBoss++;
  132 |           direction = { x: -lastDirection.x, y: -lastDirection.y };
  133 |           if (missingBoss > 8) direction = lastDirection;
  134 |           duration = 300;
  135 |         }
  136 |         if (trackedFrames === 1) await page.screenshot({ path: info.outputPath('natural-boss-tracked.png') });
  137 |       }
  138 |       if (touch) {
  139 |         const box = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 500 }).catch(() => null); if (!box) continue;
  140 |         const origin = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
  141 |         const moved = { ...origin, x: origin.x + direction.x * 35, y: origin.y + direction.y * 35 };
  142 |         await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
  143 |         await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
  144 |         for (const name of win ? ['炎龙斩', '赤龙降世', '地图互动'] : []) {
  145 |           const button = page.getByRole('button', { name, exact: true });
  146 |           if (!await button.isEnabled({ timeout: 200 }).catch(() => false)) continue;
  147 |           const action = await button.boundingBox({ timeout: 500 }).catch(() => null); if (!action) continue;
  148 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
  149 |           await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [moved] });
  150 |         }
  151 |         await page.waitForTimeout(duration); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  152 |       } else {
  153 |         const keys = [direction.x > .25 ? 'd' : direction.x < -.25 ? 'a' : '', direction.y > .25 ? 's' : direction.y < -.25 ? 'w' : ''].filter(Boolean);
  154 |         for (const key of keys) await page.keyboard.down(key);
  155 |         if (win) { await page.keyboard.press('e'); await page.keyboard.press('r'); await page.keyboard.press('f'); }
  156 |         await page.waitForTimeout(duration); for (const key of keys) await page.keyboard.up(key);
  157 |       }
  158 |       timeline.push({ seconds: (Date.now() - started) / 1000, time, hp, boss: await page.getByLabel('首领生命').getAttribute('value', { timeout: 100 }).catch(() => null), direction });
  159 |     }
  160 |     const title = win ? '黄巾巨将已击败' : outcome === 'timeout' ? '首战时限已到' : '本局生命耗尽';
  161 |     await expect(result).toBeVisible();
  162 |     const actualTitle = await result.getByRole('heading', { level: 2 }).textContent();
  163 |     await expect(result.getByText('战果已保存', { exact: true })).toBeVisible();
  164 |     const stars = await result.getByLabel('本局星级').textContent();
  165 |     const actualWin = actualTitle === '黄巾巨将已击败';
  166 |     if (actualWin) expect(lootSeen).toBe(true);
  167 |     expect(stars).toMatch(actualWin ? /★{2,3}/ : /^☆☆☆$/);
  168 |     const gold = Number((await result.locator('.reward-grid dd').first().textContent())!.replace('+', ''));
  169 |     observed = { title: actualTitle, stars, gold, seconds: (Date.now() - started) / 1000, text: await result.textContent(), persistenceVerified: false };
  170 |     const box = await result.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0);
  171 |     expect(box!.x + box!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  172 |     expect(await result.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  173 |     await page.screenshot({ path: info.outputPath(`${imported ? 'imported-low-growth' : 'natural'}-${outcome}-result.png`) });
  174 |     await result.getByRole('button', { name: '再次挑战本关' }).click();
  175 |     await expect(result).toBeHidden(); await expect(page.locator('canvas')).toHaveCount(1);
  176 |     await expect(page.getByLabel('本局时间')).toHaveText(/00:0\d/);
  177 |     await page.getByRole('button', { name: '暂停', exact: true }).click();
  178 |     await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  179 |     await page.reload(); await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled();
  180 |     const save = await exportSave(page);
  181 |     expect(save.gold).toBe(baseline.gold - eventCost + gold);
  182 |     expect(save.stats.runs).toBe(baseline.stats.runs + 1);
  183 |     expect(save.modeStats.story!.runs).toBe(baseline.modeStats.story!.runs + 1);
  184 |     expect(save.chapters.ST001!.stars['ST001-01']).toBe((stars!.match(/★/g) || []).length);
  185 |     expect(save.accountXp + save.accountLv * 10000).toBeGreaterThan(baseline.accountXp + baseline.accountLv * 10000);
  186 |     if (actualWin) expect(save.inventory.gearInstances.filter(drop => drop.source === 'boss').length).toBeGreaterThanOrEqual(2);
  187 |     await page.reload(); expect(await exportSave(page)).toEqual(save);
  188 |     await writeFile(info.outputPath('saved-result.json'), JSON.stringify(save, null, 2));
  189 |     observed = { ...observed as object, persistenceVerified: true, replayVerified: true, completedSeconds: (Date.now() - started) / 1000 };
  190 |     if (imported) {
  191 |       await page.getByRole('button', { name: '存档', exact: true }).click();
  192 |       const original = page.waitForEvent('download');
  193 |       await page.getByRole('button', { name: '导出导入原件' }).click();
  194 |       expect(JSON.parse(await readFile((await (await original).path())!, 'utf8'))).toEqual(imported);
  195 |       await page.getByRole('button', { name: '使用 新征途 1', exact: true }).click();
  196 |       await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  197 |       expect(await exportSave(page)).toEqual(fresh);
  198 |     }
  199 |     expect(errors).toEqual([]);
  200 |     // Preserve the requested outcome gate, after collecting the actual saved result.
> 201 |     expect(actualTitle).toBe(title);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  202 |     expect(stars).toMatch(win ? /★{2,3}/ : /^☆☆☆$/);
  203 |   } finally {
  204 |     const path = info.outputPath('natural-settlement-input.json');
  205 |     await writeFile(path, JSON.stringify({ profile, outcome, strategy: insetContact ? 'inset-boss-contact' : contactBoss ? 'boss-contact' : win ? 'victory-chase' : outcome === 'timeout' ? 'stationary' : 'corner', observed, sampledMinHp, choices, timeline, errors, lootSeen, eventCost, trackedFrames }, null, 2));
  206 |     await info.attach('natural-settlement-input', { path, contentType: 'application/json' });
  207 |   }
  208 | }
  209 | test('natural complete first-stage victory, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'victory'); });
  210 | test('natural corner-contact defeat, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'defeat'); });
  211 | test('natural first-stage timeout, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'timeout'); });
  212 | 
  213 | test('supplemental imported low-growth save: natural-input HP defeat, reload and replay', async ({ page }, info) => {
  214 |   test.setTimeout(680_000);
  215 |   const imported: GameSave = structuredClone(fresh);
  216 |   imported.heroes.H001!.level = 1; imported.heroes.H001!.mastery = 0;
  217 |   imported.equipInst = {}; imported.runes = []; imported.build = { active: [], passive: [] };
  218 |   await finishNaturally(page, info, 'defeat', imported);
  219 | });
  220 | 
```