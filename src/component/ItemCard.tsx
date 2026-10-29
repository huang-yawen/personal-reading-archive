import { Card, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import type { ItemSummary } from '../api/types';

const { Text, Title } = Typography;

const STATUS_LABEL: Record<ItemSummary['status'], string> = {
  planned: '计划',
  in_progress: '进行中',
  completed: '已完成',
  paused: '暂停',
  dropped: '弃',
};

interface ItemCardProps {
  item: ItemSummary;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to={`/items/${item.id}`} style={{ color: 'inherit' }}>
      <Card
        hoverable
        style={{ height: '100%' }}
        cover={
          item.coverUrl ? (
            <img
              alt={item.title}
              src={item.coverUrl}
              style={{ height: 160, objectFit: 'cover' }}
            />
          ) : null
        }
      >
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Title level={5} style={{ margin: 0 }} ellipsis={{ tooltip: item.title }}>
            {item.title}
          </Title>
          {item.creator && <Text type="secondary">{item.creator}</Text>}
          <Space size={4} wrap>
            <Tag>{item.mediaType === 'book' ? '书' : '影'}</Tag>
            <Tag color="blue">{STATUS_LABEL[item.status]}</Tag>
            {item.rating != null && <Tag color="gold">{item.rating}</Tag>}
          </Space>
          {item.tags.length > 0 && (
            <Space size={4} wrap>
              {item.tags.map((t) => (
                <Tag key={t.id} color={t.color}>
                  {t.name}
                </Tag>
              ))}
            </Space>
          )}
        </Space>
      </Card>
    </Link>
  );
}
