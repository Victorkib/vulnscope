import { getDatabase } from "@/lib/mongodb"

const sampleUserData = {
  bookmarks: [
    {
      userId: "sample-user-id",
      vulnerabilityId: "CVE-2024-0001",
      createdAt: "2024-01-15T10:00:00Z",
    },
    {
      userId: "sample-user-id",
      vulnerabilityId: "CVE-2024-0002",
      createdAt: "2024-01-14T08:30:00Z",
    },
  ],
  activities: [
    {
      userId: "sample-user-id",
      type: "bookmark",
      description: "Bookmarked vulnerability CVE-2024-0001",
      vulnerabilityId: "CVE-2024-0001",
      timestamp: "2024-01-15T10:00:00Z",
    },
    {
      userId: "sample-user-id",
      type: "view",
      description: "Viewed vulnerability CVE-2024-0002",
      vulnerabilityId: "CVE-2024-0002",
      timestamp: "2024-01-14T08:30:00Z",
    },
    {
      userId: "sample-user-id",
      type: "search",
      description: "Searched for 'Apache HTTP Server'",
      timestamp: "2024-01-13T16:45:00Z",
    },
  ],
  savedSearches: [
    {
      userId: "sample-user-id",
      name: "Critical Apache Vulnerabilities",
      filters: {
        searchText: "Apache",
        severities: ["CRITICAL"],
        sources: ["NVD"],
      },
      createdAt: "2024-01-10T09:00:00Z",
      lastUsed: "2024-01-15T14:30:00Z",
    },
  ],
  preferences: {
    userId: "sample-user-id",
    theme: "system",
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    criticalAlerts: true,
    exportFormat: "json",
    dashboardLayout: "comfortable",
    language: "en",
    timezone: "UTC",
    updatedAt: "2024-01-15T10:00:00Z",
  },
}

export async function seedUserData() {
  try {
    const db = await getDatabase()

    // Clear existing user data
    await Promise.all([
      db.collection("user_bookmarks").deleteMany({}),
      db.collection("user_activity").deleteMany({}),
      db.collection("saved_searches").deleteMany({}),
      db.collection("user_preferences").deleteMany({}),
    ])

    // Insert sample data
    await Promise.all([
      db.collection("user_bookmarks").insertMany(sampleUserData.bookmarks),
      db.collection("user_activity").insertMany(sampleUserData.activities),
      db.collection("saved_searches").insertMany(sampleUserData.savedSearches),
      db.collection("user_preferences").insertOne(sampleUserData.preferences),
    ])

    console.log("Successfully seeded user data")
  } catch (error) {
    console.error("Error seeding user data:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedUserData()
    .then(() => {
      console.log("User data seeding completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("User data seeding failed:", error)
      process.exit(1)
    })
}
