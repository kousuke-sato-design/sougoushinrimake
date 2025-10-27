import { supabase } from '$lib/supabaseClient';

interface VerificationResult {
	verified: boolean;
	source: string;
	details: string;
}

/**
 * 作業セッションの時間を検証する
 * データベースの活動ログ（作成・更新レコード）を確認して、
 * 記録された作業時間が実際の活動と一致するかチェックする
 */
export async function verifyWorkSession(
	startTime: Date,
	endTime: Date
): Promise<VerificationResult> {
	try {
		// 1. データベース活動の確認（work_sessions以外のテーブル）
		const dbActivity = await checkDatabaseActivity(startTime, endTime);
		if (dbActivity.verified) {
			return dbActivity;
		}

		// 2. その他の検証方法を追加可能
		// - ファイルシステムの変更時刻
		// - ブラウザのアクセスログ
		// - etc.

		return {
			verified: false,
			source: 'none',
			details: '指定された時間帯に活動が確認できませんでした'
		};
	} catch (error) {
		console.error('Verification error:', error);
		return {
			verified: false,
			source: 'error',
			details: '検証中にエラーが発生しました'
		};
	}
}

/**
 * データベースの活動を確認
 * landing_pages, customers, email_campaigns等のテーブルで
 * 指定時間内に作成・更新されたレコードがあるかチェック
 */
async function checkDatabaseActivity(
	startTime: Date,
	endTime: Date
): Promise<VerificationResult> {
	const startISO = startTime.toISOString();
	const endISO = endTime.toISOString();

	// チェックするテーブルのリスト（work_sessions以外）
	// updated_atがあるテーブル
	const tablesWithUpdatedAt = [
		'landing_pages',
		'customers',
		'form_templates',
		'imap_accounts',
		'email_settings',
		'sites',
		'company_profiles',
		'user_api_keys'
	];

	// created_atのみのテーブル
	const tablesWithCreatedAtOnly = [
		'lp_edit_history',
		'ai_conversation_history',
		'ai_generation_logs',
		'email_campaigns'
	];

	let totalActivities = 0;
	const activityDetails: string[] = [];

	// updated_atがあるテーブルをチェック
	for (const table of tablesWithUpdatedAt) {
		try {
			let createdCount = 0;
			let updatedCount = 0;

			// created_at が指定時間内のレコードを検索
			try {
				const { data: createdData, error: createdError } = await supabase
					.from(table)
					.select('id, created_at')
					.gte('created_at', startISO)
					.lte('created_at', endISO);

				if (!createdError && createdData) {
					createdCount = createdData.length;
				}
			} catch (e) {
				// created_atのチェックに失敗してもスキップ
			}

			// updated_at が指定時間内のレコードを検索
			try {
				const { data: updatedData, error: updatedError } = await supabase
					.from(table)
					.select('id, updated_at')
					.gte('updated_at', startISO)
					.lte('updated_at', endISO);

				if (!updatedError && updatedData) {
					updatedCount = updatedData.length;
				}
			} catch (e) {
				// updated_atのチェックに失敗してもスキップ
			}

			const totalCount = createdCount + updatedCount;

			if (totalCount > 0) {
				totalActivities += totalCount;
				activityDetails.push(`${table}: ${totalCount}件`);
			}
		} catch (e) {
			console.warn(`Failed to check ${table}:`, e);
		}
	}

	// created_atのみのテーブルをチェック
	for (const table of tablesWithCreatedAtOnly) {
		try {
			const { data: createdData, error: createdError } = await supabase
				.from(table)
				.select('id, created_at')
				.gte('created_at', startISO)
				.lte('created_at', endISO);

			if (!createdError && createdData && createdData.length > 0) {
				const count = createdData.length;
				totalActivities += count;
				activityDetails.push(`${table}: ${count}件`);
			}
		} catch (e) {
			console.warn(`${table} created_at check failed:`, e);
		}
	}

	// 許容範囲: 開始時刻の30分前から終了時刻の30分後まで
	const tolerance = 30 * 60 * 1000; // 30分
	const extendedStart = new Date(startTime.getTime() - tolerance);
	const extendedEnd = new Date(endTime.getTime() + tolerance);

	// 拡張範囲での再チェック（活動が見つからなかった場合のみ）
	if (totalActivities === 0) {
		const extendedStartISO = extendedStart.toISOString();
		const extendedEndISO = extendedEnd.toISOString();

		// updated_atがあるテーブル
		for (const table of tablesWithUpdatedAt) {
			try {
				let createdCount = 0;
				let updatedCount = 0;

				// created_at チェック
				try {
					const { data: createdData, error: createdError } = await supabase
						.from(table)
						.select('id, created_at')
						.gte('created_at', extendedStartISO)
						.lte('created_at', extendedEndISO);

					if (!createdError && createdData) {
						createdCount = createdData.length;
					}
				} catch (e) {
					// スキップ
				}

				// updated_at チェック
				try {
					const { data: updatedData, error: updatedError } = await supabase
						.from(table)
						.select('id, updated_at')
						.gte('updated_at', extendedStartISO)
						.lte('updated_at', extendedEndISO);

					if (!updatedError && updatedData) {
						updatedCount = updatedData.length;
					}
				} catch (e) {
					// スキップ
				}

				const totalCount = createdCount + updatedCount;

				if (totalCount > 0) {
					totalActivities += totalCount;
					activityDetails.push(`${table}: ${totalCount}件 (±30分以内)`);
				}
			} catch (e) {
				console.warn(`Failed to check ${table} with tolerance:`, e);
			}
		}

		// created_atのみのテーブル
		for (const table of tablesWithCreatedAtOnly) {
			try {
				const { data: createdData, error: createdError } = await supabase
					.from(table)
					.select('id, created_at')
					.gte('created_at', extendedStartISO)
					.lte('created_at', extendedEndISO);

				if (!createdError && createdData && createdData.length > 0) {
					const count = createdData.length;
					totalActivities += count;
					activityDetails.push(`${table}: ${count}件 (±30分以内)`);
				}
			} catch (e) {
				console.warn(`${table} created_at check failed (extended):`, e);
			}
		}
	}

	if (totalActivities > 0) {
		return {
			verified: true,
			source: 'database_activity',
			details: `データベース活動を検出: ${activityDetails.join(', ')}`
		};
	}

	return {
		verified: false,
		source: 'database_activity',
		details: '指定時間帯にデータベース活動が見つかりませんでした'
	};
}

/**
 * 時間の近さをチェック（±30分以内なら信頼できる）
 */
export function isTimeReasonable(recordedTime: Date, actualTime: Date): boolean {
	const diff = Math.abs(recordedTime.getTime() - actualTime.getTime());
	const thirtyMinutes = 30 * 60 * 1000;
	return diff <= thirtyMinutes;
}

/**
 * 単一の時刻を検証する（開始時刻または終了時刻）
 * 指定された時刻の前後30分以内にデータベース活動があるかチェック
 */
export async function verifySingleTime(time: Date): Promise<VerificationResult> {
	try {
		console.log('Verifying time:', time.toISOString());

		// 現在時刻との差を確認
		const now = new Date();
		const diffMinutes = Math.abs(now.getTime() - time.getTime()) / 60000;

		// 現在時刻から5分以内であれば、ユーザーが今まさに作業中と判断
		if (diffMinutes <= 5) {
			console.log('Time is within 5 minutes of now - auto verified');
			return {
				verified: true,
				source: 'real_time_activity',
				details: '現在時刻での作業として検証済み'
			};
		}

		// 時刻の前後30分
		const tolerance = 30 * 60 * 1000; // 30分
		const startTime = new Date(time.getTime() - tolerance);
		const endTime = new Date(time.getTime() + tolerance);

		const startISO = startTime.toISOString();
		const endISO = endTime.toISOString();

		console.log('Search range:', startISO, 'to', endISO);

		// チェックするテーブルのリスト（work_sessions以外）
		// updated_atがあるテーブル
		const tablesWithUpdatedAt = [
			'landing_pages',
			'customers',
			'form_templates',
			'imap_accounts',
			'email_settings',
			'sites',
			'company_profiles',
			'user_api_keys'
		];

		// created_atのみのテーブル
		const tablesWithCreatedAtOnly = [
			'lp_edit_history',
			'ai_conversation_history',
			'ai_generation_logs',
			'email_campaigns'
		];

		let totalActivities = 0;
		const activityDetails: string[] = [];

		// updated_atがあるテーブルをチェック
		for (const table of tablesWithUpdatedAt) {
			try {
				let createdCount = 0;
				let updatedCount = 0;

				// created_at が指定時間内のレコードを検索
				try {
					const { data: createdData, error: createdError } = await supabase
						.from(table)
						.select('id, created_at')
						.gte('created_at', startISO)
						.lte('created_at', endISO);

					if (createdError) {
						console.log(`${table} created_at query error:`, createdError);
					} else if (createdData) {
						createdCount = createdData.length;
						if (createdCount > 0) {
							console.log(`${table}: found ${createdCount} created records`);
						}
					}
				} catch (e) {
					console.warn(`${table} created_at check failed:`, e);
				}

				// updated_at が指定時間内のレコードを検索
				try {
					const { data: updatedData, error: updatedError } = await supabase
						.from(table)
						.select('id, updated_at')
						.gte('updated_at', startISO)
						.lte('updated_at', endISO);

					if (updatedError) {
						console.log(`${table} updated_at query error:`, updatedError);
					} else if (updatedData) {
						updatedCount = updatedData.length;
						if (updatedCount > 0) {
							console.log(`${table}: found ${updatedCount} updated records`);
						}
					}
				} catch (e) {
					console.warn(`${table} updated_at check failed:`, e);
				}

				const totalCount = createdCount + updatedCount;

				if (totalCount > 0) {
					totalActivities += totalCount;
					activityDetails.push(`${table}: ${totalCount}件`);
				}
			} catch (e) {
				console.warn(`Failed to check ${table}:`, e);
			}
		}

		// created_atのみのテーブルをチェック
		for (const table of tablesWithCreatedAtOnly) {
			try {
				const { data: createdData, error: createdError } = await supabase
					.from(table)
					.select('id, created_at')
					.gte('created_at', startISO)
					.lte('created_at', endISO);

				if (createdError) {
					console.log(`${table} created_at query error:`, createdError);
				} else if (createdData && createdData.length > 0) {
					const count = createdData.length;
					console.log(`${table}: found ${count} created records`);
					totalActivities += count;
					activityDetails.push(`${table}: ${count}件`);
				}
			} catch (e) {
				console.warn(`${table} created_at check failed:`, e);
			}
		}

		console.log('Total activities found:', totalActivities);

		if (totalActivities > 0) {
			return {
				verified: true,
				source: 'database_activity',
				details: `データベース活動を検出 (±30分以内): ${activityDetails.join(', ')}`
			};
		}

		console.log('No database activities found in the time range');
		return {
			verified: false,
			source: 'database_activity',
			details: '指定時刻の前後30分以内にデータベース活動が見つかりませんでした'
		};
	} catch (error) {
		console.error('Verification error:', error);
		return {
			verified: false,
			source: 'error',
			details: '検証中にエラーが発生しました'
		};
	}
}
