import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Form, Modal, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import { ApiError } from '../api/client';
import { createItem, fetchTags } from '../api/items';
import type { CreateItemPayload, Tag } from '../api/types';
import ItemForm from './ItemForm';
import type { ItemFormValues } from './ItemForm';

type ItemDialogProps = {
  mode: 'create' | 'edit';
};

function toPayload(values: ItemFormValues): CreateItemPayload {
  const date = (value: Dayjs | null | undefined) => (value ? value.format('YYYY-MM-DD') : null);
  const text = (value: string | null | undefined) => {
    const trimmed = (value ?? '').trim();
    return trimmed === '' ? null : trimmed;
  };
  const num = (value: number | null | undefined) => (value === null || value === undefined ? null : value);

  return {
    mediaType: values.mediaType ?? 'book',
    title: text(values.title) ?? '',
    creator: text(values.creator),
    description: text(values.description),
    coverUrl: text(values.coverUrl),
    status: values.status ?? 'planned',
    rating: num(values.rating),
    review: text(values.review),
    startedOn: date(values.startedOn),
    completedOn: date(values.completedOn),
    pageCount: num(values.pageCount),
    runtimeMinutes: num(values.runtimeMinutes),
    releaseYear: num(values.releaseYear),
    tagIds: values.tagIds ?? [],
  };
}

function ItemDialog({ mode }: ItemDialogProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm<ItemFormValues>();

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState(false);

  const close = () => navigate('..', { replace: true });

  // 请求逻辑只写一份，放在 effect 里；重试通过递增 tick 重新触发。
  // setState 全部位于 .then 回调内（异步），不违反 set-state-in-effect。
  const [tagsTick, setTagsTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchTags()
      .then((data) => {
        if (cancelled) return;
        setTags(data);
        setTagsError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setTagsError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setTagsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tagsTick]);

  const retryTags = () => {
    setTagsLoading(true);
    setTagsError(false);
    setTagsTick((tick) => tick + 1);
  };

  const handleOk = async () => {
    setServerError(null);
    let values: ItemFormValues;
    try {
      // 校验不通过时 antd 自己渲染字段错误并 reject，这里必须吞掉
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      const created = await createItem(toPayload(values));
      navigate(`/items/${created.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        // 后端的字段级错误 → 摆回对应的输入框
        form.setFields(
          Object.entries(err.fields).map(([name, message]) => ({
            name: name as keyof ItemFormValues,
            errors: [message],
          })),
        );
        return;
      }
      setServerError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 表单有改动时，Esc / 点遮罩 / 点取消都要先确认，否则一次误点就丢了输入
  const handleCancel = () => {
    if (!form.isFieldsTouched()) {
      close();
      return;
    }
    Modal.confirm({
      title: '放弃修改吗？',
      content: '当前表单有未保存的内容，关闭后会丢失。',
      okText: '放弃',
      okButtonProps: { danger: true },
      cancelText: '继续编辑',
      onOk: close,
    });
  };

  return (
    <Modal
      open
      title={mode === 'create' ? '新增条目' : `编辑条目 #${id}`}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="保存"
      confirmLoading={submitting}
      okButtonProps={{ disabled: submitting }}
      width={640}
      destroyOnHidden
    >
      {serverError && (
        <Alert type="error" showIcon message={serverError} style={{ marginBottom: 16 }} />
      )}

      <Spin spinning={tagsLoading && tags.length === 0}>
        <ItemForm
          form={form}
          tags={tags}
          tagsLoading={tagsLoading}
          tagsError={tagsError}
          onRetryTags={retryTags}
        />
      </Spin>
    </Modal>
  );
}

export default ItemDialog;
