// js/components/sugerir.js
import { enviarSugestao } from '../services/sugestoes_service.js';
import { extrairCoordenada } from '../core/utils.js';

let modal, form, btnEnviar, btnAbrir;
let localizacaoGps = null;

export function inicializarSugerir() {
    modal = document.getElementById('sugerir');
    form = document.getElementById('form-sugerir');
    btnEnviar = document.getElementById('s-enviar');
    btnAbrir = document.getElementById('btn-sugerir');

    if (!modal || !form) return;

    btnAbrir?.addEventListener('click', () => {
        modal.classList.add('active');
    });

    modal.querySelector('[data-fechar]')?.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    document.getElementById('s-gps')?.addEventListener('click', usarGps);
    form.addEventListener('submit', salvarSugestao);
}

function usarGps() {
    const btn = document.getElementById('s-gps');
    const status = document.getElementById('s-local-status');

    if (!('geolocation' in navigator)) {
        alert('Navegador não suporta geolocalização.');
        return;
    }

    btn.disabled = true;
    if (status) {
        status.hidden = false;
        status.textContent = 'Obtendo localização...';
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            localizacaoGps = {
                lat: parseFloat(pos.coords.latitude.toFixed(6)),
                lng: parseFloat(pos.coords.longitude.toFixed(6))
            };
            btn.disabled = false;
            if (status) {
                status.textContent = `📍 Localização capturada: ${localizacaoGps.lat}, ${localizacaoGps.lng}`;
                status.className = 'local-status local-status--ok';
            }
        },
        (err) => {
            btn.disabled = false;
            if (status) {
                status.textContent = '❌ Não foi possível obter o GPS. Digite o link/endereço abaixo.';
                status.className = 'local-status local-status--erro';
            }
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

async function salvarSugestao(e) {
    e.preventDefault();

    // 1. Captura de todos os campos do formulário
    const nome = document.getElementById('s-nome')?.value.trim();
    const bairro = document.getElementById('s-bairro')?.value.trim() || 'Palmas';
    const referencia = document.getElementById('s-referencia')?.value.trim();
    const descricao = document.getElementById('s-descricao')?.value.trim();
    const piso = document.querySelector('input[name="piso"]:checked')?.value || 'CIMENTO';
    const coberta = document.querySelector('input[name="coberta"]:checked')?.value === 'sim';
    const iluminacao = document.getElementById('s-iluminacao')?.checked || false;
    const acessibilidade = document.getElementById('s-acessibilidade')?.checked || false;
    const nomeSolicitante = document.getElementById('s-contato-nome')?.value.trim();
    const telefoneSolicitante = document.getElementById('s-contato-zap')?.value.trim();

    if (!nome) {
        alert('Por favor, informe o nome ou referência da quadra.');
        return;
    }

    // 2. Coordenadas (GPS ou Link/Referência Colada)
    const coordRef = extrairCoordenada(referencia);
    const latFinal = localizacaoGps ? localizacaoGps.lat : (coordRef ? coordRef.lat : -10.2085);
    const lngFinal = localizacaoGps ? localizacaoGps.lng : (coordRef ? coordRef.lng : -48.3470);

    // 3. Montagem do JSON alinhado ao SugerirQuadraRequest do Spring Boot
    const dados = {
        nomeSolicitante: nomeSolicitante || null,
        telefoneSolicitante: telefoneSolicitante || null,
        nome: nome,
        descricao: descricao || referencia || null,
        endereco: referencia || `Região do bairro ${bairro}, Palmas - TO`,
        bairroRegiao: bairro,
        latitude: latFinal,
        longitude: lngFinal,
        tipoPiso: piso.toUpperCase(),
        cobertura: coberta ? 'COBERTA' : 'DESCOBERTA',
        iluminacao: iluminacao,
        acessibilidade: acessibilidade
    };

    const formData = new FormData();
    formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));

    const inputFoto = document.getElementById('s-foto');
    if (inputFoto && inputFoto.files.length > 0) {
        formData.append('fotos', inputFoto.files[0]);
    }

    try {
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';

        await enviarSugestao(formData);

        alert('Sugestão enviada com sucesso! Um administrador irá analisar.');
        form.reset();
        localizacaoGps = null;
        modal.classList.remove('active');
    } catch (err) {
        alert(`Erro ao enviar sugestão: ${err.message}`);
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar sugestão';
    }
}