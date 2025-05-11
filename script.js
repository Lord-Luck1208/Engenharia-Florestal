// Verificação global de autenticação
function verificarAutenticacao() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const paginaAtual = window.location.pathname.split('/').pop();
    
    // Páginas que não precisam de autenticação
    const paginasPublicas = ['login.html', 'registro.html', 'recuperar_senha.html', 'redefinir_senha.html'];
    
    if (!usuarioLogado && !paginasPublicas.includes(paginaAtual)) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Executar verificação quando a página carregar
document.addEventListener('DOMContentLoaded', verificarAutenticacao);

// Lógica de login
if (window.location.pathname.endsWith('login.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const nome = document.getElementById('login_nome').value;
            const senha = document.getElementById('login_senha').value;
            const tipo = document.getElementById('login_tipo').value;
            let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const usuarioExistente = usuarios.find(u => u.nome === nome && u.senha === senha && u.tipo === tipo);
            if (usuarioExistente) {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioExistente));
                mostrarNotificacao('Login realizado com sucesso!', 'sucesso');
                setTimeout(() => window.location.href = 'painel.html', 1000);
            } else {
                mostrarNotificacao('Nome, senha ou tipo de conta incorretos!', 'erro');
            }
        });
    });
}

// Lógica de recuperação de senha
if (window.location.pathname.endsWith('recuperar_senha.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        // Inicializar EmailJS
        emailjs.init("SEU_USER_ID"); // Substitua pelo seu User ID do EmailJS

        const recuperarSenhaForm = document.getElementById('recuperarSenhaForm');
        
        recuperarSenhaForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            
            // Buscar usuário pelo email
            let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const usuario = usuarios.find(u => u.email === email);
            
            if (usuario) {
                // Gerar token único para recuperação
                const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const linkRecuperacao = `${window.location.origin}/redefinir_senha.html?token=${token}`;
                
                // Salvar token no localStorage
                localStorage.setItem('tokenRecuperacao', JSON.stringify({
                    email: email,
                    token: token,
                    expiracao: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 horas
                }));

                // Enviar email usando EmailJS
                const templateParams = {
                    to_email: email,
                    link_recuperacao: linkRecuperacao
                };

                emailjs.send('SEU_SERVICE_ID', 'SEU_TEMPLATE_ID', templateParams)
                    .then(function(response) {
                        mostrarNotificacao('Link de recuperação enviado para seu email!', 'sucesso');
                        setTimeout(() => window.location.href = 'login.html', 1000);
                    }, function(error) {
                        mostrarNotificacao('Erro ao enviar email. Tente novamente mais tarde.', 'erro');
                        console.error('Erro:', error);
                    });
            } else {
                mostrarNotificacao('Email não encontrado no sistema!', 'erro');
            }
        });
    });
}

// Lógica de redefinição de senha
if (window.location.pathname.endsWith('redefinir_senha.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const redefinirSenhaForm = document.getElementById('redefinirSenhaForm');
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        // Verificar se o token é válido
        const tokenData = JSON.parse(localStorage.getItem('tokenRecuperacao') || 'null');
        
        if (!tokenData || tokenData.token !== token || new Date().getTime() > tokenData.expiracao) {
            mostrarNotificacao('Link de recuperação inválido ou expirado!', 'erro');
            setTimeout(() => window.location.href = 'login.html', 1000);
            return;
        }
        
        redefinirSenhaForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const novaSenha = document.getElementById('nova_senha').value;
            const confirmarSenha = document.getElementById('confirmar_senha').value;
            
            if (novaSenha !== confirmarSenha) {
                mostrarNotificacao('As senhas não coincidem!', 'erro');
                return;
            }
            
            // Atualizar senha do usuário
            let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const usuarioIndex = usuarios.findIndex(u => u.email === tokenData.email);
            
            if (usuarioIndex !== -1) {
                usuarios[usuarioIndex].senha = novaSenha;
                localStorage.setItem('usuarios', JSON.stringify(usuarios));
                
                // Remover token de recuperação
                localStorage.removeItem('tokenRecuperacao');
                
                mostrarNotificacao('Senha redefinida com sucesso!', 'sucesso');
                setTimeout(() => window.location.href = 'login.html', 1000);
            } else {
                mostrarNotificacao('Erro ao redefinir senha. Tente novamente mais tarde.', 'erro');
            }
        });
    });
}

// Exibir nome e tipo do usuário logado no painel.html
if (window.location.pathname.endsWith('painel.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const usuarioInfo = document.getElementById('usuario-info');
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) {
            window.location.href = 'login.html';
            return;
        }
        usuarioInfo.innerHTML = `<strong>Bem-vindo, ${usuarioLogado.nome}!</strong><br>Tipo de conta: <span style='color:#4e7c4e'>${usuarioLogado.tipo.charAt(0).toUpperCase() + usuarioLogado.tipo.slice(1)}</span>`;
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.onclick = function () {
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            };
        }
        const btnUsuarios = document.getElementById('btnUsuarios');
        if (btnUsuarios && usuarioLogado && usuarioLogado.tipo === 'administrador') {
            btnUsuarios.style.display = 'inline-block';
        }

        // Configurar o botão de Imóveis
        const btnImoveis = document.getElementById('btnImoveis');
        if (btnImoveis) {
            btnImoveis.addEventListener('click', function() {
                const listaImoveisPainel = document.getElementById('lista-imoveis-painel');
                if (!listaImoveisPainel) {
                    console.error('Elemento lista-imoveis-painel não encontrado');
                    return;
                }
                
                if (listaImoveisPainel.style.display === 'none' || !listaImoveisPainel.style.display) {
                    const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
                    let imoveisExibir = [];
                    if (usuarioLogado.tipo === 'administrador') {
                        imoveisExibir = imoveis;
                    } else {
                        imoveisExibir = imoveis.filter(imv => imv.usuario === usuarioLogado.email);
                    }
                    
                    if (imoveisExibir.length === 0) {
                        listaImoveisPainel.innerHTML = '<em>Nenhum imóvel cadastrado ainda.</em>';
                    } else {
                        let html = '<h3 style="margin-bottom:10px;">Seus Imóveis Cadastrados</h3>';
                        html += '<ul style="padding-left:0;list-style:none;">';
                        imoveisExibir.forEach(imv => {
                            let podeEditar = usuarioLogado.tipo === 'administrador' || imv.usuario === usuarioLogado.email;
                            html += `<li style='margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e6e6e6;display:flex;align-items:center;gap:10px;'>` +
                                `<span><strong>Imóvel:</strong> ${imv.imovel} | <strong>UPA:</strong> ${imv.upa} | <strong>Ano:</strong> ${imv.ano} | <strong>Proprietário:</strong> ${imv.proprietario}</span>` +
                                (podeEditar ? `<button class='btn-editar' style='padding:4px 10px;font-size:0.95em;' onclick='editarImovel(${imv.id})'>Alterar</button>` : '') +
                                (podeEditar ? `<button class='btn-excluir' style='padding:4px 10px;font-size:0.95em;' onclick='excluirImovel(${imv.id})'>Excluir</button>` : '') +
                                `</li>`;
                        });
                        html += '</ul>';
                        listaImoveisPainel.innerHTML = html;
                    }
                    listaImoveisPainel.style.display = 'block';
                } else {
                    listaImoveisPainel.style.display = 'none';
                }
            });
        }
    });
}

// Funções para editar/excluir imóvel no painel
window.editarImovelPainel = function(id) {
    const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
    const imv = imoveis.find(i => i.id === id);
    if (imv) {
        document.getElementById('edit_imovel_id_painel').value = imv.id;
        document.getElementById('edit_imovel_painel').value = imv.imovel;
        document.getElementById('edit_ano_painel').value = imv.ano;
        document.getElementById('edit_upa_painel').value = imv.upa;
        document.getElementById('edit_proprietario_painel').value = imv.proprietario;
        document.getElementById('modal-editar-imovel-painel').style.display = 'block';
    }
}
window.fecharModalImovelPainel = function() {
    document.getElementById('modal-editar-imovel-painel').style.display = 'none';
}
window.excluirImovelPainel = function(id) {
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
        let imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
        imoveis = imoveis.filter(i => i.id !== id);
        localStorage.setItem('imoveis', JSON.stringify(imoveis));
        // Atualizar lista
        location.reload();
    }
}
const formEditarImovelPainel = document.getElementById('form-editar-imovel-painel');
if (formEditarImovelPainel) {
    formEditarImovelPainel.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit_imovel_id_painel').value);
        const imovel = document.getElementById('edit_imovel_painel').value;
        const ano = document.getElementById('edit_ano_painel').value;
        const upa = document.getElementById('edit_upa_painel').value;
        const proprietario = document.getElementById('edit_proprietario_painel').value;
        let imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
        const index = imoveis.findIndex(i => i.id === id);
        if (index !== -1) {
            imoveis[index] = {
                ...imoveis[index],
                imovel,
                ano,
                upa,
                proprietario
            };
            localStorage.setItem('imoveis', JSON.stringify(imoveis));
            window.fecharModalImovelPainel();
            location.reload();
        }
    });
}

// Cadastro de imóvel
if (window.location.pathname.endsWith('cadastro_imovel.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('cadastroImovelForm');
        if (!form) return;
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) {
            window.location.href = 'login.html';
            return;
        }
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const imovel = document.getElementById('imovel').value;
            const ano = document.getElementById('ano').value;
            const upa = document.getElementById('upa').value;
            const proprietario = document.getElementById('proprietario').value;
            let imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
            const novoImovel = {
                id: Date.now(),
                imovel,
                ano,
                upa,
                proprietario,
                usuario: usuarioLogado.email
            };
            imoveis.push(novoImovel);
            localStorage.setItem('imoveis', JSON.stringify(imoveis));
            mostrarNotificacao('Imóvel cadastrado com sucesso!', 'sucesso');
            form.reset();
        });
    });
}

// Seleção de imóvel
if (window.location.pathname.endsWith('selecao_imovel.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) {
            window.location.href = 'login.html';
            return;
        }
        const selectImovel = document.getElementById('imovel');
        let imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
        // Sempre começa em 'Selecionar...'
        selectImovel.selectedIndex = 0;
        selectImovel.innerHTML = '<option value="">Selecionar...</option>';
        imoveis.forEach(imv => {
            const opt = document.createElement('option');
            opt.value = imv.id;
            opt.textContent = `${imv.imovel} - UPA ${imv.upa} - Ano: ${imv.ano} - Proprietário: ${imv.proprietario}`;
            selectImovel.appendChild(opt);
        });
        const form = document.getElementById('selecaoImovelForm');
        const arvoresContainer = document.getElementById('arvores-container');
        const listaArvores = document.getElementById('lista_arvores');
        const filtroNumero = document.getElementById('filtro_numero');
        const btnNovaArvore = document.getElementById('btnNovaArvore');
        let arvoresDoImovel = [];
        const modal = document.getElementById('modal-arvore');
        const detalhesArvore = document.getElementById('detalhes-arvore');
        const fecharModal = document.getElementById('fechar-modal-arvore');

        // Mostrar árvores ao clicar em 'Selecionar'
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const idSelecionado = selectImovel.value;
            if (!idSelecionado) {
                mostrarNotificacao('Selecione um imóvel!', 'erro');
                return;
            }
            localStorage.setItem('imovelSelecionado', idSelecionado);
            atualizarListaArvores(idSelecionado);
            arvoresContainer.style.display = 'block';
        });

        // Remover exibição automática ao mudar o select
        selectImovel.addEventListener('change', function () {
            arvoresContainer.style.display = 'none';
        });

        // Atualizar lista de árvores
        function atualizarListaArvores(imovelId) {
            const arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
            arvoresDoImovel = arvores.filter(arv => arv.imovelId == imovelId);
            renderizarListaArvores(arvoresDoImovel);
        }

        // Renderizar lista de árvores como botões
        function renderizarListaArvores(lista) {
            listaArvores.innerHTML = '';
            if (lista.length === 0) {
                listaArvores.innerHTML = '<li>Nenhuma árvore cadastrada neste imóvel.</li>';
                return;
            }
            const imovelAtual = imoveis.find(imv => imv.id == selectImovel.value);
            listaArvores.innerHTML = `<h3>Árvores da UPA ${imovelAtual.upa}</h3>`;
            lista.forEach(arv => {
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.textContent = `Nº: ${arv.num_arvore} | Espécie: ${arv.especie}`;
                btn.style.marginBottom = '6px';
                btn.onclick = function () {
                    mostrarDetalhesArvore(arv);
                };
                li.appendChild(btn);
                listaArvores.appendChild(li);
            });
        }

        // Filtro por número
        filtroNumero.addEventListener('input', function () {
            const termo = filtroNumero.value.trim();
            if (!termo) {
                renderizarListaArvores(arvoresDoImovel);
                return;
            }
            const filtradas = arvoresDoImovel.filter(arv => String(arv.num_arvore).includes(termo));
            renderizarListaArvores(filtradas);
        });

        // Botão cadastrar nova árvore
        btnNovaArvore.addEventListener('click', function () {
            if (selectImovel.value) {
                localStorage.setItem('imovelSelecionado', selectImovel.value);
                window.location.href = 'cadastro_arvore.html';
            }
        });

        // Modal de detalhes da árvore
        function mostrarDetalhesArvore(arv) {
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            let html = `<strong>Número:</strong> <span id='edit_num_arvore'>${arv.num_arvore}</span><br>` +
                `<strong>Espécie:</strong> <span id='edit_especie'>${arv.especie}</span><br>` +
                `<strong>UT:</strong> <span id='edit_ut'>${arv.ut}</span><br>` +
                `<strong>Faixa:</strong> <span id='edit_faixa'>${arv.faixa}</span><br>` +
                `<strong>CAP:</strong> <span id='edit_cap'>${arv.cap}</span><br>` +
                `<strong>Altura:</strong> <span id='edit_altura'>${arv.altura}</span><br>` +
                `<strong>Fuste:</strong> <span id='edit_fuste'>${arv.fuste}</span><br>` +
                `<strong>Xb:</strong> <span id='edit_xb'>${arv.xb}</span><br>` +
                `<strong>Yf:</strong> <span id='edit_yf'>${arv.yf}</span><br>` +
                `<strong>Coordenadas:</strong> <span id='edit_coordenadas'>${arv.coordenadas}</span><br>` +
                `<strong>Observação:</strong> <span id='edit_observacao'>${arv.observacao || ''}</span><br>` +
                `<strong>Status:</strong> <span id='edit_status'>${arv.status || 'Outro'}</span><br>`;
            if (arv.foto) {
                html += `<img src='${arv.foto}' alt='Foto da árvore' style='max-width:180px;max-height:140px;margin-top:8px;border-radius:8px;border:1.5px solid #8d6748;'>`;
            }
            html += `<div style='margin-top:12px;'>`;
            // Botões para ADM
            if (usuarioLogado.tipo === 'administrador') {
                html += `<button id='btnAlterarArvore'>Alterar</button> <button id='btnExcluirArvore' style='background:#a94442;'>Excluir</button> <button id='btnSalvarArvore' style='display:none;background:#4e7c4e;'>Salvar</button>`;
            } else {
                // Para usuário comum, só pode alterar uma vez por árvore
                let alterou = JSON.parse(localStorage.getItem('arvoreAlterada_' + arv.id + '_' + usuarioLogado.email) || 'false');
                html += `<button id='btnAlterarArvore' ${alterou ? 'disabled' : ''}>Alterar</button> <button id='btnSalvarArvore' style='display:none;background:#4e7c4e;'>Salvar</button>`;
            }
            html += `</div>`;
            detalhesArvore.innerHTML = html;
            modal.style.display = 'flex';

            // Função para tornar campos editáveis
            function habilitarEdicao() {
                ['num_arvore','especie','ut','faixa','cap','altura','fuste','xb','yf','coordenadas','observacao','status'].forEach(campo => {
                    const span = document.getElementById('edit_' + campo);
                    const valor = span.textContent;
                    span.innerHTML = `<input type='text' id='input_${campo}' value='${valor}'>`;
                });
            }
            // Função para salvar alterações
            function salvarEdicao() {
                let arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
                let novaArvore = { ...arv };
                ['num_arvore','especie','ut','faixa','cap','altura','fuste','xb','yf','coordenadas','observacao','status'].forEach(campo => {
                    const input = document.getElementById('input_' + campo);
                    if (input) novaArvore[campo] = input.value;
                });
                arvores = arvores.map(a => a.id === arv.id ? novaArvore : a);
                localStorage.setItem('arvores', JSON.stringify(arvores));
                // Se usuário comum, marca que já alterou
                if (usuarioLogado.tipo !== 'administrador') {
                    localStorage.setItem('arvoreAlterada_' + arv.id + '_' + usuarioLogado.email, 'true');
                }
                mostrarDetalhesArvore(novaArvore);
                // Atualizar o mapa se estiver na página do mapa
                if (window.location.pathname.endsWith('mapa.html')) {
                    location.reload();
                }
            }
            // Função para excluir árvore
            function excluirArvore() {
                if (confirm('Tem certeza que deseja excluir esta árvore?')) {
                    let arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
                    arvores = arvores.filter(a => a.id !== arv.id);
                    localStorage.setItem('arvores', JSON.stringify(arvores));
                    modal.style.display = 'none';
                    atualizarListaArvores(arv.imovelId);
                    // Atualizar o mapa se estiver na página do mapa
                    if (window.location.pathname.endsWith('mapa.html')) {
                        location.reload();
                    }
                }
            }
            // Eventos dos botões
            const btnAlterar = document.getElementById('btnAlterarArvore');
            const btnSalvar = document.getElementById('btnSalvarArvore');
            const btnExcluir = document.getElementById('btnExcluirArvore');
            if (btnAlterar) {
                btnAlterar.onclick = function () {
                    habilitarEdicao();
                    btnSalvar.style.display = 'inline-block';
                    btnAlterar.style.display = 'none';
                };
            }
            if (btnSalvar) {
                btnSalvar.onclick = function () {
                    salvarEdicao();
                };
            }
            if (btnExcluir) {
                btnExcluir.onclick = function () {
                    excluirArvore();
                };
            }
        }
        fecharModal.onclick = function () {
            modal.style.display = 'none';
        };
        modal.onclick = function (e) {
            if (e.target === modal) modal.style.display = 'none';
        };

        // Sempre começa em selecionar
        selectImovel.selectedIndex = 0;
        arvoresContainer.style.display = 'none';
    });
}

// Cadastro de árvore
if (window.location.pathname.endsWith('cadastro_arvore.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) {
            window.location.href = 'login.html';
            return;
        }
        const imovelSelecionado = localStorage.getItem('imovelSelecionado');
        if (!imovelSelecionado) {
            mostrarNotificacao('Selecione um imóvel primeiro!', 'erro');
            window.location.href = 'selecao_imovel.html';
            return;
        }
        const form = document.getElementById('cadastroArvoreForm');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            try {
                const ut = document.getElementById('ut').value;
                const faixa = document.getElementById('faixa').value;
                const num_arvore = document.getElementById('num_arvore').value;
                const especie = document.getElementById('especie').value;
                const cap = document.getElementById('cap').value;
                const altura = document.getElementById('altura').value;
                const fuste = document.getElementById('fuste').value;
                const observacao = document.getElementById('observacao').value;
                const xb = document.getElementById('xb').value;
                const yf = document.getElementById('yf').value;
                const coordenadas = document.getElementById('coordenadas').value;
                const fotoInput = document.getElementById('foto');
                let arvores = JSON.parse(localStorage.getItem('arvores') || '[]');

                // Validação dos campos
                if (!ut || !faixa || !num_arvore || !especie || !cap || !altura || !fuste || !xb || !yf) {
                    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios!', 'erro');
                    return;
                }

                function salvarArvore(fotoBase64) {
                    const novaArvore = {
                        id: Date.now(),
                        imovelId: imovelSelecionado,
                        ut, faixa, num_arvore, especie, cap, altura, fuste, observacao, xb, yf, coordenadas,
                        usuario: usuarioLogado.email,
                        foto: fotoBase64 || null,
                        status: 'Outro'
                    };
                    arvores.push(novaArvore);
                    localStorage.setItem('arvores', JSON.stringify(arvores));
                    mostrarNotificacao('Árvore cadastrada com sucesso!', 'sucesso');
                    form.reset();
                }

                if (fotoInput.files && fotoInput.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        // Redimensionar e comprimir a imagem
                        const img = new Image();
                        img.onload = function() {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 800;
                            const MAX_HEIGHT = 600;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            // Converter para JPEG com qualidade reduzida
                            const fotoComprimida = canvas.toDataURL('image/jpeg', 0.6);
                            salvarArvore(fotoComprimida);
                        };
                        img.src = e.target.result;
                    };
                    reader.onerror = function() {
                        mostrarNotificacao('Erro ao processar a foto. Tente novamente.', 'erro');
                    };
                    reader.readAsDataURL(fotoInput.files[0]);
                } else {
                    salvarArvore(null);
                }
            } catch (erro) {
                console.error('Erro ao cadastrar árvore:', erro);
                mostrarNotificacao('Ocorreu um erro ao cadastrar a árvore. Por favor, tente novamente.', 'erro');
            }
        });
    });
}

// Filtro e download
if (window.location.pathname.endsWith('filtro_download.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) {
            window.location.href = 'login.html';
            return;
        }
        const form = document.getElementById('filtroForm');
        const resultadosDiv = document.getElementById('resultados');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const imovelFiltro = document.getElementById('imovel').value.toLowerCase();
            const upaFiltro = document.getElementById('upa').value.toLowerCase();
            const anoFiltro = document.getElementById('ano').value;
            const proprietarioFiltro = document.getElementById('proprietario').value.toLowerCase();
            const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
            const arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
            
            // Filtrar imóveis
            let imoveisFiltrados = imoveis.filter(imv => {
                return (
                    (!imovelFiltro || imv.imovel.toLowerCase().includes(imovelFiltro)) &&
                    (!upaFiltro || imv.upa.toLowerCase().includes(upaFiltro)) &&
                    (!anoFiltro || imv.ano === anoFiltro) &&
                    (!proprietarioFiltro || imv.proprietario.toLowerCase().includes(proprietarioFiltro))
                );
            });

            // Filtrar árvores vinculadas aos imóveis filtrados
            let arvoresFiltradas = arvores.filter(arv => imoveisFiltrados.some(imv => imv.id == arv.imovelId));
            
            // Exibir resultados
            if (imoveisFiltrados.length === 0) {
                resultadosDiv.innerHTML = '<p>Nenhum imóvel encontrado.</p>';
                return;
            }

            let html = '<h3>Imóveis Encontrados</h3>';
            imoveisFiltrados.forEach(imv => {
                html += `<div style='margin-bottom:10px;'><strong>Imóvel:</strong> ${imv.imovel} | <strong>UPA:</strong> ${imv.upa} | <strong>Ano:</strong> ${imv.ano} | <strong>Proprietário:</strong> ${imv.proprietario}</div>`;
                const arvs = arvoresFiltradas.filter(arv => arv.imovelId == imv.id);
                if (arvs.length > 0) {
                    html += '<ul style="margin-bottom:10px;">';
                    arvs.forEach(arv => {
                        html += `<li>Árvore: UT ${arv.ut}, Faixa ${arv.faixa}, Nº ${arv.num_arvore}, Espécie: ${arv.especie}, CAP: ${arv.cap}, Altura: ${arv.altura}, Fuste: ${arv.fuste}, Xb: ${arv.xb}, Yf: ${arv.yf}, Coordenadas: ${arv.coordenadas}, Obs: ${arv.observacao}</li>`;
                    });
                    html += '</ul>';
                } else {
                    html += '<em>Nenhuma árvore cadastrada neste imóvel.</em>';
                }
            });
            resultadosDiv.innerHTML = html;
        });
    });
}

// Mapa interativo das árvores
if (window.location.pathname.endsWith('mapa.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const map = L.map('map').setView([-14.2350, -51.9253], 4); // Centro aproximado do Brasil
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        let arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
        const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
        let algumMarcador = false;
        let markers = []; // Array para armazenar os marcadores

        // Função para limpar todos os marcadores
        function limparMarcadores() {
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
        }

        // Função para atualizar o mapa
        function atualizarMapa() {
            limparMarcadores();
            arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
            arvores.forEach(arv => {
                if (arv.coordenadas && arv.coordenadas.includes(',')) {
                    const [lat, lng] = arv.coordenadas.split(',').map(Number);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        algumMarcador = true;
                        const imovel = imoveis.find(imv => imv.id == arv.imovelId);
                        let popupId = `popup_${arv.id}`;
                        let popup = `<strong>Espécie:</strong> ${arv.especie}<br>` +
                            `<strong>UT:</strong> ${arv.ut} | <strong>Faixa:</strong> ${arv.faixa} | <strong>Nº Árvore:</strong> ${arv.num_arvore}<br>` +
                            `<strong>Imóvel:</strong> ${imovel ? imovel.upa : ''} - ${imovel ? imovel.ano : ''}<br>` +
                            `<strong>CAP:</strong> ${arv.cap} | <strong>Altura:</strong> ${arv.altura}<br>` +
                            `<strong>Fuste:</strong> ${arv.fuste} | <strong>Xb:</strong> ${arv.xb} | <strong>Yf:</strong> ${arv.yf}<br>` +
                            `<strong>Obs:</strong> ${arv.observacao || ''}<br>`;
                        if (arv.foto) {
                            popup += `<img src='${arv.foto}' alt='Foto da árvore' style='max-width:180px;max-height:140px;margin-top:8px;border-radius:8px;border:1.5px solid #8d6748;'><br>`;
                        }
                        popup += `<div id='${popupId}_status' style='margin-top:10px;'>
                            <strong>Status:</strong> 
                            <span id='${popupId}_status_text'>${arv.status || 'Outro'}</span>
                            <div id='${popupId}_edit' style='display:none;margin-top:6px;'>
                                <label style='margin-right:12px;'><input type='radio' name='status_${arv.id}' value='Oca' ${(arv.status === 'Oca') ? 'checked' : ''}> Oca</label>
                                <label style='margin-right:12px;'><input type='radio' name='status_${arv.id}' value='Corte' ${(arv.status === 'Corte') ? 'checked' : ''}> Corte</label>
                                <label><input type='radio' name='status_${arv.id}' value='Outro' ${(arv.status === 'Outro' || !arv.status) ? 'checked' : ''}> Outro</label>
                            </div>
                            <button id='${popupId}_alterar' style='margin-top:6px;'>Alterar</button>
                            <button id='${popupId}_salvar' style='display:none;margin-top:6px;'>Salvar</button>
                        </div>`;

                        // Adicionar seção de imóvel
                        popup += `<div id='${popupId}_imovel' style='margin-top:12px;'>
                            <strong>Imóvel:</strong> 
                            <span id='${popupId}_imovel_text'>${imovel ? `${imovel.upa} - ${imovel.ano}` : 'Não associado'}</span>
                            <div id='${popupId}_imovel_edit' style='display:none;margin-top:6px;'>
                                <select id='${popupId}_imovel_select' style='width:100%;margin-bottom:6px;'>
                                    <option value=''>Selecione um imóvel...</option>
                                    ${imoveis.map(imv => `<option value='${imv.id}' ${imv.id == arv.imovelId ? 'selected' : ''}>${imv.upa} - ${imv.ano} - ${imv.proprietario}</option>`).join('')}
                                </select>
                            </div>
                            <button id='${popupId}_imovel_alterar' style='margin-top:6px;'>Alterar Imóvel</button>
                            <button id='${popupId}_imovel_salvar' style='display:none;margin-top:6px;'>Salvar</button>
                        </div>`;

                        const marker = L.marker([lat, lng]).addTo(map).bindPopup(popup);
                        markers.push(marker);
                        marker.on('popupopen', function () {
                            // Código existente para status
                            const alterarBtn = document.getElementById(`${popupId}_alterar`);
                            const salvarBtn = document.getElementById(`${popupId}_salvar`);
                            const editDiv = document.getElementById(`${popupId}_edit`);
                            const statusText = document.getElementById(`${popupId}_status_text`);
                            if (alterarBtn && salvarBtn && editDiv && statusText) {
                                alterarBtn.onclick = function () {
                                    editDiv.style.display = 'inline';
                                    salvarBtn.style.display = 'inline';
                                    alterarBtn.style.display = 'none';
                                };
                                salvarBtn.onclick = function () {
                                    const radios = document.getElementsByName(`status_${arv.id}`);
                                    let novoStatus = 'Outro';
                                    for (let r of radios) {
                                        if (r.checked) novoStatus = r.value;
                                    }
                                    arvores = arvores.map(a => a.id === arv.id ? { ...a, status: novoStatus } : a);
                                    localStorage.setItem('arvores', JSON.stringify(arvores));
                                    statusText.textContent = novoStatus;
                                    editDiv.style.display = 'none';
                                    salvarBtn.style.display = 'none';
                                    alterarBtn.style.display = 'inline';
                                    atualizarMapa();
                                };
                            }

                            // Novo código para imóvel
                            const alterarImovelBtn = document.getElementById(`${popupId}_imovel_alterar`);
                            const salvarImovelBtn = document.getElementById(`${popupId}_imovel_salvar`);
                            const editImovelDiv = document.getElementById(`${popupId}_imovel_edit`);
                            const imovelText = document.getElementById(`${popupId}_imovel_text`);
                            const imovelSelect = document.getElementById(`${popupId}_imovel_select`);

                            if (alterarImovelBtn && salvarImovelBtn && editImovelDiv && imovelText && imovelSelect) {
                                alterarImovelBtn.onclick = function () {
                                    editImovelDiv.style.display = 'block';
                                    salvarImovelBtn.style.display = 'inline-block';
                                    alterarImovelBtn.style.display = 'none';
                                };

                                salvarImovelBtn.onclick = function () {
                                    const novoImovelId = imovelSelect.value;
                                    arvores = arvores.map(a => a.id === arv.id ? { ...a, imovelId: novoImovelId } : a);
                                    localStorage.setItem('arvores', JSON.stringify(arvores));
                                    
                                    const imovelSelecionado = imoveis.find(imv => imv.id == novoImovelId);
                                    imovelText.textContent = imovelSelecionado ? 
                                        `${imovelSelecionado.upa} - ${imovelSelecionado.ano}` : 
                                        'Não associado';
                                    
                                    editImovelDiv.style.display = 'none';
                                    salvarImovelBtn.style.display = 'none';
                                    alterarImovelBtn.style.display = 'inline-block';
                                    atualizarMapa();
                                };
                            }
                        });
                    }
                }
            });
            if (!algumMarcador) {
                setTimeout(() => {
                    mostrarNotificacao('Nenhuma árvore cadastrada com coordenadas válidas para exibir no mapa.', 'info');
                }, 500);
            }
        }

        // Inicializar o mapa
        atualizarMapa();

        // Adicionar botão de atualizar
        const container = document.querySelector('.container');
        const btnAtualizar = document.createElement('button');
        btnAtualizar.textContent = 'Atualizar Mapa';
        btnAtualizar.style.marginTop = '12px';
        btnAtualizar.onclick = atualizarMapa;
        container.appendChild(btnAtualizar);
    });
}

// NOVA LÓGICA DE LOGIN/CADASTRO DIVIDIDO
if (window.location.pathname.endsWith('login.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        // Login
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const nome = document.getElementById('login_nome').value;
            const senha = document.getElementById('login_senha').value;
            const tipo = document.getElementById('login_tipo').value;
            let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const usuarioExistente = usuarios.find(u => u.nome === nome && u.senha === senha && u.tipo === tipo);
            if (usuarioExistente) {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioExistente));
                mostrarNotificacao('Login realizado com sucesso!', 'sucesso');
                setTimeout(() => window.location.href = 'painel.html', 1000);
            } else {
                mostrarNotificacao('Nome, senha ou tipo de conta incorretos!', 'erro');
            }
        });
    });
}

if (window.location.pathname.endsWith('registro.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        // Cadastro
        const cadastroForm = document.getElementById('cadastroForm');
        cadastroForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const nome = document.getElementById('cadastro_nome').value;
            const email = document.getElementById('cadastro_email').value;
            const senha = document.getElementById('cadastro_senha').value;
            const tipo = document.getElementById('cadastro_tipo').value;
            let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            if (usuarios.find(u => u.nome === nome && u.tipo === tipo)) {
                mostrarNotificacao('Nome já cadastrado para este tipo de conta!', 'erro');
                return;
            }
            if (usuarios.find(u => u.email === email)) {
                mostrarNotificacao('E-mail já cadastrado!', 'erro');
                return;
            }
            const novoUsuario = { nome, email, senha, tipo };
            usuarios.push(novoUsuario);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            mostrarNotificacao('Cadastro realizado com sucesso! Agora faça login.', 'sucesso');
            cadastroForm.reset();
        });
    });
}

// Página de usuários cadastrados (apenas para administradores)
if (window.location.pathname.endsWith('usuarios.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado || usuarioLogado.tipo !== 'administrador') {
            mostrarNotificacao('Acesso restrito! Apenas administradores podem ver esta página.', 'erro');
            setTimeout(() => window.location.href = 'painel.html', 1000);
            return;
        }
        // Atualizar usuários antigos para garantir que todos tenham id
        let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        let alterou = false;
        usuarios = usuarios.map((u, idx) => {
            if (!u.id) {
                u.id = Date.now() + idx + Math.floor(Math.random()*10000);
                alterou = true;
            }
            return u;
        });
        if (alterou) {
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
        }
        carregarUsuarios();

        // Configurar o formulário de edição
        const formEditar = document.getElementById('form-editar');
        if (formEditar) {
            formEditar.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const id = parseInt(document.getElementById('edit_id').value);
                const nome = document.getElementById('edit_nome').value;
                const email = document.getElementById('edit_email').value;
                const tipo = document.getElementById('edit_tipo').value;
                const novaSenha = document.getElementById('edit_senha').value;
                
                let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                const index = usuarios.findIndex(u => u.id === id);
                
                if (index !== -1) {
                    usuarios[index] = {
                        ...usuarios[index],
                        nome,
                        email,
                        tipo,
                        // Mantém a senha atual se não for informada uma nova
                        senha: novaSenha ? novaSenha : usuarios[index].senha
                    };
                    
                    localStorage.setItem('usuarios', JSON.stringify(usuarios));
                    fecharModal();
                    carregarUsuarios();
                    mostrarNotificacao('Usuário atualizado com sucesso!', 'sucesso');
                }
            });
        }
    });
}

function carregarUsuarios() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const tabela = document.getElementById('tabela-usuarios');
    
    if (usuarios.length === 0) {
        tabela.innerHTML = '<p>Nenhum usuário cadastrado.</p>';
        return;
    }

    let html = `
        <table>
            <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Tipo de Conta</th>
                <th>Ações</th>
            </tr>
    `;

    usuarios.forEach(usuario => {
        html += `
            <tr>
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>${usuario.tipo}</td>
                <td class="acoes">
                    <button onclick="editarUsuario(${usuario.id})" class="btn-editar">Alterar</button>
                    <button onclick="excluirUsuario(${usuario.id})" class="btn-excluir">Excluir</button>
                </td>
            </tr>
        `;
    });

    html += '</table>';
    tabela.innerHTML = html;
}

function editarUsuario(id) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuario = usuarios.find(u => u.id === id);
    
    if (usuario) {
        document.getElementById('edit_id').value = usuario.id;
        document.getElementById('edit_nome').value = usuario.nome;
        document.getElementById('edit_email').value = usuario.email;
        document.getElementById('edit_tipo').value = usuario.tipo;
        document.getElementById('edit_senha').value = ''; // Limpa o campo de senha
        document.getElementById('modal-editar').style.display = 'block';
    }
}

function fecharModal() {
    document.getElementById('modal-editar').style.display = 'none';
}

function excluirUsuario(id) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        usuarios = usuarios.filter(u => u.id !== id);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        carregarUsuarios();
        mostrarNotificacao('Usuário excluído com sucesso!', 'sucesso');
    }
}

// Função para mostrar/esconder lista de imóveis
window.mostrarListaImoveis = function() {
    console.log('Função mostrarListaImoveis chamada');
    const listaImoveisPainel = document.getElementById('lista-imoveis-painel');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    if (!listaImoveisPainel) {
        console.error('Elemento lista-imoveis-painel não encontrado');
        return;
    }
    
    console.log('Estado atual da lista:', listaImoveisPainel.style.display);
    
    if (listaImoveisPainel.style.display === 'none' || !listaImoveisPainel.style.display) {
        const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
        console.log('Imóveis encontrados:', imoveis.length);
        
        let imoveisExibir = [];
        if (usuarioLogado.tipo === 'administrador') {
            imoveisExibir = imoveis;
        } else {
            imoveisExibir = imoveis.filter(imv => imv.usuario === usuarioLogado.email);
        }
        
        if (imoveisExibir.length === 0) {
            listaImoveisPainel.innerHTML = '<em>Nenhum imóvel cadastrado ainda.</em>';
        } else {
            let html = '<h3 style="margin-bottom:10px;">Seus Imóveis Cadastrados</h3>';
            html += '<ul style="padding-left:0;list-style:none;">';
            imoveisExibir.forEach(imv => {
                let podeEditar = usuarioLogado.tipo === 'administrador' || imv.usuario === usuarioLogado.email;
                html += `<li style='margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e6e6e6;display:flex;align-items:center;gap:10px;'>` +
                    `<span><strong>Imóvel:</strong> ${imv.imovel} | <strong>UPA:</strong> ${imv.upa} | <strong>Ano:</strong> ${imv.ano} | <strong>Proprietário:</strong> ${imv.proprietario}</span>` +
                    (podeEditar ? `<button class='btn-editar' style='padding:4px 10px;font-size:0.95em;' onclick='editarImovel(${imv.id})'>Alterar</button>` : '') +
                    (podeEditar ? `<button class='btn-excluir' style='padding:4px 10px;font-size:0.95em;' onclick='excluirImovel(${imv.id})'>Excluir</button>` : '') +
                    `</li>`;
            });
            html += '</ul>';
            listaImoveisPainel.innerHTML = html;
        }
        listaImoveisPainel.style.display = 'block';
        console.log('Lista exibida');
    } else {
        listaImoveisPainel.style.display = 'none';
        console.log('Lista ocultada');
    }
}

// Página de lista de imóveis
if (window.location.pathname.endsWith('lista_imoveis.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) {
            window.location.href = 'login.html';
            return;
        }

        // Carregar lista de imóveis
        function carregarListaImoveis() {
            const listaImoveis = document.getElementById('lista-imoveis');
            const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
            let imoveisExibir = [];
            
            if (usuarioLogado.tipo === 'administrador') {
                imoveisExibir = imoveis;
            } else {
                imoveisExibir = imoveis.filter(imv => imv.usuario === usuarioLogado.email);
            }

            if (imoveisExibir.length === 0) {
                listaImoveis.innerHTML = '<em>Nenhum imóvel cadastrado ainda.</em>';
            } else {
                let html = '<ul style="padding-left:0;list-style:none;">';
                imoveisExibir.forEach(imv => {
                    let podeEditar = usuarioLogado.tipo === 'administrador' || imv.usuario === usuarioLogado.email;
                    html += `<li style='margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e6e6e6;display:flex;align-items:center;gap:10px;'>` +
                        `<span><strong>Imóvel:</strong> ${imv.imovel} | <strong>UPA:</strong> ${imv.upa} | <strong>Ano:</strong> ${imv.ano} | <strong>Proprietário:</strong> ${imv.proprietario}</span>` +
                        (podeEditar ? `<button class='btn-editar' style='padding:4px 10px;font-size:0.95em;' onclick='editarImovel(${imv.id})'>Alterar</button>` : '') +
                        (podeEditar ? `<button class='btn-excluir' style='padding:4px 10px;font-size:0.95em;' onclick='excluirImovel(${imv.id})'>Excluir</button>` : '') +
                        `</li>`;
                });
                html += '</ul>';
                listaImoveis.innerHTML = html;
            }
        }

        // Configurar formulário de edição
        function configurarFormularioEdicao() {
            const formEditarImovel = document.getElementById('form-editar-imovel');
            if (formEditarImovel) {
                formEditarImovel.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const id = parseInt(document.getElementById('edit_imovel_id').value);
                    const imovel = document.getElementById('edit_imovel').value;
                    const ano = document.getElementById('edit_ano').value;
                    const upa = document.getElementById('edit_upa').value;
                    const proprietario = document.getElementById('edit_proprietario').value;
                    let imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
                    const index = imoveis.findIndex(i => i.id === id);
                    if (index !== -1) {
                        imoveis[index] = {
                            ...imoveis[index],
                            imovel,
                            ano,
                            upa,
                            proprietario
                        };
                        localStorage.setItem('imoveis', JSON.stringify(imoveis));
                        window.fecharModalImovel();
                        carregarListaImoveis();
                    }
                });
            }
        }

        // Inicializar
        carregarListaImoveis();
        configurarFormularioEdicao();
    });
}

// Função para editar imóvel
function editarImovel(id) {
    const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
    const imovel = imoveis.find(imv => imv.id === id);

    if (!imovel) {
        mostrarNotificacao('Imóvel não encontrado!', 'erro');
        return;
    }

    // Preencher o formulário do modal com os dados do imóvel
    document.getElementById('edit_imovel_id').value = imovel.id;
    document.getElementById('edit_imovel').value = imovel.imovel;
    document.getElementById('edit_upa').value = imovel.upa;
    document.getElementById('edit_ano').value = imovel.ano;
    document.getElementById('edit_proprietario').value = imovel.proprietario;

    // Exibir o modal
    document.getElementById('modal-editar-imovel').style.display = 'block';
}

// Função para excluir imóvel
function excluirImovel(id) {
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
        const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
        const arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
        
        const imoveisAtualizados = imoveis.filter(imv => imv.id !== id);
        localStorage.setItem('imoveis', JSON.stringify(imoveisAtualizados));
        
        const arvoresAtualizadas = arvores.filter(arv => arv.imovelId !== id);
        localStorage.setItem('arvores', JSON.stringify(arvoresAtualizadas));
        
        carregarImoveisRegistrados();
        mostrarNotificacao('Imóvel excluído com sucesso!', 'sucesso');
    }
}

// Função para gerar planilha Excel
document.addEventListener('DOMContentLoaded', function() {
    const btnDownloadExcel = document.getElementById('btnDownloadExcel');
    if (btnDownloadExcel) {
        btnDownloadExcel.addEventListener('click', function() {
            try {
                const imovelFiltro = document.getElementById('imovel').value.toLowerCase();
                const upaFiltro = document.getElementById('upa').value.toLowerCase();
                const anoFiltro = document.getElementById('ano').value;
                const proprietarioFiltro = document.getElementById('proprietario').value.toLowerCase();

                const imoveis = JSON.parse(localStorage.getItem('imoveis') || '[]');
                const arvores = JSON.parse(localStorage.getItem('arvores') || '[]');
                
                // Filtrar imóveis
                let imoveisFiltrados = imoveis.filter(imv => {
                    return (
                        (!imovelFiltro || imv.imovel.toLowerCase().includes(imovelFiltro)) &&
                        (!upaFiltro || imv.upa.toLowerCase().includes(upaFiltro)) &&
                        (!anoFiltro || imv.ano === anoFiltro) &&
                        (!proprietarioFiltro || imv.proprietario.toLowerCase().includes(proprietarioFiltro))
                    );
                });

                if (imoveisFiltrados.length === 0) {
                    mostrarNotificacao('Nenhum imóvel encontrado para gerar a planilha.', 'info');
                    return;
                }

                // Criar workbook
                const wb = XLSX.utils.book_new();
                
                // Criar planilha de imóveis
                const imoveisData = imoveisFiltrados.map(imv => ({
                    'Imóvel': imv.imovel,
                    'UPA': imv.upa,
                    'Ano': imv.ano,
                    'Proprietário': imv.proprietario
                }));
                const wsImoveis = XLSX.utils.json_to_sheet(imoveisData);
                XLSX.utils.book_append_sheet(wb, wsImoveis, "Imóveis");

                // Filtrar árvores dos imóveis encontrados
                const arvoresFiltradas = arvores.filter(arv => 
                    imoveisFiltrados.some(imv => imv.id == arv.imovelId)
                );

                // Criar planilha de árvores
                const arvoresData = arvoresFiltradas.map(arv => {
                    const imovel = imoveis.find(imv => imv.id == arv.imovelId);
                    return {
                        'Imóvel': imovel ? imovel.imovel : 'Não associado',
                        'UPA': imovel ? imovel.upa : 'Não associado',
                        'UT': arv.ut,
                        'Faixa': arv.faixa,
                        'Número da Árvore': arv.num_arvore,
                        'Espécie': arv.especie,
                        'CAP': arv.cap,
                        'Altura': arv.altura,
                        'Fuste': arv.fuste,
                        'Xb': arv.xb,
                        'Yf': arv.yf,
                        'Coordenadas': arv.coordenadas,
                        'Observação': arv.observacao || '',
                        'Status': arv.status || 'Outro'
                    };
                });
                const wsArvores = XLSX.utils.json_to_sheet(arvoresData);
                XLSX.utils.book_append_sheet(wb, wsArvores, "Árvores");

                // Gerar e baixar o arquivo
                XLSX.writeFile(wb, 'dados_imoveis_arvores.xlsx');
            } catch (erro) {
                console.error('Erro ao gerar planilha:', erro);
                mostrarNotificacao('Ocorreu um erro ao gerar a planilha. Por favor, tente novamente.', 'erro');
            }
        });
    }
});

// Função para mostrar notificações personalizadas
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remover notificações existentes
    const notificacoesExistentes = document.querySelectorAll('.notificacao');
    notificacoesExistentes.forEach(notif => {
        notif.classList.add('fechando');
        setTimeout(() => notif.remove(), 300);
    });

    // Criar nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    
    // Adicionar ícone baseado no tipo
    let icone = '';
    switch(tipo) {
        case 'sucesso':
            icone = '✓';
            break;
        case 'erro':
            icone = '✕';
            break;
        default:
            icone = 'ℹ';
    }
    
    notificacao.innerHTML = `
        <span class="icone">${icone}</span>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notificacao.classList.add('fechando');
        setTimeout(() => notificacao.remove(), 300);
    }, 5000);
}