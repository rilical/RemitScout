import { use, registerTheme } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, ScatterChart, GaugeChart, HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  VisualMapComponent,
  ToolboxComponent,
} from 'echarts/components'
import { REMIT_SCOUT_THEME, REMIT_SCOUT_CONSUMER_THEME } from '~/lib/echartsTheme'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  GaugeChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  VisualMapComponent,
  ToolboxComponent,
])

registerTheme('remitScout', REMIT_SCOUT_THEME)
registerTheme('remitScoutConsumer', REMIT_SCOUT_CONSUMER_THEME)

export default defineNuxtPlugin(() => {})
