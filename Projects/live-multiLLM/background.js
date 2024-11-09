let particles = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    background(255, 154, 158); // 粉色背景
    for (let particle of particles) {
        particle.update();
        particle.display();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class Particle {
    constructor() {
        this.position = createVector(random(width), random(height));
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.size = random(5, 15);
        this.color = color(random(200, 255), random(200, 255), random(200, 255), 150);
    }

    update() {
        this.position.add(this.velocity);
        if (this.position.x < 0 || this.position.x > width) this.velocity.x *= -1;
        if (this.position.y < 0 || this.position.y > height) this.velocity.y *= -1;

        // 与鼠标交互
        let mouseVector = createVector(mouseX, mouseY);
        let distance = p5.Vector.dist(this.position, mouseVector);
        if (distance < 100) {
            let force = p5.Vector.sub(this.position, mouseVector);
            force.setMag(1);
            this.velocity.add(force);
            this.velocity.limit(3);
        }
    }

    display() {
        noStroke();
        fill(this.color);
        ellipse(this.position.x, this.position.y, this.size);
    }
}