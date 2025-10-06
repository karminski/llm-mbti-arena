/**
 * API Client module
 * Handles communication with OpenAI-compatible APIs
 */

import OpenAI from 'openai';
import { APIClientOptions } from './types.js';

export class APIClient {
  private client: OpenAI;
  private modelName: string;
  private maxRetries: number = 3;

  constructor(options: APIClientOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.apiUrl,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/llm-mbti-arena',
        'X-Title': 'LLM MBTI Arena',
      },
    });
    this.modelName = options.modelName;
  }

  /**
   * Ask a question to the model and get the choice (A or B)
   * @param question - The question text
   * @param choiceA - Text for option A
   * @param choiceB - Text for option B
   * @returns The chosen option ('A' or 'B')
   * @throws Error if all retries fail or response cannot be parsed
   */
  async askQuestion(
    question: string,
    choiceA: string,
    choiceB: string
  ): Promise<'A' | 'B'> {
    const prompt = this.constructPrompt(question, choiceA, choiceB);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.modelName,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 50, // Increased to accommodate JSON format
          response_format: { type: 'json_object' }, // Force JSON output if supported
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from model');
        }

        const choice = this.parseResponse(content);
        return choice;
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries;
        
        if (isLastAttempt) {
          throw new Error(
            `Failed to get response after ${this.maxRetries} attempts: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        // Log retry attempt to stderr
        console.error(
          `[Retry ${attempt}/${this.maxRetries}] API call failed, retrying...`
        );
        
        // Wait before retrying (exponential backoff)
        await this.sleep(1000 * attempt);
      }
    }

    // This should never be reached due to the throw in the loop
    throw new Error('Unexpected error in askQuestion');
  }

  /**
   * Construct the prompt for the model
   * Design: Don't tell the model this is an MBTI test to get more natural responses
   */
  private constructPrompt(
    question: string,
    choiceA: string,
    choiceB: string
  ): string {
    return `请根据你的倾向回答以下问题，选择更符合你的选项。

问题：${question}

选项：
A. ${choiceA}
B. ${choiceB}

请以 JSON 格式回答，只包含你的选择：
{"choice": "A"} 或 {"choice": "B"}`;
  }

  /**
   * Parse the model's response to extract A or B
   * @param response - Raw response from the model
   * @returns 'A' or 'B'
   * @throws Error if response cannot be parsed
   */
  private parseResponse(response: string): 'A' | 'B' {
    const trimmed = response.trim();

    // Try to parse as JSON first
    try {
      // Extract JSON from response (handle cases where model adds extra text)
      const jsonMatch = trimmed.match(/\{[^}]*"choice"\s*:\s*"[AB]"[^}]*\}/i);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const choice = parsed.choice?.toUpperCase();
        if (choice === 'A' || choice === 'B') {
          return choice;
        }
      }
    } catch (e) {
      // JSON parsing failed, fall through to other methods
    }

    // Fallback: Direct match
    const normalized = trimmed.toUpperCase();
    if (normalized === 'A' || normalized === 'A.') {
      return 'A';
    }
    if (normalized === 'B' || normalized === 'B.') {
      return 'B';
    }

    // Fallback: Fuzzy matching - look for A or B in the response
    // Use word boundary to avoid matching A/B in other words
    const hasA = /\bA\b/.test(normalized);
    const hasB = /\bB\b/.test(normalized);

    if (hasA && !hasB) {
      return 'A';
    }
    if (hasB && !hasA) {
      return 'B';
    }

    // Cannot determine
    throw new Error(
      `Unable to parse response: "${response}". Expected JSON format {"choice": "A"} or {"choice": "B"}.`
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
