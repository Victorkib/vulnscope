import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
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

    // First get the current vulnerability to find related ones
    const currentVuln = await collection.findOne({ cveId: id });
    if (!currentVuln) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }

    // Find related vulnerabilities based on multiple criteria with scoring
    const pipeline = [
      {
        $match: {
          cveId: { $ne: id }, // Exclude current vulnerability
        },
      },
      {
        $addFields: {
          relationshipScore: {
            $add: [
              // Score for same affected software
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $setIntersection: [
                            '$affectedSoftware',
                            currentVuln.affectedSoftware || [],
                          ],
                        },
                      },
                      0,
                    ],
                  },
                  3,
                  0,
                ],
              },
              // Score for same severity
              {
                $cond: [{ $eq: ['$severity', currentVuln.severity] }, 2, 0],
              },
              // Score for same CWE
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$cweId', null] },
                      { $ne: [currentVuln.cweId, null] },
                      { $eq: ['$cweId', currentVuln.cweId] },
                    ],
                  },
                  2,
                  0,
                ],
              },
              // Score for similar CVSS score (within 1 point)
              {
                $cond: [
                  {
                    $lte: [
                      {
                        $abs: {
                          $subtract: ['$cvssScore', currentVuln.cvssScore],
                        },
                      },
                      1,
                    ],
                  },
                  1,
                  0,
                ],
              },
              // Score for same category
              {
                $cond: [{ $eq: ['$category', currentVuln.category] }, 1, 0],
              },
            ],
          },
          relationshipType: {
            $switch: {
              branches: [
                {
                  case: {
                    $gt: [
                      {
                        $size: {
                          $setIntersection: [
                            '$affectedSoftware',
                            currentVuln.affectedSoftware || [],
                          ],
                        },
                      },
                      0,
                    ],
                  },
                  then: 'SAME_SOFTWARE',
                },
                {
                  case: {
                    $and: [
                      { $ne: ['$cweId', null] },
                      { $ne: [currentVuln.cweId, null] },
                      { $eq: ['$cweId', currentVuln.cweId] },
                    ],
                  },
                  then: 'SAME_CWE',
                },
                {
                  case: { $eq: ['$severity', currentVuln.severity] },
                  then: 'SAME_SEVERITY',
                },
                {
                  case: { $eq: ['$category', currentVuln.category] },
                  then: 'SAME_CATEGORY',
                },
              ],
              default: 'SIMILAR_ATTACK',
            },
          },
          similarity: {
            $divide: [
              {
                $add: [
                  {
                    $cond: [
                      {
                        $gt: [
                          {
                            $size: {
                              $setIntersection: [
                                '$affectedSoftware',
                                currentVuln.affectedSoftware || [],
                              ],
                            },
                          },
                          0,
                        ],
                      },
                      0.4,
                      0,
                    ],
                  },
                  {
                    $cond: [
                      { $eq: ['$severity', currentVuln.severity] },
                      0.3,
                      0,
                    ],
                  },
                  {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$cweId', null] },
                          { $ne: [currentVuln.cweId, null] },
                          { $eq: ['$cweId', currentVuln.cweId] },
                        ],
                      },
                      0.2,
                      0,
                    ],
                  },
                  {
                    $cond: [
                      {
                        $lte: [
                          {
                            $abs: {
                              $subtract: ['$cvssScore', currentVuln.cvssScore],
                            },
                          },
                          1,
                        ],
                      },
                      0.1,
                      0,
                    ],
                  },
                ],
              },
              1,
            ],
          },
        },
      },
      {
        $match: {
          relationshipScore: { $gt: 0 }, // Only include vulnerabilities with some relationship
        },
      },
      {
        $sort: {
          relationshipScore: -1,
          cvssScore: -1,
          publishedDate: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          cveId: 1,
          title: 1,
          severity: 1,
          cvssScore: 1,
          publishedDate: 1,
          affectedSoftware: 1,
          relationshipType: 1,
          similarity: 1,
          relationshipScore: 1,
        },
      },
    ];

    const relatedVulns = await collection.aggregate(pipeline).toArray();

    return NextResponse.json(relatedVulns);
  } catch (error) {
    console.error('Error fetching related vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related vulnerabilities' },
      { status: 500 }
    );
  }
}
