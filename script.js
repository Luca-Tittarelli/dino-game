const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    backgroundColor: '#02BAF6',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1500 },
            debug: false,
        },
    },
    scene: {
        preload,
        create,
        update,
    },
};

const game = new Phaser.Game(config);

let speed = 4;
let score = 0;
let isGameOver = false

function preload() {
    this.load.image('sand', './assets/textures/sand.jpg');
    this.load.image('obstacle', './assets/textures/obstacle.png')
    this.load.image('obstacle-2', './assets/textures/obstacle-2.png')
    this.load.image('sun', './assets/textures/sun.png')
    this.load.spritesheet(
        'dino', 
        './assets/entities/dino.png',
        { frameWidth: 100, frameHeight: 100 }
    );
}

function create() {
    // Crear el suelo usando un TileSprite
    this.floor = this.add.tileSprite(config.width / 2, config.height - 64, config.width, 128, 'sand');
    this.add.image(config.width - 10, 10, 'sun')
        .setOrigin(1, 0)
        .setScale(.6)
    
    // Añadimos el dinosaurio
    this.dino = this.physics.add.sprite(10, 100, 'dino')
        .setOrigin(0, 0)
        .setScale(0.8);
    
    this.physics.add.existing(this.floor, true);

    // Colisiones
    this.physics.add.collider(this.dino, this.floor);

    // Grupo de obstáculos
    this.obstacles = this.physics.add.group();

    // Generar obstáculos periódicamente
    this.time.addEvent({
        delay: 500,
        callback: addObstacle,
        callbackScope: this,
        loop: true,
    });

    // Animaciones
    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('dino', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
    });

    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('dino', { start: 8, end: 19 }),
        frameRate: 15,
    });
    this.anims.create({
        key: 'die',
        frames: this.anims.generateFrameNumbers('dino', {start: 20, end: 25}),
        frameRate: 10
    })
    this.dino.play('run');

    // Controles
    this.keys = this.input.keyboard.createCursorKeys();

    // Colisión entre dino y obstáculos
    this.physics.add.overlap(this.dino, this.obstacles, hitObstacle, null, this);
        // Texto del puntaje
    this.scoreText = this.add.text(10, 10, `Score: ${score}`, {
        font: '24px Arial',
        fill: '#000',
    });

    // Evento para incrementar el puntaje periódicamente
    this.time.addEvent({
        delay: 100, // Incrementar cada 100ms
        callback: () => {
            this.scoreText.setText(`Score: ${score}`);
        },
        loop: true,
    });
}

function update() {
    if(isGameOver) return
    // Si el dino presiona la tecla de salto y está tocando el suelo
    if (this.keys.up.isDown && this.dino.body.touching.down) {
        this.dino.setVelocityY(-700);  // Salto
        this.dino.play('jump', true);  // Cambiar a animación de salto
    }
    else if(this.keys.down.isDown && !this.dino.body.touching.down){
        this.dino.setVelocityY(500)
    }
    // Cambiar a animación de correr cuando toque el suelo
    else if (this.dino.body.touching.down && this.dino.anims.currentAnim.key !== 'run') {
        this.dino.play('run', true);
    }

    // Mover el suelo
    this.floor.tilePositionX += speed;
    
    if(isGameOver == false){
        score++
        speed += 0.005
    }

    // Mover obstáculos y eliminarlos cuando salgan de la pantalla
    this.obstacles.getChildren().forEach(obstacle => {
        obstacle.x -= speed;
        if (obstacle.x < -obstacle.width) {
            obstacle.destroy();  // Elimina obstáculos fuera de pantalla
        }
    });
}

let lastGenerated = 0;  // Guardará el tiempo de la última generación
const obstacleDelay = 1000;  // Tiempo mínimo entre obstáculos (en milisegundos)

function addObstacle() {
    const currentTime = this.time.now;  // Obtiene el tiempo actual del juego
    let random = Math.floor(Math.random() * 10)
    let canGenerate = true
    console.log(random)
    if(random > 3 && random < 7 && currentTime - lastGenerated > obstacleDelay) {
        lastGenerated = currentTime;  // Actualiza el tiempo de la última generación
        let randomObstacle = random == 5 ? 'obstacle-2' : 'obstacle'
        setTimeout(()=> canGenerate = true, 1)
        const obstacle = this.obstacles.create(config.width, config.height - 120, randomObstacle);
        obstacle
            .setOrigin(0, 1)
            .setScale(.13);
        obstacle.body.allowGravity = false;
    }
}

function hitObstacle() {
    if (isGameOver) return
    gameOver.call(this); // Llama a la función gameOver
}


function gameOver() {
    isGameOver = true;
    // Establecer velocidad hacia adelante y hacia arriba para simular el salto
    this.dino.setVelocityX(300); // Avance hacia adelante
    this.dino.setVelocityY(-250); // Salto hacia arriba (ajusta el valor según la altura deseada)
    this.dino.play('die'); // Animación de "morir"
    this.physics.world.removeCollider(this.dinoCollider);
    
    // Detener el movimiento después de completar el salto y avance
    this.time.delayedCall(500, () => {
        this.dino.setVelocityX(0); // Detener el avance
        this.dino.once('animationcomplete', ()=>{
            this.physics.pause()
        })
        
        const gameOverText = this.add.text(config.width / 2, config.height / 2 - 50, 'Perdiste!', {
            font: '48px Arial',
            fill: '#ff0000',
        }).setOrigin(0.5);
    
        const scoreText = this.add.text(config.width / 2, config.height / 2, `Puntaje: ${score}`, {
            font: '24px Arial',
            fill: '#000000',
        }).setOrigin(0.5);
    
        const restartText = this.add.text(config.width / 2, config.height / 2 + 50, 'Click para volver a jugar', {
            font: '24px Arial',
            fill: '#000',
        }).setOrigin(0.5);
    });

    // Mostrar texto de "Game Over"

    // Hacer clic para reiniciar el juego
    this.input.once('pointerdown', () => {
        this.scene.restart(); // Reiniciar escena
        isGameOver = false;
        speed = 4;            // Reiniciar velocidad
        score = 0;            // Reiniciar puntaje
    });
}
