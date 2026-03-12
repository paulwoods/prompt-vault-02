let counter = Date.now();

export function uniqueEmail(): string {
    return `e2e-${++counter}@example.com`;
}

export function uniqueName(prefix = 'item'): string {
    return `${prefix}-${++counter}`;
}

export const TEST_PASSWORD = 'Password123!';
