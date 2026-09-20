# Deterministic crisis classification boundary

The rule engine runs before AI calls. Explicit self-harm or suicide language,
first-person permanent-disappearance euphemisms, and imminent intent are routed
to crisis support. History entries authored by users are screened as well as
the current message. Caller-supplied assistant entries are retained only as
unverified user-role quotations, and unknown roles are rejected before a
provider call.

Only a complete, explicit denial (for example, “Aku tidak mau bunuh diri”) or
a clearly framed third-person film/news discussion is exempted from the
crisis result. Mixed, quoted, educational, or otherwise ambiguous language
continues down the conservative crisis path. A `high` distress result is not
the same as `crisis` and does not by itself stop the AI path. The
regression corpus in `tests/crisis/crisisRegression.test.mjs` records the exact
boundary examples. These rules are not a clinical assessment and require
ongoing review by qualified Indonesian-language safety experts.
