export * from './chapterBattle';
import { WebAudioBackend } from '../../src/game/audio/WebAudioBackend';
const played: string[] = [], failures: string[] = [];
const play = WebAudioBackend.prototype.play;
WebAudioBackend.prototype.play = function (cue) {
  try { const voice = play.call(this, cue); played.push(cue); return voice; }
  catch (error) { failures.push(String(error)); throw error; }
};
Object.assign(window, { chapterAudioEvidence: () => ({ played: [...played], failures: [...failures] }) });
