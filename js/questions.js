/*
 * Sample questions shown the first time the setup page opens.
 * Questions 1-8 unlock the outer cells (in the order they are opened);
 * question 9 unlocks the golden slot. Couples are expected to rewrite them.
 * English is optional everywhere; guests see both languages when it is given.
 */
window.DEFAULT_QUESTIONS = [
  { q: '我们是在哪一年认识的？', qEn: 'What year did we meet?', answer: '2018', answerEn: '', wrong: ['2016', '2019', '2020'], wrongEn: ['', '', ''] },
  { q: '是谁先说"我爱你"的？', qEn: 'Who said "I love you" first?', answer: '新郎', answerEn: 'The groom', wrong: ['新娘'], wrongEn: ['The bride'] },
  { q: '我们第一次约会吃的是什么？', qEn: 'What did we eat on our first date?', answer: '火锅', answerEn: 'Hotpot', wrong: ['日料', '西餐', '烧烤'], wrongEn: ['Japanese', 'Western', 'BBQ'] },
  { q: '求婚是在哪里发生的？', qEn: 'Where did the proposal happen?', answer: '海边', answerEn: 'At the beach', wrong: ['餐厅', '家里', '旅行途中'], wrongEn: ['At a restaurant', 'At home', 'On a trip'] },
  { q: '家里谁比较会做饭？', qEn: 'Who is the better cook?', answer: '新娘', answerEn: 'The bride', wrong: ['新郎'], wrongEn: ['The groom'] },
  { q: '我们一起去过最远的地方是？', qEn: 'What is the farthest place we have travelled to together?', answer: '冰岛', answerEn: 'Iceland', wrong: ['日本', '澳洲', '法国'], wrongEn: ['Japan', 'Australia', 'France'] },
  { q: '谁比较爱睡懒觉？', qEn: 'Who loves to sleep in?', answer: '新郎', answerEn: 'The groom', wrong: ['新娘'], wrongEn: ['The bride'] },
  { q: '我们在一起多少年了？', qEn: 'How many years have we been together?', answer: '5 年', answerEn: '5 years', wrong: ['3 年', '4 年', '6 年'], wrongEn: ['3 years', '4 years', '6 years'] },
  { q: '宝宝的预产期是几月？', qEn: "Which month is the baby's due date?", answer: '3 月', answerEn: 'March', wrong: ['2 月', '4 月', '5 月'], wrongEn: ['February', 'April', 'May'] }
];
