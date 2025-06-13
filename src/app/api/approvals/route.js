// app/api/approvals/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/auth.js'
import { prisma } from '@/lib/prisma.js'

// GET - Fetch approval requests (for admin) or notifications (for investor)
export async function GET(request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'requests' or 'notifications'

  try {
    if (type === 'requests' && session.user.role === 'admin') {
      // Admin fetching approval requests
      const approvalRequests = await prisma.approvalRequest.findMany({
        where: { status: 'pending' },
        include: {
          changes: true,
          user: {
            select: { id: true, username: true, email: true }
          }
        },
        orderBy: { submittedAt: 'desc' }
      })

      return NextResponse.json({ approvalRequests })

    } else if (type === 'notifications') {
      // Investor fetching notifications
      const notifications = await prisma.investorNotification.findMany({
        where: { 
          userId: session.user.id,
          read: false 
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ notifications })

    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', message: error.message },
      { status: 500 }
    )
  }
}

// POST - Submit approval request or approve/reject request
export async function POST(request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, changes, requestId, decision } = body

    if (action === 'submit') {
      // Investor submitting changes for approval
      if (!changes || changes.length === 0) {
        return NextResponse.json({ error: 'No changes to submit' }, { status: 400 })
      }

      // Create approval request with changes
      const approvalRequest = await prisma.approvalRequest.create({
        data: {
          userId: session.user.id,
          userName: session.user.username || session.user.email,
          changes: {
            create: changes.map(change => ({
              itemId: change.itemId,
              fieldName: change.fieldName,
              oldValue: change.oldValue || '',
              newValue: change.newValue
            }))
          }
        },
        include: { changes: true }
      })

      return NextResponse.json({ 
        success: true, 
        message: `Submitted ${changes.length} changes for approval`,
        approvalRequest 
      })

    } else if (action === 'approve' && session.user.role === 'admin') {
      // Admin approving request
      const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: { changes: true, user: true }
      })

      if (!approvalRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }

      // Update request status
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'approved' }
      })

      // Create notification for investor
      await prisma.investorNotification.create({
        data: {
          userId: approvalRequest.userId,
          message: `Your ${approvalRequest.changes.length} changes have been approved and applied!`,
          type: 'approved'
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: `Approved ${approvalRequest.changes.length} changes`,
        approvalRequest 
      })

    } else if (action === 'reject' && session.user.role === 'admin') {
      // Admin rejecting request
      const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: { changes: true, user: true }
      })

      if (!approvalRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }

      // Update request status
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' }
      })

      // Create notification for investor
      await prisma.investorNotification.create({
        data: {
          userId: approvalRequest.userId,
          message: `Your ${approvalRequest.changes.length} changes have been rejected.`,
          type: 'rejected'
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: `Rejected ${approvalRequest.changes.length} changes`,
        approvalRequest 
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process request', message: error.message },
      { status: 500 }
    )
  }
}

// PUT - Mark notification as read
export async function PUT(request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { notificationId } = body

    await prisma.investorNotification.update({
      where: { 
        id: notificationId,
        userId: session.user.id // Ensure user can only mark their own notifications
      },
      data: { read: true }
    })

    return NextResponse.json({ success: true, message: 'Notification marked as read' })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read', message: error.message },
      { status: 500 }
    )
  }
}