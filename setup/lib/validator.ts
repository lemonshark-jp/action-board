// バリデーション

/**
 * チームIDのバリデーション
 */
export function validateTeamId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id);
}

/**
 * HEXカラーコードのバリデーション（3桁・6桁両方対応）
 */
export function validateHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * URLのバリデーション
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
