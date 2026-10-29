import {
  Alert,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Select,
} from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import type { MediaStatus, MediaType, Tag } from '../api/types';

export type ItemFormValues = {
  mediaType?: MediaType;
  title?: string;
  creator?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  status?: MediaStatus;
  rating?: number | null;
  review?: string | null;
  startedOn?: Dayjs | null;
  completedOn?: Dayjs | null;
  pageCount?: number | null;
  runtimeMinutes?: number | null;
  releaseYear?: number | null;
  tagIds?: number[];
};

const CREATE_DEFAULT_VALUES: ItemFormValues = {
  mediaType: 'book',
  status: 'planned',
  rating: null,
  tagIds: [],
};

const TYPE_OPTIONS = [
  { value: 'book' as const, label: '书籍' },
  { value: 'movie' as const, label: '电影' },
];

const STATUS_OPTIONS = [
  { value: 'planned' as const, label: '计划中' },
  { value: 'in_progress' as const, label: '在读 / 在看' },
  { value: 'completed' as const, label: '已完成' },
  { value: 'paused' as const, label: '搁置' },
  { value: 'dropped' as const, label: '弃坑' },
];

type ItemFormProps = {
  form: FormInstance<ItemFormValues>;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError: boolean;
  onRetryTags: () => void;
  initialValues?: ItemFormValues;
  typeDisabled?: boolean;
};

function ItemForm({
  form,
  tags,
  tagsLoading,
  tagsError,
  onRetryTags,
  initialValues,
  typeDisabled,
}: ItemFormProps) {
  // 类型切换时「清空」另一侧字段，而不只是隐藏。
  // 光隐藏的话，残留值仍会随表单提交，后端会因为互斥校验直接 400，
  // 用户却看不到那个已经隐藏的输入框，只看到一条莫名其妙的错误。
  const handleValuesChange = (changed: Partial<ItemFormValues>) => {
    if (!('mediaType' in changed)) return;
    if (changed.mediaType === 'book') {
      form.resetFields(['runtimeMinutes', 'releaseYear']);
    } else {
      form.resetFields(['pageCount']);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues ?? CREATE_DEFAULT_VALUES}
      onValuesChange={handleValuesChange}
    >
      <Form.Item name="mediaType" label="类型">
        <Segmented options={TYPE_OPTIONS} block disabled={typeDisabled} />
      </Form.Item>

      <Form.Item name="title" label="标题" rules={[{ required: true, message: '标题不能为空' }]}>
        <Input maxLength={255} showCount placeholder="输入书名 / 片名" />
      </Form.Item>

      {/* 作者 / 导演随类型变化 */}
      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.mediaType !== cur.mediaType}>
        {({ getFieldValue }) => {
          const isBook = getFieldValue('mediaType') === 'book';
          return (
            <Form.Item name="creator" label={isBook ? '作者' : '导演'}>
              <Input
                maxLength={255}
                placeholder={isBook ? '例如 刘慈欣' : '例如 Christopher Nolan'}
              />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item name="status" label="状态">
        <Select options={STATUS_OPTIONS} />
      </Form.Item>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="rating"
            label="评分"
            extra="0–10，可留空"
            rules={[{ type: 'number', min: 0, max: 10, message: '评分需在 0–10 之间' }]}
          >
            <InputNumber min={0} max={10} step={0.5} precision={1} style={{ width: '100%' }} placeholder="9.0" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="startedOn" label="开始日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      {/* 状态为「已完成」时，完成日期变必填 */}
      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
        {({ getFieldValue }) => (
          <Form.Item
            name="completedOn"
            label="完成日期"
            rules={
              getFieldValue('status') === 'completed'
                ? [{ required: true, message: '状态为已完成时必须填写完成日期' }]
                : []
            }
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => {
                const started = form.getFieldValue('startedOn');
                return !!current && !!started && current.isBefore(started, 'day');
              }}
            />
          </Form.Item>
        )}
      </Form.Item>

      {/* 类型联动字段：显示哪一组，另一组的值已经清掉 */}
      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.mediaType !== cur.mediaType}>
        {({ getFieldValue }) =>
          getFieldValue('mediaType') === 'book' ? (
            <Form.Item
              name="pageCount"
              label="页数"
              rules={[{ type: 'number', min: 1, max: 65535, message: '页数需在 1–65535 之间' }]}
            >
              <InputNumber min={1} max={65535} precision={0} style={{ width: '100%' }} placeholder="302" />
            </Form.Item>
          ) : (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="runtimeMinutes"
                  label="时长（分钟）"
                  rules={[{ type: 'number', min: 1, max: 65535, message: '时长需在 1–65535 之间' }]}
                >
                  <InputNumber min={1} max={65535} precision={0} style={{ width: '100%' }} placeholder="169" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="releaseYear"
                  label="上映年份"
                  rules={[{ type: 'number', min: 1000, max: 2155, message: '上映年份不合法' }]}
                >
                  <InputNumber min={1000} max={2155} precision={0} style={{ width: '100%' }} placeholder="2014" />
                </Form.Item>
              </Col>
            </Row>
          )
        }
      </Form.Item>

      <Form.Item name="tagIds" label="标签">
        <Select
          mode="multiple"
          allowClear
          loading={tagsLoading}
          placeholder={tagsError ? '标签加载失败' : '选择标签（可多选）'}
          options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
        />
      </Form.Item>
      {tagsError && (
        <Alert
          type="warning"
          showIcon
          message="标签列表加载失败，可重试"
          action={<a onClick={onRetryTags}>重试</a>}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item name="description" label="简介">
        <Input.TextArea rows={3} maxLength={5000} showCount placeholder="可选" />
      </Form.Item>

      <Form.Item name="review" label="短评">
        <Input.TextArea rows={3} maxLength={5000} showCount placeholder="可选" />
      </Form.Item>
    </Form>
  );
}

export default ItemForm;
