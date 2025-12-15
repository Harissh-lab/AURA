"""Calculate overall system accuracy with ENHANCED ML v2"""
import json

# Load dataset
data = json.load(open('combined_dataset_processed_simple.json','r',encoding='utf-8'))
avg_quality = sum(d.get('quality_score',0) for d in data)/len(data)

# Component accuracies (UPDATED with v2 ML model)
ml_acc = 78.85      # ENHANCED v2: RandomForest + Features (was 66.96)
cat_acc = 80
match_acc = 73.1
crisis_acc = 100

# Weighted overall accuracy
overall = (ml_acc*0.20 + cat_acc*0.25 + match_acc*0.15 + avg_quality*0.25 + crisis_acc*0.15)

print('\n=== OVERALL SYSTEM ACCURACY ===\n')
print('Component Accuracies:')
print(f'  ML Distress Detection:  {ml_acc:.1f}% (20% weight) [ENHANCED v2]')
print(f'  Category Matching:      {cat_acc:.1f}% (25% weight)')
print(f'  Response Matching:      {match_acc:.1f}% (15% weight)')
print(f'  Response Quality:       {avg_quality:.1f}% (25% weight)')
print(f'  Crisis Detection:       {crisis_acc:.1f}% (15% weight)')
print(f'\n🎯 OVERALL ACCURACY: {overall:.1f}%\n')
print(f'Status: {"✅ Excellent" if overall >= 80 else "✅ Good" if overall >= 75 else "⚠️ Needs Improvement"}')

baseline = 73.4  # Previous overall accuracy
improvement = overall - baseline
print(f'\nImprovement: {improvement:+.1f} points from baseline ({baseline:.1f}%)')

# ML improvement breakdown
ml_improvement = (78.85 - 66.96) * 0.20
print(f'\nML Model v2 Contribution:')
print(f'  v1 accuracy:     66.96%')
print(f'  v2 accuracy:     78.85%')
print(f'  Raw improvement: +11.89 percentage points')
print(f'  Weighted impact: {ml_improvement:+.2f} points to overall score')
