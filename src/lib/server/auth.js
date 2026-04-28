import { dev } from '$app/environment';
import crypto from 'node:crypto';

const SESSION_COOKIE_NAME = 'sessionid';
const SESSION_MAX_AGE = 60 * 60 * 6;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;
const ALLOWED_ROLES = new Set(['admin', 'bendahara', 'petugas']);

export function getSessionCookieName() {
	return SESSION_COOKIE_NAME;
}

export function getSessionMaxAge() {
	return SESSION_MAX_AGE;
}

export function getSessionCookieOptions() {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: SESSION_MAX_AGE
	};
}

export function createSessionToken() {
	return crypto.randomUUID();
}

export function buildSessionCookieValue({ userId, sessionId }) {
	return JSON.stringify({ userId, sessionId });
}

export function parseSessionCookieValue(rawValue) {
	if (!rawValue) return null;

	try {
		const parsed = JSON.parse(rawValue);
		if (!parsed || typeof parsed !== 'object') return null;

		const userId = Number(parsed.userId);
		const sessionId = typeof parsed.sessionId === 'string' ? parsed.sessionId.trim() : '';

		if (!Number.isInteger(userId) || userId <= 0 || !sessionId) {
			return null;
		}

		return { userId, sessionId };
	} catch {
		return null;
	}
}

export function normalizeUsername(value) {
	return value.toString().trim().toLowerCase();
}

export function isValidUsername(username) {
	return USERNAME_PATTERN.test(username);
}

export function isStrongPassword(password) {
	return password.length >= 8;
}

export function isValidRole(role) {
	return ALLOWED_ROLES.has(role);
}

// In-memory store for pending OTPs during 2FA login
export const pendingOtps = new Map();

export function generateOTP(length = 5) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let otp = '';
	for (let i = 0; i < length; i++) {
		otp += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return otp;
}
