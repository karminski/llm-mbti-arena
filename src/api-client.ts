/**
 * API Client module
 * Handles communication with OpenAI-compatible APIs
 */

import OpenAI from 'openai';
import { APIClientOptions } from './types.js';

export class APIClient {
  private client: OpenAI;
  private modelName: string;
  private maxRetries: number;

  constructor(options: APIClientOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.apiUrl,
      timeout: 30000, // 30 seconds timeout
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/llm-mbti-arena',
        'X-Title': 'LLM MBTI Arena',
      },
    });
    this.modelName = options.modelName;
    this.maxRetries = options.maxRetries ?? 3;
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
          max_tokens: 5000, // Enough for JSON with markdown wrapper
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
            `Failed to get response after ${this.maxRetries} attempts: ${error instanceof Error ? error.message : String(error)
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
{"choice": "A"} 或 {"choice": "B"}
只需要输出JSON, 不要输出其他任何内容`;
  }

  /**
   * Parse the model's response to extract A or B
   * Simple string matching approach for reliability
   * @param response - Raw response from the model
   * @returns 'A' or 'B'
   * @throws Error if response cannot be parsed
   */
  private parseResponse(response: string): 'A' | 'B' {
    const content = response.trim();

    // Simple string matching: look for exact patterns
    const hasChoiceA = content.includes('{"choice": "A"}') || content.includes('{"choice":"A"}');
    const hasChoiceB = content.includes('{"choice": "B"}') || content.includes('{"choice":"B"}');

    // Check for case-insensitive variants
    const hasChoiceALower = content.includes('{"choice": "a"}') || content.includes('{"choice":"a"}');
    const hasChoiceBLower = content.includes('{"choice": "b"}') || content.includes('{"choice":"b"}');

    if (hasChoiceA || hasChoiceALower) {
      return 'A';
    }

    if (hasChoiceB || hasChoiceBLower) {
      return 'B';
    }

    // If no match found, throw error
    throw new Error(
      `Unable to find valid choice in response: "${response}". Expected format: {"choice": "A"} or {"choice": "B"}.`
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
