// トランザクション管理

import { existsSync } from "node:fs";
import { copyFile, rename, unlink } from "node:fs/promises";

interface Transaction {
  files: string[];
  backups: Map<string, string>;
}

/**
 * トランザクション開始
 */
export function beginTransaction(): Transaction {
  return {
    files: [],
    backups: new Map(),
  };
}

/**
 * ファイル作成を記録
 */
export function trackFile(transaction: Transaction, filePath: string) {
  transaction.files.push(filePath);
}

/**
 * 既存ファイルのバックアップ
 */
export async function backupFile(transaction: Transaction, filePath: string) {
  if (existsSync(filePath)) {
    const backupPath = `${filePath}.backup`;
    await copyFile(filePath, backupPath);
    transaction.backups.set(filePath, backupPath);
  }
}

/**
 * トランザクションコミット（バックアップ削除）
 */
export async function commitTransaction(transaction: Transaction) {
  for (const backupPath of transaction.backups.values()) {
    if (existsSync(backupPath)) {
      await unlink(backupPath);
    }
  }
}

/**
 * ロールバック失敗時のエラー
 */
export class RollbackError extends Error {
  constructor(
    message: string,
    public readonly errors: unknown[],
  ) {
    super(message);
    this.name = "RollbackError";
  }
}

/**
 * トランザクションロールバック
 * @throws {RollbackError} ロールバック中にエラーが発生した場合
 */
export async function rollbackTransaction(transaction: Transaction) {
  const errors: unknown[] = [];

  // 作成したファイルを削除（順次実行で競合回避）
  for (const filePath of transaction.files) {
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      errors.push(error);
    }
  }

  // バックアップから復元（順次実行で競合回避）
  for (const [originalPath, backupPath] of transaction.backups.entries()) {
    try {
      if (existsSync(backupPath)) {
        await rename(backupPath, originalPath);
      }
    } catch (error) {
      errors.push(error);
    }
  }

  // エラーがあれば例外をスロー
  if (errors.length > 0) {
    console.error("ロールバック中にエラーが発生しました:");
    for (const error of errors) {
      console.error(error);
    }
    throw new RollbackError(
      `Rollback failed with ${errors.length} error(s). System may be in inconsistent state.`,
      errors,
    );
  }
}
