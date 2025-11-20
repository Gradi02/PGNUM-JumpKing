export class InputHandler {
    static keysPressed = {
        w: false,
        s: false,
        a: false,
        d: false
    };

    static _horizontal = 0;
    static _vertical = 0;
    static _smoothFactor = 1000;

    static getHorizontalRaw() {
        return (InputHandler.keysPressed.d ? 1 : 0) - (InputHandler.keysPressed.a ? 1 : 0);
    }

    static getVerticalRaw() {
        return (InputHandler.keysPressed.s ? 1 : 0) - (InputHandler.keysPressed.w ? 1 : 0);
    }
}

window.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
            InputHandler.keysPressed.w = true;
            break;
        case 's':
            InputHandler.keysPressed.s = true;
            break;
        case 'a':
            InputHandler.keysPressed.a = true;
            break;
        case 'd':
            InputHandler.keysPressed.d = true;
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
            InputHandler.keysPressed.w = false;
            break;
        case 's':
            InputHandler.keysPressed.s = false;
            break;
        case 'a':
            InputHandler.keysPressed.a = false;
            break;
        case 'd':
            InputHandler.keysPressed.d = false;
            break;
    }
});