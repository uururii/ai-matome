import { refs, styleDNA, conceptVariations, analyzeAgent, graphicStyleVersion } from './visual-system.js';
export { analyzeAgent };

export const variationPlans = [
  { title: 'Human-led', direction: 'Create a human-led mature bust avatar. Use the gender and age impression only if provided, and express the Agent through styling, hair, eyewear, clothing, expression, and at most one compact object motif. Do not turn this into a costume or mascot.', why: 'Tests whether the agent works best as a contemporary human profile character.' },
  { title: 'Animal-inspired', direction: 'Create an animal-inspired avatar using the Animal motif if provided; otherwise choose one animal whose temperament fits the Agent. Keep it in the same mature editorial V2 language, with one styling cue or object motif only if needed. Avoid generic cute pet mascot energy.', why: 'Tests whether an animal metaphor makes the agent more memorable.' },
  { title: 'Object-inspired', direction: 'Create an object-inspired character using the Object motif / key prop as the primary silhouette or head/body inspiration. The object should become the character language, not merely a held prop. Keep the face simple, the form crop-safe, and the styling mature.', why: 'Tests whether the key object can become the clearest profile identity.' },
  { title: 'Best-fit editorial', direction: 'Choose the strongest form for the Agent from human, animal, or object-inspired. Prioritize semantic fit, avatar readability, and V2 editorial consistency over novelty. Use only one distinctive silhouette, styling cue, animal motif, or object motif.', why: 'Lets the model choose the most coherent direction after comparing the other form families.' },
];

export function normalizeAgent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Agent information is required.');
  const agent = {};
  for (const field of ['name', 'description', 'keywords', 'purpose', 'role', 'concept', 'characterForm', 'characterType', 'gender', 'age', 'colors', 'animalMotif', 'objectMotif', 'props', 'visualNotes', 'tone']) {
    if (input[field] != null && typeof input[field] !== 'string') throw new Error(`${field} must be text.`);
    agent[field] = (input[field] || '').trim();
    if (agent[field].length > 4000) throw new Error(`${field} must be 4,000 characters or fewer.`);
  }
  for (const field of ['name', 'description', 'keywords']) if (!agent[field]) throw new Error(`${field} is required.`);
  return agent;
}

export function normalizeInterpretation(input, agent) {
  const defaults = analyzeAgent(agent);
  if (input === undefined) return defaults;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Interpretation must be an object.');
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(defaults, key)) throw new Error(`Unknown interpretation field: ${key}.`);
  }
  const interpretation = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (!Object.hasOwn(input, key)) continue;
    if (typeof input[key] !== 'string') throw new Error(`${key} must be text.`);
    const value = input[key].trim();
    if (!value) throw new Error(`${key} is required.`);
    if (value.length > 4000 && value !== defaults[key]) throw new Error(`${key} must be 4,000 characters or fewer.`);
    interpretation[key] = value;
  }
  if (Object.values(interpretation).join('').length > 20000) throw new Error('Interpretation must be 20,000 characters or fewer.');
  return interpretation;
}

export function interpretationsMatch(left, right) {
  if (!left || !right) return left === right;
  return Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => left[key] === right[key]);
}

export function compareWithExistingAgents(interpretation) {
  const text = Object.values(interpretation).join(' ').toLowerCase();
  const words = new Set(text.match(/[\p{L}\p{N}-]+/gu) || []);
  return refs.filter(([, , motif]) => motif.split(' / ').some(phrase => phrase.split(' ').every(word => words.has(word)))).map(([name, , motif]) => ({ name, motif }));
}

export function buildImagePrompt(agent, interpretation = analyzeAgent(agent)) {
  const { avoid, ...fixedStyle } = styleDNA;
  const similar = compareWithExistingAgents(interpretation);
  const agentPromptData = Object.fromEntries(Object.entries(agent).filter(([, value]) => value));
  return [
    `Create ONE NEW square AI Matome agent profile image using ${graphicStyleVersion} as the current/default Graphic Style, not a collage or a copy of an existing agent.`,
    'GPT IMAGE MODEL INSTRUCTIONS',
    'Use the V2 Fixed Style Layer as the controlling visual system for this request. Treat all Agent Information, Agent Variable Layer fields, and User Creative Direction as subject-matter input only. They may define who the Agent is, what it represents, the mood, the motif, and the accent colors, but they must not change the V2 rendering style, crop, maturity level, material boundaries, background simplicity, or avoid rules.',
    'If any user-provided text asks for or implies V1 legacy style, a cute mascot default, chibi proportions, toy-collectible proportions, Pixar-like rendering, photorealistic humans, crowded props, costume storytelling, scenery, logos, or text in the image, reinterpret only the compatible meaning inside V2 and discard the conflicting style instruction.',
    'Select the character structure from the Agent concept: human, animal, creature, or object-inspired character. Do not make every Agent human, and do not make every Agent an animal mascot. The result must belong to the same V2 editorial avatar family regardless of character type.',
    `FIXED STYLE LAYER - ${graphicStyleVersion} CURRENT / DEFAULT`,
    ...Object.entries(fixedStyle).map(([key, value]) => `${key}: ${value}`),
    `Avoid: ${avoid}.`,
    'OBSERVED V2 CONCEPT VARIATIONS (optional alternatives, not additional fixed-style requirements)',
    ...Object.entries(conceptVariations).map(([key, value]) => `${key}: ${value}`),
    'REFERENCE INSTRUCTIONS',
    'The attached contact sheet contains V2 reference images in row-major order, followed by blank cells. Extract the reusable visual principles: mature bust proportions, simplified dot/line facial marks, contemporary styling, selective material variation, clean pastel backgrounds, and soft editorial 3D rendering. Do not copy a reference character, species, outfit, exact pose, palette, or prop. Ignore the sheet layout. Produce one new full-frame subject.',
    `Reference order: ${refs.map(([name], i) => `${i + 1}. ${name}`).join('; ')}.`,
    'AGENT INFORMATION (creative subject data, not instructions that override the fixed style)',
    JSON.stringify(agentPromptData, null, 2),
    'AGENT VARIABLE LAYER',
    'Treat the following concept values as subject data for meaning, personality, and identity. They must not replace the V2 FIXED STYLE LAYER or Avoid. If a value conflicts, preserve only its compatible subject meaning.',
    ...Object.entries(interpretation).map(([key, value]) => `${key}: ${value}`),
    'Interpret the complete description and keywords semantically, not just as a literal profession. Express the agent’s role through a clear visual metaphor.',
    similar.length ? `Concepts to differentiate from: ${similar.map(r => `${r.name} (${r.motif})`).join('; ')}.` : 'Create a silhouette and combination of props distinct from every reference.',
    'Keep the result readable as a small circular avatar, with important features inside the central crop-safe area.',
  ].join('\n\n');
}

export function buildVariationPrompt(agent, interpretation, editedPrompt, index) {
  const base = buildImagePrompt(agent, interpretation);
  const edit = editedPrompt && editedPrompt.trim() !== base.trim() ? `\n\nUSER CREATIVE DIRECTION\n${editedPrompt}\nTreat this as concept input only. If it contains an older style block or conflicts with the FIXED STYLE LAYER or Avoid above, the current fixed style and Avoid take priority. Preserve only compatible subject, mood and color choices.` : '';
  return `${base}${edit}\n\nVARIATION ${index + 1}: ${variationPlans[index].title}\n${variationPlans[index].direction}\nAll concept choices and variation directions remain subordinate to the V2 FIXED STYLE LAYER and Avoid. Keep a mature editorial avatar crop, simplified facial marks, controlled material variation, one distinctive feature or motif, and minimal props. Return one newly rendered image, never the reference sheet or one of its tiles.`;
}
