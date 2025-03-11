"use client"

import { Welcome } from '@ant-design/x';
import { Card, ConfigProvider, Flex, theme } from 'antd';
import React from 'react';

const items: {
  algorithm: typeof theme.defaultAlgorithm;
  background: string;
}[] = [
  {
    algorithm: theme.darkAlgorithm,
    background: 'linear-gradient(97deg, rgba(90,196,255,0.12) 0%, rgba(174,136,255,0.12) 100%)',
  },
];

const WelcomeComponent = () => {
  return (
    <Welcome
      style={{
        backgroundImage: 'linear-gradient(97deg, rgba(90,196,255,0.12) 0%, rgba(174,136,255,0.12) 100%)',
        borderStartStartRadius: 4,
        padding: 12
      }}
      icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
      title="Hello, I'm Butter"
      description="I'm here to help you find the best strategy for your investment and trade."
    />
  );
};

export default WelcomeComponent;