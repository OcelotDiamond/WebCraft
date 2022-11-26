import "./gl-matrix-min.js";
const { mat2, mat2d, mat4, mat3, quat, quat2, vec2, vec3, vec4 } = glMatrix;

function resizeWindow() {
    canvas.height = document.documentElement.clientHeight
    canvas.width = document.documentElement.clientWidth
    mat4.perspective(projectionMatrix, 75*Math.PI/180, canvas.width/canvas.height, 1e-4, 1e4);
}

function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
}

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

window.onresize = resizeWindow

// Check if webGL initialized properly
if (!gl) {
    throw new Error('Webgl is not supported');
    //alert('Unable to initialize WebGL.\nYour browser may not support it.');
}

gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexData = [
    // Front
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, -.5, 0.5,
    // Left
    -.5, 0.5, 0.5,
    -.5, -.5, 0.5,
    -.5, 0.5, -.5,
    -.5, 0.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, -.5,
    // Back
    -.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, 0.5, -.5,
    0.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, -.5, -.5,
    // Right
    0.5, 0.5, -.5,
    0.5, -.5, -.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    0.5, -.5, -.5,
    // Top
    0.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, -.5,
    // Bottom
    0.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, -.5,
];

let tempColorData = [];

for (let face = 0; face < 6; face++) {
    let faceColor = randomColor();
    for (let vertex = 0; vertex < 6; vertex++) {
        tempColorData.push(...faceColor);
    }
}

const colorData = tempColorData;

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;
attribute vec3 position;
attribute vec3 color;
varying vec3 vColor;
uniform mat4 matrix;
void main() {
    vColor = color;
    gl_Position = matrix * vec4(position, 1);
}
`);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
precision mediump float;
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(vColor, 1);
}
`);
gl.compileShader(fragmentShader);

// Attach shaders to program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// Get location of attribute
const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const colorLocation = gl.getAttribLocation(program, `color`);
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

const uniformLocations = {
    matrix: gl.getUniformLocation(program, 'matrix'),
};

const matrix = mat4.create();
const projectionMatrix = mat4.create();

mat4.translate(matrix, matrix, [0, 0, -2]);

mat4.perspective(projectionMatrix, 70*Math.PI/180, canvas.width/canvas.height, 1.75, 1e4);

mat4.scale(matrix, matrix, [0.5, 0.5, 0.5]);

const finalMatrix = mat4.create();

function loadFrame() {
    requestAnimationFrame(loadFrame)
    mat4.rotateX(matrix, matrix, Math.PI/2**8);
    mat4.rotateY(matrix, matrix, Math.PI/2**9);
    mat4.rotateZ(matrix, matrix, Math.PI/2**10);
    mat4.multiply(finalMatrix, projectionMatrix, matrix);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length/3);
}

loadFrame();