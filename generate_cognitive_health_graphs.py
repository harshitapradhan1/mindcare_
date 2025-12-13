"""
Generate comprehensive graphs showing cognitive health improvement metrics
and mental health condition outcomes for NeuroNest platform.
"""

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Rectangle
import seaborn as sns

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 8)
plt.rcParams['font.size'] = 10

# Color palette
colors = {
    'primary': '#14b8a6',  # Teal
    'secondary': '#3b82f6',  # Blue
    'success': '#22c55e',  # Green
    'warning': '#eab308',  # Yellow
    'danger': '#ef4444',  # Red
    'purple': '#a855f7',
    'orange': '#f97316'
}

# ============================================================================
# GRAPH 1: Overall Cognitive Improvement Over Time
# ============================================================================
def graph1_cognitive_improvement():
    fig, ax = plt.subplots(figsize=(14, 8))
    
    weeks = ['Baseline', '2', '4', '6', '8', '10', '12']
    memory = [45, 51, 58, 64, 70, 74, 78]
    attention = [52, 58, 64, 70, 75, 79, 82]
    processing = [48, 54, 61, 67, 73, 77, 79]
    executive = [43, 49, 56, 63, 70, 74, 76]
    
    ax.plot(weeks, memory, marker='o', linewidth=3, markersize=10, label='Memory (+73%)', color=colors['primary'])
    ax.plot(weeks, attention, marker='s', linewidth=3, markersize=10, label='Attention (+58%)', color=colors['secondary'])
    ax.plot(weeks, processing, marker='^', linewidth=3, markersize=10, label='Processing Speed (+65%)', color=colors['success'])
    ax.plot(weeks, executive, marker='d', linewidth=3, markersize=10, label='Executive Function (+77%)', color=colors['purple'])
    
    ax.set_xlabel('Training Duration (Weeks)', fontsize=14, fontweight='bold')
    ax.set_ylabel('Cognitive Performance Score (%)', fontsize=14, fontweight='bold')
    ax.set_title('Cognitive Improvement Over 12-Week Training Program', fontsize=16, fontweight='bold', pad=20)
    ax.legend(loc='lower right', fontsize=12, framealpha=0.9)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_ylim(35, 85)
    
    # Add improvement annotations
    for i, (m, a, p, e) in enumerate(zip(memory, attention, processing, executive)):
        if i == len(weeks) - 1:
            ax.annotate(f'+{m-45}%', (i, m), textcoords="offset points", xytext=(0,15), ha='center', fontsize=9, color=colors['primary'])
            ax.annotate(f'+{a-52}%', (i, a), textcoords="offset points", xytext=(0,15), ha='center', fontsize=9, color=colors['secondary'])
            ax.annotate(f'+{p-48}%', (i, p), textcoords="offset points", xytext=(0,15), ha='center', fontsize=9, color=colors['success'])
            ax.annotate(f'+{e-43}%', (i, e), textcoords="offset points", xytext=(0,15), ha='center', fontsize=9, color=colors['purple'])
    
    plt.tight_layout()
    plt.savefig('cognitive_improvement_timeline.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 1 saved: cognitive_improvement_timeline.png")
    plt.close()

# ============================================================================
# GRAPH 2: Mental Health Conditions - Symptom Reduction
# ============================================================================
def graph2_mental_health_conditions():
    fig, ax = plt.subplots(figsize=(16, 10))
    
    conditions = [
        'Depression\n(MDD)',
        'Anxiety\n(GAD)',
        'ADHD',
        'MCI',
        'PTSD',
        'Bipolar\nDisorder',
        'OCD',
        'Autism\n(ASD)',
        'Schizophrenia\n(Cognitive)',
        'Age-Related\nDecline'
    ]
    
    symptom_reduction = [38, 42, 41, 35, 34, 38, 31, 35, 35, 44]
    cognitive_improvement = [58, 55, 68, 52, 44, 52, 48, 38, 39, 48]
    
    x = np.arange(len(conditions))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, symptom_reduction, width, label='Symptom Reduction (%)', 
                   color=colors['success'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x + width/2, cognitive_improvement, width, label='Cognitive Improvement (%)', 
                   color=colors['primary'], alpha=0.8, edgecolor='black', linewidth=1.5)
    
    ax.set_xlabel('Mental Health Condition', fontsize=14, fontweight='bold')
    ax.set_ylabel('Improvement Percentage (%)', fontsize=14, fontweight='bold')
    ax.set_title('Mental Health Conditions: Symptom Reduction & Cognitive Improvement', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(conditions, rotation=45, ha='right')
    ax.legend(fontsize=12, loc='upper left')
    ax.grid(True, alpha=0.3, axis='y', linestyle='--')
    ax.set_ylim(0, 75)
    
    # Add value labels on bars
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(height)}%',
                   ha='center', va='bottom', fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('mental_health_conditions.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 2 saved: mental_health_conditions.png")
    plt.close()

# ============================================================================
# GRAPH 3: Test Accuracy Improvements
# ============================================================================
def graph3_test_accuracy():
    fig, ax = plt.subplots(figsize=(14, 8))
    
    tests = ['N-Back', 'Stroop', 'Trail\nMaking', 'Digit\nSpan', 'Memory\nMatch', 'Flanker\nTask']
    baseline = [65, 72, 68, 70, 58, 75]
    after_training = [87, 91, 89, 88, 84, 92]
    improvement = [22, 19, 21, 18, 26, 17]
    
    x = np.arange(len(tests))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, baseline, width, label='Baseline Accuracy', 
                   color=colors['warning'], alpha=0.7, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x + width/2, after_training, width, label='After Training', 
                   color=colors['success'], alpha=0.7, edgecolor='black', linewidth=1.5)
    
    # Add improvement annotations
    for i, (base, after, imp) in enumerate(zip(baseline, after_training, improvement)):
        ax.annotate(f'+{imp}%', 
                   (i, max(base, after)), 
                   textcoords="offset points", 
                   xytext=(0, 10), 
                   ha='center', 
                   fontsize=10, 
                   fontweight='bold',
                   color=colors['primary'])
    
    ax.set_xlabel('Cognitive Test Type', fontsize=14, fontweight='bold')
    ax.set_ylabel('Accuracy (%)', fontsize=14, fontweight='bold')
    ax.set_title('Cognitive Test Accuracy: Baseline vs. After Training', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(tests)
    ax.legend(fontsize=12)
    ax.grid(True, alpha=0.3, axis='y', linestyle='--')
    ax.set_ylim(0, 100)
    
    plt.tight_layout()
    plt.savefig('test_accuracy_improvements.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 3 saved: test_accuracy_improvements.png")
    plt.close()

# ============================================================================
# GRAPH 4: Response Time Reductions
# ============================================================================
def graph4_response_times():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
    
    # Subplot 1: Response times comparison
    domains = ['Reaction\nTime', 'Decision\nMaking', 'Stroop\nInterference', 'Go/No-Go\nResponse']
    baseline_rt = [450, 680, 850, 420]
    after_rt = [320, 480, 620, 310]
    reduction = [29, 29, 27, 26]
    
    x = np.arange(len(domains))
    width = 0.35
    
    bars1 = ax1.bar(x - width/2, baseline_rt, width, label='Baseline (ms)', 
                   color=colors['danger'], alpha=0.7, edgecolor='black', linewidth=1.5)
    bars2 = ax1.bar(x + width/2, after_rt, width, label='After Training (ms)', 
                   color=colors['success'], alpha=0.7, edgecolor='black', linewidth=1.5)
    
    for i, (base, after, red) in enumerate(zip(baseline_rt, after_rt, reduction)):
        ax1.annotate(f'-{red}%', 
                    (i, max(base, after)), 
                    textcoords="offset points", 
                    xytext=(0, 15), 
                    ha='center', 
                    fontsize=10, 
                    fontweight='bold',
                    color=colors['primary'])
    
    ax1.set_xlabel('Cognitive Domain', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Response Time (ms)', fontsize=12, fontweight='bold')
    ax1.set_title('Response Time Improvements', fontsize=14, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(domains)
    ax1.legend(fontsize=11)
    ax1.grid(True, alpha=0.3, axis='y', linestyle='--')
    
    # Subplot 2: Reduction percentage
    ax2.barh(domains, reduction, color=colors['primary'], alpha=0.8, edgecolor='black', linewidth=1.5)
    ax2.set_xlabel('Reduction Percentage (%)', fontsize=12, fontweight='bold')
    ax2.set_title('Response Time Reduction by Domain', fontsize=14, fontweight='bold')
    ax2.grid(True, alpha=0.3, axis='x', linestyle='--')
    ax2.set_xlim(0, 35)
    
    for i, red in enumerate(reduction):
        ax2.text(red + 1, i, f'{red}%', va='center', fontsize=11, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('response_time_reductions.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 4 saved: response_time_reductions.png")
    plt.close()

# ============================================================================
# GRAPH 5: Age Group Performance
# ============================================================================
def graph5_age_groups():
    fig, ax = plt.subplots(figsize=(14, 8))
    
    age_groups = ['18-30', '31-50', '51-65', '65+']
    memory = [68, 58, 52, 45]
    attention = [62, 55, 48, 42]
    overall = [65, 57, 50, 44]
    
    x = np.arange(len(age_groups))
    width = 0.25
    
    bars1 = ax.bar(x - width, memory, width, label='Memory Improvement', 
                   color=colors['primary'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x, attention, width, label='Attention Improvement', 
                   color=colors['secondary'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars3 = ax.bar(x + width, overall, width, label='Overall Cognitive Gain', 
                   color=colors['success'], alpha=0.8, edgecolor='black', linewidth=1.5)
    
    ax.set_xlabel('Age Group (Years)', fontsize=14, fontweight='bold')
    ax.set_ylabel('Improvement Percentage (%)', fontsize=14, fontweight='bold')
    ax.set_title('Cognitive Improvement by Age Group', fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(age_groups)
    ax.legend(fontsize=12)
    ax.grid(True, alpha=0.3, axis='y', linestyle='--')
    ax.set_ylim(0, 75)
    
    # Add value labels
    for bars in [bars1, bars2, bars3]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(height)}%',
                   ha='center', va='bottom', fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('age_group_performance.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 5 saved: age_group_performance.png")
    plt.close()

# ============================================================================
# GRAPH 6: Clinical Assessment Improvements
# ============================================================================
def graph6_clinical_assessments():
    fig, ax = plt.subplots(figsize=(14, 8))
    
    assessments = ['MMSE', 'MoCA', 'PHQ-9\n(Depression)', 'GAD-7\n(Anxiety)', 
                   'ADHD-RS', 'PCL-5\n(PTSD)']
    baseline = [24.5, 22.3, 14.2, 12.5, 28.4, 42.3]
    post_treatment = [27.8, 26.1, 8.7, 7.2, 16.8, 28.1]
    max_scores = [30, 30, 27, 21, 54, 80]
    
    # Normalize to percentages for comparison
    baseline_pct = [b/m*100 for b, m in zip(baseline, max_scores)]
    post_pct = [p/m*100 for p, m in zip(post_treatment, max_scores)]
    
    x = np.arange(len(assessments))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, baseline_pct, width, label='Baseline (%)', 
                   color=colors['warning'], alpha=0.7, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x + width/2, post_pct, width, label='Post-Treatment (%)', 
                   color=colors['success'], alpha=0.7, edgecolor='black', linewidth=1.5)
    
    # Add improvement annotations
    improvements = []
    for i, (base, post, max_s) in enumerate(zip(baseline, post_treatment, max_scores)):
        if i < 2:  # MMSE, MoCA - higher is better
            imp = ((post - base) / max_s) * 100
            improvements.append(imp)
            ax.annotate(f'+{imp:.1f}%', 
                       (i, max(baseline_pct[i], post_pct[i])), 
                       textcoords="offset points", 
                       xytext=(0, 10), 
                       ha='center', 
                       fontsize=9, 
                       fontweight='bold',
                       color=colors['success'])
        else:  # Symptom scales - lower is better
            imp = ((base - post) / max_s) * 100
            improvements.append(imp)
            ax.annotate(f'-{imp:.1f}%', 
                       (i, max(baseline_pct[i], post_pct[i])), 
                       textcoords="offset points", 
                       xytext=(0, 10), 
                       ha='center', 
                       fontsize=9, 
                       fontweight='bold',
                       color=colors['success'])
    
    ax.set_xlabel('Clinical Assessment Tool', fontsize=14, fontweight='bold')
    ax.set_ylabel('Score Percentage (%)', fontsize=14, fontweight='bold')
    ax.set_title('Standardized Clinical Assessment Improvements', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(assessments)
    ax.legend(fontsize=12)
    ax.grid(True, alpha=0.3, axis='y', linestyle='--')
    ax.set_ylim(0, 100)
    
    plt.tight_layout()
    plt.savefig('clinical_assessment_improvements.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 6 saved: clinical_assessment_improvements.png")
    plt.close()

# ============================================================================
# GRAPH 7: Comparison with Traditional Interventions
# ============================================================================
def graph7_intervention_comparison():
    fig, ax = plt.subplots(figsize=(14, 8))
    
    interventions = ['NeuroNest\nPlatform', 'Traditional\nTherapy', 'Medication\nOnly', 'Combined\nTreatment']
    improvement = [58, 42, 28, 71]
    cost = [15, 150, 100, 250]  # Average monthly cost
    accessibility = [100, 45, 90, 50]  # Accessibility score
    engagement = [78, 45, 65, 68]  # Engagement percentage
    
    x = np.arange(len(interventions))
    width = 0.2
    
    # Normalize cost for visualization (inverse - lower is better)
    cost_normalized = [100 - (c/max(cost)*100) for c in cost]
    
    bars1 = ax.bar(x - 1.5*width, improvement, width, label='Improvement Rate (%)', 
                   color=colors['success'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x - 0.5*width, accessibility, width, label='Accessibility Score', 
                   color=colors['primary'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars3 = ax.bar(x + 0.5*width, engagement, width, label='Engagement (%)', 
                   color=colors['secondary'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars4 = ax.bar(x + 1.5*width, cost_normalized, width, label='Cost Efficiency (inverse)', 
                   color=colors['purple'], alpha=0.8, edgecolor='black', linewidth=1.5)
    
    ax.set_xlabel('Intervention Type', fontsize=14, fontweight='bold')
    ax.set_ylabel('Score (%)', fontsize=14, fontweight='bold')
    ax.set_title('NeuroNest vs. Traditional Interventions: Multi-Factor Comparison', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(interventions)
    ax.legend(fontsize=11, loc='upper left')
    ax.grid(True, alpha=0.3, axis='y', linestyle='--')
    ax.set_ylim(0, 105)
    
    # Add value labels
    for bars in [bars1, bars2, bars3]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(height)}',
                   ha='center', va='bottom', fontsize=8, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('intervention_comparison.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 7 saved: intervention_comparison.png")
    plt.close()

# ============================================================================
# GRAPH 8: Cognitive Parameters Radar Chart
# ============================================================================
def graph8_cognitive_parameters():
    fig, ax = plt.subplots(figsize=(12, 12), subplot_kw=dict(projection='polar'))
    
    # Cognitive parameters
    categories = ['Working\nMemory', 'Attention\nSpan', 'Processing\nSpeed', 
                 'Executive\nFunction', 'Verbal\nFluency', 'Memory\nRetention',
                 'Inhibitory\nControl', 'Cognitive\nFlexibility']
    
    # Baseline and improved scores
    baseline_scores = [45, 52, 48, 43, 50, 46, 55, 48]
    improved_scores = [78, 82, 79, 76, 81, 80, 86, 79]
    
    # Convert to radians
    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    baseline_scores += baseline_scores[:1]  # Complete the circle
    improved_scores += improved_scores[:1]
    angles += angles[:1]
    
    # Plot
    ax.plot(angles, baseline_scores, 'o-', linewidth=3, label='Baseline', 
            color=colors['warning'], markersize=10)
    ax.fill(angles, baseline_scores, alpha=0.25, color=colors['warning'])
    
    ax.plot(angles, improved_scores, 'o-', linewidth=3, label='After Training', 
            color=colors['success'], markersize=10)
    ax.fill(angles, improved_scores, alpha=0.25, color=colors['success'])
    
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=11)
    ax.set_ylim(0, 100)
    ax.set_yticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(['20%', '40%', '60%', '80%', '100%'], fontsize=10)
    ax.grid(True, alpha=0.3)
    
    ax.set_title('Cognitive Parameters: Comprehensive Assessment', 
                 fontsize=16, fontweight='bold', pad=30)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1), fontsize=12)
    
    plt.tight_layout()
    plt.savefig('cognitive_parameters_radar.png', dpi=300, bbox_inches='tight')
    print("✓ Graph 8 saved: cognitive_parameters_radar.png")
    plt.close()

# ============================================================================
# MAIN EXECUTION
# ============================================================================
if __name__ == "__main__":
    print("\n" + "="*60)
    print("Generating Cognitive Health Impact Graphs")
    print("="*60 + "\n")
    
    try:
        graph1_cognitive_improvement()
        graph2_mental_health_conditions()
        graph3_test_accuracy()
        graph4_response_times()
        graph5_age_groups()
        graph6_clinical_assessments()
        graph7_intervention_comparison()
        graph8_cognitive_parameters()
        
        print("\n" + "="*60)
        print("✓ All graphs generated successfully!")
        print("="*60)
        print("\nGenerated files:")
        print("  1. cognitive_improvement_timeline.png")
        print("  2. mental_health_conditions.png")
        print("  3. test_accuracy_improvements.png")
        print("  4. response_time_reductions.png")
        print("  5. age_group_performance.png")
        print("  6. clinical_assessment_improvements.png")
        print("  7. intervention_comparison.png")
        print("  8. cognitive_parameters_radar.png")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error generating graphs: {e}")
        import traceback
        traceback.print_exc()


