import numpy as np
import json
import os
import matplotlib.pyplot as plt

def pass_probability(level):
    if level <= 1:
        return 0.12
    elif level >= 99:
        return 0.82
    elif level <= 50:
        # Linear interpolation between level 1 and level 50
        return 0.12 + (0.47 - 0.12) / (50 - 1) * (level - 1)
    else:
        # Linear interpolation between level 50 and level 99
        return 0.47 + (0.82 - 0.47) / (99 - 50) * (level - 50)

def simulate_ticks_with_spell(initial_level, max_level, max_row, prayer_duration, total_ticks, simulations=10000):
    xp_per_success = 20
    reach_counts = []
    total_experiences = []
    reset_counts = []

    for _ in range(simulations):
        ticks = 0
        level = initial_level
        row = 0
        successes = 0
        reach_count = 0
        total_experience = 0
        reset_count = 0

        while ticks < total_ticks:
            level = min(initial_level + int(ticks / 100), max_level)
            pass_prob = pass_probability(level)
            
            if np.random.rand() < pass_prob:
                successes += 1
                total_experience += xp_per_success
                if np.random.rand() < 0.5:
                    ticks += 4  # knocked backward, next roll on tick 5
                else:
                    ticks += 10  # knocked forward, next roll on tick 11
                    row += 1
            else:
                ticks += 15  # failed, next roll on tick 16
                row = 0

            if row > max_row:
                reach_count += 1
                remaining_prayer_duration = prayer_duration - (ticks % prayer_duration)
                ticks += remaining_prayer_duration  # idle for the remaining prayer duration

            if ticks // prayer_duration > reset_count:
                reset_count += 1
        
        reach_counts.append(reach_count)
        total_experiences.append(total_experience)
        reset_counts.append(reset_count)

    avg_reach_count = np.mean(reach_counts)
    std_reach_count = np.std(reach_counts)
    avg_experience = np.mean(total_experiences)
    std_experience = np.std(total_experiences)
    avg_reset_count = np.mean(reset_counts)
    std_reset_count = np.std(reset_counts)

    return avg_reach_count, std_reach_count, avg_experience, std_experience, avg_reset_count, std_reset_count

def main():
    initial_level = 99
    max_level = 99
    max_row = 6
    prayer_duration = 1500
    total_ticks = 6000
    simulations = 10000

    avg_reach_count, std_reach_count, avg_experience, std_experience, avg_reset_count, std_reset_count = simulate_ticks_with_spell(initial_level, max_level, max_row, prayer_duration, total_ticks, simulations)

    results = {
        "avg_reach_count": avg_reach_count,
        "std_reach_count": std_reach_count,
        "avg_experience": avg_experience,
        "std_experience": std_experience,
        "avg_reset_count": avg_reset_count,
        "std_reset_count": std_reset_count
    }

    # Create output directory if it doesn't exist
    output_dir = 'outputs'
    os.makedirs(output_dir, exist_ok=True)

    # Save results to a JSON file named after the initial level
    json_filename = f'{output_dir}/simulation_results_level_{initial_level}.json'
    with open(json_filename, 'w') as json_file:
        json.dump(results, json_file, indent=4)

    print(f"Results saved to {json_filename}")

    # Print results to the console
    print(f"Average times reached past max_row: {avg_reach_count:.2f} ± {std_reach_count:.2f}")
    print(f"Average experience gained: {avg_experience:.2f} ± {std_experience:.2f}")
    print(f"Average times reset because prayer ran out: {avg_reset_count:.2f} ± {std_reset_count:.2f}")

if __name__ == "__main__":
    main()
