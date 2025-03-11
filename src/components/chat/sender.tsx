import React, { useState } from 'react';
import { Sender } from '@ant-design/x';

const SenderComponent = ({
  onSubmit,
  disabled
}: {
  onSubmit: (content: string) => void
  disabled?: boolean
}) => {
  const [value, setValue] = useState('');
  return (
    <Sender
      submitType="enter"
      placeholder="Press Enter to send message"
      value={value}
      onChange={setValue}
      disabled={disabled}
      onSubmit={() => {
        if (!value) return
        onSubmit(value)
        setValue('')
      }}
    />
  );
};

export default SenderComponent;