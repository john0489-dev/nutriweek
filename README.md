# NutriWeek

App de cardápios semanais otimizados por IA (nutrição + custo + o que você já tem em casa), para iPhone e Android via um único código-base (React Native / Expo).

## Estrutura do projeto

```
nutriweek/
  mobile/     App React Native (Expo) — iOS e Android a partir do mesmo código
  backend/    API Node/Express que chama a IA (Claude) e devolve o cardápio
```

## Por que essa stack

- **React Native + Expo**: um único código TypeScript roda em iPhone e Android, com preview instantâneo no app "Expo Go" (sem precisar de Mac/Xcode para testar no dia a dia; só é necessário para gerar o build final da App Store).
- **Backend próprio**: a chave da IA nunca fica no app (celular = ambiente inseguro para segredos). O app fala com seu backend, e o backend fala com a IA.
- **Zod** no backend para validar o JSON que a IA devolve — se a IA "alucinar" um formato errado, a API retorna erro em vez de quebrar o app.

## Como a IA otimiza o cardápio

O endpoint `POST /api/menu/generate` recebe:
- Perfil do usuário (objetivo, restrições, alergias, orçamento semanal)
- Itens da despensa (o que a pessoa já tem em casa)
- Observações livres (ex: "sem repetir frango")

E devolve um cardápio de 7 dias com refeições (café, almoço, lanche, jantar), cada uma com ingredientes, modo de preparo, macros, custo estimado em R$, e uma lista de compras consolidada — priorizando o que já está na despensa e respeitando o orçamento e as restrições.

## Rodando localmente

### 1. Backend

```bash
cd backend
cp .env.example .env
# edite .env e cole sua ANTHROPIC_API_KEY (console.anthropic.com)
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

1. **Onboarding**: objetivo (emagrecer / manter / ganhar massa / comer melhor), restrições, alergias, tamanho da família, orçamento semanal.
2. **Cardápio da semana**: toca em "Gerar cardápio" → a IA monta os 7 dias → navega por dia → toca numa refeição para ver ingredientes e modo de preparo.
3. **Despensa**: adiciona o que já tem em casa e reotimiza o cardápio priorizando esses itens (menos desperdício, menos gasto).
4. **Perfil**: revisão dos dados salvos (edição completa é o próximo passo — ver roadmap).

Todo o estado (perfil, despensa, último cardápio gerado) é salvo localmente no celular (`AsyncStorage`), então o app funciona offline depois da primeira geração — só precisa de rede para *gerar* ou *reotimizar* o cardápio.

## Publicando nas lojas (quando o app estiver pronto)

Uso recomendado: [EAS Build](https://docs.expo.dev/build/introduction/) (serviço da própria Expo) para gerar o `.ipa` (iOS) e `.aab`/`.apk` (Android) sem precisar de Mac próprio:

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

Depois é só submeter pelo `eas submit` (ou manualmente pela App Store Connect / Google Play Console).

## Roadmap sugerido

1. Editar perfil diretamente na tela de Perfil (hoje só o onboarding grava).
2. Autenticação (login) + conta na nuvem, para o cardápio não ficar preso a um único celular.
3. Lista de compras marcável (checklist) a partir de `shoppingList`.
4. Histórico de cardápios anteriores.
5. Cache/streaming da resposta da IA (hoje é uma chamada única; para cardápios grandes, considerar exibir progresso).
6. Testes automatizados (Jest no mobile, testes de contrato no backend validando o schema Zod contra respostas reais da IA).
7. Deploy do backend (Render, Railway, Fly.io ou similar) para o app funcionar fora da rede local.

## Variáveis de ambiente

| Onde | Variável | Descrição |
|---|---|---|
| `backend/.env` | `ANTHROPIC_API_KEY` | Chave da API da Anthropic (obrigatória) |
| `backend/.env` | `ANTHROPIC_MODEL` | Modelo usado (padrão: `claude-sonnet-4-5`) |
| `backend/.env` | `PORT` | Porta do servidor (padrão: `3333`) |
| `mobile` (opcional) | `EXPO_PUBLIC_API_URL` | URL do backend, para testar em device físico ou apontar para produção |
