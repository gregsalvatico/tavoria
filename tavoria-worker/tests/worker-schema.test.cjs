const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Run with PGLITE_MODULE pointing to a temporary installation; no app dependency.
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  await db.exec(`create table workers(id text primary key, photo_url text, video_url text); create table shifts(id text primary key); insert into workers values ('existing','original-photo','original-video');`);
  const migration = fs.readdirSync(path.resolve(__dirname, '../supabase/migrations')).find(n => n.endsWith('_worker_preferences_and_media.sql'));
  await db.exec(fs.readFileSync(path.resolve(__dirname, '../supabase/migrations', migration), 'utf8'));
  const { rows: [row] } = await db.query("select * from workers where id='existing'");
  assert.equal(row.photo_url, 'original-photo'); assert.deepEqual(row.job_preferences, {}); assert.deepEqual(row.photo_urls, []);
  await db.query("update workers set job_preferences=$1, photo_urls=$2 where id='existing'", [JSON.stringify({ days: ['fri'], from: '18:00', to: '02:00', openToWork: false }), JSON.stringify([null, 'extra-photo'])]);
  const { rows: [saved] } = await db.query("select * from workers where id='existing'");
  assert.equal(saved.job_preferences.openToWork, false); assert.equal(saved.photo_urls[1], 'extra-photo');
  await assert.rejects(db.exec("update workers set photo_urls='{}'::jsonb"));
  await assert.rejects(db.exec("update workers set video_urls='[null,null,null,null]'::jsonb"));
  await assert.rejects(db.exec("update workers set job_preferences='[]'::jsonb"));
  console.log('Migration checks passed: existing media preserved, preferences persisted, slot bounds and object constraints enforced.');
  await db.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
