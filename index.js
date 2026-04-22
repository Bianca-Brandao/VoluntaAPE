const {
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
} = require('./database');

const PROBLEMAS_PADRAO = [
  { codigo: 1, nome: 'Resgates e Evacuações', descricao: 'Retirada segura de pessoas em áreas de risco.' },
  { codigo: 2, nome: 'Distribuição de Mantimentos e Água', descricao: 'Entrega de alimentos e água potável à população afetada.' },
  { codigo: 3, nome: 'Apoio em Abrigos', descricao: 'Organização e manutenção de abrigos temporários.' },
  { codigo: 4, nome: 'Atendimento à Saúde', descricao: 'Atendimento médico e primeiros socorros.' },
  { codigo: 5, nome: 'Logística e Reconstrução', descricao: 'Planejamento e apoio à reconstrução de estruturas.' },
  { codigo: 6, nome: 'Segurança e Comunicação', descricao: 'Coordenar comunicação, segurança e alertas.' }
];

async function inicializarBibliotecaDeProblemas() {
  await connectDB();
  for (const problema of PROBLEMAS_PADRAO) {
    const existing = await getProblemaByCodigo(problema.codigo);
    if (!existing) {
      await createProblema(problema);
    }
  }
  console.log('Biblioteca de problemas inicializada.');
}

async function limparDadosTeste() {
  await clearTestData();
}

async function cadastrarVoluntario({ nome, idade, telefone, email, habilidades, endereco }) {
  if (idade < 18) {
    throw new Error('A idade mínima para cadastro de voluntários é 18 anos.');
  }
  // Verificar se já existe voluntário com mesmo nome e telefone
  const existing = await getVoluntarioByNomeAndTelefone(nome, telefone);
  if (existing) {
    console.log(`Voluntário ${nome} já cadastrado (ID: ${existing.id}).`);
    return { id: existing.id, ...existing, habilidades: JSON.parse(existing.habilidades || '[]') };
  }

  const voluntarioData = {
    nome,
    idade,
    telefone,
    email,
    habilidades: habilidades || [],
    endereco,
    problemaEscolhidoCodigo: null
  };
  const id = await createVoluntario(voluntarioData);
  return { id, ...voluntarioData };
}

async function cadastrarLocal(endereco, problemaCodigo, descricao, coordenadas) {
  // Verificar se já existe local com mesmo endereço e problema
  const existing = await getLocalByEnderecoAndProblema(endereco, problemaCodigo);
  if (existing) {
    console.log(`Local ${endereco} já cadastrado para este problema (ID: ${existing.id}).`);
    return { id: existing.id, ...existing };
  }

  const problema = await getProblemaByCodigo(problemaCodigo);
  if (!problema) {
    throw new Error(`Problema com código ${problemaCodigo} não encontrado.`);
  }

  const localData = {
    endereco,
    problemaCodigo,
    descricao,
    coordenadas
  };
  const id = await createLocalAjuda(localData);
  console.log(`Local cadastrado: ${endereco} com problema ${problema.nome}`);
  return { id, ...localData };
}

async function listarProblemas() {
  return await getProblemas();
}

async function listarLocais() {
  return await getLocaisAjuda();
}

async function vincularVoluntarioAProblema(voluntarioId, problemaCodigo, localId = null) {
  const problema = await getProblemaByCodigo(problemaCodigo);
  if (!problema) {
    throw new Error(`Problema com código ${problemaCodigo} não encontrado.`);
  }

  if (localId) {
    const local = await getLocalAjudaById(localId);
    if (!local || local.problemaCodigo != problemaCodigo) {
      throw new Error(`Local com ID ${localId} não encontrado ou não corresponde ao problema.`);
    }
  }

  await updateVoluntario(voluntarioId, { problemaEscolhidoCodigo: problemaCodigo, localEscolhidoId: localId });
  console.log(`Voluntário escolheu o problema ${problema.nome}${localId ? ` no local ${localId}` : ''}.`);
  return { problemaEscolhidoCodigo: problemaCodigo, localEscolhidoId: localId };
}

async function exibirRelatorioLocal(idLocal) {
  const local = await getLocalAjudaById(idLocal);
  if (!local) {
    throw new Error('Local não encontrado.');
  }

  const problema = await getProblemaByCodigo(local.problemaCodigo);
  console.log('--- RELATÓRIO DE AJUDA ---');
  console.log(`Local: ${local.endereco}`);
  console.log(`Problema ID: ${local.problemaCodigo}`);
  console.log(`Problema: ${problema ? problema.nome : 'Não encontrado'}`);
  console.log(`Descrição do local: ${local.descricao || 'Sem descrição adicional.'}`);
}

async function demonstrarSemDuplicatas() {
  console.log('\n--- DEMONSTRAÇÃO: Sistema sem duplicatas ---');

  // Tentar cadastrar o mesmo voluntário novamente
  console.log('Tentando cadastrar voluntário duplicado...');
  const voluntarioDuplicado = await cadastrarVoluntario({
    nome: 'Ana Silva',
    idade: 28,
    telefone: '11987654321',
    email: 'ana.silva@example.com',
    habilidades: ['Apoio em Abrigos', 'Comunicação'],
    endereco: 'Rua das Flores, 123'
  });

  // Tentar cadastrar o mesmo local novamente
  console.log('Tentando cadastrar local duplicado...');
  const localDuplicado = await cadastrarLocal(
    'Avenida Central, 85',
    2,
    'Entrega de água e mantimentos para famílias isoladas.',
    { latitude: -23.55052, longitude: -46.633308 }
  );

  console.log('Sistema funcionando: duplicatas evitadas com sucesso!');
}

async function main() {
  try {
    // Limpar dados de teste para evitar acumulação
    await limparDadosTeste();

    await inicializarBibliotecaDeProblemas();

    const problemas = await listarProblemas();
    console.log('Tipos de problemas disponíveis:');
    problemas.forEach(p => console.log(`${p.codigo} - ${p.nome}`));

    const voluntario = await cadastrarVoluntario({
      nome: 'Ana Silva',
      idade: 28,
      telefone: '11987654321',
      email: 'ana.silva@example.com',
      habilidades: ['Apoio em Abrigos', 'Comunicação'],
      endereco: 'Rua das Flores, 123'
    });

    await vincularVoluntarioAProblema(voluntario.id, 3);

    const local = await cadastrarLocal(
      'Avenida Central, 85',
      2,
      'Entrega de água e mantimentos para famílias isoladas.',
      { latitude: -23.55052, longitude: -46.633308 }
    );

    await exibirRelatorioLocal(local.id);

    const locais = await listarLocais();
    console.log('Locais cadastrados:');
    locais.forEach(l => console.log(`${l.id}: ${l.endereco} (problema ${l.problemaCodigo})`));

    // Demonstrar que o sistema evita duplicatas
    await demonstrarSemDuplicatas();

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await closeDB();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  limparDadosTeste,
  inicializarBibliotecaDeProblemas,
  cadastrarVoluntario,
  cadastrarLocal,
  listarProblemas,
  listarLocais,
  vincularVoluntarioAProblema,
  exibirRelatorioLocal,
  demonstrarSemDuplicatas
};
