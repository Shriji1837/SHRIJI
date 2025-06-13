// app/api/sheets/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/auth.js'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID
const SHEET_NAME = 'Detailed breakdown'
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const SHEET_RANGE = 'A1:Z5000'
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${SHEET_RANGE}?key=${API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch sheet data')
    }
    
    const rows = data.values || []
    if (rows.length === 0) {
      return NextResponse.json({ data: [] })
    }
    
    const headers = rows[0]
    console.log('🔍 DEBUG: Actual headers from Google Sheets:')
headers.forEach((header, index) => {
  const columnLetter = String.fromCharCode(65 + index);
  console.log(`Column ${columnLetter} (${index}): "${header}" (length: ${header.length})`)
})

// Specifically check column M (index 12)
console.log('\n🔧 Column M specifically:')
console.log(`Header: "${headers[12]}" (type: ${typeof headers[12]})`)
console.log(`Trimmed: "${headers[12]?.trim()}"`)
console.log(`Mapped to: ${mapHeaderToFieldName(headers[12])}`)

// Check first few data rows for column M
console.log('\n📊 First 5 rows of column M data:')
for (let i = 1; i <= 5 && i < rows.length; i++) {
  console.log(`Row ${i + 1}: "${rows[i][12]}" (type: ${typeof rows[i][12]})`)
}
    const dataRows = rows.slice(1)
    
    const transformedData = dataRows.map((row, index) => {
      const item = {
        id: `item-${index + 2}`, // +2 because we skip header and start from row 2
        rowIndex: index + 2 // Track the actual row number in the sheet
      }
      
      headers.forEach((header, colIndex) => {
        const fieldName = mapHeaderToFieldName(header)
        item[fieldName] = row[colIndex] || ''
      })
      
      return item
    }).filter(item => item.propertyName && item.propertyName.trim() !== '')
    
    return NextResponse.json({ data: transformedData })
    
  } catch (error) {
    console.error('Error fetching sheet data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sheet data', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rowIndex, columnLetter, newValue } = await request.json()
    
    if (!rowIndex || !columnLetter || newValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: rowIndex, columnLetter, newValue' },
        { status: 400 }
      )
    }

    const range = `${columnLetter}${rowIndex}`
    
    console.log(`Updating ${range} with value: ${newValue}`)
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetId: SHEET_ID,
        range: range,
        value: newValue
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Cell ${range} updated successfully!` 
      })
    } else {
      throw new Error(result.error || 'Update failed')
    }
    
  } catch (error) {
    console.error('Error updating sheet:', error)
    return NextResponse.json(
      { error: 'Failed to update sheet', message: error.message },
      { status: 500 }
    )
  }
}

// Helper function to map headers to field names
// Replace your mapHeaderToFieldName function in route.js with this:
function mapHeaderToFieldName(header) {
  // Normalize the header by trimming whitespace
  const normalizedHeader = header.trim()
  
  const headerMap = {
    'Property Name': 'propertyName',
    'Category': 'category',
    'Sub Category': 'subCategory',
    'Floor': 'floor',
    'Location': 'location',
    'Item Description': 'itemDescription',
    'Size/Type': 'sizeType',
    'Hardware Type': 'hardwareType',
    'Quantity': 'quantity',
    ' Quantity': 'quantity', // Handle the space issue
    'Link': 'link',
    'Vendor': 'vendor',
    'Allowance per item': 'allowancePerItem',
    'Total Allowance': 'totalBudgetWithTax', // This is the key fix!
    'Notes': 'notes',
    'Quantity to be Ordered': 'quantityToBeOrdered',
    'Price Per Item': 'pricePerItem',
    'Total Purchase Price': 'totalPriceWithTax', // Updated to match your actual header
    'Difference From Allowance': 'differenceFromAllowance',
    ' Difference From Allowance ': 'differenceFromAllowance', // Handle spaces
    "Shriji's Share": 'shrijiShare',
    "Client's Share": 'clientShare',
    'Shriji Questions/Comments': 'shrijiComments',
    "Client's Approval": 'approval',
    'Ordered? (Y/N)': 'ordered',
    'Order ID': 'orderId',
    'Order Date': 'orderDate',
    'Priority': 'priority',
    'Allowance Collection': 'allowanceCollection'
  }
  
  // Try exact match first
  if (headerMap[normalizedHeader]) {
    return headerMap[normalizedHeader]
  }
  
  // Try case-insensitive match
  const lowerHeader = normalizedHeader.toLowerCase()
  for (const [key, value] of Object.entries(headerMap)) {
    if (key.toLowerCase() === lowerHeader) {
      return value
    }
  }
  
  // Debug: log what we couldn't find
  
  // Fallback to generic transformation
  const fallback = normalizedHeader.toLowerCase().replace(/[^a-z0-9]/g, '')
  return fallback
}