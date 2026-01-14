import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  animate?: boolean;
  glowEffect?: boolean;
  children?: React.ReactNode;
}

const sizeMap = {
  sm: { dimension: 80, fontSize: 'text-lg', labelSize: 'text-[10px]' },
  md: { dimension: 120, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { dimension: 180, fontSize: 'text-4xl', labelSize: 'text-sm' },
  xl: { dimension: 280, fontSize: 'text-6xl', labelSize: 'text-base' },
};

const variantColors = {
  default: {
    track: 'stroke-muted',
    progress: 'stroke-foreground',
    glow: 'var(--foreground)',
  },
  primary: {
    track: 'stroke-primary/20',
    progress: 'stroke-primary',
    glow: 'var(--primary)',
  },
  success: {
    track: 'stroke-success/20',
    progress: 'stroke-success',
    glow: 'var(--success)',
  },
  warning: {
    track: 'stroke-warning/20',
    progress: 'stroke-warning',
    glow: 'var(--warning)',
  },
};

export function CircularProgress({
  value,
  size = 'md',
  strokeWidth = 8,
  showValue = false,
  label,
  variant = 'primary',
  animate = true,
  glowEffect = true,
  children,
}: CircularProgressProps) {
  const { dimension, fontSize, labelSize } = sizeMap[size];
  const colors = variantColors[variant];
  
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const center = dimension / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow effect */}
      {glowEffect && value > 0 && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: dimension + 20,
            height: dimension + 20,
            background: `radial-gradient(circle, hsl(${colors.glow} / 0.15) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <svg
        width={dimension}
        height={dimension}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.track}
        />
        
        {/* Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors.progress}
          style={{
            strokeDasharray: circumference,
            filter: glowEffect ? `drop-shadow(0 0 8px hsl(${colors.glow} / 0.5))` : undefined,
          }}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {showValue && (
              <span className={cn("font-mono font-bold", fontSize)}>
                {Math.round(value)}%
              </span>
            )}
            {label && (
              <span className={cn("text-muted-foreground", labelSize)}>
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Mini progress ring for compact displays
export function MiniProgressRing({
  value,
  size = 24,
  strokeWidth = 3,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className={cn("transform -rotate-90", className)}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="stroke-primary"
        style={{
          strokeDasharray: circumference,
          strokeDashoffset,
          transition: 'stroke-dashoffset 0.3s ease',
        }}
      />
    </svg>
  );
}
