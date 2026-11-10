// Testes das rotas SEM precisar de MySQL: o módulo ./db é substituído por um banco em memória.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

let tabela = [];
let proximoId = 1;
let falhar = false;

const dbFalso = {
  async execute(sql, params = []) {
    if (falhar) throw new Error('falha simulada no MySQL');
    const s = sql.trim().toUpperCase();
    if (s.startsWith('SELECT * FROM MEDICOES WHERE')) return [tabela.filter(r => r.id == params[0])];
    if (s.startsWith('SELECT ID FROM MEDICOES')) return [tabela.filter(r => r.id == params[0]).map(r => ({ id: r.id }))];
    if (s.startsWith('SELECT * FROM MEDICOES')) return [tabela];
    if (s.startsWith('INSERT')) {
      const [descricao, tipo, valor_original, unidade_original, valor_convertido, unidade_convertida, classificacao] = params;
      const id = proximoId++;
      tabela.push({ id, descricao, tipo, valor_original, unidade_original, valor_convertido, unidade_convertida, classificacao });
      return [{ insertId: id, affectedRows: 1 }];
    }
    if (s.startsWith('UPDATE')) {
      const r = tabela.find(x => x.id == params[7]);
      if (!r) return [{ affectedRows: 0 }];
      [r.descricao, r.tipo, r.valor_original, r.unidade_original, r.valor_convertido, r.unidade_convertida, r.classificacao] = params;
      return [{ affectedRows: 1 }];
    }
    if (s.startsWith('DELETE')) {
      const antes = tabela.length;
      tabela = tabela.filter(r => r.id != params[0]);
      return [{ affectedRows: antes - tabela.length }];
    }
    throw new Error('SQL não suportado no mock: ' + sql);
  }
};

const dbPath = require.resolve('../db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: dbFalso };
const app = require('../index');

let server, base;
test.before(async () => {
  await new Promise(ok => { server = app.listen(0, ok); });
  base = `http://localhost:${server.address().port}`;
});
test.after(() => server.close());
test.beforeEach(() => { tabela = []; proximoId = 1; falhar = false; });

const json = (method, url, body) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

test('GET / -> 200', async () => {
  const r = await fetch(base + '/');
  assert.strictEqual(r.status, 200);
});

test('POST /medicao -> 201 com conversão e classificação', async () => {
  const r = await json('POST', '/medicao', { descricao: 'CPU', tipo: 'temperatura', valor: 100 });
  assert.strictEqual(r.status, 201);
  const b = await r.json();
  assert.strictEqual(b.id, 1);
  assert.strictEqual(b.valor_convertido, 212);
  assert.strictEqual(b.unidade_original, '°C');
  assert.strictEqual(b.unidade_convertida, '°F');
  assert.strictEqual(b.classificacao, 'Acima da temperatura ideal');
});

test('POST aceita valor 0 (não confunde com ausente)', async () => {
  const r = await json('POST', '/medicao', { descricao: 'Gelo', tipo: 'temperatura', valor: 0 });
  assert.strictEqual(r.status, 201);
  assert.strictEqual((await r.json()).valor_convertido, 32);
});

test('POST -> 400 campo ausente', async () => {
  for (const corpo of [
    { tipo: 'temperatura', valor: 50 },
    { descricao: 'x', valor: 50 },
    { descricao: 'x', tipo: 'temperatura' },
    {}
  ]) {
    assert.strictEqual((await json('POST', '/medicao', corpo)).status, 400);
  }
});

test('POST -> 400 tipo inválido e valor não numérico', async () => {
  assert.strictEqual((await json('POST', '/medicao', { descricao: 'x', tipo: 'umidade', valor: 5 })).status, 400);
  assert.strictEqual((await json('POST', '/medicao', { descricao: 'x', tipo: 'temperatura', valor: 'abc' })).status, 400);
});

test('GET /medicoes lista e GET /medicao/:id busca', async () => {
  await json('POST', '/medicao', { descricao: 'A', tipo: 'temperatura', valor: 70 });
  await json('POST', '/medicao', { descricao: 'B', tipo: 'temperatura', valor: 110 });
  const lista = await (await fetch(base + '/medicoes')).json();
  assert.strictEqual(lista.length, 2);
  const um = await fetch(base + '/medicao/2');
  assert.strictEqual(um.status, 200);
  assert.strictEqual((await um.json()).classificacao, 'Limite crítico');
});

test('GET /medicao/:id -> 404', async () => {
  assert.strictEqual((await fetch(base + '/medicao/999')).status, 404);
});

test('PUT recalcula; 400 e 404', async () => {
  await json('POST', '/medicao', { descricao: 'A', tipo: 'temperatura', valor: 70 });
  const ok = await json('PUT', '/medicao/1', { descricao: 'A2', tipo: 'temperatura', valor: 90 });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(tabela[0].classificacao, 'Atencao / Intermediario');
  assert.strictEqual(tabela[0].valor_convertido, 194);
  assert.strictEqual((await json('PUT', '/medicao/1', { descricao: 'x' })).status, 400);
  assert.strictEqual((await json('PUT', '/medicao/1', { descricao: 'x', tipo: 'pressao', valor: 1 })).status, 400);
  assert.strictEqual((await json('PUT', '/medicao/999', { descricao: 'x', tipo: 'temperatura', valor: 1 })).status, 404);
});

test('DELETE -> 200 e depois 404', async () => {
  await json('POST', '/medicao', { descricao: 'A', tipo: 'temperatura', valor: 70 });
  assert.strictEqual((await json('DELETE', '/medicao/1')).status, 200);
  assert.strictEqual((await json('DELETE', '/medicao/1')).status, 404);
});

test('erro do MySQL -> 500', async () => {
  falhar = true;
  assert.strictEqual((await fetch(base + '/medicoes')).status, 500);
  assert.strictEqual((await fetch(base + '/medicao/1')).status, 500);
  assert.strictEqual((await json('POST', '/medicao', { descricao: 'x', tipo: 'temperatura', valor: 1 })).status, 500);
  assert.strictEqual((await json('PUT', '/medicao/1', { descricao: 'x', tipo: 'temperatura', valor: 1 })).status, 500);
  assert.strictEqual((await json('DELETE', '/medicao/1')).status, 500);
});
