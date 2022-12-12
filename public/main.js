const { mat2, mat2d, mat4, mat3, quat, quat2, vec2, vec3, vec4 } = glMatrix;

function resizeWindow() {
    canvas.height = document.documentElement.clientHeight
    canvas.width = document.documentElement.clientWidth
}

function mouseLockChange() {
    if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas) {
        document.addEventListener("mousemove", updateCamera, false);
    } else {
        document.removeEventListener("mousemove", updateCamera, false);
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

function drawCubeUv() {
    const uv = repeat(6, [
        1, 1,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        0, 0 
    ]);

    return uv;
}

function getTexture(url) {
    const texture = gl.createTexture();
    const image = new Image();

    image.onload = e => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        gl.generateMipmap(gl.TEXTURE_2D);
    };

    image.crossOrigin = "anonymous";
    image.src = url;
    return texture;
}

function repeat(n, pattern) {
    return [...Array(n)].reduce(sum => sum.concat(pattern), []);
}

function base3(number) {
    if (number < 3 && number > -1) {
        return number;
    }
    return number - Math.floor(number/3)*3
}

function isEven(n) {
    return !(n%2);
}

function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
}

function keyDownHandler(event) {
    activeKeys[event.key.toLowerCase()] = true;
}

function keyUpHandler(event) {
    activeKeys[event.key.toLowerCase()] = false;
}

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2', {antialias: true});
const activeKeys = {};

window.onresize = resizeWindow

document.addEventListener('pointerlockchange', mouseLockChange, false);
document.addEventListener('mozpointerlockchange', mouseLockChange, false);
document.addEventListener('webkitpointerlockchange', mouseLockChange, false);

document.addEventListener('keyup', keyUpHandler, false);
document.addEventListener('keydown', keyDownHandler, false);

if (!gl) {
    throw new Error('Webgl is not supported');
    //alert('Unable to initialize WebGL.\nYour browser may not support it.');
}

gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

let vertexData = [];

let uvData = [];

const gridSize = 5;

for (let i = -1*Math.floor(gridSize/2); i < Math.ceil(gridSize/2); i++) {
    for (let j = -1*Math.floor(gridSize/2); j < Math.ceil(gridSize/2); j++) {
        for (let k = -1*Math.floor(gridSize/2); k < Math.ceil(gridSize/2); k++) {
            if (i!=0||j!=0||k!=0) {
                vertexData.push(...drawCube(i*2,j*2,k*2));
                uvData.push(...drawCubeUv());
            }
        }
    }
}

const dirt = getTexture(`assets/dirt.png`);

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, dirt);

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

const uvBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.STATIC_DRAW);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUV;
uniform mat4 matrix;
void main() {
    vUV = uv;
    gl_Position = matrix * vec4(position, 1);
}
`);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
precision mediump float;
varying vec2 vUV;
uniform sampler2D textureID;
void main() {
    gl_FragColor = texture2D(textureID, vUV);
}
`);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const uvLocation = gl.getAttribLocation(program, `uv`);
gl.enableVertexAttribArray(uvLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

const uniformLocations = {
    modelMatrix: gl.getUniformLocation(program, 'matrix'),
    textureID: gl.getUniformLocation(program, 'textureID')
};

gl.uniform1i(uniformLocations.textureID, 0);

const modelMatrix = mat4.create();
const originViewMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);
mat4.translate(originViewMatrix, originViewMatrix, [0, 0, 0]);
mat4.invert(viewMatrix, viewMatrix);

mat4.perspective(projectionMatrix, 70*Math.PI/180, canvas.width/canvas.height, 1e-4, 1e4);

const mvMatrix = mat4.create();
const vpMatrix = mat4.create();
const mvpMatrix = mat4.create();

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

canvas.onclick = function() {
    canvas.requestPointerLock();
};

let camera_rot = [0, 0];
let player_pos = [0, 0, 0];

const to_radian = Math.PI/180;
const quarter_circle = 90*to_radian;
const half_circle = Math.PI;
const senseitivity = 0.00390625;
const speed = 1.5625e-1;

function updateCamera(e) {
    const x_rot = camera_rot[0] + e.movementX*senseitivity;
    if (x_rot >= half_circle) {
        camera_rot[0] = -half_circle + (x_rot % half_circle);
    }
    else if (x_rot < -half_circle) {
        camera_rot[0] = half_circle + (x_rot % half_circle);
    }
    else {
        camera_rot[0] = x_rot;
    }
    const y_diff = camera_rot[1] + e.movementY*to_radian*senseitivity;
    if (y_diff >= -quarter_circle && y_diff <= quarter_circle) {
        camera_rot[1] += e.movementY*senseitivity;
    }
    else if (y_diff < -quarter_circle) {
        camera_rot[1] = -quarter_circle;
    }
    else if (y_diff > quarter_circle) {
        camera_rot[1] = quarter_circle;
    }
    else {
        throw new Error('Invalid rotation');
    }

    mat4.rotateX(viewMatrix, originViewMatrix, camera_rot[1]);
    mat4.rotateY(viewMatrix, viewMatrix, camera_rot[0]);
}

function updatePos() {
    if (!!activeKeys['w']) {
        player_pos[0]-=Math.sin(camera_rot[0])*speed;
        player_pos[2]+=Math.cos(camera_rot[0])*speed;
    }
    if (!!activeKeys['s']) {
        player_pos[0]+=Math.sin(camera_rot[0])*speed;
        player_pos[2]-=Math.cos(camera_rot[0])*speed;
    }
    if (!!activeKeys['a']) {
        player_pos[0]-=Math.sin(camera_rot[0]-quarter_circle)*speed;
        player_pos[2]+=Math.cos(camera_rot[0]-quarter_circle)*speed;
    }
    if (!!activeKeys['d']) {
        player_pos[0]+=Math.sin(camera_rot[0]-quarter_circle)*speed;
        player_pos[2]-=Math.cos(camera_rot[0]-quarter_circle)*speed;
    }
    if (!!activeKeys[' ']) {
        player_pos[1]-=speed;
    }
    if (!!activeKeys['shift']) {
        player_pos[1]+=speed;
    }
    mat4.translate(vpMatrix, viewMatrix, player_pos);
}

function loadFrame() {
    requestAnimationFrame(loadFrame)
    updatePos()
    mat4.multiply(mvMatrix, vpMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.modelMatrix, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length/3);
}

loadFrame();
