// app/api/investor-properties/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/auth.js'

const SHEET_ID = '1es81QpMRqqrc0dmmJ0o5gVLdBlxVvXaCh_OstV5eIo8'
const SHEET_NAME = 'Client & Investor List' 
const INVESTOR_RANGE = 'I3:N500' // Range containing investor data
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Only investors need property filtering
    if (session.user.role !== 'investor') {
      return NextResponse.json({ 
        properties: [], // Admins see all properties (handled elsewhere)
        isAdmin: true 
      })
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${INVESTOR_RANGE}?key=${API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch investor data')
    }
    
    const rows = data.values || []
    const investorProperties = []
    
    console.log(`🔍 Checking ${rows.length} rows for investor: ${session.user.username}`)
    
    // Check each row for the investor's username
    rows.forEach((row, index) => {
      const actualRowIndex = index + 3 // Since we start from row 3
      
      // Column N (index 5 in our I3:N500 range) contains investor names
      // Column M (index 4 in our I3:N500 range) contains property names
      const investorName = row[5] // Column N
      const propertyName = row[4] // Column M
      
      if (investorName && propertyName) {
        // Check if this investor name matches the current user
        if (investorName.toLowerCase().includes(session.user.username.toLowerCase()) ||
            session.user.username.toLowerCase().includes(investorName.toLowerCase())) {
          
          investorProperties.push({
            propertyName: propertyName.trim(),
            investorName: investorName.trim(),
            rowIndex: actualRowIndex
          })
          
          console.log(`✅ Found property for investor: ${propertyName} (Row ${actualRowIndex})`)
        }
      }
    })
    
    // Get unique property names
    const uniqueProperties = [...new Set(investorProperties.map(p => p.propertyName))]
    
    console.log(`🎯 Investor ${session.user.username} has access to properties:`, uniqueProperties)
    
    return NextResponse.json({ 
      properties: uniqueProperties,
      investorProperties: investorProperties, // Full details for debugging
      isAdmin: false
    })
    
  } catch (error) {
    console.error('Error fetching investor properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch investor properties', message: error.message },
      { status: 500 }
    )
  }
}