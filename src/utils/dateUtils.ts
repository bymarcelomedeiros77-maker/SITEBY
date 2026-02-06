/**
 * Utility functions for date calculations
 */

/**
 * Calculate expected delivery date based on send date
 * Rules:
 * - If sent on Wednesday (3) or Thursday (4): Next week's Wednesday or Thursday
 * - Otherwise: +7 days from send date
 * 
 * @param dataEnvio ISO date string (YYYY-MM-DD)
 * @returns ISO date string for expected delivery
 */
export function calculateExpectedDelivery(dataEnvio: string): string {
    const sendDate = new Date(dataEnvio);
    const dayOfWeek = sendDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    let expectedDate: Date;

    if (dayOfWeek === 3 || dayOfWeek === 4) {
        // Wednesday (3) or Thursday (4)
        // Set to next week's same day
        expectedDate = new Date(sendDate);
        expectedDate.setDate(sendDate.getDate() + 7);
    } else {
        // Any other day: add 7 days
        expectedDate = new Date(sendDate);
        expectedDate.setDate(sendDate.getDate() + 7);
    }

    return expectedDate.toISOString().split('T')[0];
}

/**
 * Calculate days overdue based on expected delivery date
 * @param dataPrevista ISO date string (YYYY-MM-DD)
 * @returns Number of days overdue (0 if not overdue)
 */
export function calculateDaysOverdue(dataPrevista: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expectedDate = new Date(dataPrevista);
    expectedDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - expectedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
}

/**
 * Format date for display
 * @param isoDate ISO date string (YYYY-MM-DD)
 * @returns Formatted date DD/MM/YYYY
 */
export function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR');
}
