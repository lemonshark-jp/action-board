#!/usr/bin/env node
// 対話的セットアップスクリプト

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { generateColorPalette } from "./lib/color-utils.js";
import { generateConfigFile, generateEnvFile } from "./lib/generator.js";
import { promptTeamConfig } from "./lib/prompts.js";
import {
  backupFile,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  trackFile,
} from "./lib/transaction.js";

async function main() {
  console.log(chalk.bold.cyan("\n🚀 Action Board チームセットアップ\n"));

  try {
    // 設定入力
    const config = await promptTeamConfig();

    // カラーパレット生成
    if (!config.colors.secondary) {
      const palette = generateColorPalette(config.colors.primary);
      config.colors = palette;
    }

    // 確認
    console.log(`\n${chalk.bold("=== 設定確認 ===")}`);
    console.log(JSON.stringify(config, null, 2));
    console.log("");

    const proceed = await confirm({
      message: "この設定でファイルを生成しますか？",
      default: true,
    });

    if (!proceed) {
      console.log(chalk.yellow("\n中止しました。"));
      process.exit(0);
    }

    // トランザクション開始
    const transaction = beginTransaction();

    try {
      // ファイルパス
      const scriptDir = dirname(fileURLToPath(import.meta.url));
      const rootDir = join(scriptDir, "..");
      const envPath = join(rootDir, ".env.local");
      const configPath = join(
        scriptDir,
        "configs",
        "teams",
        `${config.team.id}.jsonc`,
      );

      // バックアップ
      await backupFile(transaction, envPath);
      await backupFile(transaction, configPath);

      // ファイル生成
      console.log(chalk.blue("\n📝 ファイル生成中..."));

      await generateEnvFile(config, envPath);
      trackFile(transaction, envPath);
      console.log(chalk.green(`✓ ${envPath}`));

      await generateConfigFile(config, configPath);
      trackFile(transaction, configPath);
      console.log(chalk.green(`✓ ${configPath}`));

      // コミット
      await commitTransaction(transaction);

      console.log(chalk.bold.green("\n✅ セットアップ完了！\n"));
      console.log("次のステップ:");
      console.log("  1. アプリケーションを起動: cd .. && npm run dev");
      console.log("  2. ブラウザで確認: http://localhost:3000\n");
    } catch (error) {
      // ロールバック
      console.error(
        chalk.red("\n❌ エラーが発生しました。変更をロールバックします...\n"),
      );
      await rollbackTransaction(transaction);
      throw error;
    }
  } catch (error) {
    console.error(chalk.red("\n❌ セットアップに失敗しました:\n"));
    console.error(error);
    process.exit(1);
  }
}

main();
