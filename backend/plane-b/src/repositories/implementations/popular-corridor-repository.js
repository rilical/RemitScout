"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopularCorridorRepository = void 0;
const db_1 = require("../../../../shared/db");
class PopularCorridorRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async clearAll() {
        await (0, db_1.query)('DELETE FROM gold.popular_corridors', [], this.pool);
    }
    async insertCorridor(input) {
        await (0, db_1.query)(`INSERT INTO gold.popular_corridors (route, count_24h, top_provider, fee_range, speed_range, best_for)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            input.route,
            input.count24h,
            input.topProvider,
            input.feeRange,
            input.speedRange,
            input.bestFor,
        ], this.pool);
    }
    async aggregatePopularCorridors(maxResults = 100) {
        const result = await (0, db_1.query)(`WITH route_searches AS (
        SELECT
          COALESCE(c.source_country, rs.from_country) || ' → ' || COALESCE(c.dest_country, rs.to_country) AS route,
          COUNT(*) AS count_24h,
          MODE() WITHIN GROUP (ORDER BY rs.best_provider_name) AS top_provider
        FROM silver.recent_searches rs
        LEFT JOIN silver.corridor c
          ON c.source_country = rs.from_country
         AND c.dest_country = rs.to_country
        WHERE rs.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY COALESCE(c.source_country, rs.from_country), COALESCE(c.dest_country, rs.to_country)
      ),
      route_quotes AS (
        SELECT
          c.source_country || ' → ' || c.dest_country AS route,
          MIN(lqp.fee_amount) AS min_fee,
          MAX(lqp.fee_amount) AS max_fee,
          MIN(lqp.delivery_time_min_minutes) AS min_delivery,
          MAX(lqp.delivery_time_max_minutes) AS max_delivery
        FROM silver.latest_quote_by_provider lqp
        JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
        WHERE lqp.status = 'ok'
          AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
        GROUP BY c.source_country, c.dest_country
      ),
      route_providers AS (
        SELECT
          c.source_country || ' → ' || c.dest_country AS route,
          MODE() WITHIN GROUP (ORDER BY p.best_for) AS best_for
        FROM silver.latest_quote_by_provider lqp
        JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
        JOIN silver.providers p ON p.id = lqp.provider_id
        WHERE lqp.status = 'ok'
          AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
        GROUP BY c.source_country, c.dest_country
      )
      SELECT
        rs.route,
        rs.count_24h,
        rs.top_provider,
        CASE
          WHEN rq.min_fee IS NOT NULL AND rq.max_fee IS NOT NULL
          THEN '$' || ROUND(rq.min_fee::numeric, 2) || ' - $' || ROUND(rq.max_fee::numeric, 2)
          ELSE NULL
        END AS fee_range,
        CASE
          WHEN rq.min_delivery IS NOT NULL AND rq.max_delivery IS NOT NULL
          THEN rq.min_delivery || ' - ' || rq.max_delivery || ' min'
          ELSE NULL
        END AS speed_range,
        rp.best_for
      FROM route_searches rs
      LEFT JOIN route_quotes rq ON rq.route = rs.route
      LEFT JOIN route_providers rp ON rp.route = rs.route
      ORDER BY rs.count_24h DESC
      LIMIT $1`, [maxResults], this.pool);
        return result.rows;
    }
}
exports.PopularCorridorRepository = PopularCorridorRepository;
