# Staging ECS deploy note (March 3, 2026)

- Added health-server bootstrap coverage for ECS worker scripts.
- Kept Plane A workers on enableDatabaseCheck: false per shared health-server behavior.
- Updated ECS secret import handling to treat unresolved refs as complete ARNs.
