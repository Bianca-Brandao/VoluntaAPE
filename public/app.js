async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    const message = data.error || 'Erro no servidor';
    throw new Error(message);
  }
  return data;
}

function renderList(elementId, items, formatter) {
  const list = document.getElementById(elementId);
  list.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = formatter(item);
    list.appendChild(li);
  });
}

function populateSelect(selectElement, items, getValue, getText) {
  selectElement.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Selecione...';
  selectElement.appendChild(defaultOption);
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = getValue(item);
    option.textContent = getText(item);
    selectElement.appendChild(option);
  });
}

let globalProblemas = [];
let globalVoluntarios = [];
let globalLocais = [];

async function loadData() {
  try {
    const [problemas, voluntarios, locais] = await Promise.all([
      fetchJson('/api/problemas'),
      fetchJson('/api/voluntarios'),
      fetchJson('/api/locais')
    ]);

    globalProblemas = problemas;
    globalVoluntarios = voluntarios;
    globalLocais = locais;

    renderList('lista-problemas', problemas, (item) => `${item.codigo} - ${item.nome}`);
    renderList('lista-voluntarios', voluntarios, (item) => {
      const localVinculado = globalLocais.find(l => l.id == item.localEscolhidoId);
      return `${item.id}: ${item.nome} — ${item.telefone} — ${item.endereco} ${item.problemaEscolhidoCodigo ? `(problema ${item.problemaEscolhidoCodigo})` : ''} ${localVinculado ? `(local: ${localVinculado.endereco})` : ''}`;
    });
    renderList('lista-locais', locais, (item) => `${item.id}: ${item.endereco} — problema ${item.problemaCodigo} ${item.descricao ? `— ${item.descricao}` : ''}`);

    const problemaSelects = document.querySelectorAll('select[name="problemaCodigo"]');
    problemaSelects.forEach((select) => {
      populateSelect(select, problemas, (item) => item.codigo, (item) => `${item.codigo} - ${item.nome}`);
    });

    const voluntarioSelect = document.querySelector('select[name="voluntarioId"]');
    populateSelect(voluntarioSelect, voluntarios, (item) => item.id, (item) => `${item.nome} (${item.telefone})`);
  } catch (error) {
    alert('Erro: ' + error.message);
  }
}

function transformFormData(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

async function handleFormSubmit(event, path) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = transformFormData(form);

  try {
    await fetchJson(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    alert('Operação realizada com sucesso!');
    form.reset();
    await loadData();
  } catch (error) {
    alert('Erro: ' + error.message);
  }
}

function setupForms() {
  document.getElementById('form-voluntario').addEventListener('submit', (event) => handleFormSubmit(event, '/api/voluntarios'));
  document.getElementById('form-local').addEventListener('submit', (event) => handleFormSubmit(event, '/api/locais'));
  document.getElementById('form-vincular').addEventListener('submit', (event) => handleFormSubmit(event, '/api/vincular'));

  // Adicionar listener para mudança no select de problema
  const problemaSelect = document.querySelector('#form-vincular select[name="problemaCodigo"]');
  problemaSelect.addEventListener('change', (event) => {
    const problemaCodigo = event.target.value;
    const locaisFiltrados = globalLocais.filter(local => local.problemaCodigo == problemaCodigo);
    const localSelect = document.querySelector('#form-vincular select[name="localId"]');
    populateSelect(localSelect, locaisFiltrados, (item) => item.id, (item) => `${item.id}: ${item.endereco}`);
  });

  // Pesquisa
  document.getElementById('form-pesquisa').addEventListener('submit', (event) => {
    event.preventDefault();
    const query = event.currentTarget.query.value.toLowerCase();
    const resultados = [];

    // Filtrar voluntários
    globalVoluntarios.forEach(vol => {
      if (vol.nome.toLowerCase().includes(query) || vol.telefone.includes(query) || vol.endereco.toLowerCase().includes(query)) {
        const localVinculado = globalLocais.find(l => l.id == vol.localEscolhidoId);
        resultados.push(`Voluntário: ${vol.nome} (${vol.telefone}) - ${vol.endereco} ${vol.problemaEscolhidoCodigo ? `(vinculado ao problema ${vol.problemaEscolhidoCodigo})` : ''} ${localVinculado ? `(local: ${localVinculado.endereco})` : ''}`);
      }
    });

    // Filtrar locais
    globalLocais.forEach(local => {
      if (local.endereco.toLowerCase().includes(query) || local.descricao.toLowerCase().includes(query)) {
        const voluntariosVinculados = globalVoluntarios.filter(v => v.localEscolhidoId == local.id).map(v => v.nome).join(', ');
        resultados.push(`Local: ${local.endereco} (problema ${local.problemaCodigo}) - ${local.descricao || ''} ${voluntariosVinculados ? `(voluntários: ${voluntariosVinculados})` : ''}`);
      }
    });

    // Filtrar problemas
    globalProblemas.forEach(prob => {
      if (prob.nome.toLowerCase().includes(query) || prob.descricao.toLowerCase().includes(query)) {
        const vinculados = globalVoluntarios.filter(v => v.problemaEscolhidoCodigo == prob.codigo).length;
        const locaisCount = globalLocais.filter(l => l.problemaCodigo == prob.codigo).length;
        resultados.push(`Problema ${prob.codigo}: ${prob.nome} - ${prob.descricao} (Voluntários: ${vinculados}, Locais: ${locaisCount})`);
      }
    });

    const container = document.getElementById('resultados-pesquisa');
    container.innerHTML = '';
    if (resultados.length === 0) {
      container.textContent = 'Nenhum resultado encontrado.';
    } else {
      resultados.forEach(res => {
        const div = document.createElement('div');
        div.textContent = res;
        container.appendChild(div);
      });
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupForms();
  loadData();
});
