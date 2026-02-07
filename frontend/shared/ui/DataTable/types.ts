export type DataTableVariant = 'terminal' | 'consumer'

export type DataTableAlign = 'left' | 'center' | 'right'

export type DataTableColumn = {
  key: string
  label: string
  align?: DataTableAlign
  sortable?: boolean
  widthClass?: string
}

export type DataTableSort = {
  key: string
  direction: 'asc' | 'desc'
}

export type DataTablePagination = {
  page: number
  pageSize: number
  total: number
}

export type DataTableRowKey = (row: unknown, rowIndex: number) => string
