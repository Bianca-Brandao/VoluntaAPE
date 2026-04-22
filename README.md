# VoluntaAPE - Sistema de Gerenciamento de Voluntários

Sistema de gerenciamento de voluntários para situações de emergência, desenvolvido em Node.js com SQLite.

## 📋 Funcionalidades

- ✅ Cadastro de voluntários com validação de idade mínima (18 anos)
- ✅ Cadastro de locais de ajuda com coordenadas
- ✅ Vinculação de voluntários a problemas e locais específicos
- ✅ Pesquisa avançada de vínculos
- ✅ Interface web responsiva
- ✅ Sistema anti-duplicatas

## 🚀 Instalação e Execução

```bash
npm install
npm start
```

Para desenvolvimento:
```bash
npm run dev
```

## 🌐 Interface Web

Acesse: `http://localhost:3000`

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **SQLite3** - Banco de dados local
- **Express.js** - Framework web
- **HTML/CSS/JS** - Interface frontend

## 📖 API

Principais funções disponíveis:
- `cadastrarVoluntario()` - Cadastra novo voluntário
- `cadastrarLocal()` - Cadastra local de ajuda
- `vincularVoluntarioAProblema()` - Vincula voluntário a problema/local
- `listarProblemas()` - Lista tipos de problemas
- `listarLocais()` - Lista locais cadastrados

## 📊 Estrutura de Dados

- **Voluntário**: nome, idade, telefone, email, habilidades, endereço, problema/local vinculado
- **Problema**: código, nome, descrição
- **Local**: endereço, problema, descrição, coordenadas

## 🔧 Desenvolvimento

Para modificar problemas padrão, edite `PROBLEMAS_PADRAO` em `index.js`.
Para alterar schemas, modifique `database.js`.