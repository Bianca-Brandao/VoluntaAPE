const express = require('express');
const path = require('path');
const {
  inicializarBibliotecaDeProblemas,
  cadastrarVoluntario,
  cadastrarLocal,
  listarProblemas,
  vincularVoluntarioAProblema
} = require('./index');
const {
  getVoluntarios,
  getLocaisAjuda
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/problemas', async (req, res) => {
  try {
    const problemas = await listarProblemas();
    res.json(problemas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/voluntarios', async (req, res) => {
  try {
    const voluntarios = await getVoluntarios();
    res.json(voluntarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locais', async (req, res) => {
  try {
    const locais = await getLocaisAjuda();
    res.json(locais);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/voluntarios', async (req, res) => {
  try {
    const { nome, idade, telefone, email, habilidades, endereco } = req.body;
    const habilidadesArray = typeof habilidades === 'string'
      ? habilidades.split(',').map((item) => item.trim()).filter(Boolean)
      : Array.isArray(habilidades)
        ? habilidades
        : [];

    const voluntario = await cadastrarVoluntario({
      nome,
      idade: Number(idade),
      telefone,
      email,
      habilidades: habilidadesArray,
      endereco
    });

    res.status(201).json(voluntario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/locais', async (req, res) => {
  try {
    const { endereco, problemaCodigo, descricao, latitude, longitude } = req.body;
    const local = await cadastrarLocal(
      endereco,
      Number(problemaCodigo),
      descricao,
      {
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null
      }
    );
    res.status(201).json(local);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vincular', async (req, res) => {
  try {
    const { voluntarioId, problemaCodigo, localId } = req.body;
    const resultado = await vincularVoluntarioAProblema(Number(voluntarioId), Number(problemaCodigo), localId ? Number(localId) : null);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    await inicializarBibliotecaDeProblemas();
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error.message);
    process.exit(1);
  }
}

startServer();
