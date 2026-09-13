const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const file = path.resolve(__dirname, '../lib/workerMatching.ts');
const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = new Module(file); mod._compile(compiled, file);
const { rankWorkers, matchWorker, coversSchedule } = mod.exports;
const worker = { id: 'a', first_name: 'Anna', city: 'Milano', positions: ['Barista'], languages: ['IT', 'EN'], job_preferences: { days: ['fri'], from: '18:00', to: '02:00', roleExperience: { Barista: 3 } } };
const request = { roles: ['Barista'], city: 'Milan', days: ['fri'], hours_start: '19:00:00', hours_end: '01:00:00', worker_requirements: { minimumExperience: 2, languages: ['IT'] } };
assert.equal(matchWorker(worker, request).group, 'strong');
assert.equal(coversSchedule(worker.job_preferences, request), true);
assert.equal(coversSchedule(worker.job_preferences, { ...request, hours_end: '03:00' }), false);
assert.equal(coversSchedule({ days: ['sun'], from: '22:00', to: '06:00' }, { days: ['mon'], hours_start: '01:00', hours_end: '05:00' }), true);
assert.equal(coversSchedule({ days: ['venerdi'], from: '18:00', to: '02:00' }, { days: ['Friday'], hours_start: '19:00', hours_end: '01:00' }), true);
assert.equal(coversSchedule({}, request), null);
assert.equal(coversSchedule(worker.job_preferences, { ...request, days: [], start_date: '2026-09-11' }), true);
assert.equal(matchWorker({ ...worker, job_preferences: {} }, request).group, 'good');
assert.ok(matchWorker({ ...worker, job_preferences: {} }, request).reasons.includes('availability_unknown'));
assert.equal(matchWorker({ ...worker, positions: ['Chef'] }, request).group, 'review');
assert.equal(matchWorker({ ...worker, job_preferences: { ...worker.job_preferences, minimumHourlyPay: 14 } }, { ...request, pay_unit: 'hour', pay_amount: 12 }).group, 'review');
assert.equal(matchWorker({ ...worker, job_preferences: { ...worker.job_preferences, minimumHourlyPay: 14 } }, { ...request, pay_unit: 'month', pay_amount: 1200 }).group, 'strong');
assert.equal(matchWorker({ ...worker, job_preferences: { ...worker.job_preferences, availableFrom: '2026-09-15' } }, { ...request, start_when: 'now' }, '2026-09-11').group, 'review');
assert.equal(matchWorker({ ...worker, age_range: '50+', nationality: 'FR' }, request).score, matchWorker({ ...worker, age_range: '18–20', nationality: 'IT' }, request).score);
assert.equal(matchWorker({ ...worker, years_exp: '5+ years', job_preferences: { ...worker.job_preferences, roleExperience: undefined } }, { ...request, worker_requirements: { ...request.worker_requirements, minimumExperience: 4 } }).group, 'strong');
const pool = [{ ...worker, id: 'old', created_at: '2020-01-01' }, { ...worker, id: 'new', created_at: '2026-01-01', positions: ['Chef'] }, { ...worker, id: 'paused', job_preferences: { openToWork: false } }, { id: 'stub' }];
assert.deepEqual(rankWorkers(pool, request).map(m => m.worker.id), ['old', 'new', 'stub']);
assert.deepEqual(rankWorkers([{ ...worker, id: 'b' }, worker], request).map(m => m.worker.id), ['a', 'b']);
const mediaPool = [
  { ...worker, id: 'photo', photo_url: 'photo.jpg' },
  { ...worker, id: 'video', video_url: 'video.mp4' },
  { ...worker, id: 'both', photo_url: 'photo.jpg', video_url: 'video.mp4' },
  { ...worker, id: 'none' },
];
assert.deepEqual(rankWorkers(mediaPool, request).map(m => m.worker.id), ['both', 'video', 'photo', 'none']);
console.log('Matching checks passed: overnight/week boundaries, unknown data, salary units, start dates, complete visibility, media priority, demographic neutrality.');
