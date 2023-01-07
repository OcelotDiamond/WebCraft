class Entity {
    constructor (data) {
        this.Air = 300;
        this.CustomName = '';
        this.CustomNameVisable = false;
        this.FallDistance = 0;
        this.Fire = -20;
        this.Glowing = false;
        this.HasVisualFire = false;
        this.id = null;
        this.Invulnerable = false;
        this.Motion = [0,0,0]; // [dX, dY, dZ]
        this.NoGravity = false;
        this.OnGround = false;
        this.Passengers = [];
        this.PortalCooldown = 0;
        this.Pos = [0,0,0]; // [X, Y, Z]
        this.Rotation = [0,0]; // [Yaw, Pitch]
        this.Silent = false;
        this.Tags = {};
        this.UUID = [0,0,0,0];
        for(let i in data) {
            this[i] = data[i];
        }
    }
}