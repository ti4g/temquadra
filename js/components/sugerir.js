// js/components/sugerir.js
// Painel "Sugerir quadra": formulário + mini-mapa, envia para
// POST /quadras/sugestoes (multipart: "dados" em JSON + "fotos").
import { enviarSugestao } from '../services/sugestoes.service.js';
import { formatarWhatsapp } from '../core/utils.js';
import { icone, avisar } from './ui.js';
import { criarSeletorLocal } from './seletor-local.js';
import { htmlEscolhaPiso, htmlEscolhaCobertura, htmlExtras, lerExtras, criarSeletorFotos, validarObrigatorios, limparErroAoDigitar } from './campos-quadra.js';

let painel;
let local = null;
let fotos = null;
let extras = [];

function htmlFormulario() {
    return `
        <div class="painel__topo">
            <h2 id="sugerir-titulo">Sugerir quadra</h2>
            <button type="button" class="btn-icone" data-fechar aria-label="Fechar">${icone('fechar')}</button>
        </div>
        <form class="painel__corpo form" id="form-sugerir" novalidate>
            <p class="campo__dica">A equipe confere cada sugestão antes de ela aparecer no mapa.</p>

            <fieldset>
                <legend>Onde ela fica?</legend>
                <div id="s-local"></div>
            </fieldset>

            <div class="campo">
                <label class="campo__rotulo" for="s-endereco">Endereço ou referência</label>
                <input class="entrada" id="s-endereco" name="endereco" required placeholder="Ex.: Alameda 12, ao lado da escola">
                <p class="campo__erro" hidden>Conta pra gente onde fica a quadra.</p>
            </div>
            <div class="campo">
                <label class="campo__rotulo" for="s-bairro">Quadra ou bairro</label>
                <input class="entrada" id="s-bairro" name="bairroRegiao" placeholder="Ex.: 305 Sul">
            </div>

            <div class="campo">
                <label class="campo__rotulo" for="s-nome">Nome da quadra</label>
                <input class="entrada" id="s-nome" name="nome" required placeholder="Ex.: Quadra da Praça da 305 Sul">
                <p class="campo__erro" hidden>Dê um nome pra quadra, mesmo que seja só um apelido.</p>
            </div>

            <fieldset>
                <legend>Tipo de piso</legend>
                <div class="escolhas">${htmlEscolhaPiso()}</div>
            </fieldset>
            <fieldset>
                <legend>Cobertura</legend>
                <div class="escolhas">${htmlEscolhaCobertura()}</div>
            </fieldset>

            <label class="interruptor">Tem iluminação à noite<input type="checkbox" name="iluminacao"></label>
            ${htmlExtras(extras)}

            <fieldset>
                <legend>Fotos (até 3)</legend>
                <div class="fotos" id="s-fotos"></div>
            </fieldset>

            <div class="campo">
                <label class="campo__rotulo" for="s-descricao">Algo mais que vale saber? (opcional)</label>
                <textarea class="entrada" id="s-descricao" name="descricao" placeholder="Ex.: tem bebedouro, a rede de vôlei está rasgada…"></textarea>
            </div>

            <fieldset>
                <legend>Quer que a gente te avise? (opcional)</legend>
                <div class="linha-2">
                    <input class="entrada" name="nomeSolicitante" placeholder="Seu nome" autocomplete="name" aria-label="Seu nome">
                    <input class="entrada" name="telefoneSolicitante" id="s-zap" placeholder="WhatsApp" inputmode="tel" autocomplete="tel" aria-label="Seu WhatsApp">
                </div>
            </fieldset>
        </form>
        <div class="painel__rodape">
            <button type="submit" form="form-sugerir" class="btn btn--primario" id="s-enviar">Enviar sugestão</button>
        </div>`;
}

function htmlSucesso() {
    return `
        <div class="painel__topo">
            <h2 id="sugerir-titulo">Sugestão enviada</h2>
            <button type="button" class="btn-icone" data-fechar aria-label="Fechar">${icone('fechar')}</button>
        </div>
        <div class="painel__corpo">
            <div class="sucesso">
                <span class="sucesso__selo">${icone('check')}</span>
                <h2>Valeu pela ajuda!</h2>
                <p>Sua sugestão foi pra fila da equipe. Assim que ela for aprovada, a quadra aparece no mapa pra todo mundo.</p>
                <button type="button" class="btn btn--escuro" id="s-outra">Sugerir outra quadra</button>
                <button type="button" class="btn btn--claro" data-fechar>Voltar pro mapa</button>
            </div>
        </div>`;
}

async function enviar(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    if (!validarObrigatorios(form, ['s-endereco', 's-nome'])) return;

    const d = new FormData(form);
    const ponto = local.obter();
    const dados = {
        nome: d.get('nome').trim(),
        endereco: d.get('endereco').trim(),
        bairroRegiao: d.get('bairroRegiao').trim() || null,
        tipoPiso: d.get('tipoPiso'),
        cobertura: d.get('cobertura'),
        iluminacao: d.get('iluminacao') === 'on',
        ...lerExtras(form, extras),
        descricao: d.get('descricao').trim() || null,
        latitude: ponto?.lat ?? null,
        longitude: ponto?.lng ?? null,
        nomeSolicitante: d.get('nomeSolicitante').trim() || null,
        telefoneSolicitante: d.get('telefoneSolicitante').trim() || null
    };

    const corpo = new FormData();
    corpo.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
    fotos.arquivos().forEach(a => corpo.append('fotos', a));

    const botao = painel.querySelector('#s-enviar');
    botao.disabled = true;
    botao.textContent = 'Enviando…';
    try {
        await enviarSugestao(corpo);
        limpar();
        painel.innerHTML = htmlSucesso();
        painel.querySelector('#s-outra').addEventListener('click', () => prepararSugerir());
    } catch (err) {
        avisar(`Não deu pra enviar agora: ${err.message}`, { tipo: 'erro', duracao: 5000 });
        botao.disabled = false;
        botao.textContent = 'Enviar sugestão';
    }
}

function limpar() {
    fotos?.limpar();
    local?.destruir();
    fotos = local = null;
}

export function iniciarSugerir(elPainel) {
    painel = elPainel;
}

/**
 * Abre o formulário limpo (o [data-fechar] é tratado pela página).
 * `extrasDaApi`: campos extras (banheiro, bebedouro) que a API já aceita.
 */
export function prepararSugerir(extrasDaApi = extras) {
    extras = extrasDaApi;
    limpar();
    painel.innerHTML = htmlFormulario();
    const form = painel.querySelector('#form-sugerir');
    local = criarSeletorLocal(painel.querySelector('#s-local'));
    fotos = criarSeletorFotos(painel.querySelector('#s-fotos'));
    form.addEventListener('submit', enviar);
    limparErroAoDigitar(form);
    form.querySelector('#s-zap').addEventListener('input', e => { e.target.value = formatarWhatsapp(e.target.value); });
    // O Leaflet precisa do painel já com tamanho: espera a animação de abertura.
    setTimeout(() => local?.ativar(), 320);
}
