/**
 * Question loader module
 * Loads and validates MBTI test questions from the dataset
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Question, Dimension } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VALID_DIMENSIONS: Dimension[] = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];

/**
 * Load MBTI questions from the dataset file
 * @returns Array of validated questions
 * @throws Error if file not found or JSON parsing fails
 */
export function loadQuestions(): Question[] {
  const datasetPath = resolve(__dirname, 'datasets', 'mbti-questions.json');
  
  try {
    const fileContent = readFileSync(datasetPath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    if (!Array.isArray(questions)) {
      throw new Error('Questions data must be an array');
    }
    
    validateQuestions(questions);
    return questions;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Questions file not found at: ${datasetPath}\n` +
        'Please ensure src/datasets/mbti-questions.json exists.'
      );
    }
    
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON format in questions file: ${error.message}\n` +
        'Please check the JSON syntax in src/datasets/mbti-questions.json'
      );
    }
    
    throw error;
  }
}

/**
 * Validate questions array structure and required fields
 * @param questions - Array of questions to validate
 * @throws Error if validation fails with detailed message
 */
export function validateQuestions(questions: unknown[]): asserts questions is Question[] {
  if (questions.length === 0) {
    throw new Error('Questions array is empty');
  }
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const prefix = `Question at index ${i}`;
    
    // Check if question is an object
    if (typeof q !== 'object' || q === null) {
      throw new Error(`${prefix}: must be an object`);
    }
    
    const question = q as Record<string, unknown>;
    
    // Validate question field
    if (typeof question.question !== 'string' || question.question.trim() === '') {
      throw new Error(`${prefix}: missing or invalid "question" field (must be non-empty string)`);
    }
    
    // Validate choice_a
    validateChoice(question.choice_a, `${prefix}.choice_a`);
    
    // Validate choice_b
    validateChoice(question.choice_b, `${prefix}.choice_b`);
  }
}

/**
 * Validate a single choice object
 * @param choice - Choice object to validate
 * @param fieldPath - Path description for error messages
 * @throws Error if validation fails
 */
function validateChoice(choice: unknown, fieldPath: string): void {
  if (typeof choice !== 'object' || choice === null) {
    throw new Error(`${fieldPath}: must be an object`);
  }
  
  const c = choice as Record<string, unknown>;
  
  // Validate value field
  if (typeof c.value !== 'string') {
    throw new Error(`${fieldPath}.value: must be a string`);
  }
  
  if (!VALID_DIMENSIONS.includes(c.value as Dimension)) {
    throw new Error(
      `${fieldPath}.value: "${c.value}" is not a valid MBTI dimension. ` +
      `Must be one of: ${VALID_DIMENSIONS.join(', ')}`
    );
  }
  
  // Validate text field
  if (typeof c.text !== 'string' || c.text.trim() === '') {
    throw new Error(`${fieldPath}.text: must be a non-empty string`);
  }
}
