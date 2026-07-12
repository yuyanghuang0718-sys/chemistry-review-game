import React, { useEffect, useMemo, useState } from "react";
import {
  buildMaterialExplanations,
  evaluateMaterialAnswer,
  expandMaterialQuestions,
  formatFormula,
  optionLabel,
  shuffleItems,
  validateMaterialData
} from "./materialAnalysis.js";

const emptyAnswer = {
  category: "",
  particle: "",
  bond: "",
  conductivity: null,
  properties: []
};

function loadBestRecord() {
  try {
    return JSON.parse(localStorage.getItem("chem-material-boss-record") || "null");
  } catch {
    return null;
  }
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
  oscillator.frequency.value = good ? 720 : 180;
  oscillator.type = good ? "triangle" : "sawtooth";
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}

export default function MaterialAnalysisGame() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(emptyAnswer);
  const [result, setResult] = useState(null);
  const [session, setSession] = useState({ score: 0, xp: 0, streak: 0, maxStreak: 0, startedAt: Date.now(), finished: false });
  const [sound, setSound] = useState(() => localStorage.getItem("chem-material-sound") !== "off");
  const [best, setBest] = useState(loadBestRecord);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/materials.json`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(json => {
        const validation = validateMaterialData(json);
        if (!validation.valid) throw new Error(`題庫驗證失敗：${validation.count} 題，缺少 ${validation.missing.join(", ")}`);
        const expanded = expandMaterialQuestions(json);
        setData({ ...json, expandedCount: validation.count });
        setDeck(shuffleItems(expanded).slice(0, json.sessionLength || 10));
      })
      .catch(error => setLoadError(error.message));
  }, []);

  const current = deck[index];
  const progress = deck.length ? Math.round((index / deck.length) * 100) : 0;
  const completed = session.finished;
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
  const level = Math.floor(session.xp / 100) + 1;
  const required = current && answer.category && answer.particle && answer.bond && answer.conductivity !== null && answer.properties.length > 0;
  const explanations = useMemo(() => {
    if (!result || !current || !data) return [];
    return buildMaterialExplanations(current, answer, result, data.options);
  }, [answer, current, data, result]);

  function setField(field, value) {
    if (result) return;
    setAnswer(prev => ({ ...prev, [field]: value }));
  }

  function toggleProperty(id) {
    if (result) return;
    setAnswer(prev => {
      const exists = prev.properties.includes(id);
      return {
        ...prev,
        properties: exists ? prev.properties.filter(item => item !== id) : [...prev.properties, id]
      };
    });
  }

  function submit() {
    if (!current || !required || result) return;
    const nextResult = evaluateMaterialAnswer(current, answer);
    const xpGain = nextResult.correctCount * 8 + (nextResult.perfect ? 20 : 0);
    setResult(nextResult);
    setFlipped(true);
    playTone(sound, nextResult.perfect);
    setSession(prev => ({
      ...prev,
      score: prev.score + nextResult.correctCount,
      xp: prev.xp + xpGain,
      streak: nextResult.perfect ? prev.streak + 1 : 0,
      maxStreak: nextResult.perfect ? Math.max(prev.maxStreak, prev.streak + 1) : prev.maxStreak
    }));
  }

  function nextCard() {
    if (index + 1 >= deck.length) {
      const finalScore = session.score;
      const accuracy = Math.round((finalScore / (deck.length * 5)) * 100);
      const finalRecord = {
        accuracy,
        xp: session.xp,
        maxStreak: session.maxStreak,
        seconds: elapsedSeconds,
        at: new Date().toISOString()
      };
      const brokeRecord = !best || accuracy > best.accuracy || (accuracy === best.accuracy && finalRecord.seconds < best.seconds);
      if (brokeRecord) {
        localStorage.setItem("chem-material-boss-record", JSON.stringify(finalRecord));
        setBest(finalRecord);
      }
      setSession(prev => ({ ...prev, finished: true, brokeRecord, finalAccuracy: accuracy }));
      return;
    }
    setIndex(prev => prev + 1);
    setAnswer(emptyAnswer);
    setResult(null);
    setFlipped(false);
  }

  function restart() {
    const expanded = expandMaterialQuestions(data);
    setDeck(shuffleItems(expanded).slice(0, data.sessionLength || 10));
    setIndex(0);
    setAnswer(emptyAnswer);
    setResult(null);
    setFlipped(false);
    setSession({ score: 0, xp: 0, streak: 0, maxStreak: 0, startedAt: Date.now(), finished: false });
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    localStorage.setItem("chem-material-sound", next ? "on" : "off");
  }

  if (loadError) {
    return <div className="material-shell"><div className="material-error">題庫載入失敗：{loadError}</div></div>;
  }

  if (!data || !current) {
    return <div className="material-shell"><div className="material-loading">載入物質題庫中...</div></div>;
  }

  if (completed) {
    return (
      <main className="material-shell">
        <section className="boss-result-card">
          <p className="eyebrow">Boss Clear</p>
          <h2>{session.finalAccuracy === 100 ? "★★★★★ PERFECT" : "挑戰完成"}</h2>
          <div className="boss-metrics">
            <strong>正確率 {session.finalAccuracy}%</strong>
            <span>作答時間 {elapsedSeconds} 秒</span>
            <span>最高連勝 {session.maxStreak}</span>
            <span>本次 XP +{session.xp}</span>
            <span>{session.brokeRecord ? "打破最佳紀錄" : "尚未打破最佳紀錄"}</span>
          </div>
          <button className="control-button primary" type="button" onClick={restart}>再挑戰一次</button>
        </section>
      </main>
    );
  }

  return (
    <main className="material-shell">
      <section className="material-topbar">
        <div>
          <p className="eyebrow">Boss Mode</p>
          <h2>物質分析遊戲</h2>
        </div>
        <div className="material-stats">
          <span>Lv.{level}</span>
          <span>XP {session.xp}</span>
          <span>連勝 {session.streak}</span>
          <button type="button" onClick={toggleSound}>{sound ? "音效開" : "音效關"}</button>
        </div>
      </section>

      <div className="material-progress" aria-label="進度">
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="material-layout">
        <div className={`material-card ${flipped ? "flipped" : ""} ${result?.perfect ? "perfect" : result ? "missed" : ""}`}>
          <div className="material-card-face">
            <span>{current.stateLabel}</span>
            <h3 className="formula-text">{formatFormula(current)}</h3>
            <p>{current.name}</p>
          </div>
        </div>

        <form className="analysis-board">
          <ChoiceGroup title="① 物質分類" options={data.options.categories} value={answer.category} onPick={value => setField("category", value)} />
          <ChoiceGroup title="② 組成粒子" options={data.options.particles} value={answer.particle} onPick={value => setField("particle", value)} />
          <ChoiceGroup title="③ 化學鍵" options={data.options.bonds} value={answer.bond} onPick={value => setField("bond", value)} />
          <ChoiceGroup
            title="④ 此狀態是否導電？"
            options={[{ id: true, label: "可以" }, { id: false, label: "不可以" }]}
            value={answer.conductivity}
            onPick={value => setField("conductivity", value)}
          />
          <section className="analysis-section wide">
            <h3>⑤ 最符合的性質（可複選）</h3>
            <div className="chip-grid">
              {data.options.properties.map(option => (
                <button
                  className={answer.properties.includes(option.id) ? "selected" : ""}
                  key={option.id}
                  type="button"
                  onClick={() => toggleProperty(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </form>
      </section>

      <section className="material-actions">
        <button className="control-button primary" disabled={!required || !!result} type="button" onClick={submit}>送出整張資訊卡</button>
        <button className="control-button" disabled={!result} type="button" onClick={nextCard}>{index + 1 >= deck.length ? "看結算" : "下一題"}</button>
        <span>{index + 1} / {deck.length} 題，題庫 {data.expandedCount} 張狀態卡</span>
      </section>

      {result && (
        <section className="analysis-result">
          <div className="star-row">{result.stars}</div>
          <div className="field-result-row">
            <ResultBadge label="分類" ok={result.fields.category} answer={optionLabel(data.options, "categories", current.category)} />
            <ResultBadge label="粒子" ok={result.fields.particle} answer={optionLabel(data.options, "particles", current.particle)} />
            <ResultBadge label="鍵結" ok={result.fields.bond} answer={optionLabel(data.options, "bonds", current.bond)} />
            <ResultBadge label="導電" ok={result.fields.conductivity} answer={current.conductivity ? "可以" : "不可以"} />
            <ResultBadge
              label="性質"
              ok={result.fields.properties}
              answer={current.properties.map(id => optionLabel(data.options, "properties", id)).join("、")}
            />
          </div>
          <div className="ai-feedback">
            <h3>AI 教學解析</h3>
            {explanations.map(text => <p key={text}>{text}</p>)}
            <p className="truth-line">
              正解：{optionLabel(data.options, "categories", current.category)} / {optionLabel(data.options, "particles", current.particle)} / {optionLabel(data.options, "bonds", current.bond)} / {current.conductivity ? "可導電" : "不可導電"}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function ChoiceGroup({ title, options, value, onPick }) {
  return (
    <section className="analysis-section">
      <h3>{title}</h3>
      <div className="answer-pills">
        {options.map(option => (
          <button
            className={value === option.id ? "selected" : ""}
            key={String(option.id)}
            type="button"
            onClick={() => onPick(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultBadge({ label, ok, answer }) {
  return (
    <span className={ok ? "result-badge ok" : "result-badge wrong"}>
      <strong>{label}：{ok ? "✔" : "✘"}</strong>
      {!ok && <em>正解：{answer}</em>}
    </span>
  );
}
