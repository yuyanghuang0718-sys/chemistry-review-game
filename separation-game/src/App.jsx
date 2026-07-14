import React, { useEffect, useMemo, useRef, useState } from "react";
import MaterialAnalysisGame from "./MaterialAnalysisGame.jsx";
import SolutionPreparationGame from "./SolutionPreparationGame.jsx";

const methods = [
  {
    id: "filter",
    name: "過濾",
    short: "不溶固體 + 液體",
    definition: "用濾紙或濾材攔住不溶固體，讓液體通過。",
    clue: "看到泥沙、沉澱、不溶物，要想到過濾。",
    color: "#3f8f70",
    soft: "#e4f1e9",
    icon: "濾"
  },
  {
    id: "distill",
    name: "蒸餾",
    short: "沸點不同",
    definition: "利用沸點不同，先汽化再冷凝，分離液體或從溶液取回溶劑。",
    clue: "從食鹽水取純水，或分離沸點不同液體，要想到蒸餾。",
    color: "#347ca0",
    soft: "#e1eef5",
    icon: "沸"
  },
  {
    id: "extract",
    name: "萃取",
    short: "在兩溶劑中溶解度不同",
    definition: "利用物質在兩種互不相溶溶劑中的溶解度不同，把目標物轉到另一層。",
    clue: "看到水層、有機層、分層、搖晃、溶到另一種溶劑，要想到萃取。",
    color: "#d99a20",
    soft: "#fff0c9",
    icon: "層"
  },
  {
    id: "chrom",
    name: "層析",
    short: "移動速率不同",
    definition: "利用物質對固定相與流動相親和力不同，移動距離不同而分離。",
    clue: "看到濾紙、展開液、色點分開、Rf 值，要想到層析。",
    color: "#7661a7",
    soft: "#ebe5f6",
    icon: "移"
  },
  {
    id: "crystal",
    name: "再結晶",
    short: "溶解度隨溫度改變",
    definition: "利用固體在冷熱溶劑中的溶解度差異，使較純晶體析出。",
    clue: "看到熱水溶解、冷卻析出晶體、純化固體，要想到再結晶。",
    color: "#2f9ba0",
    soft: "#ddf1f1",
    icon: "晶"
  },
  {
    id: "rf",
    name: "Rf 值",
    short: "成分距離 ÷ 展開液距離",
    definition: "Rf = 成分由起始線移動距離 ÷ 展開液由起始線移動距離。",
    clue: "Rf 是比值，與同一條層析圖上的距離有關。",
    color: "#d35d4b",
    soft: "#fae1dc",
    icon: "比"
  }
];

const missions = [
  {
    prompt: "泥水中有大量細砂，老師要留下清澈液體，最適合用哪一種方法？",
    answer: "filter",
    why: "細砂是不溶固體，濾紙能攔住固體，讓液體通過。",
    visual: "filter"
  },
  {
    prompt: "想從食鹽水中取得較純的水，不能只把水分蒸乾。應該用哪一種方法？",
    answer: "distill",
    why: "水先汽化再冷凝，可和不揮發的食鹽分離。",
    visual: "distill"
  },
  {
    prompt: "啤酒樣品加入酸後，再加入異辛烷搖晃，待液體分層後取有機層測吸光度。這是哪一種分離概念？",
    answer: "extract",
    why: "目標物在水層與異辛烷層的溶解度不同，會轉移到較能溶解它的溶劑層。",
    visual: "extract"
  },
  {
    prompt: "混合染料滴在濾紙起始線，展開液上升後，不同顏色停在不同高度。這是哪一種方法？",
    answer: "chrom",
    why: "不同成分對固定相與流動相親和力不同，因此移動速率和距離不同。",
    visual: "chrom"
  },
  {
    prompt: "硝酸鉀含雜質，先用熱水溶解，冷卻後讓較純晶體析出。這是哪一種純化方法？",
    answer: "crystal",
    why: "再結晶利用溶解度隨溫度改變，使目標固體重新形成晶體。",
    visual: "crystal"
  },
  {
    prompt: "層析圖中，某色點從起始線移動 4 cm，展開液移動 10 cm。這題需要用哪個概念？",
    answer: "rf",
    why: "Rf = 4 ÷ 10 = 0.4。題目問比值時要用 Rf 值。",
    visual: "rf"
  }
];

const speedQuestions = [
  { prompt: "分離不溶固體與液體", answer: "filter" },
  { prompt: "利用沸點不同", answer: "distill" },
  { prompt: "兩種互不相溶溶劑，溶解度不同", answer: "extract" },
  { prompt: "固定相、流動相、移動速率不同", answer: "chrom" },
  { prompt: "熱溶冷析純化固體", answer: "crystal" },
  { prompt: "成分移動距離除以展開液距離", answer: "rf" },
  { prompt: "濾紙上色點分離", answer: "chrom" },
  { prompt: "食鹽水取純水", answer: "distill" },
  { prompt: "收集沉澱", answer: "filter" },
  { prompt: "水層與有機層分層", answer: "extract" }
];

const rfQuestions = [
  {
    type: "calc",
    prompt: "色素 A 從起始線上升 3.0 cm，展開液上升 10.0 cm。A 的 Rf 值是多少？",
    solvent: 10,
    spots: [{ label: "A", distance: 3, color: "#d35d4b" }],
    answer: 0.3,
    why: "Rf = 3.0 ÷ 10.0 = 0.30。"
  },
  {
    type: "calc",
    prompt: "色素 B 從起始線上升 7.5 cm，展開液上升 10.0 cm。B 的 Rf 值是多少？",
    solvent: 10,
    spots: [{ label: "B", distance: 7.5, color: "#347ca0" }],
    answer: 0.75,
    why: "Rf = 7.5 ÷ 10.0 = 0.75。"
  },
  {
    type: "choice",
    prompt: "同一張濾紙上，A 上升 3.0 cm，B 上升 7.5 cm，展開液上升 10.0 cm。誰的 Rf 較大？",
    solvent: 10,
    spots: [
      { label: "A", distance: 3, color: "#d35d4b" },
      { label: "B", distance: 7.5, color: "#347ca0" }
    ],
    options: ["A", "B", "一樣大"],
    answer: "B",
    why: "同一張圖展開液距離相同，色素上升越遠，Rf 越大。"
  },
  {
    type: "choice",
    prompt: "以水為展開液時，A 上升 3.0 cm，B 上升 7.5 cm。哪一個色素比較親水？",
    solvent: 10,
    mobile: "水",
    spots: [
      { label: "A", distance: 3, color: "#d35d4b" },
      { label: "B", distance: 7.5, color: "#347ca0" }
    ],
    options: ["A", "B", "無法判斷"],
    answer: "B",
    why: "水是展開液，B 跟著水跑得比較遠，代表 B 較親水。"
  },
  {
    type: "choice",
    prompt: "同一色素在水中的 Rf = 0.25，在乙酸乙酯中的 Rf = 0.80。這個色素比較親哪一種展開液？",
    solvent: 10,
    spots: [
      { label: "水", distance: 2.5, color: "#347ca0" },
      { label: "乙", distance: 8, color: "#d99a20" }
    ],
    options: ["水", "乙酸乙酯", "兩者一樣"],
    answer: "乙酸乙酯",
    why: "同一色素在乙酸乙酯中 Rf 較大，表示它比較會跟著乙酸乙酯移動。"
  }
];

const matterItems = [
  ...["氧氣", "臭氧", "水銀", "硫黃", "24K金", "石墨", "金剛石", "碳60"].map(name => ({
    name,
    category: "element",
    note: "元素是由同一種元素的原子組成，不能用化學方法再分解成更簡單物質。"
  })),
  ...["水", "食鹽", "酒精", "葡萄糖", "乾冰", "過氧化氫", "硫酸銅晶體", "甲烷"].map(name => ({
    name,
    category: "compound",
    note: "化合物是兩種以上元素以固定比例化合而成的純物質。"
  })),
  ...["空氣", "海水", "食鹽水", "糖水", "酒", "鹽酸", "雙氧水（市售）", "碘酒", "18K金", "黃銅"].map(name => ({
    name,
    category: "mixture",
    note: "混合物由兩種以上物質混合而成，比例不固定，可用物理方法分離。"
  }))
];

const matterCategories = [
  { id: "element", label: "元素", description: "單一元素形成的純物質", color: "#3f8f70" },
  { id: "compound", label: "化合物", description: "不同元素固定比例化合", color: "#347ca0" },
  { id: "mixture", label: "混合物", description: "兩種以上物質混合，比例不固定", color: "#d99a20" }
];

const gameCards = [
  {
    id: "separation",
    title: "分離純化實驗室",
    kicker: "過濾、蒸餾、萃取、層析、再結晶、Rf 值",
    description: "用情境判斷分離方法，練習 Rf 值計算與展開液親和力判斷。"
  },
  {
    id: "matter",
    title: "物質分類配對",
    kicker: "元素、化合物、混合物",
    description: "把常見物質配對到正確分類，特別練容易混淆的合金、溶液與純物質。"
  },
  {
    id: "materialAnalysis",
    title: "物質分析遊戲",
    kicker: "物質種類、粒子、鍵結、導電與性質",
    description: "完成整張物質資訊卡，一次批改全部內容，練習從狀態推理導電與物理性質。"
  },
  {
    id: "solutionPreparation",
    title: "溶液調配實驗室",
    kicker: "固體配製、原液稀釋、器材與步驟",
    description: "計算實際用量、選擇器材並排列操作流程，完成一整張溶液調配實驗單。"
  }
];

const labModes = [
  { id: "mission", label: "情境挑戰" },
  { id: "flash", label: "定義翻牌" },
  { id: "speed", label: "限時快答" },
  { id: "rfLab", label: "Rf 值實驗" }
];

const speedTime = 15;

function method(id) {
  return methods.find(item => item.id === id);
}

function shuffleItems(items) {
  return [...items]
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(entry => entry.item);
}

function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Chemistry Review</p>
          <h1>化學複習遊戲</h1>
          <p className="subtitle">選一個主題開始練習。每個遊戲都保留答題、回饋、重置與進度追蹤。</p>
        </div>
        <GlassSurface className="nav-panel">
          <button className={page === "home" ? "active" : ""} type="button" onClick={() => setPage("home")}>遊戲選單</button>
          <button className={page === "separation" ? "active" : ""} type="button" onClick={() => setPage("separation")}>分離純化</button>
          <button className={page === "matter" ? "active" : ""} type="button" onClick={() => setPage("matter")}>物質分類</button>
          <button className={page === "materialAnalysis" ? "active" : ""} type="button" onClick={() => setPage("materialAnalysis")}>物質分析</button>
          <button className={page === "solutionPreparation" ? "active" : ""} type="button" onClick={() => setPage("solutionPreparation")}>溶液調配</button>
        </GlassSurface>
      </header>

      {page === "home" && <HomePage onOpen={setPage} />}
      {page === "separation" && <SeparationGame />}
      {page === "matter" && <MatterMatchingGame />}
      {page === "materialAnalysis" && <MaterialAnalysisGame />}
      {page === "solutionPreparation" && <SolutionPreparationGame />}
    </div>
  );
}

function HomePage({ onOpen }) {
  return (
    <main className="home-grid">
      {gameCards.map(card => (
        <SpotlightCard className="game-card" key={card.id} onClick={() => onOpen(card.id)}>
          <span>{card.kicker}</span>
          <h2>{card.title}</h2>
          <p>{card.description}</p>
          <button className="control-button primary" type="button">開始遊戲</button>
        </SpotlightCard>
      ))}
    </main>
  );
}

function SeparationGame() {
  const [mode, setMode] = useState("mission");
  const [index, setIndex] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashBack, setFlashBack] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rfInput, setRfInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(speedTime);
  const [missionDeck, setMissionDeck] = useState(() => shuffleItems(missions));
  const [speedDeck, setSpeedDeck] = useState(() => shuffleItems(speedQuestions));
  const [rfDeck, setRfDeck] = useState(() => shuffleItems(rfQuestions));
  const [flashDeck, setFlashDeck] = useState(() => shuffleItems(methods));
  const timeoutRef = useRef(null);

  const mastery = answered ? Math.round((score / answered) * 100) : 0;
  const title = useMemo(() => labModes.find(item => item.id === mode)?.label || "情境挑戰", [mode]);
  const progress = useMemo(() => {
    if (mode === "mission") return `第 ${(index % missionDeck.length) + 1} 題`;
    if (mode === "flash") return `${flashIndex + 1} / ${flashDeck.length}`;
    if (mode === "speed") return `剩 ${Math.ceil(timeLeft)} 秒`;
    return `第 ${(index % rfDeck.length) + 1} 題`;
  }, [flashDeck.length, flashIndex, index, missionDeck.length, mode, rfDeck.length, timeLeft]);

  useEffect(() => {
    setFeedback(null);
    setLocked(false);
    setSelected(null);
    setRfInput("");
    setTimeLeft(speedTime);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [mode, index, flashIndex]);

  useEffect(() => {
    if (mode !== "speed" || locked) return undefined;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const nextValue = Math.max(0, prev - 0.25);
        if (nextValue <= 0) {
          clearInterval(timer);
          handleSpeedTimeout();
        }
        return nextValue;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [mode, locked, index]);

  function addCorrect() {
    setAnswered(prev => prev + 1);
    setScore(prev => prev + 1);
    setStreak(prev => prev + 1);
  }

  function addWrong(item) {
    setAnswered(prev => prev + 1);
    setStreak(0);
    setWrong(prev => [...prev, item]);
  }

  function goNext() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (mode === "flash") {
      setFlashBack(false);
      setFlashIndex(prev => (prev + 1) % flashDeck.length);
      return;
    }
    setIndex(prev => prev + 1);
  }

  function resetAll() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIndex(0);
    setFlashIndex(0);
    setFlashBack(false);
    setScore(0);
    setAnswered(0);
    setStreak(0);
    setWrong([]);
    setFeedback(null);
    setLocked(false);
    setSelected(null);
    setRfInput("");
    setTimeLeft(speedTime);
    setMissionDeck(shuffleItems(missions));
    setSpeedDeck(shuffleItems(speedQuestions));
    setRfDeck(shuffleItems(rfQuestions));
    setFlashDeck(shuffleItems(methods));
  }

  function changeMode(nextMode) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMode(nextMode);
    setIndex(0);
    setFlashIndex(0);
    setFlashBack(false);
    if (nextMode === "mission") setMissionDeck(shuffleItems(missions));
    if (nextMode === "speed") setSpeedDeck(shuffleItems(speedQuestions));
    if (nextMode === "rfLab") setRfDeck(shuffleItems(rfQuestions));
    if (nextMode === "flash") setFlashDeck(shuffleItems(methods));
  }

  function answerMethod(question, answerId, isSpeed = false) {
    if (locked) return;
    const correctMethod = method(question.answer);
    const selectedMethod = method(answerId);
    const isCorrect = answerId === question.answer;
    setLocked(true);
    setSelected(answerId);
    if (isCorrect) {
      addCorrect();
      setFeedback({ type: "good", text: `答對。${question.why || correctMethod.clue}` });
    } else {
      addWrong({
        prompt: question.prompt,
        correct: correctMethod.name,
        why: question.why || correctMethod.definition
      });
      setFeedback({
        type: "bad",
        text: `不是 ${selectedMethod.name}。正解是 ${correctMethod.name}：${question.why || correctMethod.clue}`
      });
    }
    if (isSpeed) timeoutRef.current = setTimeout(goNext, 900);
  }

  function handleSpeedTimeout() {
    if (mode !== "speed" || locked) return;
    const question = speedDeck[index % speedDeck.length];
    const correctMethod = method(question.answer);
    setLocked(true);
    addWrong({
      prompt: question.prompt,
      correct: correctMethod.name,
      why: correctMethod.definition
    });
    setFeedback({ type: "bad", text: `時間到。正解是 ${correctMethod.name}：${correctMethod.definition}` });
    timeoutRef.current = setTimeout(goNext, 650);
  }

  function answerRfCalc(question) {
    if (locked) return;
    const value = Number(rfInput);
    const isCorrect = Number.isFinite(value) && Math.abs(value - question.answer) <= 0.01;
    setLocked(true);
    if (isCorrect) {
      addCorrect();
      setFeedback({ type: "good", text: `答對。${question.why}` });
    } else {
      addWrong({ prompt: question.prompt, correct: question.answer.toFixed(2), why: question.why });
      setFeedback({ type: "bad", text: `答案是 ${question.answer.toFixed(2)}。${question.why}` });
    }
  }

  function answerRfChoice(question, answerText) {
    if (locked) return;
    const isCorrect = answerText === question.answer;
    setLocked(true);
    setSelected(answerText);
    if (isCorrect) {
      addCorrect();
      setFeedback({ type: "good", text: `答對。${question.why}` });
    } else {
      addWrong({ prompt: question.prompt, correct: question.answer, why: question.why });
      setFeedback({ type: "bad", text: `不是 ${answerText}。正解是 ${question.answer}：${question.why}` });
    }
  }

  return (
    <>
      <GlassSurface className="toolbar-glass">
        <PillNav items={labModes} activeId={mode} onChange={changeMode} />
        <div className="toolbar-actions">
          <button className="control-button" type="button" onClick={resetAll}>重置</button>
          <button className="control-button primary" type="button" onClick={goNext}>下一題</button>
        </div>
      </GlassSurface>

      <main className="layout">
        <GlassSurface className="stage-panel">
          <div className="section-head">
            <h2>{title}</h2>
            <span className="badge">{progress}</span>
          </div>
          <div className="stage-content">
            {mode === "mission" && (
              <MissionStage
                question={missionDeck[index % missionDeck.length]}
                locked={locked}
                selected={selected}
                feedback={feedback}
                onAnswer={answerMethod}
              />
            )}
            {mode === "flash" && (
              <FlashStage
                item={flashDeck[flashIndex % flashDeck.length]}
                flashBack={flashBack}
                onToggle={() => setFlashBack(prev => !prev)}
              />
            )}
            {mode === "speed" && (
              <SpeedStage
                question={speedDeck[index % speedDeck.length]}
                locked={locked}
                selected={selected}
                feedback={feedback}
                timeLeft={timeLeft}
                onAnswer={answerMethod}
              />
            )}
            {mode === "rfLab" && (
              <RfStage
                question={rfDeck[index % rfDeck.length]}
                locked={locked}
                selected={selected}
                feedback={feedback}
                rfInput={rfInput}
                setRfInput={setRfInput}
                onCalc={answerRfCalc}
                onChoice={answerRfChoice}
              />
            )}
          </div>
        </GlassSurface>

        <aside className="side-panel">
          <ScorePanel score={score} streak={streak} mastery={mastery} />
          <ReferencePanel />
          <WrongPanel wrong={wrong} />
        </aside>
      </main>
    </>
  );
}

function MatterMatchingGame() {
  const [deck, setDeck] = useState(() => shuffleItems(matterItems));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [wrong, setWrong] = useState([]);

  const current = deck[index % deck.length];
  const answered = Math.min(index, deck.length);
  const mastery = answered ? Math.round((score / answered) * 100) : 0;
  const finished = index >= deck.length;
  const categoryDeck = useMemo(() => finished ? matterCategories : shuffleItems(matterCategories), [current?.name, finished]);

  function reset() {
    setDeck(shuffleItems(matterItems));
    setIndex(0);
    setScore(0);
    setStreak(0);
    setSelected(null);
    setLocked(false);
    setFeedback(null);
    setWrong([]);
  }

  function next() {
    setSelected(null);
    setLocked(false);
    setFeedback(null);
    setIndex(prev => prev + 1);
  }

  function answer(categoryId) {
    if (locked || finished) return;
    const category = matterCategories.find(item => item.id === current.category);
    const chosen = matterCategories.find(item => item.id === categoryId);
    const isCorrect = categoryId === current.category;
    setSelected(categoryId);
    setLocked(true);
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setFeedback({ type: "good", text: `答對。${current.name} 是${category.label}。${current.note}` });
    } else {
      setStreak(0);
      setWrong(prev => [...prev, {
        prompt: current.name,
        correct: category.label,
        why: `${current.name} 不是${chosen.label}，是${category.label}。${current.note}`
      }]);
      setFeedback({ type: "bad", text: `${current.name} 不是${chosen.label}，正解是${category.label}。${current.note}` });
    }
  }

  return (
    <main className="layout">
      <GlassSurface className="stage-panel">
        <div className="section-head">
          <h2>物質分類配對</h2>
          <span className="badge">{finished ? "完成" : `第 ${index + 1} / ${deck.length} 題`}</span>
        </div>
        <div className="stage-content">
          {finished ? (
            <div className="stage-stack">
              <SpotlightCard className="question-card finish-card">
                <h3>本輪完成</h3>
                <p>得分 {score} / {deck.length}，熟練度 {mastery}% 。錯題會留在右側方便複習。</p>
              </SpotlightCard>
              <button className="control-button primary wide-action" type="button" onClick={reset}>再玩一輪</button>
            </div>
          ) : (
            <div className="stage-stack">
              <SpotlightCard className="matter-card">
                <span>判斷這個物質屬於哪一類</span>
                <h3>{current.name}</h3>
              </SpotlightCard>
              <div className="category-grid">
                {categoryDeck.map(category => (
                  <SpotlightCard
                    className={`category-card ${locked ? category.id === current.category ? "correct" : category.id === selected ? "wrong" : "" : ""}`}
                    key={category.id}
                  >
                    <button type="button" disabled={locked} onClick={() => answer(category.id)}>
                      <strong>{category.label}</strong>
                      <span>{category.description}</span>
                    </button>
                  </SpotlightCard>
                ))}
              </div>
              <Feedback feedback={feedback} placeholder="先自己判斷，不給提示。作答後才會顯示解析。" />
              <div className="toolbar-actions">
                <button className="control-button" type="button" onClick={reset}>重置</button>
                <button className="control-button primary" type="button" disabled={!locked} onClick={next}>下一題</button>
              </div>
            </div>
          )}
        </div>
      </GlassSurface>

      <aside className="side-panel">
        <ScorePanel score={score} streak={streak} mastery={mastery} />
        <GlassSurface className="reference-panel">
          <div className="section-head">
            <h2>分類速查</h2>
            <span className="badge">作答後看</span>
          </div>
          <div className="method-grid">
            {matterCategories.map(category => (
              <SpotlightCard className="method-card" key={category.id}>
                <div className="method-icon" style={{ background: category.color }}>{category.label.slice(0, 1)}</div>
                <div>
                  <h3>{category.label}</h3>
                  <p>{category.description}</p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </GlassSurface>
        <WrongPanel wrong={wrong} />
      </aside>
    </main>
  );
}

function ScorePanel({ score, streak, mastery }) {
  return (
    <div className="scoreboard standalone" aria-label="目前成績">
      <Stat label="得分" value={score} />
      <Stat label="連勝" value={streak} />
      <Stat label="熟練度" value={mastery} suffix="%" />
    </div>
  );
}

function ReferencePanel() {
  return (
    <GlassSurface className="reference-panel">
      <div className="section-head">
        <h2>必背速查</h2>
        <span className="badge">先備知識</span>
      </div>
      <div className="method-grid">
        {methods.map(item => <MethodCard key={item.id} item={item} />)}
      </div>
    </GlassSurface>
  );
}

function WrongPanel({ wrong }) {
  return (
    <GlassSurface className="wrong-panel">
      <div className="section-head">
        <h2>錯題回顧</h2>
        <span className="badge">{wrong.length} 題</span>
      </div>
      <div className="wrong-list">
        {wrong.length ? wrong.slice(-8).reverse().map((item, itemIndex) => (
          <SpotlightCard className="wrong-item" key={`${item.prompt}-${itemIndex}`}>
            <strong>{item.correct}</strong>
            <p>{item.prompt}</p>
            <p>{item.why}</p>
          </SpotlightCard>
        )) : <p className="empty">目前沒有錯題。答錯後會在這裡留下回顧重點。</p>}
      </div>
    </GlassSurface>
  );
}

function Stat({ label, value, suffix = "" }) {
  return (
    <SpotlightCard className="stat-card">
      <span>{label}</span>
      <strong><Counter value={value} />{suffix}</strong>
    </SpotlightCard>
  );
}

function MissionStage({ question, locked, selected, feedback, onAnswer }) {
  return (
    <div className="stage-stack">
      <SpotlightCard className="question-card visual-card">
        <MethodVisual type={question.visual} />
        <div>
          <p className="prompt">{question.prompt}</p>
          <p className="hint">選出最適合的分離或純化方法。</p>
        </div>
      </SpotlightCard>
      <MethodChoices locked={locked} selected={selected} correct={question.answer} seedKey={question.prompt} onAnswer={id => onAnswer(question, id)} />
      <Feedback feedback={feedback} />
    </div>
  );
}

function SpeedStage({ question, locked, selected, feedback, timeLeft, onAnswer }) {
  return (
    <div className="stage-stack">
      <SpotlightCard className="question-card">
        <h3>{question.prompt}</h3>
        <p>限時內選出對應方法。時間內答對會加分。</p>
        <div className="timer-bar">
          <div className="timer-fill" style={{ width: `${Math.max(0, timeLeft / speedTime * 100)}%` }} />
        </div>
      </SpotlightCard>
      <MethodChoices locked={locked} selected={selected} correct={question.answer} seedKey={question.prompt} onAnswer={id => onAnswer(question, id, true)} compact />
      <Feedback feedback={feedback} placeholder="時間內作答。" />
    </div>
  );
}

function FlashStage({ item, flashBack, onToggle }) {
  return (
    <div className="flash-area">
      <SpotlightCard
        className="flash-card"
        style={{ "--method-color": item.color, "--method-soft": item.soft }}
        onClick={onToggle}
      >
        {flashBack ? (
          <p>{item.definition}<br /><br /><strong>判斷線索：</strong>{item.clue}</p>
        ) : (
          <h2>{item.name}</h2>
        )}
        <span className="corner-note">點一下翻面</span>
      </SpotlightCard>
      <div className="mini-grid">
        {methods.map(methodItem => (
          <SpotlightCard className="mini-card" key={methodItem.id}>
            <h3>{methodItem.name}</h3>
            <p>{methodItem.short}</p>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}

function RfStage({ question, locked, selected, feedback, rfInput, setRfInput, onCalc, onChoice }) {
  const optionDeck = useMemo(() => question.options ? shuffleItems(question.options) : [], [question.prompt]);
  const tags = [
    question.mobile ? `展開液：${question.mobile}` : "展開液距離已知",
    `展開液距離：${question.solvent.toFixed(1)} cm`
  ];
  return (
    <div className="stage-stack">
      <SpotlightCard className="question-card rf-board">
        <RfVisual question={question} />
        <div>
          <p className="prompt">{question.prompt}</p>
          <div className="tag-row">
            {tags.map(tag => <span className="rf-tag" key={tag}>{tag}</span>)}
          </div>
        </div>
      </SpotlightCard>
      {question.type === "calc" ? (
        <div className="rf-form">
          <label htmlFor="rfAnswer"><strong>Rf =</strong></label>
          <input
            id="rfAnswer"
            type="number"
            step="0.01"
            min="0"
            max="1"
            inputMode="decimal"
            aria-label="輸入 Rf 值"
            value={rfInput}
            disabled={locked}
            onChange={event => setRfInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") onCalc(question);
            }}
          />
          <button className="choice-card submit-card" disabled={locked} type="button" onClick={() => onCalc(question)}>
            送出
          </button>
        </div>
      ) : (
        <div className="choices">
          {optionDeck.map(option => (
            <ChoiceCard
              key={option}
              label={option}
              disabled={locked}
              state={locked ? option === question.answer ? "correct" : option === selected ? "wrong" : "" : ""}
              onClick={() => onChoice(question, option)}
            />
          ))}
        </div>
      )}
      <Feedback feedback={feedback} />
    </div>
  );
}

function MethodChoices({ locked, selected, correct, seedKey, onAnswer, compact = false }) {
  const optionDeck = useMemo(() => shuffleItems(methods), [seedKey]);
  return (
    <div className={compact ? "choices compact" : "choices"}>
      {optionDeck.map(item => (
        <ChoiceCard
          key={item.id}
          label={item.name}
          disabled={locked}
          state={locked ? item.id === correct ? "correct" : item.id === selected ? "wrong" : "" : ""}
          onClick={() => onAnswer(item.id)}
        />
      ))}
    </div>
  );
}

function ChoiceCard({ label, disabled, state, onClick }) {
  return (
    <SpotlightCard className={`choice-card ${state}`}>
      <button type="button" disabled={disabled} onClick={onClick}>
        <strong>{label}</strong>
      </button>
    </SpotlightCard>
  );
}

function MethodCard({ item }) {
  return (
    <SpotlightCard className="method-card">
      <div className="method-icon" style={{ background: item.color }}>{item.icon}</div>
      <div>
        <h3>{item.name}</h3>
        <p><strong>{item.short}</strong><br />{item.definition}</p>
      </div>
    </SpotlightCard>
  );
}

function Feedback({ feedback, placeholder = "作答後會顯示結果。" }) {
  return (
    <div className={`feedback ${feedback?.type || ""}`}>
      {feedback?.text || placeholder}
    </div>
  );
}

function MethodVisual({ type }) {
  if (type === "distill") {
    return (
      <svg viewBox="0 0 160 160" aria-label="蒸餾示意圖">
        <path d="M38 116h40l-7-45H45z" fill="#e1eef5" stroke="#347ca0" strokeWidth="4" />
        <path d="M56 70v-28h62" fill="none" stroke="#347ca0" strokeWidth="5" strokeLinecap="round" />
        <path d="M112 42v70" stroke="#347ca0" strokeWidth="5" />
        <rect x="96" y="112" width="34" height="26" rx="4" fill="#dff0ff" stroke="#347ca0" strokeWidth="3" />
        <path d="M31 130h54" stroke="#d99a20" strokeWidth="7" strokeLinecap="round" />
        <path d="M43 120c12-14 23-14 34 0" fill="none" stroke="#e76f51" strokeWidth="3" />
      </svg>
    );
  }
  if (type === "extract") {
    return (
      <svg viewBox="0 0 160 160" aria-label="萃取示意圖">
        <path d="M68 20h24l8 30v42l-20 45-20-45V50z" fill="#fff" stroke="#d99a20" strokeWidth="4" />
        <path d="M63 78h34v16H63z" fill="#e1eef5" />
        <path d="M61 95h38l-19 40z" fill="#fff0c9" />
        <path d="M69 36h22" stroke="#d99a20" strokeWidth="5" strokeLinecap="round" />
        <circle cx="50" cy="72" r="5" fill="#347ca0" />
        <circle cx="111" cy="102" r="5" fill="#d99a20" />
      </svg>
    );
  }
  if (type === "chrom") {
    return (
      <svg viewBox="0 0 160 160" aria-label="層析示意圖">
        <rect x="48" y="20" width="64" height="120" rx="4" fill="#fff" stroke="#7661a7" strokeWidth="4" />
        <path d="M54 112h52" stroke="#23313d" strokeWidth="3" />
        <path d="M54 38h52" stroke="#d35d4b" strokeWidth="3" strokeDasharray="5 5" />
        <circle cx="76" cy="95" r="6" fill="#d35d4b" />
        <circle cx="78" cy="72" r="6" fill="#d99a20" />
        <circle cx="82" cy="49" r="6" fill="#3f8f70" />
      </svg>
    );
  }
  if (type === "crystal") {
    return (
      <svg viewBox="0 0 160 160" aria-label="再結晶示意圖">
        <path d="M49 32h62l-12 98H61z" fill="#ddf1f1" stroke="#2f9ba0" strokeWidth="4" />
        <path d="M57 84h46v38H57z" fill="#e4f7f7" />
        <path d="M80 94l10 8-4 13H74l-4-13z" fill="#2f9ba0" />
        <path d="M65 24c-4-10 10-10 6-20M83 24c-4-10 10-10 6-20" stroke="#d35d4b" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "rf") {
    return (
      <svg viewBox="0 0 160 160" aria-label="Rf 示意圖">
        <rect x="52" y="18" width="56" height="120" rx="4" fill="#fff" stroke="#d35d4b" strokeWidth="4" />
        <path d="M58 112h44" stroke="#23313d" strokeWidth="3" />
        <path d="M58 42h44" stroke="#347ca0" strokeWidth="3" strokeDasharray="5 5" />
        <circle cx="80" cy="70" r="7" fill="#d35d4b" />
        <text x="42" y="152" fontSize="18" fill="#23313d" fontWeight="800">Rf</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 160" aria-label="過濾示意圖">
      <rect x="52" y="92" width="56" height="46" rx="5" fill="#dff0ff" stroke="#347ca0" strokeWidth="3" />
      <path d="M36 24h88L94 78v23H66V78z" fill="#fff" stroke="#3f8f70" strokeWidth="4" />
      <path d="M50 40h60" stroke="#d35d4b" strokeWidth="7" strokeLinecap="round" />
      <circle cx="69" cy="52" r="4" fill="#8a6d3b" />
      <circle cx="88" cy="55" r="5" fill="#8a6d3b" />
      <path d="M80 82v35" stroke="#347ca0" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function RfVisual({ question }) {
  const baseY = 236;
  const frontY = 56;
  const scale = (baseY - frontY) / question.solvent;
  return (
    <svg className="rf-visual" viewBox="0 0 300 300" role="img" aria-label="層析濾紙與色素移動距離">
      <rect x="70" y="28" width="140" height="230" rx="6" fill="var(--paper)" stroke="var(--line)" strokeWidth="4" />
      <line x1="84" y1={baseY} x2="196" y2={baseY} stroke="var(--ink)" strokeWidth="4" />
      <line x1="84" y1={frontY} x2="196" y2={frontY} stroke="#3f8f70" strokeWidth="4" />
      <text x="42" y={baseY + 7} fill="var(--ink)" fontSize="22" fontWeight="800">X</text>
      <text x="42" y={frontY + 7} fill="#3f8f70" fontSize="22" fontWeight="800">Y</text>
      {question.spots.map((spot, spotIndex) => {
        const y = baseY - spot.distance * scale;
        const x = question.spots.length === 1 ? 140 : 108 + spotIndex * 58;
        return (
          <g key={`${spot.label}-${spot.distance}`}>
            <circle cx={x} cy={y} r="8" fill={spot.color} />
            <text x={x - 30} y={y + 5} fill={spot.color} fontSize="24" fontWeight="800">{spot.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PillNav({ items, activeId, onChange }) {
  return (
    <nav className="pill-nav" aria-label="遊戲模式">
      {items.map(item => (
        <button
          className={item.id === activeId ? "active" : ""}
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function SpotlightCard({ children, className = "", spotlightColor = "rgba(124, 196, 255, 0.20)", style, onClick }) {
  const divRef = useRef(null);
  function handleMouseMove(event) {
    const rect = divRef.current.getBoundingClientRect();
    divRef.current.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    divRef.current.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    divRef.current.style.setProperty("--spotlight-color", spotlightColor);
  }
  return (
    <div ref={divRef} className={`spotlight-card ${className}`} style={style} onMouseMove={handleMouseMove} onClick={onClick}>
      {children}
    </div>
  );
}

function GlassSurface({ children, className = "" }) {
  return <div className={`glass-surface ${className}`}>{children}</div>;
}

function Counter({ value }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return undefined;
    const started = performance.now();
    const duration = 360;
    let frame = 0;
    function tick(now) {
      const progress = Math.min(1, (now - started) / duration);
      setDisplay(Math.round(start + diff * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return display;
}

export default App;
