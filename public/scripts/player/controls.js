document.addEventListener('pointerlockchange', mouseLockChange, false);
document.addEventListener('mozpointerlockchange', mouseLockChange, false);
document.addEventListener('webkitpointerlockchange', mouseLockChange, false);

function mouseLockChange() {
    if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas) {
        document.addEventListener("mousemove", updateCamera, false);
    } else {
        document.removeEventListener("mousemove", updateCamera, false);
    }
}

let camera_rot = [0, 0];
let player_pos = [0, 0, 0];

function updateCamera(e) {
    const to_radian = Math.PI/180;
    const quarter_circle = Math.PI/2;
    const half_circle = Math.PI;
    const senseitivity = 0.00390625;
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

function updatePos(speed, angle) {
    const quarter_circle = Math.PI/2;
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