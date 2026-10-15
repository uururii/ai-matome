import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { WandSparkles, Copy, Check, Image as ImageIcon, Layers3, LibraryBig, Moon, Sun } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import './hub-theme.css';

import { refs, styleDNA, conceptVariations, graphicStyleVersion } from '../shared/visual-system.js';
import { analyzeAgent, buildImagePrompt, normalizeAgent, normalizeInterpretation, interpretationsMatch } from '../shared/generation.js';
import { getPromptView, getVariationPromptView, getInterpretationView, promptLanguages } from '../shared/prompt-translation.js';
import { generateProfileImages, getGenerationStatus, getGeneration, resumeGeneration } from '@generation-client';

const agentExample = {
  name: '코미디 소식통',
  description: '코미디를 좋아하는 사람들을 위해 코미디언의 근황부터 방송, 온라인 콘텐츠, 라이브 공연과 경연 소식까지 흥미로운 정보를 모아 소개합니다.',
  purpose: '코미디언의 활동과 최신 코미디 트렌드를 빠르게 발견하고 정리하는 큐레이터',
  characterType: 'auto 또는 human / animal / creature / object-inspired',
  gender: 'no preference 또는 female / male / neutral',
  age: 'adult, young adult, middle-aged 등',
  colors: '검정, 아이보리, 민트 포인트',
  visualNotes: '세련된 안경을 쓴 성숙한 진행자 느낌. 마이크는 작게 하나만, 장난감 같은 느낌은 피하기',
  tone: '밝고 재치 있지만 지나치게 가볍지 않은 분위기. 친근한 말투로 핵심을 명확하게 전달',
  keywords: '코미디언 근황\n예능 출연\n코미디 공연\n스탠드업 코미디\n코미디 경연\n신인 코미디언',
};
const imageGeneratorGptUrl = 'https://chatgpt.com/g/g-6abe2a02f49481b89c07d3291865ca3b-ai-agent-image-generator';

function App() {
  const [agent, setAgent] = useState({ name: '', description: '', purpose: '', characterType: '', gender: '', age: '', colors: '', visualNotes: '', tone: '', keywords: '' });
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
  const canPrepare = connection?.configured && agent.name.trim() && agent.description.trim() && agent.keywords.trim() && !busy && !remainingWait;
  const previewMode = connection?.mode === 'preview';
  const shownPrompt = prompt;
  const promptView = getPromptView(agent, reading, shownPrompt, promptLanguage);
  const interpretationView = getInterpretationView(agent, readingDraft, interpretationLanguage);
  const previousResults = job && reading && (!interpretationsMatch(job.interpretation, reading) || (job.sourcePrompt || buildImagePrompt(job.agent, job.interpretation)) !== prompt);
  const editedPrompt = reading && prompt !== buildImagePrompt(agent, reading);
  const variations = job?.images || [];
  const hasVariationPrompts = variations.some(image => image.prompt);
  const completed = variations.filter(image => ['complete', 'preview'].includes(image.status)).length;
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
      const normalized = normalizeAgent(agent);
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
    try { await navigator.clipboard.writeText(promptView.text); setNotice('Prompt copied'); }
    catch { setNotice('Copy unavailable. Select the prompt to copy it.'); }
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
      setNotice(openGpt ? '4 prompts copied. Paste them into the opened GPT window.' : '4 GPT image prompts copied as one batch');
      if (openGpt) window.open(imageGeneratorGptUrl, '_blank', 'noopener,noreferrer');
    }
    catch { setNotice('Copy unavailable. Select each prompt to copy it.'); }
  };
  return <div className={dark ? 'app-shell dark' : 'app-shell'}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Layers3 size={20}/></div><div><strong>AI Matome</strong><span>Creative tools</span></div></div>
      <div className="side-label">Workspace</div>
      <nav aria-label="Workspace">
        <Button variant="ghost" className={'nav-item '+(tab==='generator'?'active':'')} aria-current={tab==='generator'?'page':undefined} onClick={()=>setTab('generator')}><WandSparkles/> Profile generator</Button>
        <Button variant="ghost" className={'nav-item '+(tab==='library'?'active':'')} aria-current={tab==='library'?'page':undefined} onClick={()=>setTab('library')}><LibraryBig/> Reference library <Badge variant="outline">{refs.length}</Badge></Button>
      </nav>
      <div className="side-foot"><div className="reference-stack">{refs.slice(0,3).map(r=><img key={r[0]} src={'/references/'+r[1]} alt={r[0]}/>)}</div><strong>Matome Visual System</strong><span>{graphicStyleVersion} · {refs.length} references</span><Badge variant="secondary">Current Default</Badge></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{tab==='generator'?'Profile generator':'Reference library'}</strong></div><div className="top-actions"><Badge variant="secondary">{connection?.configured ? (connection.provider === 'browser-preview' ? connection.label : previewMode ? "Mock preview" : connection.label) : "Setup required"}</Badge><Button variant="ghost" size="icon" aria-label={dark?'Light mode':'Dark mode'} title={dark?'Light mode':'Dark mode'} onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</Button></div></header>
      {tab==='generator' ? <main className="main">
        <div className="page-heading"><div><div className="eyebrow">AI MATOME</div><h1>Agent Profile Generator</h1></div><Badge variant="outline"><Layers3/> {graphicStyleVersion} · {refs.length} references</Badge></div>
        {connection?.provider !== 'browser-preview' && <div className="connection-bar" role="status"><span>{connection?.message || 'Connecting to the local generation service…'}</span><Button variant="ghost" size="sm" onClick={refreshConnection} disabled={busy}>Check connection</Button></div>}
        {error && <div className="generation-error" role="alert">{error}</div>}
        {remainingWait > 0 && <p className="demo-note" role="status">Retry available in {remainingWait}s. No automatic API retry will be sent.</p>}
        <div className="studio-grid">
          <section className="input-panel">
            <SectionHeading step="01" title="Agent / Character brief" description="Describe the agent and the character direction in one place."/>
            <form onSubmit={e=>{e.preventDefault();prepareVariations();}}><fieldset disabled={busy}>
              <Field label="Agent name" required placeholder={agentExample.name} value={agent.name} onChange={v=>update('name',v)}/>
              <Field label="Description" required placeholder={agentExample.description} value={agent.description} onChange={v=>update('description',v)} area/>
              <Field label="Purpose / concept" placeholder={agentExample.purpose} value={agent.purpose} onChange={v=>update('purpose',v)} area/>
              <div className="two-col">
                <Field label="Character type" placeholder={agentExample.characterType} value={agent.characterType} onChange={v=>update('characterType',v)}/>
                <Field label="Gender" placeholder={agentExample.gender} value={agent.gender} onChange={v=>update('gender',v)}/>
              </div>
              <div className="two-col">
                <Field label="Age impression" placeholder={agentExample.age} value={agent.age} onChange={v=>update('age',v)}/>
                <Field label="Preferred colors" placeholder={agentExample.colors} value={agent.colors} onChange={v=>update('colors',v)}/>
              </div>
              <Field label="Visual notes" placeholder={agentExample.visualNotes} value={agent.visualNotes} onChange={v=>update('visualNotes',v)} area/>
              <Field label="Tone" placeholder={agentExample.tone} value={agent.tone} onChange={v=>update('tone',v)} area/>
              <Field label="Keywords" required placeholder={agentExample.keywords} value={agent.keywords} onChange={v=>update('keywords',v)} area/>
              <Button type="submit" className="full" disabled={!canPrepare}>{busy ? `${previewMode ? "Preparing" : "Generating"} ${completed}/4` : previewMode ? "Create 4 variation prompts" : "Generate 4 variations"}</Button>
            </fieldset></form>
          </section>
          <div className="right-column">
            <details className="advanced-panel">
              <summary>Advanced: interpretation and full prompt</summary>
            <section className="interpretation">
              <SectionHeading step="02" title="Agent interpretation" description="A visual concept based on your agent information."/>
              <PromptLanguageToggle value={interpretationLanguage} onChange={setInterpretationLanguage} label="Agent 해석 보기 언어"/>
              {reading ? <>
                <div className="interpret-grid" lang={interpretationLanguage}>{['visualMotif', 'primaryObject', 'mood', 'color'].map(key => <EditableInfo key={`${key}-${readingRevision}`} label={interpretationView.labels[key]} value={interpretationView.values[key]} sourceValue={readingDraft[key]} disabled={busy} onChange={value=>changeInterpretation(key,value)}/>)}</div>
                <div className="concept-strip" lang={interpretationLanguage}>{['coreRole', 'composition'].map(key => <EditableInfo key={`${key}-${readingRevision}`} label={interpretationView.labels[key]} value={interpretationView.values[key]} sourceValue={readingDraft[key]} disabled={busy} onChange={value=>changeInterpretation(key,value)}/>)}</div>
                <div className="interpretation-actions"><Button variant="ghost" size="sm" disabled={busy || (!interpretationDirty && interpretationsMatch(reading, analyzeAgent(agent)))} onClick={resetInterpretation}>Reset interpretation</Button><Button size="sm" disabled={busy || !interpretationDirty} onClick={applyInterpretation}>Apply changes</Button></div>
                {interpretationDirty && <p className="prompt-language-status" role="status">Unapplied changes</p>}
                {editedPrompt && <p className="prompt-language-status">Applying or resetting interpretation replaces the edited prompt.</p>}
                {interpretationLanguage !== 'en' && <p className="prompt-language-status">{interpretationLanguage === 'ko' ? '직접 입력한 내용은 원문 유지' : '直接入力した内容は原文を保持'}</p>}
              </> : <p className="empty-state" role="status">아직 분석된 Agent 정보가 없습니다.</p>}
            </section>
            <section className="prompt-panel">
              <SectionHeading step="03" title="Generated prompt" description="Shared style rules combined with your agent's concept." action={<Button variant="ghost" size="icon-sm" title="현재 언어로 복사" aria-label="현재 언어로 복사" disabled={!promptView.text.trim()} onClick={copyPrompt}><Copy/></Button>}/>
              <PromptLanguageToggle value={promptLanguage} onChange={setPromptLanguage}/>
              <Textarea disabled={busy || !reading} readOnly={promptLanguage !== 'en'} lang={promptView.status === 'localized' ? promptLanguage : undefined} aria-label="Generated prompt" aria-describedby={reading ? 'prompt-language-status' : undefined} className="prompt-box" placeholder="아직 생성된 프롬프트가 없습니다." value={promptView.text} onChange={e=>setPrompt(e.target.value)}/>
              {reading && <p id="prompt-language-status" className="prompt-language-status" role="status">{promptView.status === 'edited' ? '직접 수정한 프롬프트는 자동 번역하지 않습니다. 수정된 원문을 표시합니다.' : promptLanguage === 'en' ? '생성 요청에는 영문 원본이 사용됩니다.' : promptLanguage === 'ko' ? '앱 생성 문구의 한국어 번역입니다. Agent 입력은 원문을 유지하며, 생성 요청에는 영문 원본이 사용됩니다.' : 'アプリ生成文の日本語訳です。Agentの入力は原文を保持し、生成リクエストには英語の原文を使用します。'}</p>}
              <div className="prompt-footer"><Button disabled={!canGenerate} onClick={()=>generate()}>{busy ? `${previewMode ? "Preparing" : "Generating"} ${completed}/4` : previewMode ? "Preview 4 variations" : "Generate 4 variations"}</Button></div>
            </section>
            </details>
          </div>
        </div>
        <section className="results">
          <SectionHeading step="02" title="Profile image variations" action={<Button variant="outline" size="sm" disabled={!canGenerate || !job} onClick={()=>generate()}>{previewMode ? "Refresh previews" : "Regenerate all"}</Button>}/>
          <div className="gpt-export-bar">
            <div><strong>Send all 4 prompts to GPT</strong><span>{hasVariationPrompts ? 'Copy the full batch and open the AI Agent Image Generator.' : 'Run Preview 4 variations first to create the four final prompts.'}</span></div>
            <Button disabled={!hasVariationPrompts} onClick={()=>copyVariationBatchPrompt({ openGpt: true })}><Copy/> Copy & open GPT</Button>
          </div>
          <div className="generation-summary" role="status"><span>{busy ? `Processing · ${completed}/4 complete` : job ? `${completed}/4 ${job.mode === 'preview' ? 'prompts ready · No images generated' : 'images complete'}` : previewMode ? 'No prompt previews yet' : 'No images generated yet'}</span>
            {previousResults && <Badge variant="outline">Previous results</Badge>}
            {job?.status === 'failed' && <Button variant="outline" size="sm" disabled={!canGenerate || previousResults} onClick={()=>generate(true)}>Resume remaining images</Button>}
            {pollPaused && <Button variant="outline" size="sm" onClick={checkProgress}>Check progress</Button>}
          </div>
          {job ? <div className="variation-grid">{variations.map((r,i)=><Variation key={`${job.id}-${i}`} item={r} index={i} agent={job.agent} interpretation={job.interpretation} sourcePrompt={job.sourcePrompt} selected={selected===i} onSelect={()=>setSelected(i)}/>)}</div> : <p className="empty-state" role="status">아직 생성된 결과가 없습니다.</p>}
          {selected!==null&&<div className="selected-bar"><span><Check size={16}/> Variation {selected+1} selected</span><Button asChild size="sm"><a href={variations[selected].url} download>Download image</a></Button></div>}
        </section>
        <div className="notice" role="status">{notice}</div>
      </main> : <Library refs={refs}/>}
    </div>
  </div>
}

function SectionHeading({step,title,description,action}) { return <div className="panel-head"><div className="panel-title"><h2><span className="step">{step}</span>{title}</h2>{description && <p className="panel-description">{description}</p>}</div>{action}</div> }
function Field({label,required,placeholder,value,onChange,area}) {
  const props = {required,placeholder,value,onChange:e=>onChange(e.target.value),lang:/[ぁ-んァ-ン]/.test(value)?'ja':'ko'};
  return <label className="field"><span className="field-label">{label}{required&&<span className="required" aria-hidden="true"> *</span>}</span>{area?<Textarea {...props} rows={label==='Keywords'?5:3}/>:<Input {...props}/>}</label>
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
function Variation({item,index,agent,interpretation,sourcePrompt,selected,onSelect}) {
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('en');
  const promptView = getVariationPromptView(agent, interpretation, item.prompt, item.index ?? index, language, sourcePrompt);
  const ready = item.status === 'complete' && item.url;
  return <article className={'variation '+(selected?'selected':'')}>
    <div className="image-wrap">{ready?<img src={item.url} alt={item.title}/>:<div className="placeholder"><ImageIcon size={24}/><span>{item.status === 'preview' ? 'Prompt preview · No image' : item.status === 'generating' ? 'Processing…' : item.status === 'failed' ? 'Generation stopped' : 'Variation '+(index+1)}</span></div>}<Badge className="var-number" variant="secondary">0{index+1}</Badge></div>
    <div className="var-meta"><strong>{item.title}</strong><span>{item.why}</span><Button variant={selected?'default':'outline'} size="sm" disabled={!ready} aria-pressed={selected} onClick={onSelect}>{selected?'Selected':'Select variation '+(index+1)}</Button>
    {ready && <Button asChild variant="ghost" size="sm"><a href={item.url} download={'matome-variation-'+(index+1)+'.png'}>Download</a></Button>}
    {item.prompt && <><details open={item.status === 'preview'}><summary>Final image prompt</summary><PromptLanguageToggle value={language} onChange={value=>{setLanguage(value);setCopied(false);}}/>{language !== 'en' && <p className="prompt-language-status" role="status">{promptView.status !== 'localized' ? '번역할 수 없는 수정본입니다. 원문을 표시합니다.' : language === 'ko' ? 'Agent 입력·직접 수정한 내용은 원문 유지' : 'Agentの入力・直接編集した内容は原文を保持'}</p>}<pre className="image-prompt" lang={promptView.status === 'localized' ? language : undefined}>{promptView.text}</pre></details><Button variant="ghost" size="sm" onClick={async()=>{try{await navigator.clipboard.writeText(promptView.text);setCopied(true);}catch{setCopied(false);}}}>{copied ? 'Copied' : 'Copy final prompt'}</Button></>}
    </div>
  </article>
}
function Library({refs}) {
  return <main className="main library-page"><div className="page-heading"><div><div className="eyebrow">AI MATOME</div><h1>Reference library</h1></div><Badge variant="outline">{graphicStyleVersion} · {refs.length} references</Badge></div>
    <section className="dna-section"><SectionHeading title="Global Style DNA"/><div className="dna-grid">{Object.entries(styleDNA).map(([label,value])=><Info key={label} label={label} value={value}/>)}</div></section>
    <section className="dna-section"><SectionHeading title="Agent Concept Variations"/><div className="dna-grid">{Object.entries(conceptVariations).map(([label,value])=><Info key={label} label={label} value={value}/>)}</div></section>
    <SectionHeading title="Agent references"/>
    <div className="matrix">{refs.map(r=><article className="ref-card" key={r[0]}><img src={'/references/'+r[1]} alt={r[0]}/><div><strong>{r[0]}</strong><span>{r[2]}</span></div></article>)}</div>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
