import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Cria (uma única vez) e retorna o cliente da Anthropic, usando a chave do .env. */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Copie backend/.env.example para backend/.env e preencha a chave."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function getModelName(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
}
