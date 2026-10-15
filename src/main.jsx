import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { WandSparkles, Copy, Layers3, LibraryBig, Moon, Sun } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import './hub-theme.css';

import { refs, styleDNA, conceptVariations, graphicStyleVersion, deriveCharacterDirection } from '../shared/visual-system.js';
import { analyzeAgent, buildImagePrompt, normalizeAgent, normalizeInterpretation, interpretationsMatch } from '../shared/generation.js';
import { getPromptView, getVariationPromptView, getInterpretationView, promptLanguages } from '../shared/prompt-translation.js';
import { generateProfileImages, getGenerationStatus, getGeneration, resumeGeneration } from '@generation-client';

const agentExample = {
  name: '코미디 소식통',
  description: '코미디를 좋아하는 사람들을 위해 코미디언의 근황부터 방송, 온라인 콘텐츠, 라이브 공연과 경연 소식까지 흥미로운 정보를 모아 소개합니다.',
  keywords: '코미디언 근황\n예능 출연\n코미디 공연\n스탠드업 코미디\n코미디 경연\n신인 코미디언',
  tone: '밝고 재치 있지만 지나치게 가볍지 않은 분위기. 친근한 말투로 핵심을 명확하게 전달',
  characterType: 'auto or human / animal / creature / object-inspired',
  gender: 'no preference or female / male / neutral',
  age: 'adult, young adult, middle-aged, or not applicable',
  colors: 'black, ivory, and mint accent',
  props: 'one compact microphone or editorial glasses',
  visualNotes: 'Mature presenter with refined glasses. Keep the microphone compact; avoid a toy-like or childish look.',
};
const imageGeneratorGptUrl = 'https://chatgpt.com/g/g-6abe2a02f49481b89c07d3291865ca3b-ai-agent-image-generator';

const directionTranslations = {
  ko: {
    'auto': '자동 선택',
    'human': '사람형',
    'object-inspired': '사물 기반 캐릭터',
    'no preference': '선호 없음',
    'not applicable': '해당 없음',
    'adult or young adult': '성인 또는 젊은 성인',
    'warm neutrals with one bright accent': '따뜻한 뉴트럴 톤과 밝은 포인트 색 하나',
    'black, denim, soft neutrals, and one vivid accent': '블랙, 데님, 부드러운 뉴트럴 톤과 선명한 포인트 색 하나',
    'clean neutrals with blue or mint accent': '깔끔한 뉴트럴 톤과 블루 또는 민트 포인트',
    'balanced contemporary colors with one signature accent': '균형 잡힌 현대적 컬러와 시그니처 포인트 색 하나',
    'one compact microphone or presenter cue': '작은 마이크 하나 또는 진행자 느낌의 단서',
    'editorial glasses, headset, or one compact bulletin object': '에디토리얼 안경, 헤드셋 또는 작은 소식 오브젝트 하나',
    'headphones or one clean fan-culture accent': '헤드폰 또는 깔끔한 팬 문화 포인트 하나',
    'one category-defining ball or sporty headwear cue': '카테고리를 보여주는 공 또는 스포티한 헤드웨어 단서 하나',
    'one simplified food-shaped motif integrated into the character': '캐릭터에 통합된 단순한 음식 형태 모티프 하나',
    'one distinctive category cue only if needed': '필요할 때만 카테고리를 보여주는 특징 하나',
    'Mature V2 editorial avatar, close bust crop, simplified facial marks, contemporary styling, one distinctive feature, minimal props, not childish or chibi.': '성숙한 V2 에디토리얼 아바타, 클로즈업 bust crop, 단순한 얼굴 표시, 현대적인 스타일링, 하나의 뚜렷한 특징, 최소한의 소품, 유치하거나 chibi처럼 보이지 않게.',
  },
  ja: {
    'auto': '自動選択',
    'human': '人型',
    'object-inspired': '物体ベースのキャラクター',
    'no preference': '指定なし',
    'not applicable': '該当なし',
    'adult or young adult': '大人または若い大人',
    'warm neutrals with one bright accent': '温かいニュートラルと明るいアクセント色を一つ',
    'black, denim, soft neutrals, and one vivid accent': 'ブラック、デニム、柔らかなニュートラル、鮮やかなアクセントを一つ',
    'clean neutrals with blue or mint accent': 'クリーンなニュートラルにブルーまたはミントのアクセント',
    'balanced contemporary colors with one signature accent': 'バランスのよい現代的な色とシグネチャーアクセントを一つ',
    'one compact microphone or presenter cue': '小さなマイクまたはプレゼンターらしい要素を一つ',
    'editorial glasses, headset, or one compact bulletin object': 'エディトリアルな眼鏡、ヘッドセット、または小さなニュースオブジェクトを一つ',
    'headphones or one clean fan-culture accent': 'ヘッドホンまたはすっきりしたファン文化のアクセントを一つ',
    'one category-defining ball or sporty headwear cue': 'カテゴリーを示すボールまたはスポーティな帽子の要素を一つ',
    'one simplified food-shaped motif integrated into the character': 'キャラクターに統合された単純な食べ物形モチーフを一つ',
    'one distinctive category cue only if needed': '必要な場合のみカテゴリーを示す特徴を一つ',
    'Mature V2 editorial avatar, close bust crop, simplified facial marks, contemporary styling, one distinctive feature, minimal props, not childish or chibi.': '成熟したV2エディトリアルアバター、近接バストクロップ、単純な顔の印、現代的なスタイリング、一つの明確な特徴、最小限の小物。子どもっぽさやちび風は避ける。',
  },
};

function localizeDirectionValue(value, language) {
  if (!value || language === 'en') return value;
  return directionTranslations[language]?.[value] || value;
}

const directionPlaceholders = {
  ko: {
    characterType: '자동 선택 또는 사람형 / 동물형 / 생물형 / 사물 기반',
    gender: '선호 없음 또는 여성 / 남성 / 중성',
    age: '성인, 젊은 성인, 중년, 또는 해당 없음',
    colors: '블랙, 아이보리, 민트 포인트',
    props: '작은 마이크 하나 또는 에디토리얼 안경',
    visualNotes: '세련된 안경을 쓴 성숙한 진행자. 마이크는 작게, 장난감 같거나 유치한 느낌은 피하기.',
  },
  ja: {
    characterType: '自動選択、または人型 / 動物型 / クリーチャー / 物体ベース',
    gender: '指定なし、または女性 / 男性 / ニュートラル',
    age: '大人、若い大人、中年、または該当なし',
    colors: 'ブラック、アイボリー、ミントのアクセント',
    props: '小さなマイクまたはエディトリアルな眼鏡',
    visualNotes: '洗練された眼鏡の成熟したプレゼンター。マイクは小さく、玩具風や子どもっぽさは避ける。',
  },
  en: {
    characterType: agentExample.characterType,
    gender: agentExample.gender,
    age: agentExample.age,
    colors: agentExample.colors,
    props: agentExample.props,
    visualNotes: agentExample.visualNotes,
  },
};

function getDirectionPlaceholder(field, language) {
  return directionPlaceholders[language]?.[field] || directionPlaceholders.en[field] || '';
}

const uiText = {
  ko: {
    profileGenerator: '프로필 생성기', referenceLibrary: '레퍼런스 라이브러리', setupRequired: '설정 필요', mockPreview: '목업 프리뷰',
    heading: 'Agent Profile Generator', briefTitle: 'Agent 기본 정보', briefDesc: '기본 정보를 입력하면 캐릭터 방향은 자동 해석됩니다.',
    name: 'Agent name', description: 'Description', keywords: 'Keywords', tone: 'Tone',
    directionTitle: 'AI가 해석한 캐릭터 방향', directionDesc: '자동으로 채워진 값입니다. 원하는 이미지가 있으면 직접 수정하세요.',
    characterType: 'Character type', gender: 'Gender', age: 'Age impression', colors: 'Preferred colors', props: 'Props', visualNotes: 'Visual notes',
    create: '4개 시안 프롬프트 만들기', generate: '4개 시안 생성', preparing: '준비 중', generating: '생성 중',
    results: '프로필 이미지 시안', refresh: '시안 새로 만들기', regenerate: '전체 재생성',
    send: '4개 프롬프트를 GPT로 보내기', sendReady: '전체 프롬프트를 복사하고 AI Agent Image Generator를 엽니다.', sendEmpty: '기본 정보를 입력하면 최종 GPT 배치가 준비됩니다.',
    copyOpen: '복사하고 GPT 열기', noPreview: '아직 프롬프트 시안이 없습니다', noImages: '아직 생성된 이미지가 없습니다', noResults: '아직 생성된 결과가 없습니다.',
    promptReady: '프롬프트 준비됨 · 이미지는 생성하지 않음', imagesComplete: '이미지 완료', previous: '이전 결과', resume: '남은 이미지 이어서 생성', check: '진행 확인',
    advanced: '고급: 전체 프롬프트', interpretation: '이미지 해석', interpretationDesc: 'Agent 정보 기반으로 자동 해석된 캐릭터 방향입니다. 화면 언어로 보이며, 생성에는 영어 원문이 사용됩니다.',
    fullPrompt: '생성 프롬프트', fullPromptDesc: '공통 스타일 규칙과 Agent 컨셉을 결합한 프롬프트입니다.', promptPlaceholder: '아직 생성된 프롬프트가 없습니다.',
    reset: '해석 초기화', apply: '변경 적용', unapplied: '적용되지 않은 변경사항', copied: '복사 완료', copyUnavailable: '복사를 사용할 수 없습니다. 텍스트를 직접 선택해 복사하세요.',
    promptEnglish: '생성 요청에는 영문 원본이 사용됩니다.', promptKo: '한국어 번역 보기입니다. 실제 생성 요청에는 영문 원본이 사용됩니다.', promptJa: '日本語訳表示です。実際の生成リクエストには英語原文が使われます。',
  },
  ja: {
    profileGenerator: 'プロフィール生成', referenceLibrary: 'リファレンス', setupRequired: '設定が必要', mockPreview: 'モックプレビュー',
    heading: 'Agent Profile Generator', briefTitle: 'Agent基本情報', briefDesc: '基本情報を入力すると、キャラクター方向は自動で解釈されます。',
    name: 'Agent name', description: 'Description', keywords: 'Keywords', tone: 'Tone',
    directionTitle: 'AIが解釈したキャラクター方向', directionDesc: '自動入力された値です。必要に応じて編集できます。',
    characterType: 'Character type', gender: 'Gender', age: 'Age impression', colors: 'Preferred colors', props: 'Props', visualNotes: 'Visual notes',
    create: '4案のプロンプトを作成', generate: '4案を生成', preparing: '準備中', generating: '生成中',
    results: 'プロフィール画像案', refresh: '案を更新', regenerate: 'すべて再生成',
    send: '4つのプロンプトをGPTへ送る', sendReady: '全プロンプトをコピーしてAI Agent Image Generatorを開きます。', sendEmpty: '基本情報を入力すると最終GPTバッチが準備されます。',
    copyOpen: 'コピーしてGPTを開く', noPreview: 'プロンプト案はまだありません', noImages: '画像はまだ生成されていません', noResults: '生成結果はまだありません。',
    promptReady: 'プロンプト準備完了 · 画像未生成', imagesComplete: '画像完了', previous: '以前の結果', resume: '残りの画像を再開', check: '進行確認',
    advanced: '詳細: 完全プロンプト', interpretation: '画像解釈', interpretationDesc: 'Agent情報にもとづいて自動解釈されたキャラクター方向です。画面言語で表示され、生成には英語原文が使われます。',
    fullPrompt: '生成プロンプト', fullPromptDesc: '共通スタイルルールとAgentコンセプトを組み合わせたプロンプトです。', promptPlaceholder: '生成されたプロンプトはまだありません。',
    reset: '解釈をリセット', apply: '変更を適用', unapplied: '未適用の変更', copied: 'コピーしました', copyUnavailable: 'コピーできません。テキストを選択してコピーしてください。',
    promptEnglish: '生成リクエストには英語原文が使われます。', promptKo: '한국어 번역 보기입니다. 실제 생성 요청에는 영문 원본이 사용됩니다.', promptJa: '日本語訳表示です。実際の生成リクエストには英語原文が使われます。',
  },
  en: {
    profileGenerator: 'Profile generator', referenceLibrary: 'Reference library', setupRequired: 'Setup required', mockPreview: 'Mock preview',
    heading: 'Agent Profile Generator', briefTitle: 'Agent basics', briefDesc: 'Enter the basics first; character direction is interpreted automatically.',
    name: 'Agent name', description: 'Description', keywords: 'Keywords', tone: 'Tone',
    directionTitle: 'AI-interpreted character direction', directionDesc: 'These values are auto-filled. Edit them when you have a clearer character in mind.',
    characterType: 'Character type', gender: 'Gender', age: 'Age impression', colors: 'Preferred colors', props: 'Props', visualNotes: 'Visual notes',
    create: 'Create 4 variation prompts', generate: 'Generate 4 variations', preparing: 'Preparing', generating: 'Generating',
    results: 'Profile image variations', refresh: 'Refresh previews', regenerate: 'Regenerate all',
    send: 'Send all 4 prompts to GPT', sendReady: 'Copy the full batch and open the AI Agent Image Generator.', sendEmpty: 'Enter the basics first to prepare the final GPT batch.',
    copyOpen: 'Copy & open GPT', noPreview: 'No prompt previews yet', noImages: 'No images generated yet', noResults: 'No results yet.',
    promptReady: 'prompts ready · No images generated', imagesComplete: 'images complete', previous: 'Previous results', resume: 'Resume remaining images', check: 'Check progress',
    advanced: 'Advanced: full prompt', interpretation: 'Image interpretation', interpretationDesc: 'Auto-interpreted character direction based on your agent information. It is displayed in the UI language while English source text is used for generation.',
    fullPrompt: 'Generated prompt', fullPromptDesc: "Shared style rules combined with your agent's concept.", promptPlaceholder: 'No generated prompt yet.',
    reset: 'Reset interpretation', apply: 'Apply changes', unapplied: 'Unapplied changes', copied: 'Prompt copied', copyUnavailable: 'Copy unavailable. Select the text to copy it.',
    promptEnglish: 'The English source prompt is used for generation.', promptKo: 'Korean translation view. The English source prompt is used for generation.', promptJa: 'Japanese translation view. The English source prompt is used for generation.',
  },
};

function App() {
  const [agent, setAgent] = useState({ name: '', description: '', purpose: '', characterType: '', gender: '', age: '', colors: '', props: '', visualNotes: '', tone: '', keywords: '' });
  const [uiLanguage, setUiLanguage] = useState('ko');
  const [tab, setTab] = useState('generator');
  const [reading, setReading] = useState(null);
  const [readingDraft, setReadingDraft] = useState(null);
  const [readingRevision, setReadingRevision] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [promptLanguage, setPromptLanguage] = useState('en');
  const [interpretationLanguage, setInterpretationLanguage] = useState('en');
  const [selected, setSelected] = useState(null);
  const [job, setJob] = useState(null);
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [pollPaused, setPollPaused] = useState(false);
  const sending = useRef(false);
  const [dark, setDark] = useState(false);
  const [notice, setNotice] = useState('');
  const busy = submitting || job?.status === 'running';
  const remainingWait = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  const interpretationDirty = !interpretationsMatch(reading, readingDraft);
  const canGenerate = connection?.configured && reading && prompt.trim() && !interpretationDirty && !busy && !remainingWait;
  const canPrepare = connection?.configured && agent.name.trim() && agent.description.trim() && agent.keywords.trim() && agent.tone.trim() && !busy && !remainingWait;
  const previewMode = connection?.mode === 'preview';
  const shownPrompt = prompt;
  const promptView = getPromptView(agent, reading, shownPrompt, promptLanguage);
  const interpretationView = getInterpretationView(agent, readingDraft, interpretationLanguage);
  const previousResults = job && reading && (!interpretationsMatch(job.interpretation, reading) || (job.sourcePrompt || buildImagePrompt(job.agent, job.interpretation)) !== prompt);
  const editedPrompt = reading && prompt !== buildImagePrompt(agent, reading);
  const variations = job?.images || [];
  const hasVariationPrompts = variations.some(image => image.prompt);
  const completed = variations.filter(image => ['complete', 'preview'].includes(image.status)).length;
  const t = uiText[uiLanguage];
  const basicComplete = agent.name.trim() && agent.description.trim() && agent.keywords.trim() && agent.tone.trim();
  const refreshConnection = async () => {
    try {
      const status = await getGenerationStatus();
      setConnection(status); setError(''); setRetryAt(status.retryAt || 0);
      if (status.activeJobId) {
        const activeJob = await getGeneration(status.activeJobId);
        setJob(activeJob); setAgent(activeJob.agent); setReading(activeJob.interpretation); setReadingDraft(activeJob.interpretation); setReadingRevision(value=>value+1);
        setPrompt(activeJob.sourcePrompt || buildImagePrompt(activeJob.agent, activeJob.interpretation)); setSelected(null); setPollPaused(false);
      }
    } catch (e) { setConnection(null); setError(e.message); }
  };
  useEffect(() => { void refreshConnection(); }, []);
  useEffect(() => {
    setInterpretationLanguage(uiLanguage);
  }, [uiLanguage]);
  useEffect(() => {
    if (!retryAt) return;
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  useEffect(() => {
    if (!job || job.status !== 'running' || pollPaused) return;
    let stopped = false;
    let timer;
    const poll = async () => {
      try {
        const next = await getGeneration(job.id);
        if (stopped) return;
        setJob(next);
        if (next.error) { setError(next.error.message); setRetryAt(next.error.retryAt || 0); }
        if (next.status === 'running') timer = setTimeout(poll, 2000);
      } catch (e) {
        if (!stopped) {
          setError(e.message + ' Check progress before starting another generation.'); setPollPaused(true);
          if (e.status === 404) setJob(previous => ({ ...previous, status: 'interrupted' }));
        }
      }
    };
    timer = setTimeout(poll, 1000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [job?.id, job?.status, pollPaused]);
  const update = (key, value) => {
    const next = { ...agent, [key]: value };
    setAgent(next); setReading(null); setReadingDraft(null); setPrompt(''); setJob(null); setSelected(null); setNotice(''); setError(''); setPollPaused(false);
  };
  const updateWithAutoDirection = (key, value) => {
    const next = { ...agent, [key]: value };
    const hasBasics = next.name.trim() && next.description.trim() && next.keywords.trim() && next.tone.trim();
    if (hasBasics) {
      const derived = deriveCharacterDirection(next);
      for (const field of ['characterType', 'gender', 'age', 'colors', 'props', 'visualNotes']) {
        if (!next[field]) next[field] = derived[field];
      }
    }
    setAgent(next); setReading(null); setReadingDraft(null); setPrompt(''); setJob(null); setSelected(null); setNotice(''); setError(''); setPollPaused(false);
  };
  const refreshCharacterDirection = () => {
    const derived = deriveCharacterDirection(agent);
    setAgent(previous => ({ ...previous, ...derived }));
    setReading(null); setReadingDraft(null); setPrompt(''); setJob(null); setSelected(null); setNotice(''); setError('');
  };
  const analyze = () => {
    try {
      const normalized = normalizeAgent(agent);
      const next = analyzeAgent(normalized);
      setAgent(normalized); setReading(next); setReadingDraft(next); setReadingRevision(value=>value+1); setPrompt(buildImagePrompt(normalized, next));
      setNotice('Agent analysis updated'); setError('');
    } catch (e) { setError(e.message); }
  };
  const prepareVariations = async () => {
    if (sending.current || !canPrepare) return;
    try {
      const autoFilled = { ...agent, ...Object.fromEntries(Object.entries(deriveCharacterDirection(agent)).map(([key, value]) => [key, agent[key] || value])) };
      const normalized = normalizeAgent(autoFilled);
      const nextReading = analyzeAgent(normalized);
      const nextPrompt = buildImagePrompt(normalized, nextReading);
      sending.current = true; setSubmitting(true); setError(''); setPollPaused(false);
      setAgent(normalized); setReading(nextReading); setReadingDraft(nextReading); setReadingRevision(value=>value+1); setPrompt(nextPrompt); setSelected(null);
      const next = await generateProfileImages({
        agent: normalized, interpretation: nextReading, prompt: nextPrompt, requestId: crypto.randomUUID(),
      });
      setJob(next); setNotice(previewMode ? '4 variation prompts prepared' : '4 variations started');
    } catch (e) { setError(e.message); if (e.retryAt) setRetryAt(e.retryAt); }
    finally { sending.current = false; setSubmitting(false); }
  };
  const changeInterpretation = (key, value) => {
    setReadingDraft(previous => ({ ...previous, [key]: value }));
    setError(''); setNotice('');
  };
  const applyInterpretation = () => {
    try {
      const next = normalizeInterpretation(readingDraft, agent);
      setReading(next); setReadingDraft(next); setReadingRevision(value=>value+1);
      setPrompt(buildImagePrompt(agent, next)); setSelected(null);
      setError(''); setNotice('Interpretation changes applied');
    } catch (e) { setError(e.message); }
  };
  const resetInterpretation = () => {
    const next = analyzeAgent(agent);
    setReading(next); setReadingDraft(next); setReadingRevision(value=>value+1);
    setPrompt(buildImagePrompt(agent, next)); setSelected(null);
    setError(''); setNotice('Original interpretation restored');
  };
  const generate = async (resume = false) => {
    if (sending.current || !canGenerate || (resume && previousResults)) return;
    try {
      const normalized = normalizeAgent(agent);
      sending.current = true; setSubmitting(true); setError(''); setPollPaused(false);
      const next = resume && job ? await resumeGeneration(job.id) : await generateProfileImages({
        agent: normalized, interpretation: reading, prompt: shownPrompt, requestId: crypto.randomUUID(),
      });
      setJob(next); setSelected(null);
    } catch (e) { setError(e.message); if (e.retryAt) setRetryAt(e.retryAt); }
    finally { sending.current = false; setSubmitting(false); }
  };
  const checkProgress = async () => {
    try { const next = await getGeneration(job.id); setJob(next); setPollPaused(false); setError(next.error?.message || ''); if (next.error?.retryAt) setRetryAt(next.error.retryAt); }
    catch (e) { setError(e.message); if (e.status === 404) setJob(previous => ({ ...previous, status: 'interrupted' })); }
  };
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(promptView.text); setNotice(t.copied); }
    catch { setNotice(t.copyUnavailable); }
  };
  const copyVariationBatchPrompt = async ({ openGpt = false } = {}) => {
    const readyPrompts = variations.filter(image => image.prompt).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const text = [
      'Generate four separate V2 AI Matome profile image candidates from the following four prompts.',
      '',
      'Important:',
      '- Create 4 separate square 1:1 images, not a collage or grid.',
      '- Use each prompt independently.',
      '- Keep the same V2 Graphic Style across all four.',
      '- Label them Variation 1, Variation 2, Variation 3, and Variation 4.',
      '- If image-generation limits prevent creating all four images in one response, generate as many as possible and clearly say which variations still need to be generated.',
      '',
      ...readyPrompts.flatMap((image, i) => [
        `--- Variation ${i + 1}: ${image.title || `Variation ${i + 1}`} ---`,
        image.prompt,
        '',
      ]),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text.trim());
      setNotice(openGpt ? (uiLanguage === 'ja' ? '4つのプロンプトをコピーしました。開いたGPT画面に貼り付けてください。' : uiLanguage === 'en' ? '4 prompts copied. Paste them into the opened GPT window.' : '4개 프롬프트를 복사했습니다. 열린 GPT 창에 붙여넣어 주세요.') : (uiLanguage === 'ja' ? '4つのGPT画像プロンプトをまとめてコピーしました。' : uiLanguage === 'en' ? '4 GPT image prompts copied as one batch' : '4개 GPT 이미지 프롬프트를 한 번에 복사했습니다.'));
      if (openGpt) window.open(imageGeneratorGptUrl, '_blank', 'noopener,noreferrer');
    }
    catch { setNotice(t.copyUnavailable); }
  };
  return <div className={dark ? 'app-shell dark' : 'app-shell'}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Layers3 size={20}/></div><div><strong>AI Matome</strong><span>Creative tools</span></div></div>
      <div className="side-label">Workspace</div>
      <nav aria-label="Workspace">
        <Button variant="ghost" className={'nav-item '+(tab==='generator'?'active':'')} aria-current={tab==='generator'?'page':undefined} onClick={()=>setTab('generator')}><WandSparkles/> {t.profileGenerator}</Button>
        <Button variant="ghost" className={'nav-item '+(tab==='library'?'active':'')} aria-current={tab==='library'?'page':undefined} onClick={()=>setTab('library')}><LibraryBig/> {t.referenceLibrary} <Badge variant="outline">{refs.length}</Badge></Button>
      </nav>
      <div className="side-foot"><div className="reference-stack">{refs.slice(0,3).map(r=><img key={r[0]} src={'/references/'+r[1]} alt={r[0]}/>)}</div><strong>Matome Visual System</strong><span>{graphicStyleVersion} · {refs.length} references</span><Badge variant="secondary">Current Default</Badge></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{tab==='generator'?t.profileGenerator:t.referenceLibrary}</strong></div><div className="top-actions"><PromptLanguageToggle value={uiLanguage} onChange={setUiLanguage} label="UI language"/><Badge variant="secondary">{connection?.configured ? (connection.provider === 'browser-preview' ? connection.label : previewMode ? t.mockPreview : connection.label) : t.setupRequired}</Badge><Button variant="ghost" size="icon" aria-label={dark?'Light mode':'Dark mode'} title={dark?'Light mode':'Dark mode'} onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</Button></div></header>
      {tab==='generator' ? <main className="main">
        <div className="page-heading"><div><div className="eyebrow">AI MATOME</div><h1>{t.heading}</h1></div><Badge variant="outline"><Layers3/> {graphicStyleVersion} · {refs.length} references</Badge></div>
        {connection?.provider !== 'browser-preview' && <div className="connection-bar" role="status"><span>{connection?.message || 'Connecting to the local generation service…'}</span><Button variant="ghost" size="sm" onClick={refreshConnection} disabled={busy}>Check connection</Button></div>}
        {error && <div className="generation-error" role="alert">{error}</div>}
        {remainingWait > 0 && <p className="demo-note" role="status">Retry available in {remainingWait}s. No automatic API retry will be sent.</p>}
        <div className="studio-grid">
          <section className="input-panel">
            <SectionHeading step="01" title={t.briefTitle} description={t.briefDesc}/>
            <form onSubmit={e=>{e.preventDefault();prepareVariations();}}><fieldset disabled={busy}>
              <Field label={t.name} required placeholder={agentExample.name} value={agent.name} onChange={v=>updateWithAutoDirection('name',v)}/>
              <Field label={t.description} required placeholder={agentExample.description} value={agent.description} onChange={v=>updateWithAutoDirection('description',v)} area/>
              <Field label={t.keywords} required placeholder={agentExample.keywords} value={agent.keywords} onChange={v=>updateWithAutoDirection('keywords',v)} area/>
              <Field label={t.tone} required placeholder={agentExample.tone} value={agent.tone} onChange={v=>updateWithAutoDirection('tone',v)} area/>
              <Button type="submit" className="full" disabled={!canPrepare}>{busy ? `${previewMode ? t.preparing : t.generating} ${completed}/4` : previewMode ? t.create : t.generate}</Button>
            </fieldset></form>
            <section className="interpretation image-interpretation">
              <SectionHeading step="02" title={t.interpretation} description={t.interpretationDesc} action={<Button type="button" variant="outline" size="sm" disabled={!basicComplete} onClick={refreshCharacterDirection}>{uiLanguage === 'ja' ? '再解釈' : uiLanguage === 'en' ? 'Reinterpret' : '다시 해석'}</Button>}/>
              <div className="two-col">
                <DirectionField label={t.characterType} value={agent.characterType} placeholder={getDirectionPlaceholder('characterType', uiLanguage)} uiLanguage={uiLanguage} onChange={v=>update('characterType',v)}/>
                <DirectionField label={t.gender} value={agent.gender} placeholder={getDirectionPlaceholder('gender', uiLanguage)} uiLanguage={uiLanguage} onChange={v=>update('gender',v)}/>
              </div>
              <div className="two-col">
                <DirectionField label={t.age} value={agent.age} placeholder={getDirectionPlaceholder('age', uiLanguage)} uiLanguage={uiLanguage} onChange={v=>update('age',v)}/>
                <DirectionField label={t.colors} value={agent.colors} placeholder={getDirectionPlaceholder('colors', uiLanguage)} uiLanguage={uiLanguage} onChange={v=>update('colors',v)}/>
              </div>
              <DirectionField label={t.props} value={agent.props} placeholder={getDirectionPlaceholder('props', uiLanguage)} uiLanguage={uiLanguage} onChange={v=>update('props',v)}/>
              <DirectionField label={t.visualNotes} value={agent.visualNotes} placeholder={getDirectionPlaceholder('visualNotes', uiLanguage)} uiLanguage={uiLanguage} onChange={v=>update('visualNotes',v)} area/>
              {reading ? <>
                <PromptLanguageToggle value={interpretationLanguage} onChange={setInterpretationLanguage} label="Agent 해석 보기 언어"/>
                <div className="interpret-grid" lang={interpretationLanguage}>{['visualMotif', 'primaryObject', 'mood', 'color'].map(key => <EditableInfo key={`${key}-${readingRevision}`} label={interpretationView.labels[key]} value={interpretationView.values[key]} sourceValue={readingDraft[key]} disabled={busy} onChange={value=>changeInterpretation(key,value)}/>)}</div>
                <div className="concept-strip" lang={interpretationLanguage}>{['coreRole', 'composition'].map(key => <EditableInfo key={`${key}-${readingRevision}`} label={interpretationView.labels[key]} value={interpretationView.values[key]} sourceValue={readingDraft[key]} disabled={busy} onChange={value=>changeInterpretation(key,value)}/>)}</div>
                <div className="interpretation-actions"><Button variant="ghost" size="sm" disabled={busy || (!interpretationDirty && interpretationsMatch(reading, analyzeAgent(agent)))} onClick={resetInterpretation}>{t.reset}</Button><Button size="sm" disabled={busy || !interpretationDirty} onClick={applyInterpretation}>{t.apply}</Button></div>
                {interpretationDirty && <p className="prompt-language-status" role="status">{t.unapplied}</p>}
                {editedPrompt && <p className="prompt-language-status">Applying or resetting interpretation replaces the edited prompt.</p>}
                {interpretationLanguage !== 'en' && <p className="prompt-language-status">{interpretationLanguage === 'ko' ? '직접 입력한 내용은 원문 유지' : '直接入力した内容は原文を保持'}</p>}
              </> : <p className="empty-state compact" role="status">{uiLanguage === 'ja' ? '基本情報を入力すると画像解釈が表示されます。' : uiLanguage === 'en' ? 'Enter the basics to preview the image interpretation.' : '기본 정보를 입력하면 이미지 해석이 표시됩니다.'}</p>}
            </section>
          </section>
          <div className="right-column">
            <section className="results">
              <SectionHeading step="03" title={t.results} action={<Button variant="outline" size="sm" disabled={!canGenerate || !job} onClick={()=>generate()}>{previewMode ? t.refresh : t.regenerate}</Button>}/>
              <div className="gpt-export-bar">
                <div><strong>{t.send}</strong><span>{hasVariationPrompts ? t.sendReady : t.sendEmpty}</span></div>
                <Button disabled={!hasVariationPrompts} onClick={()=>copyVariationBatchPrompt({ openGpt: true })}><Copy/> {t.copyOpen}</Button>
              </div>
              <div className="generation-summary" role="status"><span>{busy ? `Processing · ${completed}/4 complete` : job ? `${completed}/4 ${job.mode === 'preview' ? t.promptReady : t.imagesComplete}` : previewMode ? t.noPreview : t.noImages}</span>
                {previousResults && <Badge variant="outline">{t.previous}</Badge>}
                {job?.status === 'failed' && <Button variant="outline" size="sm" disabled={!canGenerate || previousResults} onClick={()=>generate(true)}>{t.resume}</Button>}
                {pollPaused && <Button variant="outline" size="sm" onClick={checkProgress}>{t.check}</Button>}
              </div>
              {job ? <div className="variation-grid">{variations.map((r,i)=><Variation key={`${job.id}-${i}`} item={r} index={i} agent={job.agent} interpretation={job.interpretation} sourcePrompt={job.sourcePrompt} uiLanguage={uiLanguage}/>)}</div> : <p className="empty-state" role="status">{t.noResults}</p>}
            </section>
            <details className="advanced-panel">
              <summary>{t.advanced}</summary>
            <section className="prompt-panel">
              <SectionHeading step="04" title={t.fullPrompt} description={t.fullPromptDesc} action={<Button variant="ghost" size="icon-sm" title="Copy prompt" aria-label="Copy prompt" disabled={!promptView.text.trim()} onClick={copyPrompt}><Copy/></Button>}/>
              <PromptLanguageToggle value={promptLanguage} onChange={setPromptLanguage}/>
              <Textarea disabled={busy || !reading} readOnly={promptLanguage !== 'en'} lang={promptView.status === 'localized' ? promptLanguage : undefined} aria-label={t.fullPrompt} aria-describedby={reading ? 'prompt-language-status' : undefined} className="prompt-box" placeholder={t.promptPlaceholder} value={promptView.text} onChange={e=>setPrompt(e.target.value)}/>
              {reading && <p id="prompt-language-status" className="prompt-language-status" role="status">{promptView.status === 'edited' ? (uiLanguage === 'ja' ? '編集済みプロンプトは自動翻訳されません。元の編集内容を表示します。' : uiLanguage === 'en' ? 'Edited prompts are shown as written and are not auto-translated.' : '직접 수정한 프롬프트는 자동 번역하지 않습니다. 수정된 원문을 표시합니다.') : promptLanguage === 'en' ? t.promptEnglish : promptLanguage === 'ko' ? t.promptKo : t.promptJa}</p>}
              <div className="prompt-footer"><Button disabled={!canGenerate} onClick={()=>generate()}>{busy ? `${previewMode ? t.preparing : t.generating} ${completed}/4` : previewMode ? t.refresh : t.regenerate}</Button></div>
            </section>
            </details>
          </div>
        </div>
        <div className="notice" role="status">{notice}</div>
      </main> : <Library refs={refs} uiLanguage={uiLanguage}/>}
    </div>
  </div>
}

function SectionHeading({step,title,description,action}) { return <div className="panel-head"><div className="panel-title"><h2><span className="step">{step}</span>{title}</h2>{description && <p className="panel-description">{description}</p>}</div>{action}</div> }
function Field({label,required,placeholder,value,onChange,area}) {
  const props = {required,placeholder,value,onChange:e=>onChange(e.target.value),lang:/[ぁ-んァ-ン]/.test(value)?'ja':'ko'};
  return <label className="field"><span className="field-label">{label}{required&&<span className="required" aria-hidden="true"> *</span>}</span>{area?<Textarea {...props} rows={label.toLowerCase().includes('keyword') || label.includes('키워드') || label.includes('キーワード') ? 5:3}/>:<Input {...props}/>}</label>
}
function DirectionField({label,value,placeholder,onChange,area,uiLanguage}) {
  const [editing, setEditing] = useState(false);
  const display = localizeDirectionValue(value, uiLanguage);
  const editHint = uiLanguage === 'ja' ? '生成用の英語原文を編集' : uiLanguage === 'en' ? 'Edit English source used for generation' : '생성용 영어 원문 편집';
  const props = { placeholder, value, onChange:e=>onChange(e.target.value), onBlur:()=>setEditing(false), autoFocus:true, lang:'en' };
  return <label className="field direction-field"><span className="field-label">{label}</span>{editing ? <>{area?<Textarea {...props} rows={3}/>:<Input {...props}/>}<span className="field-hint">{editHint}</span></> : <button type="button" className="direction-value" onClick={()=>setEditing(true)}>{display || <span className="muted-value">{placeholder}</span>}</button>}</label>
}
function Info({label,value}) { return <div className="info"><span>{label}</span><p>{value}</p></div> }
function EditableInfo({label,value,sourceValue,disabled,onChange}) {
  const [editing, setEditing] = useState(false);
  const [buffer, setBuffer] = useState(value);
  const original = useRef({ display: value, source: sourceValue });
  return <div className="info editable-info"><span>{label}</span>{editing ? <Textarea autoFocus aria-label={label} value={buffer} maxLength={4000} rows={3} disabled={disabled} onChange={e=>{const next = e.target.value; setBuffer(next); onChange(next === original.current.display ? original.current.source : next);}} onKeyDown={e=>{if(e.key === 'Escape') setEditing(false);}}/> : <button type="button" className="interpretation-value" aria-label={`Edit ${label}`} disabled={disabled} onClick={()=>{original.current={display:value,source:sourceValue};setBuffer(value);setEditing(true);}}>{value || 'Not set'}</button>}</div>;
}
function PromptLanguageToggle({value,onChange,label = '프롬프트 보기 언어'}) {
  return <div className="prompt-languages" role="group" aria-label={label}>
    {promptLanguages.map(language => <button key={language} type="button" lang={language} aria-pressed={value === language} onClick={()=>onChange(language)}>{language === 'en' ? 'English' : language === 'ko' ? '한국어' : '日本語'}</button>)}
  </div>;
}
function Variation({item,index,agent,interpretation,sourcePrompt,uiLanguage = 'en'}) {
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('en');
  const promptView = getVariationPromptView(agent, interpretation, item.prompt, item.index ?? index, language, sourcePrompt);
  return <article className="variation prompt-card">
    <div className="var-meta"><div className="variation-heading"><Badge variant="secondary">0{index+1}</Badge><strong>{item.title}</strong></div><span>{item.why}</span>
    {item.prompt && <><details open={item.status === 'preview'}><summary>{uiLanguage === 'ja' ? '最終画像プロンプト' : uiLanguage === 'ko' ? '최종 이미지 프롬프트' : 'Final image prompt'}</summary><PromptLanguageToggle value={language} onChange={value=>{setLanguage(value);setCopied(false);}}/>{language !== 'en' && <p className="prompt-language-status" role="status">{promptView.status !== 'localized' ? '번역할 수 없는 수정본입니다. 원문을 표시합니다.' : language === 'ko' ? 'Agent 입력·직접 수정한 내용은 원문 유지' : 'Agentの入力・直接編集した内容は原文を保持'}</p>}<pre className="image-prompt" lang={promptView.status === 'localized' ? language : undefined}>{promptView.text}</pre></details><Button variant="ghost" size="sm" onClick={async()=>{try{await navigator.clipboard.writeText(promptView.text);setCopied(true);}catch{setCopied(false);}}}>{copied ? (uiLanguage === 'ja' ? 'コピー済み' : uiLanguage === 'ko' ? '복사됨' : 'Copied') : (uiLanguage === 'ja' ? '最終プロンプトをコピー' : uiLanguage === 'ko' ? '최종 프롬프트 복사' : 'Copy final prompt')}</Button></>}
    </div>
  </article>
}
function Library({refs, uiLanguage = 'en'}) {
  const libraryTitle = uiLanguage === 'ja' ? 'リファレンスライブラリ' : uiLanguage === 'ko' ? '레퍼런스 라이브러리' : 'Reference library';
  return <main className="main library-page"><div className="page-heading"><div><div className="eyebrow">AI MATOME</div><h1>{libraryTitle}</h1></div><Badge variant="outline">{graphicStyleVersion} · {refs.length} references</Badge></div>
    <section className="dna-section"><SectionHeading title="Global Style DNA"/><div className="dna-grid">{Object.entries(styleDNA).map(([label,value])=><Info key={label} label={label} value={value}/>)}</div></section>
    <section className="dna-section"><SectionHeading title="Agent Concept Variations"/><div className="dna-grid">{Object.entries(conceptVariations).map(([label,value])=><Info key={label} label={label} value={value}/>)}</div></section>
    <SectionHeading title="Agent references"/>
    <div className="matrix">{refs.map(r=><article className="ref-card" key={r[0]}><img src={'/references/'+r[1]} alt={r[0]}/><div><strong>{r[0]}</strong><span>{r[2]}</span></div></article>)}</div>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
