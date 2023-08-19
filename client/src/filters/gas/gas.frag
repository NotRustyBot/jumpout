#version 300 es

precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uViewport;
uniform float uScale;
uniform float uSize;
uniform float uChunkCount;

const float PI = 3.14159265358979323846264f;
out vec4 color;

float rand(float n) {
    return fract(sin(n) * 43758.5453123f);
}

float noise(float p) {
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0f), fc);
}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898f, 4.1414f))) * 43758.5453f);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0f - 2.0f * u);

    float res = mix(mix(rand(ip), rand(ip + vec2(1.0f, 0.0f)), u.x), mix(rand(ip + vec2(0.0f, 1.0f)), rand(ip + vec2(1.0f, 1.0f)), u.x), u.y);
    return res * res;
}

float mod289(float x) {
    return x - floor(x * (1.0f / 289.0f)) * 289.0f;
}
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0f / 289.0f)) * 289.0f;
}
vec4 perm(vec4 x) {
    return mod289(((x * 34.0f) + 1.0f) * x);
}

float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0f - 2.0f * d);

    vec4 b = a.xxyy + vec4(0.0f, 1.0f, 0.0f, 1.0f);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0f);

    vec4 o1 = fract(k3 * (1.0f / 41.0f));
    vec4 o2 = fract(k4 * (1.0f / 41.0f));

    vec4 o3 = o2 * d.z + o1 * (1.0f - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0f - d.x);

    return o4.y * d.y + o4.x * (1.0f - d.y);
}

void main(void) {
    vec2 coord = (vTextureCoord - 0.5f) - mod(uViewport.xy, uSize) / uViewport.zw * uScale;
    coord *= uViewport.zw / (uChunkCount * uSize);
    coord /= uScale;
    coord += 0.5f;
    float gas = texture(uSampler, coord).a;
    color = vec4(0.1, 0.8, 0.9, 0.5) * gas;
}
