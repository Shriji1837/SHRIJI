import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Google Sheets configuration (from your page.js)
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
    const SHEET_NAME = 'Detailed breakdown';
    const SHEET_RANGE = 'A1:Z5000';
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

    // Fetch from Google Sheets API
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${SHEET_RANGE}?key=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      throw new Error('No data found in sheet');
    }
    
    // Transform data (same logic as your fetchSheetData)
    const transformedData = data.values.slice(1).map((row, index) => {
      return {
        id: index + 1,
        rowIndex: index + 2,
        propertyName: row[0] || '',
        category: row[1] || '',
        floor: row[3] || '',
        location: row[4] || '',
        itemDescription: row[5] || '',
        sizeType: row[6] || '',
        hardwareType: row[7] || '',
        quantity: row[8] || 0,
        link: row[9] || '',
        vendor: row[10] || '',
        allowancePerItem: row[11] || '',
        totalBudgetWithTax: row[12] || '',
        notes: row[13] || '',
        qualityToBeOrdered: row[14] || 0,
        pricePerItem: row[15] || '',
        totalPriceWithTax: row[16] || '',
        differenceFromAllowance: row[17] || '',
        shrijiShare: row[18] || '',
        clientShare: row[19] || '',
        shrijiComments: row[20] || '',
        ordered: row[21] || '',
        orderId: row[22] || '',
        orderDate: row[23] || '',
        priority: row[24] || '',
        approval: row[25] || ''
      };
    }).filter(item => item.propertyName);

    return NextResponse.json({ 
      success: true, 
      data: transformedData,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sheet data', 
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rowIndex, columnLetter, newValue } = await request.json()
    
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

    const range = `${columnLetter}${rowIndex}`;
    
    const payload = {
      sheetId: SHEET_ID,
      range: range,
      value: newValue
    };
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.text();
      
      try {
        const jsonResult = JSON.parse(result);
        if (jsonResult.success) {
          return NextResponse.json({ 
            success: true, 
            message: `Cell ${range} updated successfully` 
          })
        } else {
          throw new Error(jsonResult.error || 'Update failed');
        }
      } catch (parseError) {
        return NextResponse.json({ 
          success: true, 
          message: `Cell ${range} updated` 
        })
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('Error updating sheet:', error);
    return NextResponse.json({ 
      error: 'Failed to update cell', 
      message: error.message 
    }, { status: 500 })
  }
}