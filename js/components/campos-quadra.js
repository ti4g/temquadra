// js/components/campos-quadra.js
// Campos repetidos entre "Sugerir quadra" e o cadastro do painel da equipe.
import { PISOS, COBERTURAS, EXTRAS } from '../core/quadra.js';
import { reduzirImagem } from '../core/utils.js';
import { icone, avisar } from './ui.js';

export function htmlEscolhaPiso(selecionado = 'CIMENTO') {
    return Object.entries(PISOS).map(([valor, p]) => `
        <label class="chip"><input type="radio" name="tipoPiso" value="${valor}" ${valor === selecionado ? 'checked' : ''}>
        <span class="chip__ponto" style="--cor:${p.cor}"></span>${p.nome}</label>`).join('');
}

export function htmlEscolhaCobertura(selecionada = 'DESCOBERTA') {
    return Object.entries(COBERTURAS).map(([valor, nome]) => `
        <label class="chip"><input type="radio" name="cobertura" value="${valor}" ${valor === selecionada ? 'checked' : ''}>${nome}</label>`).join('');
}

/** Interruptores "Tem banheiro", "Tem bebedouro"… só dos extras que a API já aceita. */
export function htmlExtras(chaves, valores = {}) {
    return chaves.map(k => `
        <label class="interruptor">Tem ${EXTRAS[k].nome.toLowerCase()}<input type="checkbox" name="${k}" ${valores[k] ? 'checked' : ''}></label>`).join('');
}

export function lerExtras(form, chaves) {
    return Object.fromEntries(chaves.map(k => [k, !!form.querySelector(`[name="${k}"]`)?.checked]));
}

/** Escolha de fotos com prévia; reduz cada uma antes de guardar (limite de 1 MB do back). */
export function criarSeletorFotos(container, { max = 3 } = {}) {
    let fotos = []; // { arquivo, url }

    function render() {
        container.innerHTML = fotos.map((f, i) => `
            <div class="fotos__item">
                <img src="${f.url}" alt="Foto ${i + 1} escolhida">
                <button type="button" data-remover="${i}" aria-label="Remover foto ${i + 1}">${icone('fechar')}</button>
            </div>`).join('') + (fotos.length < max ? `
            <label class="fotos__add">${icone('foto')}Adicionar foto
                <input type="file" accept="image/*" multiple>
            </label>` : '');
    }

    container.addEventListener('click', ev => {
        const b = ev.target.closest('[data-remover]');
        if (!b) return;
        const [f] = fotos.splice(Number(b.dataset.remover), 1);
        URL.revokeObjectURL(f.url);
        render();
    });
    container.addEventListener('change', async ev => {
        if (ev.target.type !== 'file') return;
        for (const arquivo of Array.from(ev.target.files).slice(0, max - fotos.length)) {
            try {
                const pequeno = await reduzirImagem(arquivo);
                fotos.push({ arquivo: pequeno, url: URL.createObjectURL(pequeno) });
            } catch (err) {
                avisar(err.message, { tipo: 'erro' });
            }
        }
        render();
    });
    render();

    return {
        arquivos: () => fotos.map(f => f.arquivo),
        limpar() { fotos.forEach(f => URL.revokeObjectURL(f.url)); fotos = []; render(); }
    };
}

/** Marca campos obrigatórios vazios; devolve false e foca o primeiro. */
export function validarObrigatorios(form, ids) {
    let ok = true;
    ids.forEach(id => {
        const campo = form.querySelector('#' + id);
        const vazio = !campo.value.trim();
        campo.setAttribute('aria-invalid', vazio ? 'true' : 'false');
        const erro = campo.parentElement.querySelector('.campo__erro');
        if (erro) erro.hidden = !vazio;
        if (vazio && ok) { campo.focus(); ok = false; }
    });
    return ok;
}

/** Some com a mensagem de erro assim que a pessoa começa a corrigir. */
export function limparErroAoDigitar(form) {
    form.addEventListener('input', ev => {
        const c = ev.target;
        if (c.getAttribute('aria-invalid') === 'true' && c.value.trim()) {
            c.setAttribute('aria-invalid', 'false');
            const erro = c.parentElement.querySelector('.campo__erro');
            if (erro) erro.hidden = true;
        }
    });
}
