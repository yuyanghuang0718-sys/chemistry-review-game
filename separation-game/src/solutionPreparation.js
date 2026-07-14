export function shuffleItems(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function expandTemplate(template, taskTypes) {
  return template.variants.map((variant, index) => {
    const type = taskTypes[template.type];
    const base = {
      ...template,
      ...variant,
      id: `${template.id}-${index + 1}`,
      templateId: template.id,
      typeLabel: type.label,
      equipment: template.equipment || type.equipment,
      steps: template.steps || type.steps
    };
    if (template.type === "solid") {
      const moles = variant.molarity * (variant.volumeMl / 1000);
      return { ...base, answers: { moles, mass: moles * template.molarMass } };
    }
    return {
      ...base,
      answers: {
        stockVolume: (variant.targetConcentration * variant.finalVolumeMl) / variant.stockConcentration
      }
    };
  });
}

function pickOnePerTemplate(questions, count, random) {
  const groups = new Map();
  questions.forEach(question => {
    const group = groups.get(question.templateId) || [];
    group.push(question);
    groups.set(question.templateId, group);
  });
  const selected = shuffleItems([...groups.values()], random)
    .slice(0, count)
    .map(group => shuffleItems(group, random)[0]);
  if (selected.length >= count) return selected;
  const selectedIds = new Set(selected.map(item => item.id));
  const remaining = shuffleItems(questions.filter(item => !selectedIds.has(item.id)), random);
  return [...selected, ...remaining.slice(0, count - selected.length)];
}

export function createSolutionSession(data, random = Math.random) {
  const expanded = data.templates.flatMap(template => expandTemplate(template, data.taskTypes));
  const solid = expanded.filter(item => item.type === "solid");
  const dilution = expanded.filter(item => item.type !== "solid");
  return shuffleItems([
    ...pickOnePerTemplate(solid, 5, random),
    ...pickOnePerTemplate(dilution, 5, random)
  ], random);
}

function closeEnough(actual, expected, tolerance) {
  const parsed = Number(actual);
  return Number.isFinite(parsed) && Math.abs(parsed - expected) <= tolerance + Number.EPSILON;
}

function sameSet(left = [], right = []) {
  return left.length === right.length && left.every(item => right.includes(item));
}

export function evaluateSolutionAnswer(question, answer) {
  const calculations = question.type === "solid"
    ? closeEnough(answer.moles, question.answers.moles, Math.max(0.0001, question.answers.moles * 0.001)) &&
      closeEnough(answer.mass, question.answers.mass, 0.01)
    : closeEnough(answer.stockVolume, question.answers.stockVolume, 0.1);
  const equipment = sameSet(answer.equipment, question.equipment);
  const sequence = answer.steps.length === question.steps.length &&
    answer.steps.every((stepId, index) => stepId === question.steps[index].id);
  const fields = { calculations, equipment, sequence };
  const correctCount = Object.values(fields).filter(Boolean).length;
  return {
    fields,
    correctCount,
    perfect: correctCount === 3,
    stars: `${"★".repeat(correctCount)}${"☆".repeat(3 - correctCount)}`
  };
}

export function formatNumber(value, maximumFractionDigits = 4) {
  return Number(value).toLocaleString("zh-TW", { maximumFractionDigits });
}

export function buildSolutionFeedback(question, answer, result, equipmentOptions) {
  const feedback = [];
  if (!result.fields.calculations) {
    if (question.type === "solid") {
      feedback.push(`計算：n = M × V = ${formatNumber(question.answers.moles)} mol，再以 m = n × 式量，需稱取 ${formatNumber(question.answers.mass, 2)} g。`);
    } else {
      feedback.push(`計算：C₁V₁ = C₂V₂，所以 V₁ = ${question.targetConcentration} × ${question.finalVolumeMl} ÷ ${question.stockConcentration} = ${formatNumber(question.answers.stockVolume, 1)} mL。`);
    }
  }
  if (!result.fields.equipment) {
    const labels = question.equipment.map(id => equipmentOptions.find(item => item.id === id)?.label || id);
    feedback.push(`器材：本題需要 ${labels.join("、")}。器材必須能完成準確量取、定量轉移與定容。`);
  }
  if (!result.fields.sequence) {
    feedback.push(question.type === "solid"
      ? "步驟：先以少量水完全溶解，再定量轉移並洗滌，最後才在容量瓶中定容。直接加入目標體積的水，會使最終體積過大、濃度偏低。"
      : "步驟：先量取原液，轉入容量瓶後再加水至刻度。稀釋時要配成指定的最終體積，不是加入同樣體積的水。");
  }
  if (!feedback.length) feedback.push("三個部分都正確：計算、器材與操作順序彼此一致，這份溶液可以準確配製。 ");
  return feedback;
}

export function validateSolutionData(data) {
  const typeIds = new Set(Object.keys(data.taskTypes || {}));
  const templates = data.templates || [];
  const solidCount = templates.filter(item => item.type === "solid").length;
  const dilutionCount = templates.filter(item => item.type !== "solid").length;
  return {
    valid: data.schemaVersion === 1 && solidCount >= 5 && dilutionCount >= 5 && templates.every(item => typeIds.has(item.type) && item.variants?.length),
    solidCount,
    dilutionCount
  };
}
