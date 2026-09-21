#!/usr/bin/env bash
# Redis dan Next.js khusus tes; tidak memakai database atau server developer.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node --experimental-strip-types tests/redis/integration.test.mjs "$@"
