export function clamp(min: number, max: number, x: number) {
    return Math.max(min, Math.min(max, x));
}

export function rLerp (A: number, B: number, w: number){
    let CS = (1-w)*Math.cos(A) + w*Math.cos(B);
    let SN = (1-w)*Math.sin(A) + w*Math.sin(B);
    return Math.atan2(SN,CS);
}