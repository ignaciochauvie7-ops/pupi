import * as XLSX from 'xlsx'

export interface ProcessedClient {
  name: string
  company_name?: string
  email?: string
  phone?: string
  average_ticket?: number
  notes?: string
}

export interface ProcessedMovement {
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  category?: string
}

export function processExcelClients(
  buffer: ArrayBuffer
): ProcessedClient[] {
  try {
    const workbook = XLSX.read(buffer)
    const sheet = workbook.Sheets[
      workbook.SheetNames[0]
    ]
    const rows = XLSX.utils.sheet_to_json(
      sheet
    ) as Record<string, unknown>[]

    return rows.map(row => ({
      name: String(row['Nombre'] || row['Name'] ||
        row['nombre'] || ''),
      company_name: (row['Empresa'] ||
        row['Company'] || row['empresa']) as string | undefined,
      email: (row['Email'] || row['email'] ||
        row['correo']) as string | undefined,
      phone: (row['Teléfono'] || row['Phone'] ||
        row['telefono']) as string | undefined,
      average_ticket: parseFloat(
        String(row['Ticket'] || row['ticket'] ||
        row['Monto'] || '0')
      ),
      notes: (row['Notas'] || row['Notes'] ||
        row['notas']) as string | undefined,
    })).filter(c => c.name)
  } catch (error) {
    console.error('Excel processing error:', error)
    return []
  }
}

export function processExcelMovements(
  buffer: ArrayBuffer
): ProcessedMovement[] {
  try {
    const workbook = XLSX.read(buffer)
    const sheet = workbook.Sheets[
      workbook.SheetNames[0]
    ]
    const rows = XLSX.utils.sheet_to_json(
      sheet
    ) as Record<string, unknown>[]

    return rows.map(row => ({
      type: (String(row['Tipo'] || row['Type'] ||
        'expense').toLowerCase())
        .includes('ingreso')
        ? 'income' as const : 'expense' as const,
      description: String(row['Descripción'] ||
        row['Description'] ||
        row['descripcion'] || ''),
      amount: parseFloat(
        String(row['Monto'] || row['Amount'] ||
        row['monto'] || '0')
      ),
      date: String(row['Fecha'] || row['Date'] ||
        row['fecha'] ||
        new Date().toISOString().split('T')[0]),
      category: (row['Categoría'] ||
        row['Category'] || row['categoria']) as string | undefined,
    })).filter(m => m.description && m.amount)
  } catch (error) {
    console.error('Excel processing error:', error)
    return []
  }
}
