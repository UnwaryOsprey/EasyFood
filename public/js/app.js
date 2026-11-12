const API = {
  me: '/auth/me',
  restaurants: '/restaurants'
};

let todosRestaurantes = [];
let restauranteEmEdicao = null;
let pratoEmEdicao = null;
let usuarioAtual = null;

// ===== Imagens: restaurante, prato e perfil =====
const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
const LIMITE_IMAGEM = 5 * 1024 * 1024; // 5 MB, igual ao servidor

// Só aceita caminhos gerados pelo servidor (/uploads/...), evitando URLs estranhas.
function urlImagemSegura(url) {
  return typeof url === 'string' && /^\/uploads\/[\w\-./]+$/.test(url) ? url : null;
}

function criarFoto(url, alt, inicial, classe) {
  const caixa = document.createElement('div');
  caixa.className = classe;
  const segura = urlImagemSegura(url);

  if (segura) {
    const img = document.createElement('img');
    img.src = segura;
    img.alt = alt || '';
    img.loading = 'lazy';
    caixa.appendChild(img);
  } else {
    caixa.textContent = inicial || '◎';
  }
  return caixa;
}

function escolherImagem() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = TIPOS_IMAGEM.join(',');
    input.addEventListener('change', () => resolve(input.files[0] || null), { once: true });
    input.addEventListener('cancel', () => resolve(null), { once: true });
    input.click();
  });
}

function validarArquivoImagem(arquivo) {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return 'Use uma imagem JPEG, PNG ou WebP.';
  if (arquivo.size > LIMITE_IMAGEM) return 'A imagem deve ter no máximo 5 MB.';
  return null;
}

// Envia a imagem como multipart/form-data. O apiFetch já coloca o token.
async function enviarImagem(url, arquivo) {
  const formData = new FormData();
  formData.append('image', arquivo);

  const response = await apiFetch(url, { method: 'POST', body: formData });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.error || 'Não foi possível enviar a imagem.');
  return data;
}

// Escolhe, valida e envia. Devolve a resposta do servidor ou null (cancelado/erro).
async function selecionarEEnviar(url) {
  const arquivo = await escolherImagem();
  if (!arquivo) return null;

  const erro = validarArquivoImagem(arquivo);
  if (erro) {
    mostrarStatus(erro, 'error');
    return null;
  }

  try {
    mostrarStatus('Enviando imagem...', 'success');
    return await enviarImagem(url, arquivo);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return null;
    mostrarStatus(error.message, 'error');
    return null;
  }
}

function injetarEstilosImagens() {
  if (document.getElementById('efImagensStyle')) return;
  const style = document.createElement('style');
  style.id = 'efImagensStyle';
  style.textContent = `
    .ef-card-photo{width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#efe7db;color:#8b6f47;display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:600;margin-bottom:12px}
    .ef-card-photo img,.ef-dish-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .ef-avatar{width:36px;height:36px;border-radius:50%;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;background:var(--primary,#8b6f47);color:#fff;font-weight:600;border:0;padding:0;cursor:pointer;flex:none}
    .ef-avatar img{width:100%;height:100%;object-fit:cover;display:block}
    .ef-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;display:flex;align-items:center;justify-content:center;padding:16px}
    .ef-modal{background:var(--surface,#fff);color:var(--text-primary,#2c3e50);border-radius:12px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
    .ef-modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid #e8e8e8}
    .ef-modal-head h2{margin:0;font-size:1.25rem}
    .ef-close{background:none;border:0;font-size:1.8rem;line-height:1;cursor:pointer;color:inherit;padding:4px 8px}
    .ef-modal-body{padding:8px 20px 20px}
    .ef-dish{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #eee}
    .ef-dish-thumb{width:64px;height:64px;border-radius:8px;overflow:hidden;background:#efe7db;color:#8b6f47;display:flex;align-items:center;justify-content:center;flex:none;font-size:1.4rem}
    .ef-dish-info{flex:1;min-width:0}
    .ef-dish-info strong,.ef-dish-info p{display:block;margin:0;overflow-wrap:anywhere}
    .ef-dish-info p{font-size:.88rem;opacity:.8}
    .ef-dish-price{font-weight:600;white-space:nowrap}
    .ef-dish-actions{display:flex;flex-direction:column;gap:6px;flex:none}
    .ef-form [hidden]{display:none!important}
    .ef-form-actions{display:grid;gap:8px}
    .ef-empty{padding:18px 0;opacity:.75}
    .ef-form{display:grid;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid #e8e8e8}
    .ef-form h3{margin:0;font-size:1rem}
    .ef-form input,.ef-form textarea{width:100%;padding:9px 11px;border:1px solid #ddd;border-radius:6px;font:inherit;background:#fff;color:#2c3e50}
    .edit-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;padding:16px;overflow-y:auto}
    .edit-modal-overlay.show{display:flex;align-items:center;justify-content:center}
    .edit-modal-content{background:#fff;color:#2c3e50;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.2);width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
    .edit-modal-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid #e8e8e8}
    .edit-modal-header h2{margin:0;font-size:1.3rem}
    .edit-modal-close{background:none;border:0;font-size:1.8rem;line-height:1;cursor:pointer;color:inherit;padding:4px 10px;border-radius:6px}
    .edit-modal-close:hover{background:#f3f3f3}
    .edit-modal-form{padding:18px 22px 22px;display:grid;gap:14px}
    .edit-modal-form .form-group{margin:0;display:grid;gap:6px}
    .edit-modal-form .form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .edit-modal-form label{font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
    .edit-modal-form input,.edit-modal-form textarea{width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid #ddd;border-radius:6px;font:inherit;background:#fff;color:#2c3e50}
    .edit-modal-form textarea{resize:vertical;min-height:70px}
    .edit-modal-form .rating-input-wrapper{display:flex;align-items:center;gap:8px}
    .edit-modal-form .rating-unit{white-space:nowrap;opacity:.7;font-size:.9rem}
    .edit-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:4px}
    @media (max-width:480px){.edit-modal-form .form-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function formatarPreco(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';
}

function obterToken() {
  return localStorage.getItem('token');
}

function limparSessao() {
  localStorage.removeItem('token');
}

function escaparHTML(valor) {
  const div = document.createElement('div');
  div.textContent = String(valor);
  return div.innerHTML;
}

function mostrarStatus(mensagem, tipo = 'success') {
  const status = document.getElementById('status');
  if (!status) return;

  status.textContent = mensagem;
  status.className = `status-toast show ${tipo}`;

  window.clearTimeout(mostrarStatus.timer);
  mostrarStatus.timer = window.setTimeout(() => {
    status.classList.remove('show');
    status.textContent = '';
  }, 4000);
}

function redirecionarParaLogin() {
  const destino = `${window.location.pathname}${window.location.search}`;
  const query = encodeURIComponent(destino || '/');
  window.location.replace(`/auth/login?redirect=${query}`);
}

async function validarSessao() {
  const token = obterToken();
  if (!token) {
    redirecionarParaLogin();
    return null;
  }

  try {
    const response = await fetch(API.me, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (response.status === 401) {
      limparSessao();
      redirecionarParaLogin();
      return null;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Erro ao validar autenticação:', error);
    mostrarStatus('Não foi possível validar sua sessão.', 'error');
    return null;
  }
}

async function apiFetch(url, options = {}) {
  const token = obterToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    limparSessao();
    redirecionarParaLogin();
    throw new Error('UNAUTHORIZED');
  }

  return response;
}

function atualizarResumo(lista) {
  const total = lista.length;
  const categorias = new Set(lista.map((rest) => String(rest.category ?? '').trim()).filter(Boolean)).size;
  const ratings = lista
    .map((rest) => Number(rest.rating))
    .filter((value) => Number.isFinite(value));
  const media = ratings.length
    ? (ratings.reduce((acc, value) => acc + value, 0) / ratings.length).toFixed(1)
    : '—';

  const totalEl = (document.getElementById('statTotal') || document.getElementById('totalRestaurantes'));
  const categoriasEl = (document.getElementById('statCategories') || document.getElementById('totalCategorias'));
  const mediaEl = (document.getElementById('statAverage') || document.getElementById('mediaAvaliacoes'));

  if (totalEl) totalEl.textContent = total;
  if (categoriasEl) categoriasEl.textContent = categorias;
  if (mediaEl) mediaEl.textContent = media;
}

function inicialDaCategoria(categoria) {
  const texto = String(categoria || '').trim();
  return texto ? texto[0].toUpperCase() : 'R';
}

function exibirRestaurantes(lista) {
  const container = document.getElementById('listaRestaurantes');
  if (!container) return;

  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◎</div>
        <h3>Nenhum restaurante encontrado</h3>
        <p>Cadastre um novo estabelecimento ou escolha outra categoria</p>
        <a href="#add" class="btn-secondary">Adicionar agora</a>
      </div>
    `;
    return;
  }

  lista.forEach((rest) => {
    const card = document.createElement('article');
    card.className = 'restaurant-card';

    const nome = escaparHTML(rest.name ?? 'Sem nome');
    const categoria = escaparHTML(rest.category ?? 'Sem categoria');
    const descricao = rest.description ? escaparHTML(rest.description) : '';
    const endereco = rest.address ? escaparHTML(rest.address) : '';
    const telefone = rest.phone ? escaparHTML(rest.phone) : '';
    const ratingValue = rest.rating == null ? null : Number(rest.rating);
    const rating = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : 'N/A';
    const ehDono = Boolean(usuarioAtual) && rest.userId === usuarioAtual.id;

    card.innerHTML = `
      <div class="restaurant-header">
        <div>
          <h3 class="restaurant-title">${nome}</h3>
          <span class="restaurant-category">${categoria}</span>
        </div>
        <div class="restaurant-rating">★ ${rating}</div>
      </div>

      ${descricao ? `<p class="restaurant-description">${descricao}</p>` : ''}

      <div class="restaurant-details">
        ${endereco ? `<div class="detail-item"><span>📍</span> ${endereco}</div>` : ''}
        ${telefone ? `<div class="detail-item"><span>📞</span> ${telefone}</div>` : ''}
      </div>

      <div class="restaurant-actions">
        <button type="button" class="btn-small" data-action="menu" data-id="${rest.id}" aria-label="Ver cardápio">
          Cardápio
        </button>
        ${ehDono ? `<button type="button" class="btn-small" data-action="photo" data-id="${rest.id}" aria-label="Enviar foto do restaurante">
          Foto
        </button>` : ''}
        <button type="button" class="btn-small" data-action="edit" data-id="${rest.id}" aria-label="Editar restaurante">
          Editar
        </button>
        <button type="button" class="btn-small btn-danger" data-action="delete" data-id="${rest.id}" aria-label="Deletar restaurante">
          Deletar
        </button>
      </div>
    `;

    card.prepend(criarFoto(rest.imageUrl, rest.name, inicialDaCategoria(rest.category), 'ef-card-photo'));
    container.appendChild(card);
  });

  // Adicionar event listeners para os botões de ação
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id, 10);
      deletarRestaurante(id);
    });
  });

  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id, 10);
      abrirModalEditar(id);
    });
  });

  document.querySelectorAll('[data-action="menu"]').forEach(btn => {
    btn.addEventListener('click', () => abrirCardapio(parseInt(btn.dataset.id, 10)));
  });

  document.querySelectorAll('[data-action="photo"]').forEach(btn => {
    btn.addEventListener('click', () => enviarFotoRestaurante(parseInt(btn.dataset.id, 10)));
  });
}

function atualizarFiltros(lista) {
  const select = document.getElementById('filtroCategory');
  if (!select) return;

  const valorAtual = select.value;
  const categorias = [...new Set(lista.map((rest) => rest.category).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

  select.innerHTML = '<option value="">Todas as categorias</option>';
  categorias.forEach((categoria) => {
    const option = document.createElement('option');
    option.value = categoria;
    option.textContent = categoria;
    select.appendChild(option);
  });

  if (categorias.includes(valorAtual)) select.value = valorAtual;
}

function filtrarRestaurantes() {
  const select = document.getElementById('filtroCategory');
  const categoria = select?.value || '';
  const filtrados = categoria
    ? todosRestaurantes.filter((rest) => rest.category === categoria)
    : todosRestaurantes;

  exibirRestaurantes(filtrados);
}

async function carregarRestaurantes() {
  try {
    const response = await apiFetch(API.restaurants, { cache: 'no-store' });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const dados = await response.json();
    todosRestaurantes = Array.isArray(dados)
      ? dados
      : Array.isArray(dados.restaurants)
        ? dados.restaurants
        : [];

    atualizarResumo(todosRestaurantes);
    exibirRestaurantes(todosRestaurantes);
    atualizarFiltros(todosRestaurantes);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;

    console.error('Erro ao carregar restaurantes:', error);
    document.getElementById('listaRestaurantes').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h3>Não foi possível carregar</h3>
        <p>Verifique a conexão com o servidor e tente novamente</p>
      </div>
    `;
    mostrarStatus('Erro ao conectar com o servidor da API.', 'error');
  }
}

async function cadastrarRestaurante(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = document.getElementById('submitButton');
  const novoRestaurante = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    description: document.getElementById('description')?.value.trim() || '',
    address: document.getElementById('address')?.value.trim() || '',
    phone: document.getElementById('phone')?.value.trim() || '',
    rating: Number(document.getElementById('rating').value)
  };

  ['description', 'address', 'phone'].forEach((campo) => {
    if (!novoRestaurante[campo]) delete novoRestaurante[campo];
  });

  if (!novoRestaurante.name || !novoRestaurante.category) {
    mostrarStatus('Preencha nome e categoria.', 'error');
    return;
  }

  if (!Number.isFinite(novoRestaurante.rating) || novoRestaurante.rating < 0 || novoRestaurante.rating > 5) {
    mostrarStatus('A avaliação deve estar entre 0 e 5.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Cadastrando...';

  try {
    const response = await apiFetch(API.restaurants, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoRestaurante)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao cadastrar restaurante.', 'error');
      return;
    }

    form.reset();
    mostrarStatus('Restaurante cadastrado com sucesso!', 'success');
    await carregarRestaurantes();
    (document.getElementById('restaurants') || document.getElementById('catalogo'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro na requisição POST:', error);
    mostrarStatus('Não foi possível conectar ao servidor.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Cadastrar Restaurante <span>→</span>';
  }
}

function abrirModalEditar(id) {
  const restaurante = todosRestaurantes.find(r => r.id === id);
  if (!restaurante) {
    mostrarStatus('Restaurante não encontrado.', 'error');
    return;
  }

  restauranteEmEdicao = restaurante;

  // Criar ou atualizar modal
  let modal = document.getElementById('editModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'edit-modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="edit-modal-content">
      <div class="edit-modal-header">
        <h2>Editar Restaurante</h2>
        <button type="button" class="edit-modal-close" aria-label="Fechar">&times;</button>
      </div>

      <form id="editForm" class="edit-modal-form">
        <div class="form-group">
          <label for="editName">Nome do Restaurante</label>
          <input 
            type="text" 
            id="editName" 
            maxlength="120"
            value="${escaparHTML(restaurante.name || '')}"
            required
          >
        </div>

        <div class="form-group">
          <label for="editCategory">Categoria</label>
          <input 
            type="text" 
            id="editCategory" 
            maxlength="80"
            value="${escaparHTML(restaurante.category || '')}"
            required
          >
        </div>

        <div class="form-group">
          <label for="editDescription">Descrição</label>
          <textarea 
            id="editDescription" 
            maxlength="300"
            rows="3"
          >${escaparHTML(restaurante.description || '')}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="editAddress">Endereço</label>
            <input 
              type="text" 
              id="editAddress" 
              maxlength="200"
              value="${escaparHTML(restaurante.address || '')}"
            >
          </div>

          <div class="form-group">
            <label for="editPhone">Telefone</label>
            <input 
              type="tel" 
              id="editPhone" 
              value="${escaparHTML(restaurante.phone || '')}"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="editRating">Avaliação</label>
          <div class="rating-input-wrapper">
            <input 
              type="number" 
              id="editRating" 
              step="0.1"
              min="0"
              max="5"
              value="${restaurante.rating || ''}"
              required
            >
            <span class="rating-unit">★ / 5</span>
          </div>
        </div>

        <div class="edit-modal-actions">
          <button type="button" class="btn-secondary" id="cancelEditButton">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" id="submitEditButton">
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('show');

  // Event listeners
  const closeBtn = modal.querySelector('.edit-modal-close');
  const cancelBtn = modal.querySelector('#cancelEditButton');
  const form = modal.querySelector('#editForm');

  closeBtn.addEventListener('click', fecharModalEditar);
  cancelBtn.addEventListener('click', fecharModalEditar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModalEditar();
  });
  form.addEventListener('submit', salvarEdicaoRestaurante);
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('editModal')?.classList.contains('show')) fecharModalEditar();
  if (document.getElementById('cardapioModal')) fecharCardapio();
});

function fecharModalEditar() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.classList.remove('show');
    restauranteEmEdicao = null;
  }
}

async function salvarEdicaoRestaurante(event) {
  event.preventDefault();

  if (!restauranteEmEdicao) return;

  const id = restauranteEmEdicao.id;
  const submitButton = document.getElementById('submitEditButton');

  const dadosAtualizados = {
    name: document.getElementById('editName').value.trim(),
    category: document.getElementById('editCategory').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    address: document.getElementById('editAddress').value.trim(),
    phone: document.getElementById('editPhone').value.trim(),
    rating: Number(document.getElementById('editRating').value)
  };

  if (!dadosAtualizados.name || !dadosAtualizados.category) {
    mostrarStatus('Preencha nome e categoria.', 'error');
    return;
  }

  if (!Number.isFinite(dadosAtualizados.rating) || dadosAtualizados.rating < 0 || dadosAtualizados.rating > 5) {
    mostrarStatus('A avaliação deve estar entre 0 e 5.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Salvando...';

  try {
    const response = await apiFetch(`${API.restaurants}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtualizados)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao atualizar restaurante.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Salvar Alterações';
      return;
    }

    mostrarStatus('Restaurante atualizado com sucesso!', 'success');
    fecharModalEditar();
    await carregarRestaurantes();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao atualizar restaurante:', error);
    mostrarStatus('Não foi possível atualizar o restaurante.', 'error');
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar Alterações';
  }
}

async function deletarRestaurante(id) {
  // Confirmação antes de deletar
  if (!confirm('Tem certeza que deseja deletar este restaurante? Esta ação não pode ser desfeita.')) {
    return;
  }

  try {
    const response = await apiFetch(`${API.restaurants}/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao deletar restaurante.', 'error');
      return;
    }

    mostrarStatus('Restaurante deletado com sucesso!', 'success');
    await carregarRestaurantes();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao deletar restaurante:', error);
    mostrarStatus('Não foi possível deletar o restaurante.', 'error');
  }
}

function configurarIdentidade(usuario) {
  configurarAvatar(usuario);

  const userName = document.getElementById('userName') || document.getElementById('authStatus');
  if (!userName) return;

  const nome = usuario?.name || 'Usuário';
  userName.textContent = nome;
  userName.title = usuario?.email || nome;
}

// ----- Foto do restaurante -----
async function enviarFotoRestaurante(id) {
  const resultado = await selecionarEEnviar(`${API.restaurants}/${id}/image`);
  if (!resultado) return;

  mostrarStatus('Foto do restaurante atualizada!', 'success');
  await carregarRestaurantes();
}

// ----- Cardápio (pratos do restaurante) -----
function fecharCardapio() {
  document.getElementById('cardapioModal')?.remove();
}

async function abrirCardapio(restaurantId) {
  const restaurante = todosRestaurantes.find((r) => r.id === restaurantId);
  if (!restaurante) {
    mostrarStatus('Restaurante não encontrado.', 'error');
    return;
  }

  let pratos = [];
  try {
    const response = await apiFetch(`${API.restaurants}/${restaurantId}/dishes`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    pratos = await response.json();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao carregar cardápio:', error);
    mostrarStatus('Não foi possível carregar o cardápio.', 'error');
    return;
  }

  renderizarCardapio(restaurante, Array.isArray(pratos) ? pratos : []);
}

function renderizarCardapio(restaurante, pratos) {
  fecharCardapio();
  pratoEmEdicao = null;

  const ehDono = Boolean(usuarioAtual) && restaurante.userId === usuarioAtual.id;

  const overlay = document.createElement('div');
  overlay.id = 'cardapioModal';
  overlay.className = 'ef-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fecharCardapio();
  });

  const modal = document.createElement('div');
  modal.className = 'ef-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const cabecalho = document.createElement('div');
  cabecalho.className = 'ef-modal-head';
  const titulo = document.createElement('h2');
  titulo.textContent = `Cardápio — ${restaurante.name}`;
  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.className = 'ef-close';
  fechar.setAttribute('aria-label', 'Fechar');
  fechar.textContent = '×';
  fechar.addEventListener('click', fecharCardapio);
  cabecalho.append(titulo, fechar);

  const corpo = document.createElement('div');
  corpo.className = 'ef-modal-body';

  if (!pratos.length) {
    const vazio = document.createElement('p');
    vazio.className = 'ef-empty';
    vazio.textContent = ehDono
      ? 'Nenhum prato cadastrado ainda. Adicione o primeiro abaixo.'
      : 'Este restaurante ainda não cadastrou pratos.';
    corpo.appendChild(vazio);
  }

  pratos.forEach((prato) => {
    const item = document.createElement('div');
    item.className = 'ef-dish';

    const info = document.createElement('div');
    info.className = 'ef-dish-info';
    const nome = document.createElement('strong');
    nome.textContent = prato.name;
    info.appendChild(nome);
    if (prato.description) {
      const desc = document.createElement('p');
      desc.textContent = prato.description;
      info.appendChild(desc);
    }

    const preco = document.createElement('span');
    preco.className = 'ef-dish-price';
    preco.textContent = formatarPreco(prato.price);

    item.append(criarFoto(prato.imageUrl, prato.name, '◎', 'ef-dish-thumb'), info, preco);

    if (ehDono) {
      const acoes = document.createElement('div');
      acoes.className = 'ef-dish-actions';

      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'btn-small';
      botao.textContent = prato.imageUrl ? 'Trocar foto' : 'Foto';
      botao.setAttribute('aria-label', `Enviar foto do prato ${prato.name}`);
      botao.addEventListener('click', async () => {
        const resultado = await selecionarEEnviar(`/dishes/${prato.id}/image`);
        if (!resultado) return;
        mostrarStatus('Foto do prato atualizada!', 'success');
        abrirCardapio(restaurante.id);
      });
      acoes.appendChild(botao);

      const editar = document.createElement('button');
      editar.type = 'button';
      editar.className = 'btn-small';
      editar.dataset.action = 'edit-dish';
      editar.textContent = 'Editar';
      editar.setAttribute('aria-label', `Editar o prato ${prato.name}`);
      editar.addEventListener('click', () => iniciarEdicaoPrato(prato));
      acoes.appendChild(editar);

      if (prato.imageUrl) {
        const remover = document.createElement('button');
        remover.type = 'button';
        remover.className = 'btn-small';
        remover.dataset.action = 'remove-dish-photo';
        remover.textContent = 'Remover foto';
        remover.setAttribute('aria-label', `Remover foto do prato ${prato.name}`);
        remover.addEventListener('click', () => removerFotoPrato(prato, restaurante.id));
        acoes.appendChild(remover);
      }

      const excluir = document.createElement('button');
      excluir.type = 'button';
      excluir.className = 'btn-small btn-danger';
      excluir.dataset.action = 'delete-dish';
      excluir.textContent = 'Excluir';
      excluir.setAttribute('aria-label', `Excluir o prato ${prato.name}`);
      excluir.addEventListener('click', () => excluirPrato(prato, restaurante.id));
      acoes.appendChild(excluir);

      item.appendChild(acoes);
    }

    corpo.appendChild(item);
  });

  if (ehDono) {
    const form = document.createElement('form');
    form.className = 'ef-form';
    form.innerHTML = `
      <h3 id="pratoFormTitulo">Adicionar prato</h3>
      <input type="text" id="pratoNome" maxlength="120" placeholder="Nome do prato" required>
      <textarea id="pratoDescricao" rows="2" maxlength="300" placeholder="Descrição"></textarea>
      <input type="number" id="pratoPreco" step="0.01" min="0" placeholder="Preço (ex.: 49.90)" required>
      <div class="ef-form-actions">
        <button type="submit" class="btn-primary" id="pratoSubmit">Adicionar prato</button>
        <button type="button" class="btn-secondary" id="pratoCancelar" hidden>Cancelar edição</button>
      </div>
    `;
    form.querySelector('#pratoCancelar').addEventListener('click', cancelarEdicaoPrato);
    form.addEventListener('submit', (e) => cadastrarPrato(e, restaurante.id));
    corpo.appendChild(form);
  }

  modal.append(cabecalho, corpo);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function removerFotoPrato(prato, restaurantId) {
  if (!confirm(`Remover a foto do prato "${prato.name}"?`)) return;

  try {
    const response = await apiFetch(`/dishes/${prato.id}/image`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao remover a foto.', 'error');
      return;
    }

    mostrarStatus('Foto do prato removida.', 'success');
    abrirCardapio(restaurantId);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao remover foto do prato:', error);
    mostrarStatus('Não foi possível remover a foto.', 'error');
  }
}

async function excluirPrato(prato, restaurantId) {
  if (!confirm(`Excluir o prato "${prato.name}"? Esta ação não pode ser desfeita.`)) return;

  try {
    const response = await apiFetch(`/dishes/${prato.id}`, { method: 'DELETE' });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      mostrarStatus(data.error || 'Erro ao excluir o prato.', 'error');
      return;
    }

    mostrarStatus('Prato excluído.', 'success');
    abrirCardapio(restaurantId);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao excluir prato:', error);
    mostrarStatus('Não foi possível excluir o prato.', 'error');
  }
}

function mostrarFormularioPrato(editando) {
  const titulo = document.getElementById('pratoFormTitulo');
  const enviar = document.getElementById('pratoSubmit');
  const cancelar = document.getElementById('pratoCancelar');
  if (titulo) titulo.textContent = editando ? 'Editar prato' : 'Adicionar prato';
  if (enviar) enviar.textContent = editando ? 'Salvar alterações' : 'Adicionar prato';
  if (cancelar) cancelar.hidden = !editando;
}

function iniciarEdicaoPrato(prato) {
  const nome = document.getElementById('pratoNome');
  if (!nome) return;

  pratoEmEdicao = prato;
  nome.value = prato.name || '';
  document.getElementById('pratoDescricao').value = prato.description || '';
  document.getElementById('pratoPreco').value = Number(prato.price);
  mostrarFormularioPrato(true);

  nome.closest('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  nome.focus();
}

function cancelarEdicaoPrato() {
  pratoEmEdicao = null;
  const nome = document.getElementById('pratoNome');
  nome?.closest('form')?.reset();
  mostrarFormularioPrato(false);
}

async function cadastrarPrato(event, restaurantId) {
  event.preventDefault();

  const nome = document.getElementById('pratoNome').value.trim();
  const descricao = document.getElementById('pratoDescricao').value.trim();
  const preco = Number(document.getElementById('pratoPreco').value);

  if (!nome) {
    mostrarStatus('Informe o nome do prato.', 'error');
    return;
  }
  if (!Number.isFinite(preco) || preco < 0) {
    mostrarStatus('Informe um preço válido.', 'error');
    return;
  }

  const editando = Boolean(pratoEmEdicao);

  try {
    const response = await apiFetch(
      editando ? `/dishes/${pratoEmEdicao.id}` : `${API.restaurants}/${restaurantId}/dishes`,
      {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, description: descricao, price: preco })
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || (editando ? 'Erro ao atualizar prato.' : 'Erro ao cadastrar prato.'), 'error');
      return;
    }

    mostrarStatus(
      editando ? 'Prato atualizado!' : 'Prato cadastrado! Agora você pode enviar a foto dele.',
      'success'
    );
    abrirCardapio(restaurantId);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao cadastrar prato:', error);
    mostrarStatus('Não foi possível cadastrar o prato.', 'error');
  }
}

// ----- Foto de perfil do usuário -----
function atualizarAvatar(avatar, usuario) {
  avatar.textContent = '';
  const url = urlImagemSegura(usuario?.imageUrl);

  if (url) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    avatar.appendChild(img);
  } else {
    avatar.textContent = String(usuario?.name || 'U').trim().charAt(0).toUpperCase() || 'U';
  }
}

function configurarAvatar(usuario) {
  let avatar = document.getElementById('userAvatar');

  if (!avatar) {
    const userName = document.getElementById('userName');
    if (!userName?.parentNode) return;

    avatar = document.createElement('button');
    avatar.type = 'button';
    avatar.id = 'userAvatar';
    userName.parentNode.insertBefore(avatar, userName);
  }

  avatar.classList.add('ef-avatar');
  avatar.title = 'Clique para trocar sua foto de perfil';
  avatar.setAttribute('role', 'button');
  avatar.setAttribute('tabindex', '0');
  atualizarAvatar(avatar, usuario);

  if (avatar.dataset.bound !== '1') {
    avatar.dataset.bound = '1';
    avatar.addEventListener('click', trocarFotoPerfil);
    avatar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trocarFotoPerfil();
      }
    });
  }
}

async function trocarFotoPerfil() {
  const resultado = await selecionarEEnviar('/users/me/image');
  if (!resultado) return;

  usuarioAtual = { ...usuarioAtual, imageUrl: resultado.imageUrl };
  const avatar = document.getElementById('userAvatar');
  if (avatar) atualizarAvatar(avatar, usuarioAtual);
  mostrarStatus('Foto de perfil atualizada!', 'success');
}

async function fazerLogout() {
  limparSessao();
  window.location.replace('/auth/login');
}

function aplicarTiltCards(root = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cards = root.querySelectorAll?.('.tilt-card') || [];
  cards.forEach((card) => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';

    const strength = Number(card.dataset.tiltStrength || 5);

    const reset = () => {
      card.style.transform = '';
    };

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - .5) * strength;
      const rotateX = (0.5 - y) * strength;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
  });
}

function configurarInteracoes() {
  aplicarTiltCards(document);

  const revealItems = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
}

async function iniciarHome() {
  const usuario = await validarSessao();
  if (!usuario) return;

  usuarioAtual = usuario;

  configurarIdentidade(usuario);
  document.getElementById('loadingScreen')?.classList.add('hidden');
  document.getElementById('appContent')?.classList.remove('hidden');
  configurarInteracoes();
  await carregarRestaurantes();
}

document.addEventListener('DOMContentLoaded', () => {
  injetarEstilosImagens();
  document.getElementById('formCadastro')?.addEventListener('submit', cadastrarRestaurante);
  document.getElementById('filtroCategory')?.addEventListener('change', filtrarRestaurantes);
  document.getElementById('logoutButton')?.addEventListener('click', fazerLogout);
  iniciarHome();
});