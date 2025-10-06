import OpenAI from 'openai';

const apiKey = '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';
const model = 'anthropic/claude-3.5-sonnet';

console.log('Testing OpenAI SDK with OpenRouter...\n');

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/llm-mbti-arena',
    'X-Title': 'LLM MBTI Arena',
  },
});

console.log('Client created successfully');
console.log('BaseURL:', client.baseURL);
console.log('');

try {
  console.log('Sending request...');
  const response = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'user',
        content: '请回答 A 或 B',
      },
    ],
    temperature: 0.7,
    max_tokens: 10,
  });

  console.log('✓ Success!');
  console.log('Response:', response.choices[0]?.message?.content);
} catch (error) {
  console.log('✗ Failed');
  console.log('Error:', error);
  if (error.status) {
    console.log('Status:', error.status);
  }
  if (error.headers) {
    console.log('Headers:', error.headers);
  }
}
