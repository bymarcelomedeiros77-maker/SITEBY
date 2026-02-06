/**
 * Utility functions for critical defect alerts
 */

/**
 * Check if a faction is in critical defect state (>= 80% of max allowed defects)
 * @param defectPercent - Current defect percentage of the faction
 * @param maxDefectPercentage - Maximum allowed defect percentage from active goal
 * @returns true if faction is in critical state
 */
export const isFaccaoCritical = (
    defectPercent: number,
    maxDefectPercentage: number
): boolean => {
    const threshold = maxDefectPercentage * 0.8;
    return defectPercent >= threshold;
};

/**
 * Get the critical threshold percentage
 * @param maxDefectPercentage - Maximum allowed defect percentage
 * @returns The 80% threshold value
 */
export const getCriticalThreshold = (maxDefectPercentage: number): number => {
    return maxDefectPercentage * 0.8;
};
