import React from 'react';

export type BallVariant = 'default' | 'hot' | 'cold' | 'emerald' | 'consensus';
export type BallSize = 'sm' | 'md' | 'lg' | 'xl';

interface LotteryBallProps {
  number: number;
  variant?: BallVariant;
  size?: BallSize;
  label?: string;
  className?: string;
  tooltip?: string;
}

export const LotteryBall: React.FC<LotteryBallProps> = ({
  number,
  variant = 'default',
  size = 'md',
  label,
  className = '',
  tooltip,
}) => {
  const sizeClasses: Record<BallSize, string> = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-13 h-13 text-lg',
  };

  const variantClasses: Record<BallVariant, string> = {
    // Default State: Pure white background #FFFFFF, 1.5px border #CBD5E1, typography Outfit Bold in #0F172A
    default: 'bg-white border-[1.5px] border-slate-300 text-slate-900 shadow-xs',
    // Hot / High Frequency: Soft amber fill #FEF3C7, 1.5px border #D97706, text #B45309
    hot: 'bg-[#FEF3C7] border-[1.5px] border-[#D97706] text-[#B45309] font-bold shadow-xs',
    // Cold / Dormant: Slate fill #F1F5F9, border #94A3B8, text #64748B
    cold: 'bg-[#F1F5F9] border-[1.5px] border-[#94A3B8] text-[#64748B] font-medium',
    // Draw Highlight (Emerald): Solid #0F3E2E fill, text #FFFFFF
    emerald: 'bg-[#0F3E2E] border-[1.5px] border-[#0A291E] text-white font-bold shadow-sm',
    // Consensus Gold: Solid #D97706 fill, text #FFFFFF, distinct ring
    consensus: 'bg-[#D97706] border-[1.5px] border-[#B45309] text-white font-bold shadow-sm ring-2 ring-[#FEF3C7]',
  };

  const ball = (
    <div
      className={`relative inline-flex items-center justify-center rounded-full font-heading shrink-0 select-none tabular-nums transition-transform duration-150 hover:scale-105 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title={tooltip || `Numéro ${number}`}
    >
      <span className="leading-none tracking-tight">{number}</span>
    </div>
  );

  if (label) {
    return (
      <div className="inline-flex flex-col items-center gap-1">
        {ball}
        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
          {label}
        </span>
      </div>
    );
  }

  return ball;
};
