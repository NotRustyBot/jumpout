#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;
uniform vec4 uViewport;
uniform vec4 inputSize;
out vec2 vTextureCoord;

void main(void) {
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.f)).xy, 0.f, 1.f);

    vTextureCoord = aTextureCoord;
}