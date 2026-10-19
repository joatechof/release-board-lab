const status = document.querySelector('#status');
const button = document.querySelector('#refresh');

async function load() {
  button.disabled = true;
  try {
    const responses = await Promise.all([fetch('/api/info'), fetch('/api/releases'), fetch('/health/ready')]);
    if (responses.some((response) => !response.ok)) throw new Error('Serviço indisponível');
    const [info, releases] = await Promise.all(responses.slice(0, 2).map((response) => response.json()));
    const runtime = document.querySelector('#runtime');
    runtime.replaceChildren();
    for (const [label, value] of [['Versão', info.version], ['Ambiente', info.environment],
      ['Instância', info.instance], ['Uptime', `${info.uptimeSeconds}s`], ['Canal', info.channel]]) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      runtime.append(term, description);
    }
    const list = document.querySelector('#releases');
    list.replaceChildren(...releases.map((release) => {
      const item = document.createElement('li');
      const version = document.createElement('strong');
      version.textContent = release.version;
      item.append(version, document.createTextNode(` ${release.title} · ${release.status}`));
      return item;
    }));
    status.textContent = '● Serviço pronto para receber tráfego';
    status.dataset.state = 'ready';
  } catch {
    status.textContent = 'Não foi possível obter os dados. Confirma o servidor e consulta os logs.';
    status.dataset.state = 'error';
  } finally {
    button.disabled = false;
  }
}
button.addEventListener('click', load);
load();
