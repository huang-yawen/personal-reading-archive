import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import {
  Button,
  Empty,
  Input,
  Pagination,
  Segmented,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import { fetchItems, fetchTags } from '../api/items';
import type { ItemSummary, Tag as TagType, MediaStatus } from '../api/types';
import ItemCard from './ItemCard';

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'planned', label: '计划' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'paused', label: '暂停' },
  { value: 'dropped', label: '弃' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: '最新' },
  { value: 'title', label: '标题' },
  { value: 'rating', label: '评分' },
  { value: 'completed', label: '完成日期' },
];

export default function ItemList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<TagType[]>([]);

  const qParam = searchParams.get('q') ?? '';
  const typeParam = (searchParams.get('type') ?? '') as '' | 'book' | 'movie';
  const statusParam = searchParams.get('status') ?? '';
  const tagParam = searchParams.get('tag') ?? '';
  const sortParam = searchParams.get('sort') ?? 'newest';
  const pageParam = Number(searchParams.get('page') ?? 1) || 1;
  const pageSizeParam = Number(searchParams.get('pageSize') ?? 12) || 12;

  // 本地搜索框，防抖 300ms 后写回 URL
  const [qInput, setQInput] = useState(qParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQInput(qParam);
  }, [qParam]);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (qInput) next.set('q', qInput);
      else next.delete('q');
      next.set('page', '1');
      setSearchParams(next, { replace: true });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  // 加载标签列表（筛选用）
  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => {});
  }, []);

  // 主数据请求：URL 变化即重新请求
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetchItems({
      type: typeParam || undefined,
      status: (statusParam || undefined) as MediaStatus | undefined,
      tag: tagParam ? Number(tagParam) : undefined,
      q: qParam || undefined,
      sort: sortParam,
      page: pageParam,
      pageSize: pageSizeParam,
    })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setTotal(res.pagination.total);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '请求失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qParam, typeParam, statusParam, tagParam, sortParam, pageParam, pageSizeParam]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  }

  const isEmpty = !loading && !error && items.length === 0;
  const noAnyData = isEmpty && !qParam && !typeParam && !statusParam && !tagParam;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <Title level={3} style={{ margin: 0 }}>
          全部条目
        </Title>
        <Link to="new">
          <Button type="primary">新增条目</Button>
        </Link>
      </Space>

      {/* 筛选栏 */}
      <Space wrap size="middle">
        <Input
          placeholder="搜索标题 / 作者"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />
        <Segmented
          options={[
            { label: '全部', value: '' },
            { label: '书', value: 'book' },
            { label: '影', value: 'movie' },
          ]}
          value={typeParam}
          onChange={(v) => updateParam('type', String(v))}
        />
        <Select
          value={statusParam || ''}
          onChange={(v) => updateParam('status', v)}
          style={{ width: 140 }}
          options={STATUS_OPTIONS}
        />
        <Select
          value={tagParam || ''}
          onChange={(v) => updateParam('tag', v)}
          style={{ width: 140 }}
          options={[{ value: '', label: '全部标签' }, ...tags.map((t) => ({ value: String(t.id), label: t.name }))]}
        />
        <Select
          value={sortParam}
          onChange={(v) => updateParam('sort', v)}
          style={{ width: 120 }}
          options={SORT_OPTIONS}
        />
      </Space>

      {/* 列表 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      )}
      {error && (
        <Space direction="vertical" align="center" style={{ width: '100%', padding: 40 }}>
          <Text type="danger">{error}</Text>
          <Button onClick={() => updateParam('page', String(pageParam))}>重试</Button>
        </Space>
      )}
      {isEmpty && (
        <Empty
          description={noAnyData ? '还没有任何条目' : '没有匹配的结果'}
        >
          {noAnyData && (
            <Link to="new">
              <Button type="primary">去新增</Button>
            </Link>
          )}
        </Empty>
      )}
      {!loading && !error && items.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {!loading && !error && total > pageSizeParam && (
        <Pagination
          current={pageParam}
          pageSize={pageSizeParam}
          total={total}
          showSizeChanger
          onChange={(p, ps) => {
            const next = new URLSearchParams(searchParams);
            next.set('page', String(p));
            next.set('pageSize', String(ps));
            setSearchParams(next);
          }}
          style={{ textAlign: 'center' }}
        />
      )}

      {/* 新增弹窗挂在这里 */}
      <Outlet />
    </Space>
  );
}
