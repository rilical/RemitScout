# Sprint 3 Provider Source Map

Provider | Source Type | Endpoint/Flow | Auth Required | Notes
--- | --- | --- | --- | ---
Wise | Public API | POST /v3/quotes (unauth quote); token optional for partner fee accuracy | No | API-first, no Playwright expected in Sprint 3
Remitly | Hybrid (XHR first, web fallback) | Observe quote flow XHR; replay via HTTP; fallback Playwright | No | Treat XHR replay as web flow, stop on block
Western Union | Hybrid (XHR first, web fallback) | Observe quote flow XHR; replay via HTTP; fallback Playwright | No | Stop on block, no evasion
WorldRemit | GraphQL (XHR first, web fallback) | POST https://api.worldremit.com/graphql (createCalculation + payOutMethods); fallback Playwright | No | Stop on block, no evasion
Xe | Hybrid (XHR first, web fallback) | Observe quote flow XHR; replay via HTTP; fallback Playwright | No | Stop on block, no evasion
