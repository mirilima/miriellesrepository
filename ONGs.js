
(function() {
    'use strict';

    // ========================================
    // DEFINIÇÃO INICIAL DOS MÓDULOS (objetos vazios para evitar ordem de dependência)
    // ========================================
  
    const Helpers = {};
    const Storage = {};
    const Templates = {};
    const Validation = {};
    const Projects = {};
    const Navigation = {};
    const App = {};

    // ========================================
    // PREENCHIMENTO DOS MÓDULOS
    // ========================================
  

    // MÓDULO: Helpers (Utilitários gerais)
  
    Helpers.formatDate = function(date) {
        return new Date(date).toLocaleDateString();
    };

    // MÓDULO: Storage (Armazenamento local)
  
    Storage.saveUserData = function(data) {
        try {
            localStorage.setItem('userData', JSON.stringify(data));
        } catch (e) {
            console.error('Erro ao salvar dados do usuário:', e);
        }
    };
    Storage.loadUserData = function() {
        try {
            return JSON.parse(localStorage.getItem('userData')) || null;
        } catch (e) {
            console.error('Erro ao carregar dados do usuário:', e);
            return null;
        }
    };
    Storage.saveProjects = function(projects) {
        try {
            localStorage.setItem('projects', JSON.stringify(projects));
        } catch (e) {
            console.error('Erro ao salvar projetos:', e);
        }
    };
    Storage.loadProjects = function() {
        try {
            return JSON.parse(localStorage.getItem('projects')) || [];
        } catch (e) {
            console.error('Erro ao carregar projetos:', e);
            return [];
        }
    };

    // MÓDULO: Templates (Templates JavaScript)
  
    Templates.getTemplate = function(page, state) {
        switch (page) {
            case 'home':
                return `
                    <h1>Bem-vindo à ONG</h1>
                    <p>Conteúdo da página inicial...</p>
                    <a href="#" data-nav="cadastro">Ir para Cadastro</a>
                    <a href="#" data-nav="projetos">Ver Projetos</a>
                `;
            case 'cadastro':
                return `
                    <h1>Cadastro</h1>
                    <form id="cadastro-form">
                        <input type="text" name="nome" data-validate="required" placeholder="Nome">
                        <input type="email" name="email" data-validate="email" placeholder="Email">
                        <input type="password" name="senha" data-validate="password" placeholder="Senha">
                        <button type="submit">Cadastrar</button>
                    </form>
                `;
            case 'projetos':
                const projectsHtml = (state.projects || []).map(p => `<li>${p.nome} - ${p.descricao}</li>`).join('');
                return `
                    <h1>Projetos da ONG</h1>
                    <ul>${projectsHtml}</ul>
                    <button id="add-project">Adicionar Projeto</button>
                    <a href="#" data-nav="home">Voltar</a>
                `;
            default:
                return '<p>Página não encontrada.</p>';
        }
    };

    // MÓDULO: Validation (Validação de formulários)
  
    Validation.rules = {
        required: (value) => value.trim() !== '' || 'Este campo é obrigatório.',
        email: (value) => /\S+@\S+\.\S+/.test(value) || 'Email inválido.',
        password: (value) => value.length >= 8 || 'Senha deve ter pelo menos 8 caracteres.'
    };
    Validation.validateField = function(field) {
        const value = field.value;
        const rule = field.getAttribute('data-validate');
        if (!rule || !this.rules[rule]) return true;

        const error = this.rules[rule](value);
        if (typeof error === 'string') {
            this.showError(field, error);
            return false;
        }
        this.clearError(field);
        return true;
    };
    Validation.showError = function(field, message) {
        field.classList.add('error');
        let errorEl = field.nextElementSibling;
        if (!errorEl || !errorEl.classList.contains('error-message')) {
            errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            field.parentNode.insertBefore(errorEl, field.nextSibling);
        }
        errorEl.textContent = message;
    };
    Validation.clearError = function(field) {
        field.classList.remove('error');
        const errorEl = field.nextElementSibling;
        if (errorEl && errorEl.classList.contains('error-message')) {
            errorEl.remove();
        }
    };
    Validation.initFormValidation = function() {
        const form = document.getElementById('cadastro-form');
        if (!form) {
            console.warn('Formulário de cadastro não encontrado.');
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;
            const fields = form.querySelectorAll('[data-validate]');
            fields.forEach(field => {
                if (!this.validateField(field)) isValid = false;
            });

            if (isValid) {
                const data = new FormData(form);
                Storage.saveUserData(Object.fromEntries(data));
                alert('Cadastro realizado com sucesso!');
                Navigation.navigateTo('home');
            }
        });

        form.addEventListener('input', (e) => {
            if (e.target.hasAttribute('data-validate')) {
                this.validateField(e.target);
            }
        });
    };

    // MÓDULO: Projects (Lógica de projetos)
  
    Projects.initProjectsPage = function(projects) {
        const addBtn = document.getElementById('add-project');
        if (!addBtn) {
            console.warn('Botão de adicionar projeto não encontrado.');
            return;
        }

        addBtn.addEventListener('click', () => {
            const nome = prompt('Nome do projeto:');
            const descricao = prompt('Descrição:');
            if (nome && descricao) {
                projects.push({ nome, descricao });
                Storage.saveProjects(projects);
                App.renderPage('projetos');  // Agora App está definido
            }
        });
    };

    // MÓDULO: Navigation (Navegação SPA)
  
    Navigation.navigateTo = function(page) {
        history.pushState({ page: page }, '', `#${page}`);
        if (App && App.renderPage) {
            App.renderPage(page);
        }
    };

    // Escuta mudanças no histórico
  
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.page && App && App.renderPage) {
            App.renderPage(e.state.page);
        }
    });

    // APP PRINCIPAL (Estado global e inicialização)
  
    App.state = {
        currentPage: 'home',
        userData: null,
        projects: []
    };
    App.init = function() {
        console.log('App inicializada!');  // Log para debug
        this.state.userData = Storage.loadUserData();
        this.state.projects = Storage.loadProjects();
        this.renderPage(this.state.currentPage);
        this.setupGlobalEvents();
    };
    App.renderPage = function(page) {
        const container = document.getElementById('app-container');
        if (!container) {
            console.error('Container da app não encontrado. Certifique-se de ter <div id="app-container"></div> no HTML.');
            return;
        }

        container.innerHTML = '';
        const template = Templates.getTemplate(page, this.state);
        container.innerHTML = template;

        if (page === 'cadastro') {
            Validation.initFormValidation();
        } else if (page === 'projetos') {
            Projects.initProjectsPage(this.state.projects);
        }
    };
    App.setupGlobalEvents = function() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-nav]')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-nav');
                this.state.currentPage = page;
                Navigation.navigateTo(page);
            }
        });
    };
    App.getState = function() {
        return this.state;
    };

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
  
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof App.init === 'function') {
            App.init();
        } else {
            console.error('Erro: App.init não é uma função.');
        }
    });

    // Expõe globalmente para debug (remova em produção se não precisar)
  
    window.App = App;
    window.Navigation = Navigation;
    window.Validation = Validation;
    window.Storage = Storage;
    window.Templates = Templates;
    window.Projects = Projects;
    window.Helpers = Helpers;
})();
