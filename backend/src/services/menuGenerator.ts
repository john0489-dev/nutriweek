import { getAnthropicClient, getModelName } from "./anthropicClient";
import {
  Meal,
  MealSchema,
  MealType,
  MenuRequest,
  MenuResponse,
  MenuResponseSchema,
  UserProfile,
} from "../types/menu";

const SYSTEM_PROMPT = `Você é um nutricionista e chef experiente que monta cardápios semanais no Brasil.
Suas respostas devem:
- Respeitar rigorosamente restrições alimentares e alergias informadas (nunca inclua um ingrediente proibido).
- Priorizar ingredientes que o usuário já tem em casa (despensa), reduzindo desperdício e custo.
- Otimizar o cardápio simultaneamente por valor nutricional (adequado ao objetivo do usuário) e por custo estimado em reais (BRL), usando preços médios de supermercado brasileiro.
- Variar as refeições ao longo da semana (evitar repetir o mesmo prato mais de 2x, salvo pedido em contrário).
- Retornar APENAS um JSON válido, sem texto fora do JSON, sem markdown, seguindo exatamente o schema fornecido pelo usuário.`;

function buildUserPrompt(req: MenuRequest): string {
  const { profile, pantryItems, daysRequested, notes } = req;

  return `Monte um cardápio de ${daysRequested} dias com café da manhã, almoço, lanche da tarde e jantar para cada dia.

Perfil do usuário:
- Objetivo: ${profile.goal}
- Pessoas na casa: ${profile.householdSize}
- Restrições alimentares: ${profile.restrictions.join(", ") || "nenhuma"}
- Alergias: ${profile.allergies.join(", ") || "nenhuma"}
- Alimentos que não gosta: ${profile.dislikedFoods.join(", ") || "nenhum"}
${profile.dailyCalorieTarget ? `- Meta calórica diária: ${profile.dailyCalorieTarget} kcal` : ""}
${profile.weeklyBudgetBRL ? `- Orçamento semanal: R$ ${profile.weeklyBudgetBRL}` : ""}

Ingredientes já disponíveis em casa (use-os prioritariamente quando fizer sentido):
${pantryItems.length ? pantryItems.join(", ") : "nenhum informado"}

${notes ? `Observações adicionais do usuário: ${notes}` : ""}

Responda SOMENTE com um objeto JSON no seguinte formato (sem markdown, sem comentários):
{
  "summary": string,
  "days": [
    {
      "dayLabel": string,
      "meals": [
        {
          "type": "cafe_da_manha" | "almoco" | "lanche" | "jantar",
          "name": string,
          "description": string,
          "ingredients": [{ "name": string, "quantity": string }],
          "instructions": [string],
          "calories": number,
          "proteinG": number,
          "carbsG": number,
          "fatG": number,
          "estimatedCostBRL": number,
          "prepTimeMinutes": number,
          "usesPantryItems": [string]
        }
      ]
    }
  ],
  "estimatedWeeklyCostBRL": number,
  "avgDailyCalories": number,
  "shoppingList": [{ "name": string, "quantity": string }],
  "notes": [string]
}`;
}

/** Extrai o primeiro bloco JSON de um texto (defesa contra o modelo adicionar texto extra). */
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Resposta da IA não contém um JSON reconhecível.");
  }
  return text.slice(start, end + 1);
}

export async function generateMenu(req: MenuRequest): Promise<MenuResponse> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: getModelName(),
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(req) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou conteúdo de texto.");
  }

  const jsonText = extractJson(textBlock.text);
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(
      `Falha ao interpretar JSON retornado pela IA: ${(err as Error).message}`
    );
  }

  const parsed = MenuResponseSchema.safeParse(parsedUnknown);
  if (!parsed.success) {
    throw new Error(
      `JSON da IA não bateu com o schema esperado: ${parsed.error.message}`
    );
  }

  return parsed.data;
}

export interface RegenerateMealInput {
  profile: UserProfile;
  pantryItems: string[];
  dayLabel: string;
  mealType: MealType;
  /** Nomes das outras refeições já presentes na semana, pra IA evitar repetir. */
  otherMealNames: string[];
  notes?: string;
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe_da_manha: "café da manhã",
  almoco: "almoço",
  lanche: "lanche da tarde",
  jantar: "jantar",
};

function buildRegenerateMealPrompt(input: RegenerateMealInput): string {
  const { profile, pantryItems, dayLabel, mealType, otherMealNames, notes } =
    input;

  return `Substitua APENAS o(a) ${MEAL_TYPE_LABELS[mealType]} de ${dayLabel} por uma nova opção. Não gere o resto da semana.

Perfil do usuário:
- Objetivo: ${profile.goal}
- Pessoas na casa: ${profile.householdSize}
- Restrições alimentares: ${profile.restrictions.join(", ") || "nenhuma"}
- Alergias: ${profile.allergies.join(", ") || "nenhuma"}
- Alimentos que não gosta: ${profile.dislikedFoods.join(", ") || "nenhum"}
${profile.weeklyBudgetBRL ? `- Orçamento semanal: R$ ${profile.weeklyBudgetBRL}` : ""}

Ingredientes já disponíveis em casa (use-os prioritariamente quando fizer sentido):
${pantryItems.length ? pantryItems.join(", ") : "nenhum informado"}

Refeições que já existem no restante da semana (não repita nenhuma delas):
${otherMealNames.length ? otherMealNames.join(", ") : "nenhuma"}

${notes ? `Observação do usuário sobre essa troca: ${notes}` : ""}

Responda SOMENTE com um objeto JSON representando essa ÚNICA refeição, no formato:
{
  "type": "${mealType}",
  "name": string,
  "description": string,
  "ingredients": [{ "name": string, "quantity": string }],
  "instructions": [string],
  "calories": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "estimatedCostBRL": number,
  "prepTimeMinutes": number,
  "usesPantryItems": [string]
}`;
}

export async function regenerateSingleMeal(
  input: RegenerateMealInput
): Promise<Meal> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: getModelName(),
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildRegenerateMealPrompt(input) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou conteúdo de texto.");
  }

  const jsonText = extractJson(textBlock.text);
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(
      `Falha ao interpretar JSON retornado pela IA: ${(err as Error).message}`
    );
  }

  const parsed = MealSchema.safeParse(parsedUnknown);
  if (!parsed.success) {
    throw new Error(
      `JSON da IA não bateu com o schema esperado: ${parsed.error.message}`
    );
  }

  return parsed.data;
}
