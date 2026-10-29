import { ApiError } from "./errors";
import type { CreateItemInput, MediaStatus, MediaType } from "../types";

const MEDIA_TYPES: readonly MediaType[] = ["book", "movie"];
const MEDIA_STATUSES: readonly MediaStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "paused",
  "dropped",
];

const MAX_TAG_IDS = 20;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type Body = Record<string, unknown>;
type Errors = Record<string, string>;

function isRecord(value: unknown): value is Body {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  body: Body,
  field: string,
  label: string,
  max: number,
  errors: Errors,
): string | null {
  const raw = body[field];
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    errors[field] = `${label}必须是文本`;
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed.length > max) {
    errors[field] = `${label}不能超过 ${max} 个字符`;
    return null;
  }
  return trimmed;
}

interface NumberRule {
  label: string;
  min: number;
  max: number;
  integer: boolean;
}

// 空字符串、undefined、null 都视为「没填」，返回 null。
// 表单里的数字通常是字符串，这里一并做转换。
function readNumber(
  body: Body,
  field: string,
  rule: NumberRule,
  errors: Errors,
): number | null {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === "") return null;

  const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;

  if (!Number.isFinite(num)) {
    errors[field] = `${rule.label}必须是数字`;
    return null;
  }
  if (rule.integer && !Number.isInteger(num)) {
    errors[field] = `${rule.label}必须是整数`;
    return null;
  }
  if (num < rule.min || num > rule.max) {
    errors[field] = `${rule.label}需在 ${rule.min}–${rule.max} 之间`;
    return null;
  }
  return num;
}

function readDate(
  body: Body,
  field: string,
  label: string,
  errors: Errors,
): string | null {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") {
    errors[field] = `${label}格式应为 YYYY-MM-DD`;
    return null;
  }

  const match = DATE_PATTERN.exec(raw);
  if (match === null) {
    errors[field] = `${label}格式应为 YYYY-MM-DD`;
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // 2026-02-30 这种格式合法但日期不存在，需要额外验证
  const date = new Date(Date.UTC(year, month - 1, day));
  const exists =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!exists) {
    errors[field] = `${label}不是有效日期`;
    return null;
  }
  return raw;
}

function readEnum<T extends string>(
  body: Body,
  field: string,
  label: string,
  allowed: readonly T[],
  fallback: T | undefined,
  errors: Errors,
): T | null {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === "") {
    if (fallback !== undefined) return fallback;
    errors[field] = `${label}不能为空`;
    return null;
  }
  if (typeof raw !== "string" || !allowed.includes(raw as T)) {
    errors[field] = `${label}只能是 ${allowed.join(" / ")}`;
    return null;
  }
  return raw as T;
}

function readTagIds(body: Body, errors: Errors): number[] {
  const raw = body.tagIds;
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    errors.tagIds = "标签格式不正确";
    return [];
  }

  const ids = new Set<number>();
  for (const item of raw) {
    const num = typeof item === "number" ? item : typeof item === "string" ? Number(item) : Number.NaN;
    if (!Number.isInteger(num) || num <= 0) {
      errors.tagIds = "标签 id 必须是正整数";
      return [];
    }
    ids.add(num);
  }
  if (ids.size > MAX_TAG_IDS) {
    errors.tagIds = `最多选择 ${MAX_TAG_IDS} 个标签`;
    return [];
  }
  return [...ids];
}

export function parseCreateItemInput(payload: unknown, userId: number): CreateItemInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "请求体必须是 JSON 对象");
  }

  const errors: Errors = {};

  const mediaType = readEnum(payload, "mediaType", "类型", MEDIA_TYPES, undefined, errors);
  const status = readEnum(payload, "status", "状态", MEDIA_STATUSES, "planned", errors);

  const title = readString(payload, "title", "标题", 255, errors);
  if (title === null && errors.title === undefined) {
    errors.title = "标题不能为空";
  }

  const creator = readString(payload, "creator", "作者/导演", 255, errors);
  const description = readString(payload, "description", "简介", 5000, errors);
  const coverUrl = readString(payload, "coverUrl", "封面地址", 2048, errors);
  const review = readString(payload, "review", "短评", 5000, errors);

  // rating 列是 DECIMAL(3,1)，上限 10.0，与 schema 的 CHECK (rating <= 10) 对齐。
  const rating = readNumber(
    payload,
    "rating",
    { label: "评分", min: 0, max: 10, integer: false },
    errors,
  );

  const startedOn = readDate(payload, "startedOn", "开始日期", errors);
  const completedOn = readDate(payload, "completedOn", "完成日期", errors);

  const pageCount = readNumber(
    payload,
    "pageCount",
    { label: "页数", min: 1, max: 65535, integer: true },
    errors,
  );
  const runtimeMinutes = readNumber(
    payload,
    "runtimeMinutes",
    { label: "时长", min: 1, max: 65535, integer: true },
    errors,
  );
  const releaseYear = readNumber(
    payload,
    "releaseYear",
    { label: "上映年份", min: 1000, max: 2155, integer: true },
    errors,
  );

  const tagIds = readTagIds(payload, errors);

  // 跨字段规则
  if (startedOn !== null && completedOn !== null && completedOn < startedOn) {
    errors.completedOn = "完成日期不能早于开始日期";
  }
  if (mediaType === "book") {
    if (runtimeMinutes !== null) errors.runtimeMinutes = "书籍不能填写时长";
    if (releaseYear !== null) errors.releaseYear = "书籍不能填写上映年份";
  } else if (mediaType === "movie") {
    if (pageCount !== null) errors.pageCount = "电影不能填写页数";
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "请检查表单内容", errors);
  }
  // 前面的校验保证了这三个字段有值，但 TS 无法推断，这里显式收窄。
  if (mediaType === null || status === null || title === null) {
    throw new ApiError(400, "缺少必填字段");
  }

  return {
    userId,
    mediaType,
    title,
    creator,
    description,
    coverUrl,
    status,
    rating,
    review,
    startedOn,
    completedOn,
    pageCount,
    runtimeMinutes,
    releaseYear,
    tagIds,
  };
}
