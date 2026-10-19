# Release Board

Aplicação de laboratório para estudar o percurso de um commit até um serviço em execução. O frontend usa HTML, CSS e JavaScript; o servidor HTTP usa a biblioteca standard de Node.js. Não há packages de execução ou desenvolvimento para instalar.

## Executar

Na raiz desta pasta:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm start
```

Abre [a aplicação](http://localhost:3000). `pnpm dev` reinicia o processo quando alteras o código do servidor. Com `pnpm start`, para com `Ctrl+C` e volta a iniciar depois de uma alteração. O frontend precisa de recarregamento do browser.

Noutro terminal, com o servidor em execução:

```bash
pnpm smoke
```

## Contrato HTTP

| Método e caminho | Resultado |
| --- | --- |
| `GET /` | Interface web. |
| `GET /api/info` | Nome, versão, ambiente, instância, uptime e canal. |
| `GET /api/releases` | Três releases de exemplo definidas no código. |
| `GET /health/live` | `200`, processo consegue responder. |
| `GET /health/ready` | `200` normalmente; `503` se `READINESS_FAIL=true`. |
| Caminho desconhecido | `404` em JSON. |
| Método diferente de GET | `405`, com header `Allow: GET`. |

O histórico é fixo. A versão em execução vem de `APP_VERSION` e pode ser o SHA de um commit; o histórico ilustrativo não é atualizado por um deploy. Não há autenticação, escrita de dados, base de dados ou dados pessoais.

## Configuração

| Variable | Valor por omissão | Função |
| --- | --- | --- |
| `PORT` | `3000` | Porta onde o processo escuta. |
| `APP_VERSION` | `1.0.0` | Identidade da versão em execução. |
| `APP_ENV` | `local` | Identificação do ambiente. |
| `RELEASE_CHANNEL` | `stable` | Rótulo para exercícios de configuração. |
| `READINESS_FAIL` | `false` | Simulação de indisponibilidade para receber tráfego. |

`.env.example` documenta a configuração; a aplicação não carrega `.env` automaticamente. Exemplo em zsh/bash:

```bash
APP_VERSION=experiencia-1 APP_ENV=local pnpm start
```

## Mapa dos ficheiros

| Caminho | Responsabilidade |
| --- | --- |
| `src/server.js` | Rotas, configuração, logs JSON e encerramento por sinal. |
| `public/` | Interface e pedidos à API. |
| `test/server.test.js` | Testes HTTP com servidor numa porta temporária. |
| `scripts/smoke.mjs` | Verifica cinco endpoints de um serviço em execução e, opcionalmente, a versão. |
| `Dockerfile` | Imagem sem instalação de packages, com utilizador sem privilégios. |
| `k8s/` | Namespace, ConfigMap, Deployment, Service e configuração de kind. |
| `infra/main.bicep` | Environment e Container App Consumption no Azure. |
| `.github/workflows/ci.yml` | Testes, build, smoke test do container e publicação a partir de main. |
| `.github/workflows/deploy-azure.yml` | Deploy manual por digest com OIDC e smoke test. |

O tutorial de estudo entregue na pasta acima deste projeto explica quando usar cada ficheiro. Esta pasta será a raiz do teu repositório GitHub; `.github` precisa de ficar na raiz desse repositório, não dentro de uma subpasta `project`.

## Versões

Alvo: Node.js `22.23.3` e pnpm `11.28.4`. O `Dockerfile` fixa também o digest da imagem base; os workflows fixam os SHAs das actions. Os documentos de ferramentas e validação, entregues com o tutorial, registam datas e o ambiente realmente executado.

Cheers ;)
