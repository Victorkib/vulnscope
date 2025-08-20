import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    // Try to find by CVE ID first, then by MongoDB ObjectId
    let vulnerability = await collection.findOne({ cveId: id });

    if (!vulnerability && ObjectId.isValid(id)) {
      vulnerability = await collection.findOne({ _id: new ObjectId(id) });
    }

    if (!vulnerability) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vulnerability);
  } catch (error) {
    console.error('Error fetching vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability' },
      { status: 500 }
    );
  }
}
