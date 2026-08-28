import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const expectedReleases=[
'wanjie_wushuang_frontend_v0.1.html',
'wanjie_wushuang_frontend_v0.2_beautified.html',
'wanjie_wushuang_frontend_v0.3_game_ui.html',
'wanjie_wushuang_frontend_v0.4_high_fidelity.html',
'wanjie_wushuang_frontend_v0.5_playable_demo.html',
'wanjie_wushuang_frontend_v0.6_build_system.html',
'wanjie_wushuang_frontend_v0.7_full_loop.html',
'wanjie_wushuang_frontend_v0.8_full_map.html',
'wanjie_wushuang_frontend_v0.9_enemy_boss_mechanics.html',
'wanjie_wushuang_frontend_v1.0_first_map_complete.html',
'wanjie_wushuang_frontend_v1.1_visual_combat_remaster.html',
'wanjie_wushuang_frontend_v1.2_art_pipeline.html',
'wanjie_wushuang_frontend_v1.3_hero_system.html',
'wanjie_wushuang_frontend_v1.4_meta_progression.html',
'wanjie_wushuang_frontend_v1.5_world_progression.html',
'wanjie_wushuang_frontend_v1.6_skill_build_system.html',
'wanjie_wushuang_frontend_v1.7_alpha_integrated.html',
'wanjie_wushuang_frontend_v1.8_alpha_content_complete.html',
'wanjie_wushuang_frontend_v1.9_director_balance.html',
'wanjie_wushuang_frontend_v2.0_public_demo.html',
'wanjie_wushuang_frontend_v2.1_public_quality.html',
'wanjie_wushuang_frontend_v2.2_art_ui_cinematics.html',
'wanjie_wushuang_frontend_v2.3_hero_combat_identity.html',
'wanjie_wushuang_frontend_v2.4_real_skill_forms.html',
'wanjie_wushuang_frontend_v2.5_boss_map_interactions.html',
'wanjie_wushuang_frontend_v2.6_gear_affix_build.html',
'wanjie_wushuang_frontend_v2.7_rune_pet_combat.html',
'wanjie_wushuang_frontend_v2.8_meta_growth_awakening.html',
'wanjie_wushuang_frontend_v2.9_game_modes.html',
'wanjie_wushuang_frontend_v3.0_complete_demo.html'
];
const required=[
'00_START_HERE_CN.md','MASTER_INDEX.md','AGENTS.md','TASK.md','handoff/STATE.md',
'archive/conversation/PROJECT_CONVERSATION_FULL.md',
'archive/conversation/USER_REQUEST_TIMELINE.md',
'archive/conversation/VERSION_CHANGELOG_FULL.md',
'archive/spec/CANONICAL_GAME_DESIGN_FULL.md',
'archive/spec/BUG_REGRESSION_HISTORY.md',
'index.html','package.json'
];
let fail=false;
for(const rel of required){
 if(!fs.existsSync(path.join(root,rel))){console.error('MISSING',rel);fail=true;}
}
for(const f of expectedReleases){
 if(!fs.existsSync(path.join(root,'archive/releases',f))){console.error('MISSING RELEASE',f);fail=true;}
}
const releases=fs.existsSync(path.join(root,'archive/releases'))?fs.readdirSync(path.join(root,'archive/releases')).filter(x=>x.endsWith('.html')):[];
console.log(`Historical runnable HTML: ${releases.length}/${expectedReleases.length}`);
console.log(`Required master docs: ${required.length}`);
if(releases.length!==expectedReleases.length)fail=true;
if(fail)process.exit(1);
console.log('ARCHIVE VERIFY OK');
