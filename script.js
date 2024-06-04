function passProbability(level) {
    if (level <= 1) return 0.12;
    if (level >= 99) return 0.82;
    if (level <= 50) return 0.12 + (0.47 - 0.12) / (50 - 1) * (level - 1);
    return 0.47 + (0.82 - 0.47) / (99 - 50) * (level - 50);
}

async function getPrayerDuration(prayerLevel, prayerBonus) {
    async function queryPrayerDuration(prayerLevel, prayerBonus) {
        const url = `https://oldschool.runescape.wiki/api.php?action=parse&text=%7B%7BCalculator%3APrayer%2FPrayer_drain%2FTemplate%7Cplayername%3D%7CPrayerLevel_Input%3D${prayerLevel}%7CPrayerBonus_Input%3D${prayerBonus}%7CPrayer_Overhead%3DProtect%20from%20Missiles%7CCombat_Style%3DMelee%7CPrayer_Combination%3DNone%7CPrayer_Defence%3DNone%7CPrayer_Strength%3DNone%7CPrayer_Attack%3DNone%7CIsPrayer_RapidRestore%3D0%7CIsPrayer_RapidHeal%3D0%7CIsPrayer_ProtectItem%3D0%7CIsPrayer_Preserve%3D0%7D%7D&prop=text%7Climitreportdata&title=Calculator%3APrayer%2FPrayer_drain&disablelimitreport=true&contentmodel=wikitext&format=json`;

        const response = await fetch(url);
        const data = await response.json();

        console.log(data);

        const text = data.parse.text["*"];
        const regex = /(\d+)\s*seconds<\/b>/;
        const match = text.match(regex);

        if (match) {
            return parseInt(match[1], 10) / 0.6; // convert seconds to ticks by dividing by 0.6
        } else {
            throw new Error("Prayer duration not found");
        }
    }

    if (prayerLevel > 99) {
        const duration1 = await queryPrayerDuration(99, prayerBonus);
        const duration2 = await queryPrayerDuration(prayerLevel - 99, prayerBonus);
        return duration1 + duration2;
    } else {
        return await queryPrayerDuration(prayerLevel, prayerBonus);
    }
}

function calculateInitialLevel(maxLevel, hitsFromSpectres) {
    let level = maxLevel;
    for (let i = 0; i < hitsFromSpectres; i++) {
        level = Math.floor(level * 0.4);
    }
    return level;
}

function simulateVersion1(initialLevel, maxLevel, maxRow, prayerDuration, totalTicks, simulations) {
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
        let backwardStreak = 0;

        while (ticks < totalTicks) {
            level = Math.min(initialLevel + Math.floor(ticks / 100), maxLevel);
            const passProb = passProbability(level);

            if (Math.random() < passProb) {
                successes += 1;
                totalExperience += xpPerSuccess;
                if (Math.random() < 0.5) {
                    ticks += 4;  // knocked backward, next roll on tick 5
                    backwardStreak += 1;
                    if (backwardStreak === 2) {
                        row = Math.max(0, row - 1);  // subtract one from row
                        backwardStreak = 0;
                    }
                } else {
                    ticks += 10;  // knocked forward, next roll on tick 11
                    row += 1;
                    backwardStreak = 0;
                }
            } else {
                ticks += 15;  // failed, next roll on tick 16
                row = 0;
                backwardStreak = 0;
            }

            if (row > maxRow) {
                reachCount += 1;
                const remainingPrayerDuration = prayerDuration - (ticks % prayerDuration);
                ticks += remainingPrayerDuration;  // idle for the remaining prayer duration
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

function simulateVersion2(initialLevel, maxLevel, maxRow, prayerDuration, totalTicks, simulations) {
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
        let backwardStreak = 0;
        let previousRow = 0;

        while (ticks < totalTicks) {
            level = Math.min(initialLevel + Math.floor(ticks / 100), maxLevel);
            const passProb = passProbability(level);

            if (Math.random() < passProb) {
                successes += 1;
                totalExperience += xpPerSuccess;
                if (Math.random() < 0.5) {
                    ticks += 4;  // knocked backward, next roll on tick 5
                    backwardStreak += 1;
                    if (backwardStreak === 2) {
                        previousRow = row;
                        row = maxRow - 1;  // jump to max_row - 1
                        backwardStreak = 0;
                    }
                } else {
                    ticks += 10;  // knocked forward, next roll on tick 11
                    row += 1;
                    backwardStreak = 0;
                }
            } else {
                ticks += 15;  // failed, next roll on tick 16
                row = 0;
                backwardStreak = 0;
            }

            if (row > maxRow) {
                reachCount += 1;
                const remainingPrayerDuration = prayerDuration - (ticks % prayerDuration);
                ticks += remainingPrayerDuration;  // idle for the remaining prayer duration
            }

            if (row === maxRow - 1 && Math.random() < passProbability(level)) {
                row = previousRow;  // return to the row we were before the jump
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

document.getElementById('simulation-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const hitsFromSpectres = parseInt(document.getElementById('hits-from-spectres').value);
    const maxLevel = parseInt(document.getElementById('max-level').value);
    const maxRow = parseInt(document.getElementById('max-row').value);
    const prayerLevel = parseInt(document.getElementById('prayer-level').value);
    const prayerBonus = parseInt(document.getElementById('prayer-bonus').value);
    const totalTicks = parseInt(document.getElementById('total-ticks').value);
    const simulations = parseInt(document.getElementById('simulations').value);
    const version = document.getElementById('version').value;

    let prayerDuration;
    try {
        prayerDuration = await getPrayerDuration(prayerLevel, prayerBonus);
    } catch (error) {
        console.error('Error fetching prayer duration:', error);
        alert('Failed to fetch prayer duration. Please try again.');
        return;
    }

    const initialLevel = calculateInitialLevel(maxLevel, hitsFromSpectres);

    let results;
    if (version === '1') {
        results = simulateVersion1(initialLevel, maxLevel, maxRow, prayerDuration, totalTicks, simulations);
    } else {
        results = simulateVersion2(initialLevel, maxLevel, maxRow, prayerDuration, totalTicks, simulations);
    }

    document.getElementById('starting-level').textContent = `Starting agility level: ${initialLevel}`;
    document.getElementById('reach-count').textContent = `Average times reached past max row: ${results.avgReachCount.toFixed(2)} ± ${results.stdReachCount.toFixed(2)}`;
    document.getElementById('experience-gained').textContent = `Average experience gained: ${results.avgExperience.toFixed(2)} ± ${results.stdExperience.toFixed(2)}`;
    document.getElementById('reset-count').textContent = `Average times reset because prayer ran out: ${results.avgResetCount.toFixed(2)} ± ${results.stdResetCount.toFixed(2)}`;
});
