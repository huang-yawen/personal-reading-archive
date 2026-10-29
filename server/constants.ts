// 后端统一的演示用户。
// 登录不在本次范围内，但每条 SQL 都必须带 user_id，
// 将来加登录时只需要换掉这个常量的来源，不用改查询逻辑。
export const DEMO_USER_ID = 1;
