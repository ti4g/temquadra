// js/components/ui.js
// Peças de interface compartilhadas: ícones, toast, confirmação e a gaveta arrastável.

const TRACOS = {
    busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    voltar: '<path d="M15 18l-6-6 6-6"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    alvo: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
    rota: '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
    compartilhar: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    coracao: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>',
    luz: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>',
    banheiro: '<circle cx="6.5" cy="4.5" r="1.6"/><path d="M4.5 21v-5.5H3.8V10a1.6 1.6 0 0 1 1.6-1.6h2.2A1.6 1.6 0 0 1 9.2 10v5.5h-.7V21"/><path d="M12 3v18"/><circle cx="17.5" cy="4.5" r="1.6"/><path d="M16 21v-4.5h-2.3l1.9-6.9a1.5 1.5 0 0 1 1.5-1.2h.8a1.5 1.5 0 0 1 1.5 1.2l1.9 6.9H19V21"/>',
    bebedouro: '<path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z"/><path d="M9.3 14.3a2.8 2.8 0 0 0 2.7 2.9"/>',
    teto: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    piso: '<rect x="6" y="2.5" width="12" height="19" rx="1.5"/><path d="M6 12h12M9.5 2.5v3h5v-3M9.5 21.5v-3h5v3"/><circle cx="12" cy="12" r="2.4"/>',
    pino: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    foto: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    whatsapp: '<path d="M3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 8 19.4z"/><path d="M9.2 8.2c-.4 2.8 3.7 6.9 6.6 6.6l.9-1.6-2-1.1-1 .9a4.5 4.5 0 0 1-2.7-2.7l.9-1-1.1-2z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lapis: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    sair: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
    entrar: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    caixa: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/>'
};

/** SVG de traço pronto pra colar no HTML (decorativo). */
export function icone(nome, extra = '') {
    return `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${TRACOS[nome] || ''}</svg>`;
}

/* ---------- Foto que não carrega ----------
   Imagem com data-reserva troca pra ela se o arquivo sumir do storage,
   em vez de mostrar o ícone de imagem quebrada. */
export function usarImagemReserva() {
    document.addEventListener('error', ev => {
        const img = ev.target;
        if (img.tagName !== 'IMG' || !img.dataset.reserva) return;
        img.src = img.dataset.reserva;
        delete img.dataset.reserva;
    }, true);
}

/* ---------- Toast ---------- */
let pilhaToasts;

export function avisar(mensagem, { tipo = 'ok', duracao = 3200 } = {}) {
    if (!pilhaToasts) {
        pilhaToasts = document.createElement('div');
        pilhaToasts.className = 'toasts';
        pilhaToasts.setAttribute('role', 'status');
        pilhaToasts.setAttribute('aria-live', 'polite');
        document.body.appendChild(pilhaToasts);
    }
    const t = document.createElement('div');
    t.className = `toast${tipo === 'erro' ? ' toast--erro' : ''}`;
    t.innerHTML = `${icone(tipo === 'erro' ? 'alerta' : 'check')}<span></span>`;
    t.querySelector('span').textContent = mensagem;
    pilhaToasts.appendChild(t);
    setTimeout(() => {
        t.classList.add('toast--saindo');
        t.addEventListener('animationend', () => t.remove(), { once: true });
    }, duracao);
}

/* ---------- Confirmação (substitui o confirm() do navegador) ---------- */
export function confirmar({ titulo, texto = '', confirmar: rotulo = 'Confirmar', perigo = false }) {
    return new Promise(resolve => {
        const d = document.createElement('dialog');
        d.className = 'dialogo';
        d.innerHTML = `
            <h2></h2>
            <p></p>
            <div class="dialogo__acoes">
                <button type="button" class="btn btn--claro" value="nao">Cancelar</button>
                <button type="button" class="btn ${perigo ? 'btn--perigo' : 'btn--escuro'}" value="sim"></button>
            </div>`;
        d.querySelector('h2').textContent = titulo;
        d.querySelector('p').textContent = texto;
        d.querySelector('[value="sim"]').textContent = rotulo;
        d.addEventListener('click', ev => {
            const b = ev.target.closest('button');
            if (b) d.close(b.value);
            else if (ev.target === d) d.close('nao');
        });
        d.addEventListener('close', () => { resolve(d.returnValue === 'sim'); d.remove(); });
        document.body.appendChild(d);
        d.showModal();
    });
}

/* ---------- Gaveta arrastável (bottom sheet) ----------
   No celular a gaveta tem três alturas: espiando, meio e cheia.
   Arrasta pela "alça" (cabeçalho); a lista só rola quando ela está cheia.
   No computador (largura >= 900px) vira painel lateral fixo e o arraste é ignorado. */
export function criarGaveta(el, { alca, corpo, topoLivre = () => 0, espiar = () => 230, aoMudar } = {}) {
    const DESKTOP = window.matchMedia('(min-width: 900px)');
    const pontos = () => {
        const h = window.innerHeight;
        const cheia = topoLivre() + 8;
        return { cheia, meio: Math.max(h * 0.45, cheia + 40), espiando: h - espiar() };
    };
    let estado = 'espiando';
    let inicioY = 0, inicioPos = 0, posAtual = 0, arrastando = false, moveu = false, ultimoY = 0, ultimoT = 0, velocidade = 0;

    // Arrastar vale na gaveta toda; quando ela está cheia, a lista rola normalmente
    // e só o cabeçalho (ou a lista já no topo, puxando pra baixo) arrasta.
    function podeArrastar(ev) {
        if (DESKTOP.matches || ev.button > 0) return false;
        if (ev.target.closest('input, select, textarea')) return false;
        if (estado === 'cheia' && corpo?.contains(ev.target) && corpo.scrollTop > 0) return false;
        return true;
    }

    function aplicar(novo, animar = true) {
        estado = novo;
        el.dataset.estado = novo;
        if (DESKTOP.matches) { el.style.transform = ''; return; }
        posAtual = pontos()[novo];
        el.style.transition = animar ? 'transform .42s var(--mola)' : 'none';
        el.style.transform = `translateY(${posAtual}px)`;
        aoMudar?.(novo);
    }

    function soltar() {
        if (!arrastando) return;
        arrastando = false;
        el.classList.remove('arrastando');
        if (!moveu) return;
        const p = pontos();
        // Um "peteleco" rápido decide pela direção; devagar, vai pro ponto mais perto.
        let alvo;
        if (Math.abs(velocidade) > 0.6) {
            const ordem = ['cheia', 'meio', 'espiando'];
            const i = ordem.indexOf(estado);
            alvo = velocidade > 0 ? ordem[Math.min(i + 1, 2)] : ordem[Math.max(i - 1, 0)];
            // se arrastou além de um ponto, respeita a posição
            const maisPerto = Object.entries(p).sort((a, b) => Math.abs(a[1] - posAtual) - Math.abs(b[1] - posAtual))[0][0];
            if (Math.abs(ordem.indexOf(maisPerto) - i) > 1) alvo = maisPerto;
        } else {
            alvo = Object.entries(p).sort((a, b) => Math.abs(a[1] - posAtual) - Math.abs(b[1] - posAtual))[0][0];
        }
        aplicar(alvo);
    }

    el.addEventListener('pointerdown', ev => {
        if (!podeArrastar(ev)) return;
        arrastando = true; moveu = false;
        inicioY = ultimoY = ev.clientY; ultimoT = performance.now();
        inicioPos = posAtual; velocidade = 0;
        el.classList.add('arrastando');
        el.style.transition = 'none';
    });
    window.addEventListener('pointermove', ev => {
        if (!arrastando) return;
        const dy = ev.clientY - inicioY;
        if (Math.abs(dy) > 4) moveu = true;
        const p = pontos();
        posAtual = Math.min(Math.max(inicioPos + dy, p.cheia - 20), p.espiando + 40);
        el.style.transform = `translateY(${posAtual}px)`;
        const agora = performance.now();
        velocidade = (ev.clientY - ultimoY) / Math.max(agora - ultimoT, 1);
        ultimoY = ev.clientY; ultimoT = agora;
    });
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);

    // Depois de um arraste, o "click" que o navegador dispara não pode abrir um card.
    el.addEventListener('click', ev => {
        if (moveu) { ev.stopPropagation(); ev.preventDefault(); moveu = false; }
    }, true);

    // Toque simples no cabeçalho alterna entre espiando e meio.
    alca?.addEventListener('click', () => {
        if (DESKTOP.matches) return;
        aplicar(estado === 'espiando' ? 'meio' : 'espiando');
    });

    window.addEventListener('resize', () => aplicar(estado, false));
    DESKTOP.addEventListener('change', () => aplicar(estado, false));
    aplicar('espiando', false);

    return {
        ir: novo => aplicar(novo),
        estado: () => estado,
        ehDesktop: () => DESKTOP.matches
    };
}
export function ativarRolagemFiltros() {
  const container = document.getElementById('filtros');
  if (!container) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let arrastou = false;

  container.addEventListener('mousedown', (e) => {
    // Se clicar em um input/label/chip, não trava a interação padrão
    if (e.target.closest('input, label, .chip')) return;

    isDown = true;
    arrastou = false;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => { isDown = false; });
  container.addEventListener('mouseup', () => { isDown = false; });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) arrastou = true;
    container.scrollLeft = scrollLeft - walk;
  });
}