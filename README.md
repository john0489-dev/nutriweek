# NutriWeek

App de cardápios semanais otimizados por IA (nutrição + custo + o que você já tem em casa), para iPhone e Android via um único código-base (React Native / Expo). Suporta login, múltiplos perfis por casa, favoritos, histórico de cardápios e regeneração de refeições individuais.

## Estrutura do projeto

```
nutriweek/
  mobile/            App React Native (Expo) — iOS, Android e Web a partir do mesmo código
  backend/           API Node/Express: autenticação, perfis, geração de cardápio via IA, histórico, favoritos, Postgres
  render-build.sh    Build único de produção (mobile web + backend) — ver "Deploy em produção"
  render.yaml        Configuração de deploy (Blueprint) para o Render
```

## Por que essa stack

- **React Native + Expo**: um único código TypeScript roda em iPhone e Android, com preview instantâneo no app "Expo Go" (sem precisar de Mac/Xcode para testar no dia a dia; só é necessário para gerar o build final da App Store).
- **Backend próprio**: a chave da IA nunca fica no app (celular = ambiente inseguro para segredos). O app fala com seu backend, e o backend fala com a IA.
- **Zod** no backend para validar o JSON que a IA devolve — se a IA "alucinar" um formato errado, a API retorna erro em vez de quebrar o app.
- **Postgres** para persistência (`backend/src/db.ts`): tabelas criadas automaticamente no primeiro start, sem migração manual. Localmente você pode apontar para um Postgres instalado na sua máquina; em produção, para o banco gerenciado do seu provedor de hospedagem.
- **JWT** para sessão (e-mail + senha, hash com bcrypt) — cada usuário só vê seus próprios perfis, cardápios e favoritos.
- **Serviço único em produção**: o mesmo backend Express serve a API (`/api/*`) e o app mobile exportado para web (todo o resto), então não existe CORS nem URL de API separada para configurar — ver "Deploy em produção" abaixo.

## Como a IA otimiza o cardápio

O endpoint `POST /api/menu/generate` recebe um `profileId` (perfil salvo) + despensa + observações livres, e devolve um cardápio de 7 dias com refeições (café, almoço, lanche, jantar), cada uma com ingredientes, modo de preparo, macros, custo estimado em R$, e uma lista de compras consolidada — priorizando o que já está na despensa e respeitando o orçamento e as restrições. Cada geração fica salva no histórico do usuário.

`POST /api/menu/regenerate-meal` troca só **uma** refeição de um cardápio já gerado (ex: "não gostei desse almoço de terça"), sem precisar recriar a semana inteira — a IA recebe o restante das refeições da semana pra não repetir pratos.

## Rodando localmente

### 1. Backend

```bash
cd backend
cp .env.example .env
# edite .env e cole sua ANTHROPIC_API_KEY (console.anthropic.com)
# defina também um JWT_SECRET (qualquer string aleatória longa)
# e um DATABASE_URL apontando para um Postgres (local ou na nuvem)
npm install
npm run dev
```

Se você não tem um Postgres local ainda, o jeito mais rápido é rodar um via Docker:

```bash
docker run --name nutriweek-db -e POSTGRES_PASSWORD=nutriweek -e POSTGRES_USER=nutriweek -e POSTGRES_DB=nutriweek -p 5432:5432 -d postgres:16
# DATABASE_URL correspondente: postgres://nutriweek:nutriweek@localhost:5432/nutriweek
```

O servidor sobe em `http://localhost:3333`. Teste com:

```bash
curl http://localhost:3333/health
```

### 2. App mobile

```bash
cd mobile
npm install
npm start
```

Isso abre o Metro Bundler com um QR code. Instale o app **Expo Go** (App Store / Play Store) no seu celular e escaneie o QR code — o app abre no seu telefone puxando o código do computador, sem precisar de build nativo.

- **Emulador Android**: pressione `a` no terminal do Expo (o app já aponta para `10.0.2.2:3333`, que é como o emulador enxerga o `localhost` da máquina).
- **Simulador iOS** (precisa de Mac): pressione `i`.
- **Celular físico**: como o celular não enxerga "localhost" do seu computador, defina a variável `EXPO_PUBLIC_API_URL` com o IP da sua máquina na rede local antes de rodar `npm start`, por exemplo:
  ```bash
  EXPO_PUBLIC_API_URL=http://192.168.0.10:3333 npm start
  ```

## Fluxo do app

1. **Login / Cadastro**: e-mail + senha. A sessão (JWT) fica salva no celular.
2. **Onboarding** (primeiro acesso): cria seu primeiro perfil — objetivo, restrições, alergias, tamanho da família, orçamento semanal.
3. **Cardápio da semana**: toca em "Gerar cardápio" → a IA monta os 7 dias → navega por dia → toca numa refeição para ver ingredientes, modo de preparo, favoritar (❤), regenerar só aquela refeição, ou compartilhar.
4. **Despensa**: adiciona o que já tem em casa (fica só no celular) e reotimiza o cardápio priorizando esses itens.
5. **Favoritos**: refeições marcadas com ❤, pra acessar de novo depois.
6. **Histórico**: todos os cardápios já gerados, com detalhe de cada um.
7. **Perfil**: gerencia os perfis da casa — cada pessoa pode ter objetivo/restrições próprios; o cardápio é gerado para o perfil ativo (alternável a qualquer momento). Também é daqui que se sai da conta.

O estado de despensa e sessão fica salvo localmente no celular (`AsyncStorage`); perfis, cardápios (histórico) e favoritos ficam salvos no backend, vinculados à conta — então funcionam em qualquer aparelho em que você fizer login.

## Deploy em produção (versão web)

O jeito mais simples de colocar o NutriWeek no ar como app web (acessível de qualquer navegador, celular ou desktop, com o mesmo link) é publicar o backend + o build web num serviço só. O projeto já vem pronto pra isso: `render-build.sh` (raiz do projeto) e `render.yaml` configuram um deploy no [Render](https://render.com), mas o mesmo `render-build.sh` funciona em qualquer plataforma que rode `bash` + Node (Railway, Fly.io, um VPS, etc.) — só muda onde você configura build/start command e as variáveis de ambiente.

### O que o build faz

```bash
bash render-build.sh
```

1. Instala as dependências do `mobile/` e roda `expo export --platform web` (com `EXPO_PUBLIC_API_URL=""`, pra o app usar caminhos relativos tipo `/api/...` em vez de uma URL fixa).
2. Instala as dependências do `backend/` e compila o TypeScript (`npm run build`).
3. Copia o resultado do export web para `backend/public`.

O comando de start é sempre:

```bash
node backend/dist/index.js
```

Esse processo sobe a API **e** serve o app web na mesma porta/URL — sem CORS, sem precisar apontar o app pra uma URL de backend separada.

### Passo a passo no Render

1. Crie uma conta em [render.com](https://render.com) e conecte sua conta do GitHub (o repositório já está em `https://github.com/john0489-dev/nutriweek`).
2. No painel, clique em **New +** → **Blueprint**, escolha o repositório `nutriweek`. O Render lê o `render.yaml` da raiz e propõe automaticamente:
   - Um **Web Service** chamado `nutriweek`, com build/start command já preenchidos.
   - Um **banco Postgres** gerenciado (`nutriweek-db`, plano free), já conectado ao serviço via `DATABASE_URL`.
   - Um `JWT_SECRET` gerado automaticamente (valor aleatório seguro).
3. Antes de confirmar, o Render vai pedir o valor de `ANTHROPIC_API_KEY` (ela não vai no `render.yaml` por segurança) — cole sua chave de [console.anthropic.com](https://console.anthropic.com).
4. Clique em **Apply**. O primeiro deploy demora alguns minutos (instala tudo, exporta o web, compila). Acompanhe pelos logs do serviço.
5. Quando terminar, o Render te dá uma URL tipo `https://nutriweek.onrender.com` — abra ela: é o app completo (tela de login, cadastro, tudo), já falando com o Postgres real.

Se preferir configurar manualmente em vez de usar o Blueprint (**New +** → **Web Service**, sem o `render.yaml`):

| Campo | Valor |
|---|---|
| Build Command | `bash render-build.sh` |
| Start Command | `node backend/dist/index.js` |
| Root Directory | *(deixe em branco — é a raiz do repo)* |

E crie um banco Postgres separado (**New +** → **PostgreSQL**) para obter a `DATABASE_URL`.

### Variáveis de ambiente em produção

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sim | Chave da API da Anthropic — a única que você precisa colar manualmente |
| `DATABASE_URL` | Sim | Preenchida automaticamente pelo Render se você usar o `render.yaml`/Blueprint |
| `JWT_SECRET` | Sim | Gerada automaticamente pelo Render se você usar o Blueprint; se configurar manualmente, use um valor aleatório longo |
| `ANTHROPIC_MODEL` | Não | Padrão `claude-sonnet-4-5` |
| `NODE_ENV` | Não | Defina como `production` (já vem assim no `render.yaml`) |
| `PORT` | Não | O Render injeta automaticamente — não defina manualmente |

### Testando o build de produção localmente (opcional)

Antes de fazer deploy, dá pra simular o build de produção na sua máquina:

```bash
bash render-build.sh
DATABASE_URL=postgres://nutriweek:nutriweek@localhost:5432/nutriweek \
JWT_SECRET=teste-local \
ANTHROPIC_API_KEY=sua-chave \
PORT=3333 \
node backend/dist/index.js
```

Depois é só abrir `http://localhost:3333` — o app web completo sobe a partir do próprio backend, do mesmo jeito que vai rodar em produção.

## Publicando nas lojas (quando o app estiver pronto)

Uso recomendado: [EAS Build](https://docs.expo.dev/build/introduction/) (serviço da própria Expo) para gerar o `.ipa` (iOS) e `.aab`/`.apk` (Android) sem precisar de Mac próprio:

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

Depois é só submeter pelo `eas submit` (ou manualmente pela App Store Connect / Google Play Console).

## Roadmap sugerido

1. Apps nativos publicados nas lojas via EAS Build (ver seção acima) — hoje o foco de produção é a versão web.
2. Cardápio combinado considerando vários perfis da casa ao mesmo tempo (hoje a geração é sempre para um perfil ativo por vez).
3. Checklist marcável na lista de compras (hoje é só texto/compartilhamento).
4. Login social (Google) além de e-mail/senha.
5. Testes automatizados (Jest no mobile, testes de contrato no backend validando o schema Zod contra respostas reais da IA).
6. Cache/streaming da resposta da IA (hoje é uma chamada única; para cardápios grandes, considerar exibir progresso).

## Variáveis de ambiente

| Onde | Variável | Descrição |
|---|---|---|
| `backend/.env` | `ANTHROPIC_API_KEY` | Chave da API da Anthropic (obrigatória) |
| `backend/.env` | `ANTHROPIC_MODEL` | Modelo usado (padrão: `claude-sonnet-4-5`) |
| `backend/.env` | `PORT` | Porta do servidor (padrão: `3333`) |
| `backend/.env` | `DATABASE_URL` | String de conexão do Postgres (obrigatória) |
| `backend/.env` | `PGSSL` | Defina como `disable` para Postgres local sem SSL (produção usa SSL por padrão) |
| `backend/.env` | `JWT_SECRET` | Segredo para assinar os tokens de login — defina um valor fixo para não derrubar sessões a cada restart |
| `mobile` (opcional) | `EXPO_PUBLIC_API_URL` | URL do backend em dev; em produção o build usa `""` (caminho relativo) — ver "Deploy em produção" |

Para produção no Render, ver a seção "Variáveis de ambiente em produção" acima.
