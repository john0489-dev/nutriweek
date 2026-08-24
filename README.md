# NutriWeek

App de cardápios semanais otimizados por IA (nutrição + custo + o que você já tem em casa), para iPhone e Android via um único código-base (React Native / Expo). Suporta login, múltiplos perfis por casa, favoritos, histórico de cardápios e regeneração de refeições individuais.

## Estrutura do projeto

```
nutriweek/
  mobile/     App React Native (Expo) — iOS e Android a partir do mesmo código
  backend/    API Node/Express: autenticação, perfis, geração de cardápio via IA, histórico, favoritos
```

## Por que essa stack

- **React Native + Expo**: um único código TypeScript roda em iPhone e Android, com preview instantâneo no app "Expo Go" (sem precisar de Mac/Xcode para testar no dia a dia; só é necessário para gerar o build final da App Store).
- **Backend próprio**: a chave da IA nunca fica no app (celular = ambiente inseguro para segredos). O app fala com seu backend, e o backend fala com a IA.
- **Zod** no backend para validar o JSON que a IA devolve — se a IA "alucinar" um formato errado, a API retorna erro em vez de quebrar o app.
- **Persistência em JSON** (`backend/data/db.json`, criado automaticamente): simples e sem dependências nativas (evita dor de cabeça de compilação no Windows). Suficiente para uso pessoal/dev. Ver roadmap para trocar por um banco de verdade.
- **JWT** para sessão (e-mail + senha, hash com bcrypt) — cada usuário só vê seus próprios perfis, cardápios e favoritos.

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
npm install
npm run dev
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

## Publicando nas lojas (quando o app estiver pronto)

Uso recomendado: [EAS Build](https://docs.expo.dev/build/introduction/) (serviço da própria Expo) para gerar o `.ipa` (iOS) e `.aab`/`.apk` (Android) sem precisar de Mac próprio:

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

Depois é só submeter pelo `eas submit` (ou manualmente pela App Store Connect / Google Play Console).

## Roadmap sugerido

1. Trocar a persistência em JSON por um banco de verdade (Postgres/SQLite) — a interface em `backend/src/db.ts` já isola essa troca do resto do app.
2. Deploy do backend (Render, Railway, Fly.io ou similar) para o app funcionar fora da rede local.
3. Cardápio combinado considerando vários perfis da casa ao mesmo tempo (hoje a geração é sempre para um perfil ativo por vez).
4. Checklist marcável na lista de compras (hoje é só texto/compartilhamento).
5. Login social (Google) além de e-mail/senha.
6. Testes automatizados (Jest no mobile, testes de contrato no backend validando o schema Zod contra respostas reais da IA).
7. Cache/streaming da resposta da IA (hoje é uma chamada única; para cardápios grandes, considerar exibir progresso).

## Variáveis de ambiente

| Onde | Variável | Descrição |
|---|---|---|
| `backend/.env` | `ANTHROPIC_API_KEY` | Chave da API da Anthropic (obrigatória) |
| `backend/.env` | `ANTHROPIC_MODEL` | Modelo usado (padrão: `claude-sonnet-4-5`) |
| `backend/.env` | `PORT` | Porta do servidor (padrão: `3333`) |
| `backend/.env` | `JWT_SECRET` | Segredo para assinar os tokens de login — defina um valor fixo para não derrubar sessões a cada restart |
| `mobile` (opcional) | `EXPO_PUBLIC_API_URL` | URL do backend, para testar em device físico ou apontar para produção |
