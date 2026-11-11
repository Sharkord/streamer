import { useUserData } from '@sharkord/plugin-sdk/client';
import { Button, Group, Input } from '@sharkord/ui';
import { memo, useCallback, useEffect, useState } from 'react';
import { MAX_TITLE_LENGTH, type TPlugin } from '../../../types';

export const TitleField = memo(() => {
  const { data, loading, save } = useUserData<TPlugin>();
  const savedTitle = data.title ?? '';
  const [title, setTitle] = useState(savedTitle);

  useEffect(() => {
    setTitle(savedTitle);
  }, [savedTitle]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setTitle(event.target.value),
    []
  );

  const handleSave = useCallback(
    () => save({ ...data, title: title.trim() }),
    [save, data, title]
  );

  return (
    <Group
      label="Stream title"
      description="What viewers see on your stream. Leave it empty to use your name."
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="My stream"
          onChange={handleChange}
        />
        <Button onClick={handleSave} disabled={loading || title === savedTitle}>
          Save
        </Button>
      </div>
    </Group>
  );
});
