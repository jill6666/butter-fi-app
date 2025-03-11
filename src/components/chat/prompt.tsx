"use client"

import React from 'react';
import { Prompts } from '@ant-design/x';
import type { PromptsProps } from '@ant-design/x';
import {
  BulbOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  SmileOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { App } from 'antd';

const items: PromptsProps['items'] = [
  {
    key: '3',
    icon: <RocketOutlined style={{ color: '#722ED1' }} />,
    label: 'Saving Time on Research',
    description: 'Suggest 3 strategies with at least 7% APR',
  },
  {
    key: '2',
    icon: <InfoCircleOutlined style={{ color: '#1890FF' }} />,
    label: 'Learn More',
    description: 'What is Butter Finance and how it works?',
  },
  {
    key: '1',
    icon: <BulbOutlined style={{ color: '#FFD700' }} />,
    label: 'Keep Safe when Leveraging Turnkey',
    description: 'Why use Turnkey?',
  },
];

const PromptComponent = () => {
  const { message } = App.useApp();

  return (
    <Prompts
      title="✨ Start with a Prompt"
      items={items}
      onItemClick={(info) => {
        message.success(`You clicked a prompt: ${info.data.label}`);
      }}
    />
  );
};

export default PromptComponent;