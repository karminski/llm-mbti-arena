import questions from '../src/datasets/mbti-questions.json';
import type { Question, Dimension } from '../src/types';

const dimensionCount: Record<Dimension, number> = {
  E: 0, I: 0,
  S: 0, N: 0,
  T: 0, F: 0,
  J: 0, P: 0
};

questions.forEach((q: Question) => {
  dimensionCount[q.choice_a.value]++;
  dimensionCount[q.choice_b.value]++;
});

console.log('总题目数:', questions.length);
console.log('\n各维度题目数量统计:');
console.log('='.repeat(50));

// Wiki公式中的分母是ESTJ（第一个维度）的题目总数
const pairs = [
  { first: 'E', second: 'I', expectedFirst: 21, name: 'E/I (外倾/内倾)', formula: '(I - E) / 21 * 10' },
  { first: 'S', second: 'N', expectedFirst: 26, name: 'S/N (感觉/直觉)', formula: '(S - N) / 26 * 10' },
  { first: 'T', second: 'F', expectedFirst: 24, name: 'T/F (思考/情感)', formula: '(T - F) / 24 * 10' },
  { first: 'J', second: 'P', expectedFirst: 22, name: 'J/P (判断/知觉)', formula: '(P - J) / 22 * 10' }
];

pairs.forEach(pair => {
  const firstCount = dimensionCount[pair.first as Dimension];
  const secondCount = dimensionCount[pair.second as Dimension];
  const total = firstCount + secondCount;
  const match = firstCount === pair.expectedFirst ? '✓' : '✗';
  
  console.log(`\n${pair.name}:`);
  console.log(`  ${pair.first}: ${firstCount} 题 (期望: ${pair.expectedFirst}) ${match}`);
  console.log(`  ${pair.second}: ${secondCount} 题`);
  console.log(`  总计: ${total} 题`);
  console.log(`  Wiki公式: ${pair.formula}`);
});

console.log('\n' + '='.repeat(50));
const allMatch = pairs.every(p => dimensionCount[p.first as Dimension] === p.expectedFirst);
console.log('验证结果:', allMatch ? '✓ 数据完全匹配标准MBTI 93题' : '✗ 数据与标准不匹配');

if (allMatch) {
  console.log('\n说明:');
  console.log('  • 标准化分数 > 0 → 选择第二个维度 (I, N, F, P)');
  console.log('  • 标准化分数 < 0 → 选择第一个维度 (E, S, T, J)');
  console.log('  • 标准化分数 = 0 → 默认第一个维度 (E, S, T, J)');
}
