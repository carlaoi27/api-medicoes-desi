const test = require('node:test');
const assert = require('node:assert');
const { celsiusParaFahrenheit, classificarTemperatura, processarMedicao } = require('../temperatura');

test('conversão °C -> °F', () => {
  assert.strictEqual(celsiusParaFahrenheit(0), 32);
  assert.strictEqual(celsiusParaFahrenheit(100), 212);
  assert.strictEqual(celsiusParaFahrenheit(70), 158);
  assert.strictEqual(celsiusParaFahrenheit(36.6), 97.88);
  assert.strictEqual(celsiusParaFahrenheit(-40), -40);
});

test('classificação nas fronteiras', () => {
  assert.strictEqual(classificarTemperatura(79.99), 'Temperatura ideal');
  assert.strictEqual(classificarTemperatura(80), 'Atencao / Intermediario');
  assert.strictEqual(classificarTemperatura(94.99), 'Atencao / Intermediario');
  assert.strictEqual(classificarTemperatura(95), 'Acima da temperatura ideal');
  assert.strictEqual(classificarTemperatura(105), 'Acima da temperatura ideal');
  assert.strictEqual(classificarTemperatura(105.01), 'Limite crítico');
});

test('processarMedicao aceita string numérica e define unidades', () => {
  const r = processarMedicao('100');
  assert.deepStrictEqual(r, {
    valor_original: 100,
    unidade_original: '°C',
    valor_convertido: 212,
    unidade_convertida: '°F',
    classificacao: 'Acima da temperatura ideal'
  });
});
