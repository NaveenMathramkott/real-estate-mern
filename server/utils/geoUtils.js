// Geometry guards for GeoJSON boundaries. MongoDB rejects a 2dsphere polygon
// whose ring self-intersects, so the same checks run up front to return an
// actionable 400 instead of an opaque driver error.

// Shortest distance below which two edges count as touching at a shared
// vertex. Guards against float noise making adjacent edges look like a cross.
const EPSILON = 1e-9;

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const samePoint = (a, b) =>
  Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;

const onSegment = (a, b, p) => {
  const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  if (Math.abs(cross) > EPSILON) return false;

  const within = (v, lo, hi) =>
    v >= Math.min(lo, hi) - EPSILON && v <= Math.max(lo, hi) + EPSILON;
  return within(p[0], a[0], b[0]) && within(p[1], a[1], b[1]);
};

// Proper intersection of segments a1a2 and b1b2, excluding shared endpoints.
const segmentsProperlyCross = (a1, a2, b1, b2) => {
  const d = (p, q, r) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);

  const d1 = d(a1, a2, b1);
  const d2 = d(a1, a2, b2);
  const d3 = d(b1, b2, a1);
  const d4 = d(b1, b2, a2);

  if (
    ((d1 > EPSILON && d2 < -EPSILON) || (d1 < -EPSILON && d2 > EPSILON)) &&
    ((d3 > EPSILON && d4 < -EPSILON) || (d3 < -EPSILON && d4 > EPSILON))
  ) {
    return true;
  }

  // Collinear overlap counts too — it still produces an invalid ring.
  return (
    onSegment(a1, a2, b1) ||
    onSegment(a1, a2, b2) ||
    onSegment(b1, b2, a1) ||
    onSegment(b1, b2, a2)
  );
};

const findSelfIntersection = (ring) => {
  const edges = ring.slice(0, -1).map((point, i) => [i, point, ring[i + 1]]);

  for (let i = 0; i < edges.length; i += 1) {
    const [a, a1, a2] = edges[i];

    for (let j = i + 1; j < edges.length; j += 1) {
      const [b, b1, b2] = edges[j];

      // Adjacent edges legitimately touch at their shared vertex.
      if (b === a + 1 || (a === 0 && b === edges.length - 1)) continue;

      if (segmentsProperlyCross(a1, a2, b1, b2)) {
        return {
          edgeA: a,
          edgeB: b,
          pointA: a1,
          pointB: a2,
          pointC: b1,
          pointD: b2,
        };
      }
    }
  }

  return null;
};

// Signed area via the shoelace formula. Zero means the ring has no interior,
// which MongoDB also treats as an invalid polygon.
const signedArea = (ring) => {
  let total = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    total += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return total / 2;
};

/**
 * Validates a GeoJSON Polygon body.
 * @returns {{ ok: true, value: { type: string, coordinates: number[][][] } }
 *          | { ok: false, message: string }}
 */
export const validatePolygon = (boundary) => {
  if (!boundary || typeof boundary !== "object" || Array.isArray(boundary)) {
    return { ok: false, message: "boundary must be a GeoJSON Polygon object" };
  }

  if (boundary.type !== "Polygon") {
    return { ok: false, message: 'boundary.type must be "Polygon"' };
  }

  const { coordinates } = boundary;
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return {
      ok: false,
      message: "boundary.coordinates must be a non-empty array of rings",
    };
  }

  for (const [ringIndex, ring] of coordinates.entries()) {
    const label = ringIndex === 0 ? "boundary" : `boundary hole #${ringIndex}`;

    if (!Array.isArray(ring) || ring.length < 4) {
      return {
        ok: false,
        message: `${label} needs at least 4 points (a closed ring)`,
      };
    }

    for (const point of ring) {
      if (
        !Array.isArray(point) ||
        point.length < 2 ||
        !point.every(isFiniteNumber)
      ) {
        return {
          ok: false,
          message: `${label} contains an invalid point — expected [longitude, latitude] numbers`,
        };
      }

      const [lng, lat] = point;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return {
          ok: false,
          message: `${label} has a point outside the valid range — received [${lng}, ${lat}]; longitude must be -180..180 and latitude -90..90`,
        };
      }
    }

    if (!samePoint(ring[0], ring[ring.length - 1])) {
      return {
        ok: false,
        message: `${label} is not closed — the first point [${ring[0]}] must repeat as the last point`,
      };
    }

    if (Math.abs(signedArea(ring)) < EPSILON) {
      return {
        ok: false,
        message: `${label} encloses zero area — the points are collinear or overlapping`,
      };
    }

    const crossing = findSelfIntersection(ring);
    if (crossing) {
      return {
        ok: false,
        message: `${label} is self-intersecting — edge ${crossing.edgeA} [${crossing.pointA} -> ${crossing.pointB}] crosses edge ${crossing.edgeB} [${crossing.pointC} -> ${crossing.pointD}]. Remove or reorder points so the outline does not cross itself.`,
      };
    }
  }

  return { ok: true, value: { type: "Polygon", coordinates } };
};
