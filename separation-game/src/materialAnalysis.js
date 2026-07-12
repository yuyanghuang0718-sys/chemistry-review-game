export const stateLabels = {
  s: "固態",
  l: "液態",
  g: "氣態",
  aq: "水溶液"
};

export function optionLabel(options, group, id) {
  return options?.[group]?.find(item => item.id === id)?.label || id;
}

export function formatFormula(item) {
  return `${item.displayFormula || item.formula}(${item.state})`;
}

export function shuffleItems(items) {
  return [...items]
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(entry => entry.item);
}

export function expandMaterialQuestions(data) {
  const questions = [];
  for (const substance of data.substances || []) {
    const templates = data.stateTemplates?.[substance.category] || {};
    for (const state of substance.states || []) {
      const base = templates[state];
      if (!base) continue;
      const override = substance.stateOverrides?.[state] || {};
      questions.push({
        id: `${substance.formula}-${state}`,
        formula: substance.formula,
        displayFormula: substance.displayFormula,
        name: substance.name,
        state,
        stateLabel: stateLabels[state] || state,
        category: substance.category,
        particle: override.particle || base.particle,
        bond: substance.bond,
        conductivity: override.conductivity ?? base.conductivity,
        properties: override.properties || base.properties || [],
        reason: override.reason || base.reason,
        tags: substance.tags || []
      });
    }
  }
  return questions;
}

export function evaluateMaterialAnswer(question, answer) {
  const propertyAnswer = new Set(answer.properties || []);
  const propertyTruth = new Set(question.properties || []);
  const propertiesCorrect =
    propertyAnswer.size === propertyTruth.size &&
    [...propertyTruth].every(item => propertyAnswer.has(item));

  const fields = {
    category: answer.category === question.category,
    particle: answer.particle === question.particle,
    bond: answer.bond === question.bond,
    conductivity: answer.conductivity === question.conductivity,
    properties: propertiesCorrect
  };
  const correctCount = Object.values(fields).filter(Boolean).length;
  return {
    fields,
    correctCount,
    perfect: correctCount === 5,
    stars: "★★★★★".slice(0, correctCount) + "☆☆☆☆☆".slice(0, 5 - correctCount)
  };
}

export function buildMaterialExplanations(question, answer, result, options) {
  const explanations = [];
  if (!result.fields.category) {
    explanations.push(`分類：${formatFormula(question)} 的物質分類是「${optionLabel(options, "categories", question.category)}」，不是「${optionLabel(options, "categories", answer.category)}」。分類看物質本身主要組成。`);
  }
  if (!result.fields.particle) {
    explanations.push(`粒子：此狀態的主要粒子是「${optionLabel(options, "particles", question.particle)}」。像 HCl(aq) 這類水溶液要看是否解離成離子。`);
  }
  if (!result.fields.bond) {
    explanations.push(`鍵結：${question.name} 的主要鍵結是「${optionLabel(options, "bonds", question.bond)}」。鍵結判斷看物質內部作用，不只看當下狀態。`);
  }
  if (!result.fields.conductivity) {
    explanations.push(`導電：${question.reason}`);
  }
  if (!result.fields.properties) {
    const truth = question.properties.map(id => optionLabel(options, "properties", id)).join("、");
    explanations.push(`性質：最符合的性質是「${truth}」。性質要同時考慮物質種類與目前狀態。`);
  }
  if (!explanations.length) {
    explanations.push(`完整正確。${question.reason}`);
  }
  return explanations;
}

export function validateMaterialData(data) {
  const questions = expandMaterialQuestions(data);
  const required = ["NaCl-s", "NaCl-l", "NaCl-aq", "H2O-s", "H2O-l", "H2O-g", "HCl-g", "HCl-aq", "Cu-s", "Cu-l", "Graphite-s", "SiO2-s"];
  const ids = new Set(questions.map(item => item.id));
  return {
    count: questions.length,
    valid: questions.length >= 200 && required.every(id => ids.has(id)),
    missing: required.filter(id => !ids.has(id))
  };
}
