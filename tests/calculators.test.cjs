// Run: node --test tests/calculators.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(file, values = {}, method = 'equal') {
  const nodes = new Map();
  const alerts = [];
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        value: String(values[id] ?? ''), textContent: '', style: {},
        addEventListener(event, fn) { this[event] = fn; }, scrollIntoView() {},
      });
      return nodes.get(id);
    },
    querySelector() { return { value: method }; },
  };
  const context = vm.createContext({ document, alert: message => alerts.push(message) });
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  return { context, alerts, node: id => document.getElementById(id),
    submit() { document.getElementById('form').submit({ preventDefault() {} }); } };
}
// NHIS 2026 rates: worker health 3.595%, worker LTC 0.4724%.
test('salary deducts only the employee share of long-term care insurance', () => {
  const { context } = load('tools/salary/salary.js');
  const r = context.계산(36000000, 0);
  assert.equal(r.국민연금, 142500);
  assert.ok(Math.abs(r.건강보험 - 107850) < 0.000001);
  assert.equal(r.장기요양, 14172);
  assert.ok(Math.abs(r.고용보험 - 27000) < 0.000001);
  assert.equal(r.실수령월 + r.총공제, r.월급);
});
// NPS July 2026: income rounded down to 1,000 KRW, bounded at 410,000–6,590,000.
for (const [monthly, expected] of [[100000,19475],[410000,19475],[3000999,142500],[6590000,313025],[7000000,313025]]) {
  test(`both pension calculators agree at monthly income ${monthly}`, () => {
    const salary = load('tools/salary/salary.js').context.계산(monthly*12,0);
    const insurance = load('tools/insurance/insurance.js', { monthly });
    insurance.submit();
    assert.equal(salary.국민연금, expected);
    assert.equal(insurance.node('np_w').textContent, expected.toLocaleString('ko-KR')+'원');
    assert.equal(insurance.node('np_w').textContent, insurance.node('np_e').textContent);
    assert.equal(insurance.node('ltc_w').textContent, Math.round(salary.장기요양).toLocaleString('ko-KR')+'원');
  });
}
for (const [file,principal,total,monthly,zero] of [
  ['tools/loan/loan.js',1200,'12,000,000원','1,000,000원','0원'],
  ['en/tools/loan/loan.js',12000,'$12,000','$1,000','$0'],
]) {
  for (const method of ['equal','principal']) test(`${file}: 0% works for ${method}`, () => {
    const app=load(file,{principal,rate:0,years:1},method);app.submit();
    assert.deepEqual(app.alerts,[]);
    assert.equal(app.node('monthly').textContent,monthly);
    assert.equal(app.node('totalInt').textContent,zero);
    assert.equal(app.node('totalRepay').textContent,total);
  });
  for (const invalid of [{rate:''},{rate:-1},{principal:0},{principal:-100},{years:0},{years:1.5},{years:'Infinity'}]) {
    test(`${file}: rejects ${JSON.stringify(invalid)}`,()=>{
      const app=load(file,{principal,rate:4.5,years:30,...invalid});app.submit();
      assert.equal(app.alerts.length,1);
      assert.notEqual(app.node('result').style.display,'block');
    });
  }
}
test('positive-interest loans match independent amortization examples',()=>{
  const ko=load('tools/loan/loan.js').context;
  const en=load('en/tools/loan/loan.js').context;
  assert.ok(Math.abs(ko.원리금균등(12000000,12,12).월상환-1066185.46414)<0.01);
  assert.ok(Math.abs(en.equalMonthly(12000000,12,12).monthly-1066185.46414)<0.01);
  assert.equal(ko.원금균등(12000000,12,12).총이자,780000);
  assert.equal(en.equalPrincipal(12000000,12,12).totalInterest,780000);
});
test('published salary table matches interactive results',()=>{
  const html=fs.readFileSync(path.join(root,'tools/salary/index.html'),'utf8');
  const table=html.split('연봉별 실수령액 표')[1].split('</table>')[0];
  const context=load('tools/salary/salary.js').context;
  for(const row of table.matchAll(/<tr>(.*?)<\/tr>/gs)){
    const cells=[...row[1].matchAll(/<td>(.*?)<\/td>/g)].map(m=>Number(m[1].replace(/[^\d]/g,'')));
    if(!cells.length)continue;
    const r=context.계산(cells[0]*10000,0);
    assert.deepEqual(cells.slice(1),[r.월급,r.총공제,r.실수령월,r.실수령연].map(Math.round));
  }
});
