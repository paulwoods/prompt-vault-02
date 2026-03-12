import DOMPurify from 'dompurify';
import {describe, expect, it} from 'vitest';

// Tests for the HTML sanitization used in PublicSharePage to strip HTML tags from share body content
const sanitize = (html: string) =>
    DOMPurify.sanitize(html, {ALLOWED_TAGS: [], ALLOWED_ATTR: []});

describe('PublicSharePage sanitization', () => {
    it('strips HTML tags leaving plain text', () => {
        expect(sanitize('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    });

    it('strips script tags and content', () => {
        const result = sanitize('<script>alert("xss")</script>Safe text');
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert');
        expect(result).toBe('Safe text');
    });

    it('strips img tags with onerror', () => {
        const result = sanitize('<img src="x" onerror="alert(1)">text');
        expect(result).not.toContain('<img');
        expect(result).not.toContain('onerror');
    });

    it('returns plain text unchanged', () => {
        expect(sanitize('Plain text with no HTML')).toBe('Plain text with no HTML');
    });

    it('handles empty string', () => {
        expect(sanitize('')).toBe('');
    });

    it('strips anchor tags preserving text', () => {
        expect(sanitize('<a href="https://evil.com">click me</a>')).toBe('click me');
    });
});
