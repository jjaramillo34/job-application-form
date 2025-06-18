import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchName = searchParams.get('searchName') || '';
    const searchCounselorEmail = searchParams.get('searchCounselorEmail') || '';
    const filterPayment = searchParams.get('filterPayment') || 'all';
    const filterStatus = searchParams.get('filterStatus') || 'all';
    const filterDateFrom = searchParams.get('filterDateFrom') || '';
    const filterDateTo = searchParams.get('filterDateTo') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Build query
    const query: any = {};
    
    if (searchName) {
      query.$or = [
        { firstName: { $regex: searchName, $options: 'i' } },
        { lastName: { $regex: searchName, $options: 'i' } }
      ];
    }

    if (searchCounselorEmail) {
      query.counselor_email = { $regex: searchCounselorEmail, $options: 'i' };
    }

    if (filterPayment !== 'all') {
      query.fingerprintPaymentPreference = filterPayment;
    }

    if (filterStatus !== 'all') {
      query.status = filterStatus;
    }

    if (filterDateFrom || filterDateTo) {
      query.submittedAt = {};
      if (filterDateFrom) {
        query.submittedAt.$gte = new Date(filterDateFrom);
      }
      if (filterDateTo) {
        query.submittedAt.$lte = new Date(filterDateTo);
      }
    }

    // Build sort
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const total = await collection.countDocuments(query);
    const applications = await collection
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      applications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 