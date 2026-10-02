import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAgent, buildImagePrompt, buildVariationPrompt } from '../shared/generation.js';
import { getPromptView, getVariationPromptView, getInterpretationView } from '../shared/prompt-translation.js';

const agent = { name: '귀여움 통신', description: '새로운 소식을 소개합니다.', keywords: '트렌드, 가챠', role: 'Culture observer', concept: '귀여운 물건: 소식', tone: 'bright, witty, energetic' };

test('interpretation language changes translate generated values without mutating analysis or user input', () => {
  const reading = analyzeAgent(agent);
  const original = structuredClone(reading);
  for (const language of ['ko', 'ja']) {
    const view = getInterpretationView(agent, reading, language);
    for (const key of ['primaryObject', 'mood', 'color', 'composition']) {
      assert.notEqual(view.values[key], reading[key]);
      assert.ok(view.labels[key]);
    }
    assert.equal(view.values.coreRole, agent.role);
    assert.equal(view.values.personality, agent.tone);
    assert.ok(view.values.visualMotif.startsWith(`${agent.concept}: `));
    assert.ok(getPromptView(agent, reading, buildImagePrompt(agent, reading), language).text.includes(view.values.visualMotif));
  }
  assert.deepEqual(reading, original);
  assert.deepEqual(getInterpretationView(agent, reading, 'en').values, original);
  assert.equal(getInterpretationView(agent, null, 'ja'), null);
});

test('user-edited interpretation stays verbatim in all translated views', () => {
  const reading = { ...analyzeAgent(agent), primaryObject: '레트로 캡슐', mood: 'bright, witty, energetic', color: '桜色とミント' };
  const original = buildImagePrompt(agent, reading);
  for (const language of ['ko', 'ja']) {
    const view = getInterpretationView(agent, reading, language);
    for (const key of ['primaryObject', 'mood', 'color']) {
      assert.equal(view.values[key], reading[key]);
      assert.ok(getPromptView(agent, reading, original, language).text.includes(reading[key]));
    }
  }
});

test('language views preserve user content and leave generation prompts unchanged', () => {
  const reading = analyzeAgent(agent);
  const original = buildImagePrompt(agent, reading);
  const generation = buildVariationPrompt(agent, reading, original, 0);
  for (const language of ['ko', 'ja']) {
    const view = getPromptView(agent, reading, original, language);
    assert.equal(view.status, 'localized');
    assert.notEqual(view.text, original);
    for (const value of Object.values(agent)) assert.ok(view.text.includes(value));
    assert.ok(!view.text.includes('undefined'));
    assert.ok(!view.text.includes('floating news cards'));
    assert.equal(buildVariationPrompt(agent, reading, original, 0), generation);
  }
  assert.deepEqual(getPromptView(agent, reading, original, 'en'), { text: original, status: 'original' });
});

test('custom prompt edits show the current original instead of stale translations', () => {
  const reading = analyzeAgent(agent);
  const edited = `${buildImagePrompt(agent, reading)}\nUse a green accent.`;
  for (const language of ['ko', 'ja']) {
    assert.deepEqual(getPromptView(agent, reading, edited, language), { text: edited, status: 'edited' });
  }
});

test('empty prompts stay empty in every view', () => {
  for (const language of ['en', 'ko', 'ja']) assert.equal(getPromptView(agent, null, '', language).text, '');
});

test('all generated analysis branches have localized prose and preserve concept prefixes', () => {
  for (const keywords of ['comedy', 'news', 'ceramics']) {
    const input = { name: 'Test', description: 'Example', keywords, role: '', concept: 'Object: design', tone: '' };
    const reading = analyzeAgent(input);
    const prompt = buildImagePrompt(input, reading);
    for (const language of ['ko', 'ja']) {
      const view = getPromptView(input, reading, prompt, language);
      assert.equal(view.status, 'localized');
      for (const [key, value] of Object.entries(reading)) assert.ok(!view.text.includes(value), `${language}: ${key}`);
      assert.ok(view.text.includes('Object: design: '));
    }
  }
});

test('each variation translates its own direction without changing the original prompt', () => {
  const reading = analyzeAgent(agent);
  for (const language of ['ko', 'ja']) {
    const texts = [];
    for (let index = 0; index < 4; index++) {
      const original = buildVariationPrompt(agent, reading, '', index);
      const view = getVariationPromptView(agent, reading, original, index, language);
      assert.equal(view.status, 'localized');
      assert.ok(!view.text.includes('VARIATION'));
      assert.ok(view.text.includes(`${index + 1}:`));
      assert.ok(view.text.includes(agent.description));
      texts.push(view.text);
      assert.equal(getVariationPromptView(agent, reading, original, index, 'en').text, original);
    }
    assert.equal(new Set(texts).size, 4);
  }
});

test('variation translations retain custom instructions verbatim and reject mismatched snapshots', () => {
  const reading = analyzeAgent(agent);
  const source = 'Use a green cap. 사용자 지정. 日本語の指示。';
  const original = buildVariationPrompt(agent, reading, source, 2);
  for (const language of ['ko', 'ja']) {
    const view = getVariationPromptView(agent, reading, original, 2, language, source);
    assert.equal(view.status, 'localized');
    assert.ok(view.text.includes(source));
    assert.deepEqual(getVariationPromptView(agent, reading, original, 2, language), { text: original, status: 'edited' });
    assert.equal(getVariationPromptView(agent, reading, original, 1, language, source).status, 'edited');
  }
});
