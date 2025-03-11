import React from 'react';
import { Sender } from '@ant-design/x';
import { App } from 'antd';

const SenderComponent: React.FC = () => {
  const { message } = App.useApp();

  return (
    <Sender
      submitType="shiftEnter"
      placeholder="Press Shift + Enter to send message"
      onSubmit={() => {
        message.success('Send message successfully!');
      }}
    />
  );
};

export default SenderComponent;