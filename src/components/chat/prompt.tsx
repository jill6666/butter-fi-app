"use client"

import React from 'react';
import { Prompts } from '@ant-design/x';
import type { PromptsProps } from '@ant-design/x';
import {
  BulbOutlined,
  InfoCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';

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

const PromptComponent = ({
  onPromptClick
}: {
  onPromptClick?: (item: string) => void
}) => {
  return (
    <Prompts
      title="✨ Start with a Prompt"
      items={items}
      onItemClick={(info) => {
        onPromptClick && onPromptClick(`${info.data.description}`);
      }}
    />
  );
};

export default PromptComponent;