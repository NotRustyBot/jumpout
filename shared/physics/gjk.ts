import { Vector } from "../types";
import { Collider } from "../collider";
let ORIGIN = new Vector();
export function GJK(s1: Collider, s2: Collider): Vector[] | undefined {
    last = new Vector();
    let d = s2.parent.position.diff(s1.parent.position).normalize();
    let simplex = [support(s1, s2, d)];
    d = ORIGIN.diff(simplex[0]);
    while (true) {
        let A = support(s1, s2, d);
        if (Vector.dot(A, d) < 0) {
            return undefined
        }
        simplex.push(A);
        if (handleSimplex(simplex, d)) {
            for (let index = 0; index < simplex.length; index++) {
                const element = simplex[index];
            }
            return simplex;
        }
    }
}


function getFurthestPoint(polygon: Vector[], direction: Vector): Vector {
    let max = -Infinity;
    let result = new Vector(polygon[0].x, polygon[0].y);
    polygon.forEach(vertex => {
        let len = Vector.dot(direction, vertex);
        if (len > max) {
            max = len;
            result = vertex.result();
        }
    });
    return result;
}

export function support(s1: Collider, s2: Collider, d: Vector) {
    const p1 = getFurthestPoint(s1.rotated, d).add(s1.parent.position);
    const p2 = getFurthestPoint(s2.rotated, d.result().mult(-1)).add(s2.parent.position);
    return p1.sub(p2);
}

function handleSimplex(simplex: Vector[], d: Vector) {
    if (simplex.length == 2) {
        return lineCase(simplex, d);
    }
    return triangleCase(simplex, d);
}
function lineCase(simplex: Vector[], d: Vector) {
    const B = simplex[0];
    const A = simplex[1];
    const AB = B.diff(A);
    const AO = ORIGIN.diff(A);
    const ABperp = Vector.tripleCross(AB, AO, AB);
    d.x = ABperp.x;
    d.y = ABperp.y;
    return false;
}

let last = new Vector();
function triangleCase(simplex: Vector[], d: Vector) {
    const C = simplex[0];
    const B = simplex[1];
    const A = simplex[2];
    const AB = B.diff(A);
    const AC = C.diff(A);
    const AO = ORIGIN.diff(A);
    const ABperp = Vector.tripleCross(AC, AB, AB);
    const ACperp = Vector.tripleCross(AB, AC, AC);
    if (Vector.dot(ABperp, AO) > 0) {
        simplex.splice(0, 1);
        d.x = ABperp.x;
        d.y = ABperp.y;
        return false;
    }
    if (Vector.dot(ACperp, AO) > 0) {
        simplex.splice(1, 1);
        last = ACperp.result();
        d.x = ACperp.x;
        d.y = ACperp.y;
        return false;
    }
    return true;
}

