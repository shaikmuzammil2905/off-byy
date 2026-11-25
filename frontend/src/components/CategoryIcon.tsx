import React from 'react';
import {
  Utensils,
  Shirt,
  Sparkles,
  Headphones,
  ShoppingCart,
  Wrench,
  Tag,
  HeartPulse,
  GraduationCap,
  Dumbbell,
  Store,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  Utensils,
  Shirt,
  Sparkles,
  Headphones,
  ShoppingCart,
  Wrench,
  Tag,
  HeartPulse,
  GraduationCap,
  Dumbbell,
  Store,
};

export const CategoryIcon: React.FC<{ name: string; className?: string; color?: string }> = ({
  name,
  className = 'w-6 h-6',
  color,
}) => {
  const Icon = ICON_MAP[name] || Tag;
  return <Icon className={className} style={color ? { color } : undefined} />;
};
