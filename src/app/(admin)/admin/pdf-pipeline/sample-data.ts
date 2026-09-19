import type { PipelineQuestion } from '@/components/admin/pipeline-preview'

/**
 * Authentic sample questions matching the exact content of
 * "Application of Derivatives - JEE Main 2024 January Question Bank - MathonGo.pdf"
 */
export const SAMPLE_JEE_QUESTIONS: PipelineQuestion[] = [
  {
    chapter_name: 'Application of Derivatives',
    chapter: 'Application of Derivatives',
    question_number: 1,
    question_text:
      'If $5f(x) + 4f\\left(\\frac{1}{x}\\right) = x^2 - 2$, $\\forall x \\neq 0$ and $y = 9x^2f(x)$, then $y$ is strictly increasing in :',
    statement:
      'If $5f(x) + 4f\\left(\\frac{1}{x}\\right) = x^2 - 2$, $\\forall x \\neq 0$ and $y = 9x^2f(x)$, then $y$ is strictly increasing in :',
    question_type: 'mcq',
    type: 'mcq',
    difficulty: 'medium',
    visibility: 'public',
    options: [
      {
        text: '$\\left(0, \\frac{1}{\\sqrt{5}}\\right) \\cup \\left(\\frac{1}{\\sqrt{5}}, \\infty\\right)$',
        is_correct: false,
      },
      {
        text: '$\\left(-\\frac{1}{\\sqrt{5}}, 0\\right) \\cup \\left(\\frac{1}{\\sqrt{5}}, \\infty\\right)$',
        is_correct: true,
      },
      {
        text: '$\\left(-\\frac{1}{\\sqrt{5}}, 0\\right) \\cup \\left(0, \\frac{1}{\\sqrt{5}}\\right)$',
        is_correct: false,
      },
      {
        text: '$\\left(-\\infty, \\frac{1}{\\sqrt{5}}\\right) \\cup \\left(0, \\frac{1}{\\sqrt{5}}\\right)$',
        is_correct: false,
      },
    ],
    correct_answer: null,
    ai_difficulty: 'medium',
    source: 'JEE Main 2024 (01 Feb Shift 1)',
    merge_status: 'ok',
  },
  {
    chapter_name: 'Application of Derivatives',
    question_number: 2,
    question_text:
      'Let $g(x) = 3f\\left(\\frac{x}{3}\\right) + f(3 - x)$ and $f\'\'(x) > 0$ for all $x \\in (0, 3)$. If $g$ is decreasing in $(0, \\alpha)$ and increasing in $(\\alpha, 3)$, then $8\\alpha$ is',
    question_type: 'mcq',
    options: [
      { text: '$24$', is_correct: false },
      { text: '$0$', is_correct: false },
      { text: '$18$', is_correct: true },
      { text: '$20$', is_correct: false },
    ],
    correct_answer: null,
    ai_difficulty: 'medium',
    source: 'JEE Main 2024 (27 Jan Shift 2)',
    merge_status: 'ok',
  },
  {
    chapter_name: 'Application of Derivatives',
    question_number: 3,
    question_text:
      'The function $f(x) = 2x + 3(x)^{\\frac{2}{3}}$, $x \\in \\mathbb{R}$, has',
    question_type: 'mcq',
    options: [
      {
        text: 'exactly one point of local minima and no point of local maxima',
        is_correct: false,
      },
      {
        text: 'exactly one point of local maxima and no point of local minima',
        is_correct: false,
      },
      {
        text: 'exactly one point of local maxima and exactly one point of local minima',
        is_correct: true,
      },
      {
        text: 'exactly two points of local maxima and exactly one point of local minima',
        is_correct: false,
      },
    ],
    correct_answer: null,
    ai_difficulty: 'medium',
    source: 'JEE Main 2024 (29 Jan Shift 2)',
    merge_status: 'ok',
  },
  {
    chapter_name: 'Application of Derivatives',
    question_number: 4,
    question_text:
      'The function $f(x) = \\frac{x}{x^2 - 6x - 16}$, $x \\in \\mathbb{R} - \\{-2, 8\\}$',
    question_type: 'mcq',
    options: [
      {
        text: 'decreases in $(-2, 8)$ and increases in $(-\\infty, -2) \\cup (8, \\infty)$',
        is_correct: false,
      },
      {
        text: 'decreases in $(-\\infty, -2) \\cup (-2, 8) \\cup (8, \\infty)$',
        is_correct: true,
      },
      {
        text: 'decreases in $(-\\infty, -2)$ and increases in $(8, \\infty)$',
        is_correct: false,
      },
      {
        text: 'increases in $(-\\infty, -2) \\cup (-2, 8) \\cup (8, \\infty)$',
        is_correct: false,
      },
    ],
    correct_answer: null,
    ai_difficulty: 'medium',
    source: 'JEE Main 2024 (29 Jan Shift 2)',
    merge_status: 'ok',
  },
  {
    chapter_name: 'Application of Derivatives',
    question_number: 5,
    question_text:
      'Let $g : \\mathbb{R} \\to \\mathbb{R}$ be a non constant twice differentiable function such that $g\'\\left(\\frac{1}{2}\\right) = g\'\\left(\\frac{3}{2}\\right)$. If a real valued function $f$ is defined as $f(x) = \\frac{1}{2}[g(x) + g(2 - x)]$, then',
    question_type: 'mcq',
    options: [
      {
        text: '$f\'\'(x) = 0$ for atleast two $x$ in $(0, 2)$',
        is_correct: true,
      },
      {
        text: '$f\'\'(x) = 0$ for exactly one $x$ in $(0, 1)$',
        is_correct: false,
      },
      {
        text: '$f\'\'(x) = 0$ for no $x$ in $(0, 1)$',
        is_correct: false,
      },
      {
        text: '$f\'\\left(\\frac{3}{2}\\right) + f\'\\left(\\frac{1}{2}\\right) = 1$',
        is_correct: false,
      },
    ],
    correct_answer: null,
    ai_difficulty: 'hard',
    source: 'JEE Main 2024 (30 Jan Shift 1)',
    merge_status: 'ok',
  },
  {
    chapter_name: 'Application of Derivatives',
    question_number: 6,
    question_text:
      'Let $f(x) = (x + 3)^2(x - 2)^3$, $x \\in [-4, 4]$. If $M$ and $m$ are the maximum and minimum values of $f$, respectively in $[-4, 4]$, then the value of $M - m$ is :',
    question_type: 'mcq',
    options: [
      { text: '$600$', is_correct: false },
      { text: '$392$', is_correct: false },
      { text: '$608$', is_correct: true },
      { text: '$108$', is_correct: false },
    ],
    correct_answer: null,
    ai_difficulty: 'medium',
    source: 'JEE Main 2024 (30 Jan Shift 2)',
    merge_status: 'ok',
  },
]
