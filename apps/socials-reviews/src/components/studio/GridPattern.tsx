'use client'

import { useId } from 'react'

interface GridPatternProps {
  width?: any
  height?: any
  x?: any
  y?: any
  squares?: Array<[x: number, y: number]>
  className?: string
  yOffset?: number
  interactive?: boolean
}

export function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  className,
  yOffset = 0,
  interactive = false,
  ...props
}: GridPatternProps) {
  let patternId = useId()

  return (
    <svg
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y + yOffset}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y + yOffset} className="overflow-visible">
          {squares.map(([x, y]) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  )
}