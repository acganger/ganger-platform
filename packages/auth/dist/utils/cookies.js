"use strict";
/**
 * Cookie utility functions for cross-domain session management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCookie = setCookie;
exports.getCookie = getCookie;
exports.deleteCookie = deleteCookie;
exports.getAllCookies = getAllCookies;
exports.clearAllCookies = clearAllCookies;
/**
 * Set a cookie with the specified options
 */
function setCookie(name, value, options = {}) {
    if (typeof document === 'undefined')
        return;
    const { domain, path = '/', secure = true, sameSite = 'lax', maxAge, expires } = options;
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (domain) {
        cookieString += `; Domain=${domain}`;
    }
    if (path) {
        cookieString += `; Path=${path}`;
    }
    if (secure && typeof window !== 'undefined' && window.location.protocol === 'https:') {
        cookieString += '; Secure';
    }
    if (sameSite) {
        cookieString += `; SameSite=${sameSite}`;
    }
    if (maxAge !== undefined) {
        cookieString += `; Max-Age=${maxAge}`;
    }
    else if (expires) {
        cookieString += `; Expires=${expires.toUTCString()}`;
    }
    // Note: httpOnly cannot be set from JavaScript
    document.cookie = cookieString;
}
/**
 * Get a cookie value by name
 */
function getCookie(name) {
    if (typeof document === 'undefined')
        return null;
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}
/**
 * Delete a cookie by name
 */
function deleteCookie(name, options = {}) {
    // To delete a cookie, set it with an expired date
    setCookie(name, '', {
        ...options,
        maxAge: 0,
        expires: new Date(0)
    });
}
/**
 * Get all cookies as an object
 */
function getAllCookies() {
    if (typeof document === 'undefined')
        return {};
    const cookies = {};
    const cookieArray = document.cookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        const cookie = cookieArray[i].trim();
        const [name, value] = cookie.split('=');
        if (name && value) {
            cookies[decodeURIComponent(name)] = decodeURIComponent(value);
        }
    }
    return cookies;
}
/**
 * Clear all cookies for a specific domain
 */
function clearAllCookies(domain) {
    const cookies = getAllCookies();
    Object.keys(cookies).forEach(name => {
        // Try deleting with different path combinations
        deleteCookie(name, { domain, path: '/' });
        deleteCookie(name, { domain, path: '' });
        deleteCookie(name, { path: '/' });
        deleteCookie(name, { path: '' });
        // Also try with the current path
        if (typeof window !== 'undefined') {
            deleteCookie(name, { domain, path: window.location.pathname });
        }
    });
}
