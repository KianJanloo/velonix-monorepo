import { Injectable, ServiceUnavailableException, BadGatewayException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const SYSTEM_PROMPT = `You are an expert board game designer and balance consultant.
Analyze the provided game design and return ONLY a valid JSON object (no markdown, no explanation)
with this exact structure:

{
  "difficultyScore": <1-10 integer>,
  "complexityScore": <1-10 integer>,
  "balanceScore": <1-10 integer>,
  "replayabilityScore": <1-10 integer>,
  "playerCountRating": "<string like '2-4 players, best 3'>",
  "estimatedPlaytime": "<string like '30-60 min'>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "issues": [
    {
      "severity": "<critical|warning|info>",
      "category": "<Balance|Complexity|Clarity|Replayability|Components|Rules>",
      "title": "<short title>",
      "detail": "<1-2 sentence explanation and fix suggestion>"
    }
  ],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<suggestion 3>", "<suggestion 4>", "<suggestion 5>"]
}

Rules:
- difficultyScore: how hard is the game to play (1=trivial, 10=brutal)
- complexityScore: how many rules/decisions to track (1=simple, 10=overwhelming)
- balanceScore: how fairly balanced between players (1=very unfair, 10=perfectly balanced)
- replayabilityScore: how much variety/replay value (1=play once, 10=infinite variety)
- issues: identify 2-5 real design problems; if none, return []
- suggestions: always return 4-6 concrete, actionable improvements
- Base all analysis on the actual component count, types, rules provided
- If the game is very sparse (few components, few rules), say so clearly`;

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return !!this.config.get<boolean>("ai.enabled");
  }

  getConfig() {
    return {
      enabled: this.enabled,
      provider: this.config.get<string>("ai.provider"),
      model: this.config.get<string>("ai.model"),
      maxTokens: this.config.get<number>("ai.maxTokens"),
      hasApiKey: !!this.config.get<string>("ai.apiKey"),
    };
  }

  async balanceGame(gameSummary: string): Promise<unknown> {
    const apiKey = this.config.get<string>("ai.apiKey");
    const model = this.config.get<string>("ai.model");
    const maxTokens = this.config.get<number>("ai.maxTokens");

    if (!apiKey) {
      throw new ServiceUnavailableException(
        "AI features aren't configured on this server. Set AI_API_KEY (and optionally AI_MODEL) in the environment.",
      );
    }

    let resp: any;
    try {
      resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: `Please analyze this board game design and return a JSON balance report:\n\n${gameSummary}` },
          ],
        }),
      });
    } catch {
      throw new BadGatewayException("Couldn't reach the AI provider. Try again shortly.");
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new BadGatewayException(
        (err as { error?: { message?: string } }).error?.message ?? `AI provider error ${resp.status}`,
      );
    }

    const data = (await resp.json()) as { content: { type: string; text: string }[] };
    const raw = data.content.find((b) => b.type === "text")?.text ?? "";
    const clean = raw.replace(/```json\n?|```\n?/g, "").trim();

    try {
      return JSON.parse(clean);
    } catch {
      throw new BadGatewayException("The AI returned an unexpected response. Try again.");
    }
  }
}
