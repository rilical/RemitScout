/**
 * ECharts theme definitions for Remit-Scout.
 *
 * REMIT_SCOUT_THEME       — dark/Enterprise (terminal variant)
 * REMIT_SCOUT_CONSUMER_THEME — light/B2C (consumer variant)
 *
 * These must be COMPLETE theme objects, not partial spreads.
 * ECharts theme registration requires fully-specified objects.
 */

export const REMIT_SCOUT_THEME = {
  color: [
    '#2563EB',
    '#0B1F59',
    '#8CB8FF',
    '#5A6F9E',
    '#10B981',
    '#D97706',
    '#DC2626',
    '#DCEAFE',
  ],

  backgroundColor: 'transparent',

  textStyle: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: 12,
    color: '#94A3B8',
  },

  title: {
    textStyle: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#F8FAFC',
      fontWeight: '700',
      fontSize: 16,
    },
    subtextStyle: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#94A3B8',
      fontSize: 12,
    },
  },

  grid: {
    left: 60,
    right: 20,
    top: 24,
    bottom: 40,
  },

  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#334155',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#94A3B8',
      fontSize: 11,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    splitLine: {
      show: false,
    },
  },

  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#94A3B8',
      fontSize: 11,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#334155',
        opacity: 0.3,
        type: 'dashed',
      },
    },
  },

  tooltip: {
    backgroundColor: '#0B1F59',
    borderColor: '#1E4FBF',
    borderRadius: 12,
    textStyle: {
      color: '#F8FAFC',
      fontSize: 12,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    extraCssText: 'box-shadow: 0 12px 32px rgba(11,31,89,0.28);',
    axisPointer: {
      type: 'line',
      lineStyle: {
        color: '#8CB8FF',
        opacity: 0.45,
      },
    },
  },

  legend: {
    textStyle: {
      color: '#CBD5E1',
      fontSize: 12,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    icon: 'roundRect',
    itemWidth: 14,
    itemHeight: 8,
    itemGap: 20,
    bottom: 0,
  },

  line: {
    smooth: false,
    symbol: 'none',
    lineStyle: {
      width: 2,
    },
    areaStyle: {
      opacity: 0.08,
    },
    emphasis: {
      focus: 'series',
      lineStyle: {
        width: 3,
      },
    },
  },

  bar: {
    barMaxWidth: 32,
    barMinWidth: 4,
    itemStyle: {
      borderRadius: [2, 2, 0, 0],
    },
  },

  scatter: {
    symbolSize: 8,
    emphasis: {
      symbolSize: 12,
    },
  },

  dataZoom: [
    {
      type: 'inside',
      backgroundColor: '#1E293B',
      fillerColor: 'rgba(37, 99, 235, 0.18)',
      borderColor: '#334155',
      handleStyle: {
        color: '#2563EB',
        borderColor: '#2563EB',
      },
      textStyle: {
        color: '#94A3B8',
      },
    },
  ],

  visualMap: {
    textStyle: {
      color: '#94A3B8',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    inRange: {
      color: ['#DCEAFE', '#2563EB', '#0B1F59'],
    },
  },

  markLine: {
    lineStyle: {
      color: '#F59E0B',
      type: 'dashed',
      width: 1.5,
    },
    label: {
      color: '#F59E0B',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
  },

  gauge: {
    axisLine: {
      lineStyle: {
        color: [[1, '#334155']],
      },
    },
    axisLabel: {
      color: '#94A3B8',
    },
    title: {
      color: '#94A3B8',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    detail: {
      color: '#F8FAFC',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
  },

  heatmap: {
    itemStyle: {
      borderColor: '#0F172A',
      borderWidth: 1,
    },
  },
}

export const REMIT_SCOUT_CONSUMER_THEME = {
  color: [
    '#2563EB',
    '#0B1F59',
    '#8CB8FF',
    '#5A6F9E',
    '#10B981',
    '#D97706',
    '#DC2626',
    '#DCEAFE',
  ],

  backgroundColor: 'transparent',

  textStyle: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: 12,
    color: '#64748B',
  },

  title: {
    textStyle: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0F172A',
      fontWeight: '700',
      fontSize: 16,
    },
    subtextStyle: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#64748B',
      fontSize: 12,
    },
  },

  grid: {
    left: 60,
    right: 20,
    top: 24,
    bottom: 40,
  },

  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#E2E8F0',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#64748B',
      fontSize: 11,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    splitLine: {
      show: false,
    },
  },

  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#64748B',
      fontSize: 11,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#E2E8F0',
        opacity: 0.6,
        type: 'dashed',
      },
    },
  },

  tooltip: {
    backgroundColor: '#0B1F59',
    borderColor: '#1E4FBF',
    borderRadius: 12,
    textStyle: {
      color: '#F8FAFC',
      fontSize: 12,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    extraCssText: 'box-shadow: 0 12px 32px rgba(11,31,89,0.18);',
    axisPointer: {
      type: 'line',
      lineStyle: {
        color: '#8CB8FF',
        opacity: 0.45,
      },
    },
  },

  legend: {
    textStyle: {
      color: '#475569',
      fontSize: 12,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    icon: 'roundRect',
    itemWidth: 14,
    itemHeight: 8,
    itemGap: 20,
    bottom: 0,
  },

  line: {
    smooth: false,
    symbol: 'none',
    lineStyle: {
      width: 2,
    },
    areaStyle: {
      opacity: 0.08,
    },
    emphasis: {
      focus: 'series',
      lineStyle: {
        width: 3,
      },
    },
  },

  bar: {
    barMaxWidth: 32,
    barMinWidth: 4,
    itemStyle: {
      borderRadius: [2, 2, 0, 0],
    },
  },

  scatter: {
    symbolSize: 8,
    emphasis: {
      symbolSize: 12,
    },
  },

  dataZoom: [
    {
      type: 'inside',
      backgroundColor: '#F8FAFC',
      fillerColor: 'rgba(37, 99, 235, 0.16)',
      borderColor: '#E2E8F0',
      handleStyle: {
        color: '#2563EB',
        borderColor: '#2563EB',
      },
      textStyle: {
        color: '#64748B',
      },
    },
  ],

  visualMap: {
    textStyle: {
      color: '#64748B',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    inRange: {
      color: ['#DCEAFE', '#2563EB', '#0B1F59'],
    },
  },

  markLine: {
    lineStyle: {
      color: '#F59E0B',
      type: 'dashed',
      width: 1.5,
    },
    label: {
      color: '#F59E0B',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
  },

  gauge: {
    axisLine: {
      lineStyle: {
        color: [[1, '#E2E8F0']],
      },
    },
    axisLabel: {
      color: '#64748B',
    },
    title: {
      color: '#64748B',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    detail: {
      color: '#0F172A',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
  },

  heatmap: {
    itemStyle: {
      borderColor: '#FFFFFF',
      borderWidth: 1,
    },
  },
}
