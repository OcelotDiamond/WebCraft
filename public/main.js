const { mat2, mat2d, mat4, mat3, quat, quat2, vec2, vec3, vec4 } = glMatrix;

function resizeWindow() {
    canvas.height = document.documentElement.clientHeight
    canvas.width = document.documentElement.clientWidth
    mat4.perspective(projectionMatrix, 75*Math.PI/180, canvas.width/canvas.height, 1e-4, 1e4);
}

function mouseLockChange() {
    if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas) {
        document.addEventListener("mousemove", updatePosition, false);
    } else {
        document.removeEventListener("mousemove", updatePosition, false);
    }
}

function drawCube(x,y,z) {
    const squareData = [
        [0.5, 0.5, 0.5],
        [0.5, -.5, 0.5],
        [-.5, 0.5, 0.5],
        [-.5, 0.5, 0.5],
        [0.5, -.5, 0.5],
        [-.5, -.5, 0.5]
    ];

    let points = [];

    for (let i = 0; i<6; i++) {
        for (let j in squareData) {
            points.push(squareData[j][base3(0+i)]*Math.sign(i-2.5)*-1+x);
            points.push(squareData[j][base3(1+i)]*Math.sign(i-2.5)*-1+y);
            points.push(squareData[j][base3(2+i)]*Math.sign(i-2.5)*-1+z);
        }
    }

    return points;
}

function base3(number) {
    if (number < 3 && number > -1) {
        return number;
    }
    return number - Math.floor(number/3)*3
}

function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
}

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

window.onresize = resizeWindow

document.addEventListener('pointerlockchange', mouseLockChange, false);
document.addEventListener('mozpointerlockchange', mouseLockChange, false);
document.addEventListener('webkitpointerlockchange', mouseLockChange, false);

// Check if webGL initialized properly
if (!gl) {
    throw new Error('Webgl is not supported');
    //alert('Unable to initialize WebGL.\nYour browser may not support it.');
}

gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

let vertexData = [];

const gridSize = 15;

for (let i = -1*Math.floor(gridSize/2); i < Math.ceil(gridSize/2); i++) {
    for (let j = -1*Math.floor(gridSize/2); j < Math.ceil(gridSize/2); j++) {
        for (let k = -1*Math.floor(gridSize/2); k < Math.ceil(gridSize/2); k++) {
            vertexData.push(...drawCube(i*2,j*2,k*2));
        }
    }
}

let tempColorData = [];

for (let face = 0; face < vertexData.length/9; face++) {
    let faceColor = randomColor();
    for (let vertex = 0; vertex < 3; vertex++) {
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
    modelMatrix: gl.getUniformLocation(program, 'matrix'),
};

const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

mat4.translate(modelMatrix, modelMatrix, [0, 0, -2]);
mat4.translate(viewMatrix, viewMatrix, [0, 0, 3.5]);
mat4.invert(viewMatrix, viewMatrix);

mat4.perspective(projectionMatrix, 70*Math.PI/180, canvas.width/canvas.height, 1e-4, 1e4);

const mvMatrix = mat4.create()
const mvpMatrix = mat4.create();

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

canvas.onclick = function() {
    canvas.requestPointerLock();
};

function updatePosition(e) {
    mat4.rotateX(viewMatrix, viewMatrix, e.movementY/300);
    mat4.rotateY(viewMatrix, viewMatrix, e.movementX/300);
    const rotation = quat.create();
    mat4.getRotation(rotation, viewMatrix);
    console.log(rotation[0]);
}

function loadFrame() {
    requestAnimationFrame(loadFrame)
    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.modelMatrix, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length/3);
}

loadFrame();