/**
 * Test Crisis Keyword Detection Accuracy
 * Tests keyword-based crisis detection against labeled suicide/non-suicide dataset
 */

const fs = require('fs');
const path = require('path');

// Crisis detection function (from app.py)
function detectCrisisKeywords(text) {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'harm myself', 'cut myself', 'overdose', 'jump off',
    "don't want to live", 'better off dead', 'end it all',
    'take my life', 'suicidal', 'self harm', 'hurt myself',
    'no reason to live', "can't go on", 'finish myself'
  ];
  
  const textLower = text.toLowerCase();
  for (const keyword of crisisKeywords) {
    if (textLower.includes(keyword)) {
      return true;
    }
  }
  return false;
}

// Parse CSV manually
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted CSV values
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 2) {
      data.push({
        text: values[0].replace(/"/g, ''),
        class: values[1].replace(/"/g, '')
      });
    }
  }
  
  return data;
}

// Calculate metrics
function calculateMetrics(yTrue, yPred) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1 && yPred[i] === 1) tp++;
    else if (yTrue[i] === 0 && yPred[i] === 0) tn++;
    else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
    else if (yTrue[i] === 1 && yPred[i] === 0) fn++;
  }
  
  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = 2 * (precision * recall) / (precision + recall) || 0;
  
  return { accuracy, precision, recall, f1, tp, tn, fp, fn };
}

// Main test function
function testCrisisDetection() {
  console.log('='.repeat(80));
  console.log('CRISIS KEYWORD DETECTION ACCURACY TEST');
  console.log('='.repeat(80));
  
  // Try to load dataset
  const datasetPath = path.join(__dirname, '..', 'data', 'Suicide_Detection.csv');
  const samplePath = path.join(__dirname, '..', 'data', 'Suicide_Detection_SAMPLE.csv');
  
  let dataset;
  let filePath;
  
  if (fs.existsSync(datasetPath)) {
    filePath = datasetPath;
  } else if (fs.existsSync(samplePath)) {
    filePath = samplePath;
  } else {
    console.log('❌ No dataset found. Please ensure Suicide_Detection.csv exists.');
    return;
  }
  
  console.log(`\n📂 Loading dataset: ${filePath}`);
  dataset = parseCSV(filePath);
  console.log(`✅ Loaded ${dataset.length} samples`);
  
  // Convert labels to binary
  const yTrue = dataset.map(row => row.class === 'suicide' ? 1 : 0);
  
  const crisisCount = yTrue.filter(label => label === 1).length;
  const nonCrisisCount = yTrue.length - crisisCount;
  
  console.log(`\n📊 Dataset Distribution:`);
  console.log(`   Crisis (suicide):     ${crisisCount} samples (${(crisisCount/yTrue.length*100).toFixed(1)}%)`);
  console.log(`   Non-crisis:           ${nonCrisisCount} samples (${(nonCrisisCount/yTrue.length*100).toFixed(1)}%)`);
  
  // Test crisis detection
  console.log(`\n🧪 Testing crisis keyword detection...`);
  const predictions = dataset.map(row => {
    const isCrisis = detectCrisisKeywords(row.text);
    return isCrisis ? 1 : 0;
  });
  
  // Calculate metrics
  const metrics = calculateMetrics(yTrue, predictions);
  
  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n📈 Performance Metrics:`);
  console.log(`   Accuracy:  ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`   Precision: ${(metrics.precision * 100).toFixed(2)}%  (When it says 'crisis', how often is it correct?)`);
  console.log(`   Recall:    ${(metrics.recall * 100).toFixed(2)}%  (How many actual crises does it catch?)`);
  console.log(`   F1-Score:  ${(metrics.f1 * 100).toFixed(2)}%  (Balanced performance)`);
  
  console.log(`\n📊 Confusion Matrix:`);
  console.log(`                   Predicted`);
  console.log(`                Non-Crisis  Crisis`);
  console.log(`   Actual  Non-Crisis  [${metrics.tn.toString().padStart(4)}]    [${metrics.fp.toString().padStart(4)}]`);
  console.log(`           Crisis      [${metrics.fn.toString().padStart(4)}]    [${metrics.tp.toString().padStart(4)}]`);
  
  console.log(`\n🔍 Interpretation:`);
  console.log(`   True Positives (TP):  ${metrics.tp.toString().padStart(4)} - Correctly identified crisis`);
  console.log(`   True Negatives (TN):  ${metrics.tn.toString().padStart(4)} - Correctly identified non-crisis`);
  console.log(`   False Positives (FP): ${metrics.fp.toString().padStart(4)} - Incorrectly flagged as crisis`);
  console.log(`   False Negatives (FN): ${metrics.fn.toString().padStart(4)} - MISSED actual crisis (CRITICAL!)`);
  
  // Status
  console.log(`\n🎯 Overall Status: `, end='');
  if (metrics.accuracy >= 0.90) {
    console.log('✅ Excellent');
  } else if (metrics.accuracy >= 0.80) {
    console.log('✅ Good');
  } else if (metrics.accuracy >= 0.70) {
    console.log('⚠️ Moderate - Needs Improvement');
  } else {
    console.log('❌ Poor - Requires Urgent Improvement');
  }
  
  // Safety analysis
  console.log(`\n🚨 Safety Analysis:`);
  if (metrics.fn > 0) {
    console.log(`   ⚠️ WARNING: ${metrics.fn} crisis cases were MISSED`);
    console.log(`   This is a CRITICAL safety issue!`);
    console.log(`\n   Missed Cases:`);
    
    const missed = [];
    for (let i = 0; i < dataset.length; i++) {
      if (yTrue[i] === 1 && predictions[i] === 0) {
        missed.push(dataset[i].text);
      }
    }
    
    for (let i = 0; i < Math.min(10, missed.length); i++) {
      const text = missed[i].substring(0, 80);
      console.log(`      - "${text}${missed[i].length > 80 ? '...' : ''}"`);
    }
  } else {
    console.log(`   ✅ No crisis cases missed (100% recall)`);
  }
  
  if (metrics.fp > 0) {
    console.log(`\n   ℹ️ ${metrics.fp} false alarms (acceptable for safety)`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ Test complete!`);
  console.log(`   ACTUAL Crisis Detection Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`   (Not the claimed 100%)`);
  console.log('='.repeat(80));
  
  return metrics;
}

// Run test
testCrisisDetection();
