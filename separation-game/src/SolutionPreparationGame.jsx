import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Beaker,
  Calculator,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Droplets,
  FileText,
  FlaskConical,
  Funnel,
  Minus,
  Pipette,
  RotateCcw,
  Scale,
  Send,
  Sparkles,
  TestTube,
  Timer,
  Trophy
} from "lucide-react";
import {
  buildSolutionFeedback,
  createSolutionSession,
  evaluateSolutionAnswer,
  formatNumber,
  shuffleItems,
  validateSolutionData
} from "./solutionPreparation.js";

const equipmentIcons = {
  balance: Scale,
  "weighing-paper": FileText,
  beaker: Beaker,
  "glass-rod": Minus,
  funnel: Funnel,
  "volumetric-flask": FlaskConical,
  "wash-bottle": Droplets,
  dropper: Pipette,
  "volumetric-pipette": Pipette,
  "graduated-cylinder": TestTube,
  "erlenmeyer-flask": FlaskConical,
  "test-tube": TestTube
};

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function loadNumber(key) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : 0;
}

function createEmptyAnswer(question) {
  return {
    moles: "",
    mass: "",
    stockVolume: "",
    equipment: [],
    steps: shuffleItems(question.steps).map(step => step.id)
  };
}

function playTone(enabled, good) {
  if (!enabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.type = good ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(good ? 660 : 190, context.currentTime);
  if (good) oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.16);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.24);
  oscillator.addEventListener("ended", () => context.close());
}

export default function SolutionPreparationGame() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [session, setSession] = useState({ parts: 0, xp: 0, streak: 0, maxStreak: 0, startedAt: Date.now(), finished: false });
  const [profileXp, setProfileXp] = useState(() => loadNumber("chem-solution-lab-xp"));
  const [sound, setSound] = useState(() => localStorage.getItem("chem-solution-lab-sound") !== "off");
  const [best, setBest] = useState(() => loadJson("chem-solution-lab-record"));

  useEffect(() => {
    setLoadError("");
    const url = `${import.meta.env.BASE_URL}data/solution-lab.json?v=1`;
    fetch(url, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(json => {
        const validation = validateSolutionData(json);
        if (!validation.valid) throw new Error("題庫格式不完整");
        const nextDeck = createSolutionSession(json);
        setData(json);
        setDeck(nextDeck);
        setIndex(0);
        setAnswer(createEmptyAnswer(nextDeck[0]));
      })
      .catch(error => setLoadError(error.message));
  }, [loadAttempt]);

  const current = deck[index];
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
  const level = Math.floor(profileXp / 150) + 1;
  const progress = deck.length ? Math.round((index / deck.length) * 100) : 0;
  const equipmentOptions = useMemo(() => data ? shuffleItems(data.equipment) : [], [current?.id, data]);
  const feedback = useMemo(() => {
    if (!result || !current || !answer || !data) return [];
    return buildSolutionFeedback(current, answer, result, data.equipment);
  }, [answer, current, data, result]);

  const required = current && answer && answer.equipment.length > 0 && (
    current.type === "solid"
      ? answer.moles !== "" && answer.mass !== ""
      : answer.stockVolume !== ""
  );

  function updateNumber(field, value) {
    if (result) return;
    setAnswer(previous => ({ ...previous, [field]: value }));
  }

  function toggleEquipment(id) {
    if (result) return;
    setAnswer(previous => ({
      ...previous,
      equipment: previous.equipment.includes(id)
        ? previous.equipment.filter(item => item !== id)
        : [...previous.equipment, id]
    }));
  }

  function moveStep(stepIndex, direction) {
    if (result) return;
    const target = stepIndex + direction;
    if (target < 0 || target >= answer.steps.length) return;
    setAnswer(previous => {
      const steps = [...previous.steps];
      [steps[stepIndex], steps[target]] = [steps[target], steps[stepIndex]];
      return { ...previous, steps };
    });
  }

  function submit() {
    if (!required || result) return;
    const nextResult = evaluateSolutionAnswer(current, answer);
    const xpGain = nextResult.correctCount * 10 + (nextResult.perfect ? 15 : 0);
    const nextProfileXp = profileXp + xpGain;
    setResult(nextResult);
    setProfileXp(nextProfileXp);
    localStorage.setItem("chem-solution-lab-xp", String(nextProfileXp));
    playTone(sound, nextResult.perfect);
    setSession(previous => ({
      ...previous,
      parts: previous.parts + nextResult.correctCount,
      xp: previous.xp + xpGain,
      streak: nextResult.perfect ? previous.streak + 1 : 0,
      maxStreak: nextResult.perfect ? Math.max(previous.maxStreak, previous.streak + 1) : previous.maxStreak
    }));
  }

  function finishSession() {
    const accuracy = Math.round((session.parts / (deck.length * 3)) * 100);
    const record = { accuracy, seconds: elapsedSeconds, xp: session.xp, maxStreak: session.maxStreak, at: new Date().toISOString() };
    const brokeRecord = !best || accuracy > best.accuracy || (accuracy === best.accuracy && elapsedSeconds < best.seconds);
    if (brokeRecord) {
      localStorage.setItem("chem-solution-lab-record", JSON.stringify(record));
      setBest(record);
    }
    setSession(previous => ({ ...previous, finished: true, finalAccuracy: accuracy, brokeRecord }));
  }

  function nextQuestion() {
    if (!result) return;
    if (index + 1 >= deck.length) {
      finishSession();
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setAnswer(createEmptyAnswer(deck[nextIndex]));
    setResult(null);
  }

  function restart() {
    const nextDeck = createSolutionSession(data);
    setDeck(nextDeck);
    setIndex(0);
    setAnswer(createEmptyAnswer(nextDeck[0]));
    setResult(null);
    setSession({ parts: 0, xp: 0, streak: 0, maxStreak: 0, startedAt: Date.now(), finished: false });
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    localStorage.setItem("chem-solution-lab-sound", next ? "on" : "off");
  }

  if (loadError) {
    return (
      <main className="solution-shell">
        <section className="solution-message error">
          <FlaskConical aria-hidden="true" />
          <h2>題庫載入失敗</h2>
          <p>{loadError}</p>
          <button className="control-button primary" type="button" onClick={() => setLoadAttempt(value => value + 1)}>重新載入</button>
        </section>
      </main>
    );
  }

  if (!data || !current || !answer) {
    return <main className="solution-shell"><section className="solution-message"><FlaskConical aria-hidden="true" /><p>正在準備實驗器材...</p></section></main>;
  }

  if (session.finished) {
    return (
      <main className="solution-shell">
        <section className="solution-finish glass-surface">
          <Trophy aria-hidden="true" />
          <p className="eyebrow">Lab Complete</p>
          <h2>{session.finalAccuracy === 100 ? "★★★ PERFECT" : "實驗完成"}</h2>
          <div className="solution-finish-grid">
            <span><strong>{session.finalAccuracy}%</strong>正確率</span>
            <span><strong>{elapsedSeconds} 秒</strong>作答時間</span>
            <span><strong>{session.maxStreak}</strong>最高連勝</span>
            <span><strong>+{session.xp}</strong>本次 XP</span>
          </div>
          <p>{session.brokeRecord ? "已打破最佳紀錄" : "本次未打破最佳紀錄"}</p>
          <button className="control-button primary" type="button" onClick={restart}><RotateCcw size={18} /> 再做一輪</button>
        </section>
      </main>
    );
  }

  return (
    <main className="solution-shell">
      <section className="solution-topbar glass-surface">
        <div>
          <p className="eyebrow">Solution Lab</p>
          <h2>溶液調配實驗室</h2>
        </div>
        <div className="solution-stats">
          <span>Lv.{level}</span>
          <span>XP {profileXp}</span>
          <span>連勝 {session.streak}</span>
          <button type="button" onClick={toggleSound}>{sound ? "音效開" : "音效關"}</button>
        </div>
      </section>

      <div className="solution-progress" aria-label={`第 ${index + 1} 題，共 ${deck.length} 題`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="solution-workspace">
        <LabSpotlight className={`solution-brief ${result?.perfect ? "perfect" : result ? "missed" : ""}`}>
          <div className="solution-brief-head">
            <span>{current.typeLabel}</span>
            <strong>{index + 1} / {deck.length}</strong>
          </div>
          <div className="solution-apparatus" aria-hidden="true">
            {current.type === "solid" ? <Scale /> : <Pipette />}
            <span />
            <FlaskConical />
          </div>
          <p className="solution-formula">{current.formula}</p>
          {current.type === "solid" ? (
            <h3>配製 {current.volumeMl} mL、{current.molarity} M 的{current.name}水溶液</h3>
          ) : (
            <h3>以 {current.stockConcentration}{current.unit} 原液配製 {current.finalVolumeMl} mL、{current.targetConcentration}{current.unit} 的{current.name}</h3>
          )}
          <p className="solution-source">{current.source}</p>
        </LabSpotlight>

        <div className="solution-sheet">
          <section className="solution-section glass-surface">
            <h3><Calculator size={21} /> ① 計算用量</h3>
            {current.type === "solid" ? (
              <div className="number-answer-grid">
                <NumberAnswer label="溶質莫耳數 n" unit="mol" value={answer.moles} disabled={!!result} onChange={value => updateNumber("moles", value)} />
                <NumberAnswer label="應稱取質量 m" unit="g" value={answer.mass} disabled={!!result} onChange={value => updateNumber("mass", value)} />
              </div>
            ) : (
              <NumberAnswer label="應量取原液體積 V₁" unit="mL" value={answer.stockVolume} disabled={!!result} onChange={value => updateNumber("stockVolume", value)} />
            )}
          </section>

          <section className="solution-section glass-surface">
            <h3><Beaker size={21} /> ② 選擇必要器材（可複選）</h3>
            <div className="equipment-grid">
              {equipmentOptions.map(option => {
                const Icon = equipmentIcons[option.id] || Beaker;
                return (
                  <button className={answer.equipment.includes(option.id) ? "selected" : ""} disabled={!!result} key={option.id} type="button" onClick={() => toggleEquipment(option.id)}>
                    <Icon aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="solution-section glass-surface">
            <h3><ClipboardList size={21} /> ③ 排列操作步驟</h3>
            <ol className="step-sorter">
              {answer.steps.map((stepId, stepIndex) => {
                const step = current.steps.find(item => item.id === stepId);
                return (
                  <li key={stepId}>
                    <span>{stepIndex + 1}</span>
                    <p>{step.label}</p>
                    <div>
                      <button disabled={!!result || stepIndex === 0} title="上移" type="button" onClick={() => moveStep(stepIndex, -1)}><ChevronUp /></button>
                      <button disabled={!!result || stepIndex === answer.steps.length - 1} title="下移" type="button" onClick={() => moveStep(stepIndex, 1)}><ChevronDown /></button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </section>

      <section className="solution-actions">
        <button className="control-button primary" disabled={!required || !!result} type="button" onClick={submit}><Send size={18} /> 送出整張實驗單</button>
        <button className="control-button" disabled={!result} type="button" onClick={nextQuestion}>{index + 1 >= deck.length ? "看結算" : "下一題"}</button>
        <span><Timer size={17} /> 完成計算、器材與步驟後一次批改</span>
      </section>

      {result && (
        <section className="solution-result glass-surface">
          <div className="solution-result-title">
            <span>{result.stars}</span>
            <strong>{result.perfect ? "PERFECT" : "實驗檢核"}</strong>
          </div>
          <div className="solution-result-badges">
            <SolutionBadge label="計算" ok={result.fields.calculations} answer={calculationTruth(current)} />
            <SolutionBadge label="器材" ok={result.fields.equipment} answer={current.equipment.map(id => data.equipment.find(item => item.id === id)?.label).join("、")} />
            <SolutionBadge label="步驟" ok={result.fields.sequence} answer="請依下方正確流程" />
          </div>
          {!result.fields.sequence && (
            <ol className="correct-sequence">
              {current.steps.map(step => <li key={step.id}>{step.label}</li>)}
            </ol>
          )}
          <div className="solution-feedback">
            <h3><Sparkles size={20} /> 實驗解析</h3>
            {feedback.map(item => <p key={item}>{item}</p>)}
          </div>
        </section>
      )}
    </main>
  );
}

function NumberAnswer({ label, unit, value, disabled, onChange }) {
  return (
    <label className="number-answer">
      <span>{label}</span>
      <div>
        <input inputMode="decimal" min="0" step="any" type="number" value={value} disabled={disabled} onChange={event => onChange(event.target.value)} />
        <strong>{unit}</strong>
      </div>
    </label>
  );
}

function LabSpotlight({ children, className }) {
  const ref = useRef(null);
  function move(event) {
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    ref.current.style.setProperty("--spotlight-color", "rgba(63, 143, 112, 0.22)");
  }
  return <article ref={ref} className={`spotlight-card ${className}`} onMouseMove={move}>{children}</article>;
}

function SolutionBadge({ label, ok, answer }) {
  return <span className={ok ? "correct" : "wrong"}>{label}：{ok ? "✓" : `正解：${answer}`}</span>;
}

function calculationTruth(question) {
  if (question.type === "solid") {
    return `${formatNumber(question.answers.moles)} mol、${formatNumber(question.answers.mass, 2)} g`;
  }
  return `${formatNumber(question.answers.stockVolume, 1)} mL`;
}
