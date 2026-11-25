// Checks public/kompas.js against the 20 test cases of the Kasb Kompasi handoff (tools/kompas15_fixtures.json):
// the status, the course IDs in order and the rounded scores must match.   node tools/test_kompas15.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
// the little of the app that kompas.js touches when it loads
Object.assign(global, { window: global, document: { querySelector: () => null }, store: { get: () => null, set() {} }, T: (s) => s });
eval(fs.readFileSync(path.join(root, "public", "kompas.js"), "utf8") + "\nglobal.Compass = Compass;");
const bundle = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "kompas15.json"), "utf8"));
const { fixtures } = JSON.parse(fs.readFileSync(path.join(__dirname, "kompas15_fixtures.json"), "utf8"));
let bad = 0;
for (const f of fixtures) {
  const r = Compass._test.recommend(bundle, f.input.answers, f.input.budget_uzs ?? null, f.input.topic ?? null);
  const got = { status: r.status, ids: r.items.map((i) => i.course_id), scores: r.items.map((i) => i.score_100) };
  const want = { status: f.expected.status, ids: f.expected.course_ids || [], scores: f.expected.scores || [] };
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${f.name}${ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`}`);
}
console.log(bad ? `${bad} of ${fixtures.length} failed` : `all ${fixtures.length} passed`);
process.exit(bad ? 1 : 0);
