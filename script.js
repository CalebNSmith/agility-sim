function passProbability(level) {
    if (level <= 1) return 0.12;
    if (level >= 99) return 0.82;
    if (level <= 50) return 0.12 + (0.47 - 0.12) / (50 - 1) * (level - 1);
    return 0.47 + (0.82 - 0.47) / (99 - 50) * (level - 50);
}

function simulateTicksWithSpell(initialLevel, maxLevel, maxRow, prayerDuration, totalTicks, simulations) {
    const xpPerSuccess = 20;
    const reachCounts = [];
    const totalExperiences = [];
    const resetCounts = [];

    for (let i = 0; i < simulations; i++) {
        let ticks = 0;
        let level = initialLevel;
        let row = 0;
        let successes = 0;
        let reachCount = 0;
        let totalExperience = 0;
        let resetCount = 0;

        while (ticks < totalTicks) {
            level = Math.min(initialLevel + Math.floor(ticks / 100), maxLevel);
            const passProb = passProbability(level);

            if (Math.random() < passProb) {
                successes += 1;
                totalExperience += xpPerSuccess;
                ticks += (Math.random() < 0.5) ? 4 : 10;
                row += 1;
            } else {
                ticks += 15;
                row = 0;
            }

            if (row > maxRow) {
                reachCount += 1;
                const remainingPrayerDuration = prayerDuration - (ticks % prayerDuration);
                ticks += remainingPrayerDuration;
            }

            if (Math.floor(ticks / prayerDuration) > resetCount) {
                resetCount += 1;
            }
        }

        reachCounts.push(reachCount);
        totalExperiences.push(totalExperience);
        resetCounts.push(resetCount);
    }

    const avgReachCount = average(reachCounts);
    const stdReachCount = standardDeviation(reachCounts);
    const avgExperience = average(totalExperiences);
    const stdExperience = standardDeviation(totalExperiences);
    const avgResetCount = average(resetCounts);
    const stdResetCount = standardDeviation(resetCounts);

    return { avgReachCount, stdReachCount, avgExperience, stdExperience, avgResetCount, stdResetCount };
}

function average(arr) {
    return arr.reduce((sum, value) => sum + value, 0) / arr.length;
}

function standardDeviation(arr) {
    const avg = average(arr);
    return Math.sqrt(arr.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / arr.length);
}

document.getElementById('simulation-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const initialLevel = parseInt(document.getElementById('initial-level').value);
    const maxLevel = parseInt(document.getElementById('max-level').value);
    const maxRow = parseInt(document.getElementById('max-row').value);
    const prayerDuration = parseInt(document.getElementById('prayer-duration').value);
    const totalTicks = parseInt(document.getElementById('total-ticks').value);
    const simulations = parseInt(document.getElementById('simulations').value);

    const results = simulateTicksWithSpell(initialLevel, maxLevel, maxRow, prayerDuration, totalTicks, simulations);

    document.getElementById('reach-count').textContent = `Average times reached past max row: ${results.avgReachCount.toFixed(2)} ± ${results.stdReachCount.toFixed(2)}`;
    document.getElementById('experience-gained').textContent = `Average experience gained: ${results.avgExperience.toFixed(2)} ± ${results.stdExperience.toFixed(2)}`;
    document.getElementById('reset-count').textContent = `Average times reset because prayer ran out: ${results.avgResetCount.toFixed(2)} ± ${results.stdResetCount.toFixed(2)}`;
});
