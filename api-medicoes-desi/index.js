const express = require('express');
const db = require('./db');
const { processarMedicao } = require('./temperatura');

const app = express();
const port = 3000;

app.use(express.json());

// Valida o corpo de POST/PUT. Retorna a mensagem de erro (string) ou null se estiver ok.
function validarCorpo(body) {
  const { descricao, tipo, valor } = body || {};

  const faltando =
    descricao === undefined || descricao === null || String(descricao).trim() === '' ||
    tipo === undefined || tipo === null || String(tipo).trim() === '' ||
    valor === undefined || valor === null || String(valor).trim() === '';
  if (faltando) {
    return 'Campos obrigatórios: descricao, tipo e valor.';
  }
  if (tipo !== 'temperatura') {
    return "Tipo inválido. O único valor aceito para 'tipo' é 'temperatura'.";
  }
  if (typeof valor === 'boolean' || !Number.isFinite(Number(valor))) {
    return "O campo 'valor' deve ser numérico.";
  }
  return null;
}

function erroInterno(res, error) {
  return res.status(500).json({
    mensagem: 'Erro Interno do Servidor',
    detalhes: error.message
  });
}

app.get('/', (req, res) => {
  res.status(200).json({ mensagem: 'API de medições térmicas ativa!' });
});

app.get('/medicoes', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM medicoes');
    res.status(200).json(rows);
  } catch (error) {
    erroInterno(res, error);
  }
});

app.get('/medicao/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM medicoes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Medição não encontrada' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    erroInterno(res, error);
  }
});

app.post('/medicao', async (req, res) => {
  const erro = validarCorpo(req.body);
  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  const { descricao, tipo, valor } = req.body;
  const calc = processarMedicao(valor);

  try {
    const [result] = await db.execute(
      'INSERT INTO medicoes (descricao, tipo, valor_original, unidade_original, valor_convertido, unidade_convertida, classificacao) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [descricao, tipo, calc.valor_original, calc.unidade_original, calc.valor_convertido, calc.unidade_convertida, calc.classificacao]
    );
    res.status(201).json({ id: result.insertId, descricao, tipo, ...calc });
  } catch (error) {
    erroInterno(res, error);
  }
});

app.put('/medicao/:id', async (req, res) => {
  const { id } = req.params;

  const erro = validarCorpo(req.body);
  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  const { descricao, tipo, valor } = req.body;
  const calc = processarMedicao(valor);

  try {
    const [existente] = await db.execute('SELECT id FROM medicoes WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensagem: 'Medição não encontrada' });
    }

    await db.execute(
      'UPDATE medicoes SET descricao = ?, tipo = ?, valor_original = ?, unidade_original = ?, valor_convertido = ?, unidade_convertida = ?, classificacao = ? WHERE id = ?',
      [descricao, tipo, calc.valor_original, calc.unidade_original, calc.valor_convertido, calc.unidade_convertida, calc.classificacao, id]
    );
    res.status(200).json({
      mensagem: 'Medição atualizada com sucesso.',
      medicao: { id: Number(id), descricao, tipo, ...calc }
    });
  } catch (error) {
    erroInterno(res, error);
  }
});

app.delete('/medicao/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM medicoes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Medição não encontrada' });
    }
    res.status(200).json({ mensagem: 'Medição apagada com sucesso' });
  } catch (error) {
    erroInterno(res, error);
  }
});

// Só sobe o servidor quando executado diretamente (permite importar o app nos testes)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API de medições rodando em http://localhost:${port}`);
  });
}

module.exports = app;
