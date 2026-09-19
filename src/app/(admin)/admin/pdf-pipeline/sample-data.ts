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
    solution:
      'Given $5f(x) + 4f\\left(\\frac{1}{x}\\right) = x^2 - 2$. Replacing $x \\to \\frac{1}{x}$, we solve for $f(x)$ to get $f(x) = \\frac{5x^4 - 2x^2 - 4}{9x^2}$. Thus $y = 9x^2f(x) = 5x^4 - 2x^2 - 4$. Differentiating: $\\frac{dy}{dx} = 20x^3 - 4x = 4x(5x^2 - 1) > 0$. Finding intervals gives $x \\in \\left(-\\frac{1}{\\sqrt{5}}, 0\\right) \\cup \\left(\\frac{1}{\\sqrt{5}}, \\infty\\right)$.',
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
    solution:
      '$g\'(x) = 3 \\cdot \\frac{1}{3} f\'\\left(\\frac{x}{3}\\right) - f\'(3 - x) = f\'\\left(\\frac{x}{3}\\right) - f\'(3 - x)$. For $g$ to decrease, $g\'(x) < 0 \\implies f\'\\left(\\frac{x}{3}\\right) < f\'(3 - x)$. Since $f\'\'(x) > 0$, $f\'$ is strictly increasing, so $\\frac{x}{3} < 3 - x \\implies \\frac{4x}{3} < 3 \\implies x < \\frac{9}{4}$. Hence $\\alpha = \\frac{9}{4}$, so $8\\alpha = 8 \\times \\frac{9}{4} = 18$.',
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
    solution:
      '$f\'(x) = 2 + 2x^{-1/3} = 2\\left(1 + \\frac{1}{x^{1/3}}\\right) = 2\\left(\\frac{x^{1/3} + 1}{x^{1/3}}\\right)$. Critical points: $x = -1$ where $f\'(x) = 0$ (sign changes from $+$ to $-$, so local maximum) and $x = 0$ where $f\'(x)$ does not exist (sign changes from $-$ to $+$, so local minimum). Thus exactly one point of local maxima ($x = -1$) and exactly one point of local minima ($x = 0$).',
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
    solution:
      '$f\'(x) = \\frac{(x^2 - 6x - 16)(1) - x(2x - 6)}{(x^2 - 6x - 16)^2} = \\frac{x^2 - 6x - 16 - 2x^2 + 6x}{(x^2 - 6x - 16)^2} = \\frac{-(x^2 + 16)}{(x^2 - 6x - 16)^2}$. Notice $-(x^2 + 16) < 0$ and denominator is positive for all $x \\in \\mathbb{R} - \\{-2, 8\\}$. Hence $f\'(x) < 0$ on each disjoint interval, meaning $f$ decreases in $(-\\infty, -2) \\cup (-2, 8) \\cup (8, \\infty)$.',
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
    solution:
      '$f\'(x) = \\frac{1}{2}[g\'(x) - g\'(2 - x)]$. Then $f\'(1) = 0$, $f\'\\left(\\frac{1}{2}\\right) = \\frac{1}{2}[g\'(1/2) - g\'(3/2)] = 0$, and $f\'\\left(\\frac{3}{2}\\right) = \\frac{1}{2}[g\'(3/2) - g\'(1/2)] = 0$. Since $f\'(1/2) = f\'(1) = f\'(3/2) = 0$, by Rolle\'s Theorem, $f\'\'(x) = 0$ has at least one root in $(1/2, 1)$ and at least one root in $(1, 3/2)$. Therefore $f\'\'(x) = 0$ for at least two $x$ in $(0, 2)$.',
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
    solution:
      '$f\'(x) = 2(x + 3)(x - 2)^3 + 3(x + 3)^2(x - 2)^2 = (x + 3)(x - 2)^2[2(x - 2) + 3(x + 3)] = 5(x + 3)(x - 2)^2(x + 1)$. Critical points in $[-4, 4]$ are $x = -3, -1, 2$. Values: $f(-4) = (-1)^2(-6)^3 = -216$, $f(-3) = 0$, $f(-1) = (2)^2(-3)^3 = -108$, $f(2) = 0$, $f(4) = (7)^2(2)^3 = 392$. Minimum value $m = -216$ (at $x = -4$), Maximum value $M = 392$ (at $x = 4$). Hence $M - m = 392 - (-216) = 608$.',
    source: 'JEE Main 2024 (30 Jan Shift 2)',
    merge_status: 'ok',
  },
]
