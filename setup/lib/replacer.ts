// ファイル置換

import { readFile, writeFile } from "node:fs/promises";

/**
 * 正規表現の特殊文字をエスケープ
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * ファイル内の文字列を置換
 * @param filePath - 対象ファイルパス
 * @param replacements - 置換マップ（キー: 検索文字列, 値: 置換文字列）
 * @param literalMode - true: リテラル文字列として検索（デフォルト）, false: 正規表現として検索
 */
export async function replaceInFile(
  filePath: string,
  replacements: Record<string, string>,
  literalMode = true,
): Promise<void> {
  let content = await readFile(filePath, "utf-8");

  for (const [search, replace] of Object.entries(replacements)) {
    const pattern = literalMode ? escapeRegExp(search) : search;
    content = content.replace(new RegExp(pattern, "g"), replace);
  }

  await writeFile(filePath, content, "utf-8");
}

/**
 * 複数ファイルの置換
 * @param filePaths - 対象ファイルパスの配列
 * @param replacements - 置換マップ
 * @param literalMode - true: リテラル文字列として検索（デフォルト）, false: 正規表現として検索
 */
export async function replaceInFiles(
  filePaths: string[],
  replacements: Record<string, string>,
  literalMode = true,
): Promise<void> {
  await Promise.all(
    filePaths.map((path) => replaceInFile(path, replacements, literalMode)),
  );
}
