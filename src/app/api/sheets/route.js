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
function mapHeaderToFieldName(header) {
  const headerMap = {
    'Property Name': 'propertyName',
    'Category': 'category',
    'Floor': 'floor',
    'Location': 'location',
    'Item Description': 'itemDescription',
    'Size/Type': 'sizeType',
    'Hardware Type': 'hardwareType',
    'Quantity': 'quantity',
    'Link': 'link',
    'Vendor': 'vendor',
    'Allowance per item': 'allowancePerItem',
    'Allowance per item (With Tax)': 'totalBudgetWithTax',
    'Notes': 'notes',
    'Quality to be ordered': 'qualityToBeOrdered',
    'Price per item (With Tax)': 'pricePerItem',
    'Total Price with Tax': 'totalPriceWithTax',
    'Difference from allowance': 'differenceFromAllowance',
    'Shriji Share': 'shrijiShare',
    'Client Share': 'clientShare',
    'Shriji Comments': 'shrijiComments',
    'Ordered?': 'ordered',
    'Order ID': 'orderId',
    'Order Date': 'orderDate',
    'Priority': 'priority',
    'Approval': 'approval'
  }
  
  return headerMap[header] || header.toLowerCase().replace(/[^a-z0-9]/g, '')
}
