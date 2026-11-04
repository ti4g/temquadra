// js/components/seletor-local.js
// Mini-mapa com um pino fixo no centro: a pessoa arrasta o mapa até a quadra.
// Usado no "Sugerir quadra" e no cadastro/edição do painel da equipe.
import { icone, avisar } from './ui.js';

const CENTRO_PALMAS = [-10.2085, -48.3470];
const MIRA = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 38s-13-11.6-13-21.5a13 13 0 0 1 26 0C33 26.4 20 38 20 38z" fill="#FFD23F" stroke="#10243A" stroke-width="2.5"/><circle cx="20" cy="16.5" r="4.5" fill="#10243A"/></svg>`;

/**
 * Monta o seletor dentro de `container`. `inicial` = { lat, lng } quando a quadra já tem local.
 * O mapa só é criado em `ativar()`, depois que o container estiver visível.
 */
export function criarSeletorLocal(container, { inicial = null, botaoGps = 'Estou na quadra' } = {}) {
    container.innerHTML = `
        <div class="local">
            <div class="local__mapa"></div>
            <span class="local__mira">${MIRA}</span>
            <button type="button" class="btn btn--claro btn--p local__gps">${icone('alvo', 'ic--p')}${botaoGps}</button>
        </div>
        <p class="campo__dica local__dica">Arraste o mapa até o pino ficar em cima da quadra.</p>`;

    const caixa = container.querySelector('.local');
    const dica = container.querySelector('.local__dica');
    let mapa = null;
    let marcado = !!inicial;

    function marcar() {
        marcado = true;
        dica.textContent = 'Local marcado. Se precisar, arraste mais um pouco.';
    }

    container.querySelector('.local__gps').addEventListener('click', ev => {
        const botao = ev.currentTarget;
        if (!navigator.geolocation) return avisar('Seu navegador não informa a localização.', { tipo: 'erro' });
        botao.disabled = true;
        navigator.geolocation.getCurrentPosition(pos => {
            botao.disabled = false;
            mapa?.setView([pos.coords.latitude, pos.coords.longitude], 18);
            marcar();
        }, () => {
            botao.disabled = false;
            avisar('Não deu pra pegar sua localização. Arraste o mapa até a quadra.', { tipo: 'erro' });
        }, { enableHighAccuracy: true, timeout: 10000 });
    });

    if (inicial) marcar();

    return {
        ativar() {
            if (mapa) return mapa.invalidateSize();
            const centro = inicial ? [inicial.lat, inicial.lng] : CENTRO_PALMAS;
            mapa = L.map(caixa.querySelector('.local__mapa'), { zoomControl: false }).setView(centro, inicial ? 17 : 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapa);
            mapa.attributionControl.setPrefix(false);
            mapa.on('movestart', () => caixa.classList.add('mexendo'));
            mapa.on('moveend', () => caixa.classList.remove('mexendo'));
            mapa.on('dragend zoomend', marcar);
        },
        /** { lat, lng } com 6 casas, ou null se a pessoa não marcou nada. */
        obter() {
            if (!marcado || !mapa) return inicial && marcado ? { ...inicial } : null;
            const c = mapa.getCenter();
            return { lat: Number(c.lat.toFixed(6)), lng: Number(c.lng.toFixed(6)) };
        },
        destruir() {
            mapa?.remove();
            mapa = null;
        }
    };
}
