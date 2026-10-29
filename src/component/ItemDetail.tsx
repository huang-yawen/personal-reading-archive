import { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Button, Descriptions, Empty, Space, Spin, Tag, Typography } from 'antd';
import { ApiError } from '../api/client';
import { deleteItem, fetchItem } from '../api/items';
import type { ItemDetail } from '../api/types';

const { Title, Text, Paragraph } = Typography;

export default function ItemDetail() {
  const { id } = useParams();
  const itemId = Number(id);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(itemId)) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetchItem(itemId)
      .then((data) => {
        if (cancelled) return;
        setItem(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : '请求失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const handleDelete = async () => {
    if (!window.confirm('确认删除这条条目？')) return;
    try {
      await deleteItem(itemId);
      window.location.href = '/items';
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }
  if (error || !item) {
    return <Empty description={error ?? '条目不存在'} />;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Link to="/items">← 返回列表</Link>

      <Title level={3} style={{ margin: 0 }}>
        {item.title}
      </Title>
      {item.creator && <Text type="secondary">{item.creator}</Text>}

      <Space wrap>
        <Tag>{item.mediaType === 'book' ? '书' : '影'}</Tag>
        <Tag color="blue">{item.status}</Tag>
        {item.rating != null && <Tag color="gold">{item.rating}</Tag>}
        {item.tags.map((t) => (
          <Tag key={t.id} color={t.color}>
            {t.name}
          </Tag>
        ))}
      </Space>

      {item.description && <Paragraph>{item.description}</Paragraph>}
      {item.review && (
        <Paragraph type="secondary">短评：{item.review}</Paragraph>
      )}

      <Descriptions size="small" column={2} bordered>
        {item.startedOn && <Descriptions.Item label="开始">{item.startedOn}</Descriptions.Item>}
        {item.completedOn && <Descriptions.Item label="完成">{item.completedOn}</Descriptions.Item>}
        {item.mediaType === 'book' && item.pageCount != null && (
          <Descriptions.Item label="页数">{item.pageCount}</Descriptions.Item>
        )}
        {item.mediaType === 'movie' && item.runtimeMinutes != null && (
          <Descriptions.Item label="时长">{item.runtimeMinutes} 分钟</Descriptions.Item>
        )}
        {item.mediaType === 'movie' && item.releaseYear != null && (
          <Descriptions.Item label="上映年份">{item.releaseYear}</Descriptions.Item>
        )}
      </Descriptions>

      {item.logs.length > 0 && (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text strong>阅读 / 观影记录</Text>
          {item.logs.map((log) => (
            <Space key={log.id} size={8}>
              <Text type="secondary">{log.activityDate}</Text>
              {log.progressValue != null && <Text>{log.progressValue}</Text>}
              {log.note && <Text>{log.note}</Text>}
            </Space>
          ))}
        </Space>
      )}

      <Space>
        <Link to="edit">
          <Button type="primary">编辑</Button>
        </Link>
        <Button danger onClick={handleDelete}>
          删除
        </Button>
      </Space>

      <Outlet />
    </Space>
  );
}
