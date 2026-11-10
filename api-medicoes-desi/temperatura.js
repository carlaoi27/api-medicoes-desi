// Isso eu já sabia por causa das aulas do Felipe 👌

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

// F = (C * 9 / 5) + 32
function celsiusParaFahrenheit(celsius) {
  return arredondar((celsius * 9) / 5 + 32);
}

function classificarTemperatura(celsius) {
  if (celsius < 80) {
    return 'Temperatura ideal';
  } else if (celsius > 105) {
    return 'Limite crítico';
  } else if (celsius >= 95) {
    return 'Acima da temperatura ideal'; // 95 a 105
  }
  return 'Atencao / Intermediario'; // 80 a 94.99
}

function processarMedicao(valor) {
  const valorOriginal = Number(valor);
  return {
    valor_original: valorOriginal,
    unidade_original: '°C',
    valor_convertido: celsiusParaFahrenheit(valorOriginal),
    unidade_convertida: '°F',
    classificacao: classificarTemperatura(valorOriginal)
  };
}

module.exports = { celsiusParaFahrenheit, classificarTemperatura, processarMedicao };
