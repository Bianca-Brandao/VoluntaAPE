const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'voluntaApe.db');
let db;

function connectDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Conectado ao VoluntaAPE (SQLite)!');
        initializeTables().then(() => resolve(db)).catch(reject);
      }
    });
  });
}

async function initializeTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS voluntarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      idade INTEGER NOT NULL,
      telefone TEXT,
      email TEXT,
      habilidades TEXT,
      endereco TEXT,
      problemaEscolhidoCodigo INTEGER,
      localEscolhidoId INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS problemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo INTEGER UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      descricao TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS locaisAjuda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endereco TEXT NOT NULL,
      problemaCodigo INTEGER NOT NULL,
      descricao TEXT,
      latitude REAL,
      longitude REAL
    )`
  ];

  for (const sql of tables) {
    await run(sql);
  }

  // Adicionar coluna se não existir (para migração)
  try {
    await run(`ALTER TABLE voluntarios ADD COLUMN localEscolhidoId INTEGER`);
  } catch (err) {
    // Coluna já existe, ignorar
  }
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function closeDB() {
  if (db) {
    await new Promise((resolve) => db.close(() => resolve()));
    console.log('Conexão fechada.');
  }
}

// Funções para Voluntario
async function createVoluntario(voluntarioData) {
  await connectDB();
  const sql = `INSERT INTO voluntarios (nome, idade, telefone, email, habilidades, endereco, problemaEscolhidoCodigo, localEscolhidoId)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    voluntarioData.nome,
    voluntarioData.idade,
    voluntarioData.telefone,
    voluntarioData.email,
    JSON.stringify(voluntarioData.habilidades || []),
    voluntarioData.endereco,
    voluntarioData.problemaEscolhidoCodigo,
    voluntarioData.localEscolhidoId
  ];
  const result = await run(sql, params);
  console.log(`Voluntário cadastrado com ID: ${result.id}`);
  return result.id;
}

async function getVoluntarios() {
  await connectDB();
  const rows = await all('SELECT * FROM voluntarios');
  return rows.map(row => ({
    ...row,
    habilidades: JSON.parse(row.habilidades || '[]')
  }));
}

async function updateVoluntario(id, updateData) {
  await connectDB();
  const fields = [];
  const params = [];

  if (updateData.problemaEscolhidoCodigo !== undefined) {
    fields.push('problemaEscolhidoCodigo = ?');
    params.push(updateData.problemaEscolhidoCodigo);
  }

  if (updateData.localEscolhidoId !== undefined) {
    fields.push('localEscolhidoId = ?');
    params.push(updateData.localEscolhidoId);
  }

  if (fields.length === 0) return;

  params.push(id);
  const sql = `UPDATE voluntarios SET ${fields.join(', ')} WHERE id = ?`;
  return await run(sql, params);
}

// Funções para Problema
async function createProblema(problemaData) {
  await connectDB();
  const sql = `INSERT INTO problemas (codigo, nome, descricao) VALUES (?, ?, ?)`;
  const params = [problemaData.codigo, problemaData.nome, problemaData.descricao];
  const result = await run(sql, params);
  console.log(`Problema cadastrado com ID: ${result.id}`);
  return result.id;
}

async function getProblemas() {
  await connectDB();
  return await all('SELECT * FROM problemas ORDER BY codigo');
}

async function getProblemaByCodigo(codigo) {
  await connectDB();
  return await get('SELECT * FROM problemas WHERE codigo = ?', [codigo]);
}

// Funções para LocalAjuda
async function createLocalAjuda(localData) {
  await connectDB();
  const sql = `INSERT INTO locaisAjuda (endereco, problemaCodigo, descricao, latitude, longitude)
               VALUES (?, ?, ?, ?, ?)`;
  const params = [
    localData.endereco,
    localData.problemaCodigo,
    localData.descricao,
    localData.coordenadas?.latitude,
    localData.coordenadas?.longitude
  ];
  const result = await run(sql, params);
  console.log(`Local cadastrado com ID: ${result.id}`);
  return result.id;
}

async function getLocaisAjuda() {
  await connectDB();
  return await all('SELECT * FROM locaisAjuda');
}

async function getLocalAjudaById(id) {
  await connectDB();
  return await get('SELECT * FROM locaisAjuda WHERE id = ?', [id]);
}

async function clearTestData() {
  await connectDB();
  await run('DELETE FROM voluntarios');
  await run('DELETE FROM locaisAjuda');
  await run('DELETE FROM sqlite_sequence WHERE name IN ("voluntarios", "locaisAjuda")');
  console.log('Dados de teste limpos.');
}

async function getVoluntarioByNomeAndTelefone(nome, telefone) {
  await connectDB();
  return await get('SELECT * FROM voluntarios WHERE nome = ? AND telefone = ?', [nome, telefone]);
}

async function getLocalByEnderecoAndProblema(endereco, problemaCodigo) {
  await connectDB();
  return await get('SELECT * FROM locaisAjuda WHERE endereco = ? AND problemaCodigo = ?', [endereco, problemaCodigo]);
}

module.exports = {
  connectDB,
  closeDB,
  clearTestData,
  createVoluntario,
  getVoluntarios,
  getVoluntarioByNomeAndTelefone,
  updateVoluntario,
  createProblema,
  getProblemas,
  getProblemaByCodigo,
  createLocalAjuda,
  getLocaisAjuda,
  getLocalAjudaById,
  getLocalByEnderecoAndProblema
};
