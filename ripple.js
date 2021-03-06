function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
var removeFromArray = function (array, item) {
    for (let i = array.length; i >= 0; i--) {
        if (array[i] == item) {
            array.splice(i, 1);
        }
    }
};
function objectSome(obj, func) {
    for (var key in obj) {
        if (func(obj[key])) {
            return true;
        }
    }
    return false;
}
class DraggableComponent extends Phaser.GameObjects.Container {
    constructor(scene, x, y, children, hitShape, containsCallback, hasPermanentStroke) {
        super(scene, x, y, children);
        this.scene = scene;
        scene.add.existing(this);
        this.initInteractive(hitShape, containsCallback);
        this.children = children;
        this.hitShape = hitShape;
        this.hasPermanentStroke = hasPermanentStroke;
        this.onDragHasFired = false;
        this.firstDragEndHasFired = false;
        this.isDragging = false;
        this.children.filter(ch => ch instanceof HoverText).forEach(g => g.visible = false);
        this.children.filter(ch => ch instanceof HoverText).forEach(g => g.extraPointerOver = this.pointerOver.bind(this));
    }
    initInteractive(hitShape, containsCallback) {
        this.setInteractive(hitShape, containsCallback);
        this.scene.input.setDraggable(this);
        this.on('drag', this.onDrag);
        this.on('dragend', this.dragEnd);
        this.on("destroy", this.onDestroy);
        this.on("pointerover", this.pointerOver);
        this.on("pointerout", this.pointerOut);
    }
    onDrag(pointer, dragX, dragY) {
        this.isDragging = true;
        if (!this.onDragHasFired) {
            this.clone();
            this.onFirstDragStart();
            this.onDragHasFired = true;
        }
        if (!this.firstDragEndHasFired) {
            this.x = Math.floor((dragX - 0.5 * this.hitShape.width) / 5) * 5 + 2;
            this.y = Math.floor((dragY - 0.5 * this.hitShape.height) / 5) * 5 + 2;
        }
        else {
            this.x = Math.floor(dragX / 5) * 5 + 2;
            this.y = Math.floor(dragY / 5) * 5 + 2;
        }
        this.update();
    }
    dragEnd(pointer, dragX, dragY) {
        this.isDragging = false;
        this.firstDragEndHasFired = true;
        let extrawidth = this.hitShape.width * Math.cos(this.angle * Math.PI / 180) / 2 - this.hitShape.height * Math.sin(this.angle * Math.PI / 180) / 2;
        if (this.x + extrawidth < RippleTank.LEFT_PADDING ||
            this.x + extrawidth > RippleTank.LEFT_PADDING + RippleTank.instance.canvasElement.width) {
            console.log("destroy");
            this.destroy();
        }
        this.update();
    }
    pointerOut(pointer) {
        if (this.hasPermanentStroke) {
            this.hitShape.setStrokeStyle(1, this.BORDER_COLOUR);
        }
        else {
            this.hitShape.setStrokeStyle();
        }
        this.children.filter(ch => ch instanceof HoverText).forEach(g => g.visible = false);
    }
    pointerOver(pointer) {
        this.hitShape.setStrokeStyle(1, Phaser.Display.Color.GetColor(255, 0, 0));
        if (this.firstDragEndHasFired) {
            this.children.filter(ch => ch instanceof HoverText).forEach(g => g.visible = true);
        }
    }
    get BORDER_COLOUR() { return 0x0; }
    ;
}
DraggableComponent.ABSORBER_COLOUR = 0x888888;
DraggableComponent.OSCILLATOR_COLOUR = 0xcccccc;
DraggableComponent.REFLECTOR_COLOUR = 0xffffff;
class Glass extends DraggableComponent {
    constructor(scene, x, y) {
        let ntext = new ValueText(scene, 0, 0, "n");
        let widthText = new ValueText(scene, 0, HoverText.LINE_HEIGHT, "width");
        let heightText = new ValueText(scene, 0, 2 * HoverText.LINE_HEIGHT, "height");
        let angleText = new ValueText(scene, 0, 3 * HoverText.LINE_HEIGHT, "angle");
        let rect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, 0xffffff, 0).setStrokeStyle(1, Glass.BORDER_COLOUR);
        super(scene, x, y, [rect, ntext, widthText, heightText, angleText], rect, Phaser.Geom.Rectangle.Contains, true);
        this.scene.refractors.push(this);
        this.hitRect = rect;
        this.hitRect.width = Glass.START_WIDTH;
        this.hitRect.height = Glass.START_HEIGHT;
        this.widthText = widthText;
        this.heightText = heightText;
        this.n = Glass.START_N;
        ntext.valueSetter = function (comp) {
            var comp = comp;
            return (value) => { if (value < 1)
                value = 1; comp.n = value; comp.update(); };
        }(this);
        ntext.valueGetter = function (comp) { var comp = comp; return () => { return comp.n; }; }(this);
        angleText.valueSetter = function (comp) { var comp = comp; return (value) => { comp.angle = value; comp.update(); }; }(this);
        angleText.valueGetter = function (comp) { var comp = comp; return () => { return comp.angle; }; }(this);
        widthText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.hitRect.width = value;
                comp.hitRect.x = 0;
                comp.hitRect.y = 0;
                comp.update();
            };
        }(this);
        widthText.valueGetter = function (comp) { var comp = comp; return () => { return comp.hitRect.width; }; }(this);
        heightText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.hitRect.height = value;
                comp.hitRect.x = 0;
                comp.hitRect.y = 0;
                comp.update();
            };
        }(this);
        heightText.valueGetter = function (comp) { var comp = comp; return () => { return comp.hitRect.height; }; }(this);
    }
    clone() {
        return new Glass(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
        this.hitRect.width = Glass.ON_DRAG_WIDTH;
        this.hitRect.height = Glass.ON_DRAG_HEIGHT;
        this.widthText.updateValueText();
        this.heightText.updateValueText();
    }
    setPixels() {
        if (this.firstDragEndHasFired && !this.isDragging) {
            let x = (this.x - RippleTank.LEFT_PADDING) / RippleTank.scaleFactor;
            let y = (this.y) / RippleTank.scaleFactor;
            let width = (this.hitRect.width) / RippleTank.scaleFactor;
            let height = (this.hitRect.height) / RippleTank.scaleFactor;
            RippleTank.instance.setNrectangle(x, y, width, height, this.angle, this.n * this.n);
        }
    }
    onDestroy() { removeFromArray(Scene1.instance.refractors, this); Scene1.instance.updateRefractors(); }
    update() { Scene1.instance.updateRefractors(); }
    get BORDER_COLOUR() { return Glass.BORDER_COLOUR; }
    ;
}
Glass.BORDER_COLOUR = 0x888888;
Glass.START_WIDTH = 30;
Glass.START_HEIGHT = 60;
Glass.ON_DRAG_WIDTH = 200;
Glass.ON_DRAG_HEIGHT = 400;
Glass.START_N = 2;
class ConvexLens extends DraggableComponent {
    constructor(scene, x, y) {
        let ntext = new ValueText(scene, 0, 0, "n");
        let widthText = new ValueText(scene, 0, HoverText.LINE_HEIGHT, "width");
        let heightText = new ValueText(scene, 0, 2 * HoverText.LINE_HEIGHT, "height");
        let rightArc = new Phaser.GameObjects.Arc(scene, 0, 0, 0, 0, 0, false, 0x0, 0x0).setStrokeStyle(2, ConvexLens.BORDER_COLOUR);
        let leftArc = new Phaser.GameObjects.Arc(scene, 0, 0, 0, 0, 0, true, 0x0, 0x0).setStrokeStyle(2, ConvexLens.BORDER_COLOUR);
        let hitEllipse = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, 0xffff00, 0);
        super(scene, x, y, [hitEllipse, ntext, widthText, heightText, rightArc, leftArc], hitEllipse, Phaser.Geom.Rectangle.Contains, false);
        this.scene.refractors.push(this);
        this.widthText = widthText;
        this.heightText = heightText;
        this.hitRect = hitEllipse;
        this.leftArc = leftArc;
        this.rightArc = rightArc;
        this.setDimensions(ConvexLens.START_WIDTH, ConvexLens.START_HEIGHT);
        this.n = Glass.START_N;
        ntext.valueSetter = function (comp) {
            var comp = comp;
            return (value) => { if (value < 1)
                value = 1; comp.n = value; comp.update(); };
        }(this);
        ntext.valueGetter = function (comp) { var comp = comp; return () => { return comp.n; }; }(this);
        widthText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.setDimensions(value, comp.hitRect.height);
                comp.update();
            };
        }(this);
        widthText.valueGetter = function (comp) { var comp = comp; return () => { return comp.hitRect.width; }; }(this);
        heightText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.setDimensions(comp.hitRect.width, value);
                comp.update();
            };
        }(this);
        heightText.valueGetter = function (comp) { var comp = comp; return () => { return comp.hitRect.height; }; }(this);
    }
    setDimensions(width, height) {
        this.hitRect.width = width;
        this.hitRect.height = height;
        let radius = (height * height + width * width) / (4 * width);
        this.leftArc.x = width - radius;
        this.rightArc.x = radius;
        this.leftArc.y = height / 2;
        this.rightArc.y = height / 2;
        this.leftArc.radius = radius;
        this.rightArc.radius = radius;
        this.leftArc.startAngle = Math.asin(height / (2 * radius)) * 180 / Math.PI;
        this.leftArc.endAngle = -1 * this.leftArc.startAngle;
        this.rightArc.startAngle = 180 - 1 * this.leftArc.startAngle;
        this.rightArc.endAngle = 180 + 1 * this.leftArc.startAngle;
    }
    clone() {
        return new ConvexLens(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
        this.setDimensions(ConvexLens.ON_DRAG_WIDTH, ConvexLens.ON_DRAG_HEIGHT);
        this.widthText.updateValueText();
        this.heightText.updateValueText();
    }
    setPixels() {
        if (this.firstDragEndHasFired && !this.isDragging) {
            let x = (this.x + this.hitRect.width / 2 - RippleTank.LEFT_PADDING) / RippleTank.scaleFactor;
            let y = (this.y + this.hitRect.height / 2) / RippleTank.scaleFactor;
            let width = (this.hitRect.width) / RippleTank.scaleFactor;
            let height = (this.hitRect.height) / RippleTank.scaleFactor;
            RippleTank.instance.setConvexLens(x, y, width, height, this.n * this.n);
        }
    }
    onDestroy() { removeFromArray(Scene1.instance.refractors, this); Scene1.instance.updateRefractors(); }
    update() { Scene1.instance.updateRefractors(); }
}
ConvexLens.BORDER_COLOUR = 0x888888;
ConvexLens.START_WIDTH = 20;
ConvexLens.START_HEIGHT = 60;
ConvexLens.ON_DRAG_WIDTH = 50;
ConvexLens.ON_DRAG_HEIGHT = 300;
ConvexLens.START_N = 1.5;
class Slit extends DraggableComponent {
    constructor(scene, x, y) {
        let slitWidthText = new ValueText(scene, Slit.WIDTH, 0, "slit width");
        let fullHeight = Slit.START_TOP_HEIGHT * 2 + Slit.START_SLIT_WIDTH;
        let hitRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, DraggableComponent.ABSORBER_COLOUR, 0);
        let topRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, DraggableComponent.ABSORBER_COLOUR);
        let bottomRect = new Phaser.GameObjects.Rectangle(scene, 0, Slit.START_TOP_HEIGHT + Slit.START_SLIT_WIDTH, 0, 0, DraggableComponent.ABSORBER_COLOUR);
        super(scene, x, y, [topRect, bottomRect, hitRect, slitWidthText], hitRect, Phaser.Geom.Rectangle.Contains, false);
        this.scene.absorbers.push(this);
        this.slitWidthText = slitWidthText;
        this.hitRect = hitRect;
        this.hitRect.width = Slit.WIDTH;
        this.hitRect.height = fullHeight;
        this.topRect = topRect;
        this.topRect.width = Slit.WIDTH;
        this.topRect.height = Slit.START_TOP_HEIGHT;
        this.bottomRect = bottomRect;
        this.bottomRect.width = Slit.WIDTH;
        this.bottomRect.height = Slit.START_TOP_HEIGHT;
        this.slitWidth = Slit.START_SLIT_WIDTH;
        slitWidthText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.setSlitWidth(value);
                comp.update();
            };
        }(this);
        slitWidthText.valueGetter = function (comp) { var comp = comp; return () => { return comp.slitWidth; }; }(this);
    }
    clone() {
        return new Slit(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
        this.topRect.height = Slit.ON_DRAG_TOP_HEIGHT;
        this.bottomRect.height = Slit.ON_DRAG_TOP_HEIGHT;
        this.setSlitWidth(Slit.ON_DRAG_SLIT_WIDTH);
        this.slitWidthText.y = Slit.ON_DRAG_TOP_HEIGHT;
    }
    setSlitWidth(w) {
        console.log(w);
        this.hitRect.height = 2 * Slit.ON_DRAG_TOP_HEIGHT + w;
        this.bottomRect.y = Slit.ON_DRAG_TOP_HEIGHT + w;
        this.slitWidth = w;
        this.slitWidthText.updateValueText();
    }
    setPixels() {
        if (this.firstDragEndHasFired && !this.isDragging) {
            let x = (this.x - RippleTank.LEFT_PADDING) / RippleTank.scaleFactor + 1;
            let y0 = (this.y) / RippleTank.scaleFactor;
            let y1 = (this.y + Slit.ON_DRAG_TOP_HEIGHT) / RippleTank.scaleFactor;
            let y2 = (this.y + Slit.ON_DRAG_TOP_HEIGHT + this.slitWidth) / RippleTank.scaleFactor;
            let y3 = (this.y + 2 * Slit.ON_DRAG_TOP_HEIGHT + this.slitWidth) / RippleTank.scaleFactor;
            RippleTank.instance.setLineAbsorber(x, y0, y1);
            RippleTank.instance.setLineAbsorber(x, y2, y3);
        }
    }
    onDestroy() { removeFromArray(Scene1.instance.absorbers, this); Scene1.instance.updateAbsorbers(); }
    update() { Scene1.instance.updateAbsorbers(); }
}
Slit.WIDTH = 10;
Slit.START_TOP_HEIGHT = 27;
Slit.START_SLIT_WIDTH = 6;
Slit.ON_DRAG_SLIT_WIDTH = 25;
Slit.ON_DRAG_TOP_HEIGHT = 1000;
class DoubleSlit extends DraggableComponent {
    constructor(scene, x, y) {
        let slitWidthText = new ValueText(scene, DoubleSlit.WIDTH, 0, "slit width");
        let slitSeparationText = new ValueText(scene, DoubleSlit.WIDTH, HoverText.LINE_HEIGHT, "slit sep.");
        let fullHeight = DoubleSlit.START_TOP_HEIGHT * 2 + 2 * DoubleSlit.START_SLIT_WIDTH + DoubleSlit.START_SLIT_SEPARATION;
        let hitRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, DraggableComponent.ABSORBER_COLOUR, 0);
        let topRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, DraggableComponent.ABSORBER_COLOUR);
        let middleRect = new Phaser.GameObjects.Rectangle(scene, 0, DoubleSlit.START_TOP_HEIGHT + DoubleSlit.START_SLIT_WIDTH, 0, 0, DraggableComponent.ABSORBER_COLOUR);
        let bottomRect = new Phaser.GameObjects.Rectangle(scene, 0, DoubleSlit.START_TOP_HEIGHT + 2 * DoubleSlit.START_SLIT_WIDTH + DoubleSlit.START_SLIT_SEPARATION, 0, 0, DraggableComponent.ABSORBER_COLOUR);
        super(scene, x, y, [topRect, bottomRect, hitRect, slitWidthText, middleRect, slitSeparationText], hitRect, Phaser.Geom.Rectangle.Contains, false);
        this.scene.absorbers.push(this);
        this.slitWidthText = slitWidthText;
        this.slitSeparationText = slitSeparationText;
        this.hitRect = hitRect;
        this.hitRect.width = DoubleSlit.WIDTH;
        this.hitRect.height = fullHeight;
        this.topRect = topRect;
        this.topRect.width = DoubleSlit.WIDTH;
        this.topRect.height = DoubleSlit.START_TOP_HEIGHT;
        this.middleRect = middleRect;
        this.middleRect.width = DoubleSlit.WIDTH;
        this.middleRect.height = DoubleSlit.START_SLIT_SEPARATION;
        this.bottomRect = bottomRect;
        this.bottomRect.width = DoubleSlit.WIDTH;
        this.bottomRect.height = DoubleSlit.START_TOP_HEIGHT;
        this.slitWidth = DoubleSlit.START_SLIT_WIDTH;
        this.slitSeparation = DoubleSlit.START_SLIT_SEPARATION;
        slitWidthText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.setSlitWidth(value);
                comp.update();
            };
        }(this);
        slitWidthText.valueGetter = function (comp) { var comp = comp; return () => { return comp.slitWidth; }; }(this);
        slitSeparationText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.setSlitSeparation(value);
                comp.update();
            };
        }(this);
        slitSeparationText.valueGetter = function (comp) { var comp = comp; return () => { return comp.slitSeparation; }; }(this);
    }
    clone() {
        return new DoubleSlit(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
        this.topRect.height = DoubleSlit.ON_DRAG_TOP_HEIGHT;
        this.bottomRect.height = DoubleSlit.ON_DRAG_TOP_HEIGHT;
        this.setSlitWidth(DoubleSlit.ON_DRAG_SLIT_WIDTH);
        this.setSlitSeparation(DoubleSlit.ON_DRAG_SLIT_SEPARATION);
        this.slitWidthText.y = Math.floor(this.hitRect.height / 2);
        this.slitSeparationText.y = Math.floor(this.hitRect.height / 2) + HoverText.LINE_HEIGHT;
    }
    setSlitWidth(w) {
        console.log(w);
        this.hitRect.height = 2 * DoubleSlit.ON_DRAG_TOP_HEIGHT + w + this.slitSeparation;
        this.middleRect.y = DoubleSlit.ON_DRAG_TOP_HEIGHT + w;
        this.middleRect.height = this.slitSeparation - w;
        this.bottomRect.y = DoubleSlit.ON_DRAG_TOP_HEIGHT + w + this.slitSeparation;
        this.slitWidth = w;
        this.slitWidthText.updateValueText();
    }
    setSlitSeparation(s) {
        this.middleRect.height = s - this.slitWidth;
        this.hitRect.height = 2 * DoubleSlit.ON_DRAG_TOP_HEIGHT + this.slitWidth + s;
        this.bottomRect.y = DoubleSlit.ON_DRAG_TOP_HEIGHT + this.slitWidth + s;
        this.slitSeparation = s;
        this.slitSeparationText.updateValueText();
    }
    setPixels() {
        if (this.firstDragEndHasFired && !this.isDragging) {
            let x = (this.x - RippleTank.LEFT_PADDING) / RippleTank.scaleFactor + 1;
            let y0 = (this.y) / RippleTank.scaleFactor;
            let y1 = (this.y + this.topRect.height) / RippleTank.scaleFactor;
            let y2 = (this.y + this.middleRect.y) / RippleTank.scaleFactor;
            let y3 = (this.y + this.middleRect.y + this.middleRect.height) / RippleTank.scaleFactor;
            let y4 = (this.y + this.bottomRect.y) / RippleTank.scaleFactor;
            let y5 = (this.y + this.bottomRect.y + this.bottomRect.height) / RippleTank.scaleFactor;
            RippleTank.instance.setLineAbsorber(x, y0, y1);
            RippleTank.instance.setLineAbsorber(x, y2, y3);
            RippleTank.instance.setLineAbsorber(x, y4, y5);
        }
    }
    onDestroy() { removeFromArray(Scene1.instance.absorbers, this); Scene1.instance.updateAbsorbers(); }
    update() { Scene1.instance.updateAbsorbers(); }
}
DoubleSlit.WIDTH = 10;
DoubleSlit.START_TOP_HEIGHT = 18;
DoubleSlit.START_SLIT_WIDTH = 6;
DoubleSlit.START_SLIT_SEPARATION = 12;
DoubleSlit.ON_DRAG_SLIT_WIDTH = 15;
DoubleSlit.ON_DRAG_SLIT_SEPARATION = 60;
DoubleSlit.ON_DRAG_TOP_HEIGHT = 1000;
class Grating extends DraggableComponent {
    constructor(scene, x, y) {
        let slitWidthText = new ValueText(scene, Grating.WIDTH, 0, "slit width");
        let slitSeparationText = new ValueText(scene, Grating.WIDTH, HoverText.LINE_HEIGHT, "slit sep.");
        let hitRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, DraggableComponent.ABSORBER_COLOUR, 0);
        let rects = [];
        for (let y = 0; y < Grating.NUM_RECTANGLES; y++) {
            rects.push(new Phaser.GameObjects.Rectangle(scene, 0, y * (Grating.START_SLIT_SEPARATION + Grating.START_SLIT_WIDTH), 0, 0, DraggableComponent.ABSORBER_COLOUR));
        }
        super(scene, x, y, rects.concat([hitRect, slitWidthText, slitSeparationText]), hitRect, Phaser.Geom.Rectangle.Contains, false);
        this.scene.absorbers.push(this);
        this.slitWidthText = slitWidthText;
        this.slitSeparationText = slitSeparationText;
        this.rects = rects;
        this.rects.forEach((r) => {
            r.width = Grating.WIDTH;
            r.height = Grating.START_SLIT_SEPARATION;
            if (r.y > Grating.START_FULL_HEIGHT)
                r.visible = false;
        });
        this.hitRect = hitRect;
        this.hitRect.width = Grating.WIDTH;
        this.hitRect.height = Grating.START_FULL_HEIGHT;
        this.slitWidth = Grating.START_SLIT_WIDTH;
        this.slitSeparation = Grating.START_SLIT_SEPARATION;
        slitWidthText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.setSlitWidth(value);
                comp.update();
            };
        }(this);
        slitWidthText.valueGetter = function (comp) { var comp = comp; return () => { return comp.slitWidth; }; }(this);
        slitSeparationText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => {
                comp.setSlitSeparation(value);
                comp.update();
            };
        }(this);
        slitSeparationText.valueGetter = function (comp) { var comp = comp; return () => { return comp.slitSeparation; }; }(this);
    }
    clone() {
        return new Grating(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
        this.hitRect.height = Grating.ON_DRAG_FULL_HEIGHT;
        this.rects.forEach(r => r.visible = true);
        this.setSlitWidth(Grating.ON_DRAG_SLIT_WIDTH);
        this.setSlitSeparation(Grating.ON_DRAG_SLIT_SEPARATION);
        this.slitWidthText.y = Math.floor(0.5 * Grating.ON_DRAG_FULL_HEIGHT);
        this.slitSeparationText.y = Math.floor(0.5 * Grating.ON_DRAG_FULL_HEIGHT + HoverText.LINE_HEIGHT);
    }
    setSlitWidth(w) {
        console.log(w);
        this.slitWidth = w;
        for (let i = 0; i < Grating.NUM_RECTANGLES; i++) {
            this.rects[i].y = i * (this.slitWidth + this.slitSeparation);
        }
        this.slitWidthText.updateValueText();
    }
    setSlitSeparation(s) {
        this.slitSeparation = s;
        for (let i = 0; i < Grating.NUM_RECTANGLES; i++) {
            this.rects[i].y = i * (this.slitWidth + this.slitSeparation);
            this.rects[i].height = this.slitSeparation;
        }
        this.slitSeparationText.updateValueText();
    }
    setPixels() {
        if (this.firstDragEndHasFired && !this.isDragging) {
            let x = (this.x - RippleTank.LEFT_PADDING) / RippleTank.scaleFactor + 1;
            for (let i = 0; i < Grating.NUM_RECTANGLES; i++) {
                let y0 = (this.y + this.rects[i].y) / RippleTank.scaleFactor;
                let y1 = (this.y + this.rects[i].y + this.slitSeparation) / RippleTank.scaleFactor;
                if (y0 < RippleTank.GRID_HEIGHT && y1 > 0)
                    RippleTank.instance.setLineAbsorber(x, y0, y1);
            }
        }
    }
    onDestroy() { removeFromArray(Scene1.instance.absorbers, this); Scene1.instance.updateAbsorbers(); }
    update() { Scene1.instance.updateAbsorbers(); }
}
Grating.WIDTH = 10;
Grating.START_SLIT_WIDTH = 5;
Grating.START_SLIT_SEPARATION = 5;
Grating.START_FULL_HEIGHT = 60;
Grating.ON_DRAG_SLIT_WIDTH = 15;
Grating.ON_DRAG_SLIT_SEPARATION = 40;
Grating.ON_DRAG_FULL_HEIGHT = 2000;
Grating.NUM_RECTANGLES = 200;
class PointOscillator extends DraggableComponent {
    constructor(scene, x, y) {
        let frequencyText = new ValueText(scene, PointOscillator.START_RADIUS / 2, 0, "Frequency (Hz)");
        let activeText = new ButtonText(scene, PointOscillator.START_RADIUS / 2, HoverText.LINE_HEIGHT, "ON");
        let pulseText = new ButtonText(scene, PointOscillator.START_RADIUS / 2, 2 * HoverText.LINE_HEIGHT, "pulse");
        let circle = new Phaser.GameObjects.Ellipse(scene, 0, 0, 0, 0, DraggableComponent.OSCILLATOR_COLOUR);
        super(scene, x, y, [circle, frequencyText, activeText, pulseText], circle, Phaser.Geom.Ellipse.Contains, false);
        scene.updateFunctions.push(this.updateFrame.bind(this));
        this.scene.absorbers.push(this);
        this.circle = circle;
        this.circle.height = PointOscillator.START_RADIUS;
        this.circle.width = PointOscillator.START_RADIUS;
        this.animCounter = 0;
        this.active = true;
        this.activeText = activeText;
        this.pulseText = pulseText;
        frequencyText.valueSetter = function (comp) { var comp = comp; return (value) => { RippleTank.instance.setFrequency(value); }; }(this);
        frequencyText.valueGetter = function (comp) { var comp = comp; return () => { return RippleTank.instance.getFrequency(); }; }(this);
        activeText.onClick = function (comp) { var comp = comp; return () => { comp.toggleActive(); }; }(this);
        pulseText.onClick = function (comp) { var comp = comp; return () => { comp.pulse(); }; }(this);
    }
    pulse() {
        let x = (this.x - RippleTank.LEFT_PADDING) / RippleTank.scaleFactor;
        let y = (this.y) / RippleTank.scaleFactor;
        RippleTank.instance.disturbBall(x, y);
    }
    clone() {
        return new PointOscillator(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
    }
    updateFrame() {
        if (this.active) {
            if (this.animCounter % PointOscillator.OSCILLATE_FRAMES == 0) {
                this.circle.setSize(PointOscillator.START_RADIUS, PointOscillator.START_RADIUS);
            }
            if (this.animCounter % PointOscillator.OSCILLATE_FRAMES == PointOscillator.OSCILLATE_FRAMES / 2) {
                this.circle.setSize(PointOscillator.START_RADIUS + 2, PointOscillator.START_RADIUS + 2);
            }
            this.animCounter++;
        }
    }
    toggleActive() {
        this.active = !this.active;
        this.activeText.setText(this.active ? "ON" : "OFF");
        this.update();
    }
    setPixels() {
        if (this.firstDragEndHasFired && this.active && !this.isDragging) {
            let x = (this.x - RippleTank.LEFT_PADDING) / RippleTank.scaleFactor;
            let y = (this.y) / RippleTank.scaleFactor;
            console.log(x, y);
            RippleTank.instance.setPointOscillator(x, y);
        }
    }
    onDestroy() { removeFromArray(Scene1.instance.absorbers, this); Scene1.instance.updateAbsorbers(); }
    update() { Scene1.instance.updateAbsorbers(); }
}
PointOscillator.START_RADIUS = 25;
PointOscillator.OSCILLATE_FRAMES = 10;
class LineOscillator extends DraggableComponent {
    constructor(scene, x, y) {
        let frequencyText = new ValueText(scene, LineOscillator.START_WIDTH, 0, "Frequency");
        let activeText = new ButtonText(scene, LineOscillator.START_WIDTH, HoverText.LINE_HEIGHT, "ON");
        let pulseText = new ButtonText(scene, LineOscillator.START_WIDTH, 2 * HoverText.LINE_HEIGHT, "pulse");
        let hitRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, DraggableComponent.OSCILLATOR_COLOUR);
        super(scene, x, y, [hitRect, frequencyText, activeText, pulseText], hitRect, Phaser.Geom.Rectangle.Contains, false);
        scene.updateFunctions.push(this.updateFrame.bind(this));
        this.scene.absorbers.push(this);
        this.hitRect = hitRect;
        this.hitRect.width = LineOscillator.START_WIDTH;
        this.hitRect.height = LineOscillator.START_HEIGHT;
        this.phaseText = frequencyText;
        this.activeText = activeText;
        this.pulseText = pulseText;
        this.animCounter = 0;
        this.active = true;
        frequencyText.valueSetter = function (comp) { var comp = comp; return (value) => { RippleTank.instance.setFrequency(value); }; }(this);
        frequencyText.valueGetter = function (comp) { var comp = comp; return () => { return RippleTank.instance.getFrequency(); }; }(this);
        activeText.onClick = function (comp) { var comp = comp; return () => { comp.toggleActive(); }; }(this);
        pulseText.onClick = function (comp) { var comp = comp; return () => { comp.pulse(); }; }(this);
    }
    toggleActive() {
        this.active = !this.active;
        this.activeText.setText(this.active ? "ON" : "OFF");
        this.update();
    }
    pulse() {
        let x = (this.x - RippleTank.LEFT_PADDING + LineOscillator.START_WIDTH / 2) / RippleTank.scaleFactor;
        RippleTank.instance.disturbLine(x);
    }
    clone() {
        return new LineOscillator(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
        this.hitRect.height = LineOscillator.ON_DRAG_HEIGHT;
        this.hitRect.y = 0;
        this.phaseText.y = Math.floor(LineOscillator.ON_DRAG_HEIGHT / 2);
        this.activeText.y = Math.floor(LineOscillator.ON_DRAG_HEIGHT / 2 + HoverText.LINE_HEIGHT);
        this.pulseText.y = Math.floor(LineOscillator.ON_DRAG_HEIGHT / 2 + 2 * HoverText.LINE_HEIGHT);
    }
    updateFrame() {
        if (this.active) {
            if (this.animCounter % LineOscillator.OSCILLATE_FRAMES == 0) {
                this.hitRect.width = LineOscillator.START_WIDTH;
            }
            if (this.animCounter % LineOscillator.OSCILLATE_FRAMES == LineOscillator.OSCILLATE_FRAMES / 2) {
                this.hitRect.width = LineOscillator.START_WIDTH + 2;
            }
            this.animCounter++;
        }
    }
    setPixels() {
        if (this.firstDragEndHasFired && this.active && !this.isDragging) {
            let x = (this.x - RippleTank.LEFT_PADDING + LineOscillator.START_WIDTH / 2) / RippleTank.scaleFactor;
            RippleTank.instance.setLineOscillator(x);
        }
    }
    onDestroy() {
        removeFromArray(Scene1.instance.absorbers, this);
        Scene1.instance.updateAbsorbers();
    }
    update() { Scene1.instance.updateAbsorbers(); }
}
LineOscillator.START_HEIGHT = 60;
LineOscillator.START_WIDTH = 10;
LineOscillator.ON_DRAG_HEIGHT = 1000;
LineOscillator.OSCILLATE_FRAMES = 10;
class LineReflector extends DraggableComponent {
    constructor(scene, x, y) {
        let angleText = new ValueText(scene, LineReflector.START_WIDTH, 0, "angle");
        let hitRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0, DraggableComponent.REFLECTOR_COLOUR).setStrokeStyle(1, 0);
        super(scene, x, y, [hitRect, angleText], hitRect, Phaser.Geom.Rectangle.Contains, true);
        this.scene.absorbers.push(this);
        this.hitRect = hitRect;
        this.hitRect.width = LineReflector.START_WIDTH;
        this.hitRect.height = LineReflector.START_HEIGHT;
        this.angleText = angleText;
        angleText.valueSetter = function (comp) {
            var comp = comp;
            return (value) => { comp.angle = value; comp.update(); };
        }(this);
        angleText.valueGetter = function (comp) { var comp = comp; return () => { return comp.angle; }; }(this);
    }
    clone() {
        return new LineReflector(this.scene, this.x, this.y);
    }
    ;
    onFirstDragStart() {
        this.hitRect.height = LineReflector.ON_DRAG_HEIGHT;
        this.angleText.y = Math.floor(LineReflector.ON_DRAG_HEIGHT / 2);
    }
    setPixels() {
        if (this.firstDragEndHasFired && !this.isDragging) {
            let x = (this.x - RippleTank.LEFT_PADDING + LineReflector.START_WIDTH / 2) / RippleTank.scaleFactor;
            let y = (this.y) / RippleTank.scaleFactor;
            RippleTank.instance.setLineReflector(x, y, this.angle);
        }
    }
    onDestroy() {
        removeFromArray(Scene1.instance.absorbers, this);
        Scene1.instance.updateAbsorbers();
    }
    update() { console.log(this.x, this.y); Scene1.instance.updateAbsorbers(); }
}
LineReflector.START_HEIGHT = 60;
LineReflector.START_WIDTH = 10;
LineReflector.ON_DRAG_HEIGHT = 1000;
class myGame extends Phaser.Game {
    constructor() {
        let config = {
            type: Phaser.CANVAS,
            width: RippleTank.instance.imageWidth + RippleTank.LEFT_PADDING,
            height: RippleTank.instance.imageHeight,
            autoFocus: true,
            transparent: true,
            parent: 'gameDiv',
            url: '',
            title: 'Blue Ripple tank',
            version: '0.0.1',
            scene: [new Scene1()],
            canvas: document.getElementById("objects")
        };
        super(config);
    }
}
class HoverText extends Phaser.GameObjects.Text {
    constructor(scene, x, y, parameterName) {
        super(scene, x, y, parameterName, HoverText.TEXTSTYLE);
        HoverText.instances.push(this);
        this.scene.add.existing(this);
        this.scene = scene;
        this.setInteractive();
        this.setDepth(100);
        this.setFontSize(HoverText.FONT_SIZE);
        this.on("pointerover", this.pointerOver);
        this.on("pointerout", this.pointerOut);
        this.on("destroy", () => {
            if (this.hoverRect) {
                this.hoverRect.destroy();
            }
            removeFromArray(HoverText.instances, this);
        });
    }
    static setFontSize(value) {
        console.log(value);
        HoverText.FONT_SIZE = Number(value);
        HoverText.instances.forEach(t => t.setFontSize(HoverText.FONT_SIZE));
    }
    static get TEXTSTYLE() {
        return {
            "fill": HoverText.TEXT_COLOUR,
            "fontFamily": "sans-serif"
        };
    }
    pointerOut(pointer) {
        if (this.hoverRect) {
            this.hoverRect.destroy();
            this.hoverRect = undefined;
        }
    }
    pointerOver(pointer) {
        if (this && !this.hoverRect) {
            var bounds = this.getBounds();
            this.hoverRect = this.scene.add.rectangle(bounds.centerX, bounds.centerY, bounds.width, bounds.height).
                setStrokeStyle(1, Phaser.Display.Color.GetColor(255, 0, 0)).
                setRotation(this.rotation);
        }
        if (this.extraPointerOver)
            this.extraPointerOver();
    }
}
HoverText.LINE_HEIGHT = 30;
HoverText.instances = [];
HoverText.TEXT_COLOUR = "#fff";
HoverText.FONT_SIZE = 12;
class ValueText extends HoverText {
    constructor(scene, x, y, parameterName) {
        super(scene, x, y, parameterName + ":");
        this.parameterName = parameterName;
        this.on("pointerdown", (pointer) => { this.onClick(); });
    }
    set valueGetter(func) {
        this._valueGetter = func;
        this.text = this.parameterName + ":" + this._valueGetter();
    }
    set valueSetter(func) { this._valueSetter = func; }
    onClick() {
        var value = window.prompt("set value for " + this.parameterName, this._valueGetter().toString());
        if (isNumeric(value)) {
            this._valueSetter(Number(value));
            this.updateValueText();
        }
        ;
    }
    updateValueText() { this.text = this.parameterName + ":" + this._valueGetter(); }
}
class ButtonText extends HoverText {
    constructor(scene, x, y, parameterName) {
        super(scene, x, y, parameterName);
        this.parameterName = parameterName;
        this.on("pointerdown", (pointer) => { this.pointerDown(); });
    }
    pointerDown() {
        if (this._onClick)
            this._onClick();
    }
    set onClick(value) {
        this._onClick = value;
    }
}
class RippleTank {
    constructor(canvasElement, wasmModule) {
        this.playing = false;
        RippleTank.instance = this;
        this.wasmModule = wasmModule;
        this.canvasElement = canvasElement;
        RippleTank.GRID_WIDTH = Math.floor(window.innerWidth - RippleTank.LEFT_PADDING - RippleTank.RIGHT_PADDING) / RippleTank.scaleFactor;
        RippleTank.GRID_HEIGHT = Math.floor(window.innerHeight / RippleTank.scaleFactor);
        this.wasmModule.instance.exports.init(RippleTank.GRID_WIDTH, RippleTank.GRID_HEIGHT, RippleTank.FRAMES_PER_SECOND);
        this.canvasElement.width = RippleTank.scaleFactor * RippleTank.GRID_WIDTH;
        this.canvasElement.height = RippleTank.scaleFactor * RippleTank.GRID_HEIGHT;
        this.canvasContext = canvasElement.getContext("2d");
        this.canvasContext.scale(RippleTank.scaleFactor, RippleTank.scaleFactor);
        if (!RippleTank.DEBUG)
            this.play();
    }
    get imageWidth() { return this.canvasElement.width; }
    get imageHeight() { return this.canvasElement.height; }
    getImageArray() {
        let memory = this.wasmModule.instance.exports.memory;
        const wasmByteMemoryArray = new Uint8Array(memory.buffer);
        let start = this.wasmModule.instance.exports.RIPPLE_IMAGE_MEM_START.valueOf();
        return wasmByteMemoryArray.slice(start, start + this.wasmModule.instance.exports.RIPPLE_IMAGE_MEM_SIZE.valueOf());
    }
    copyMemoryToCanvas() {
        var imageDataArray = this.getImageArray();
        this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        const canvasImageData = this.canvasContext.createImageData(RippleTank.GRID_WIDTH, RippleTank.GRID_HEIGHT);
        canvasImageData.data.set(imageDataArray);
        this.canvasContext.putImageData(canvasImageData, 0, 0);
        this.canvasContext.drawImage(this.canvasElement, 0, 0);
    }
    timeStep() {
        if (CountUpTimer.instance)
            CountUpTimer.instance.timestep();
        this.wasmModule.instance.exports.timeStep();
        this.copyMemoryToCanvas();
    }
    play() {
        if (!this.playing) {
            this.playing = true;
            this.timer = setInterval(this.timeStep.bind(this), 1000 / RippleTank.FRAMES_PER_SECOND);
        }
    }
    stop() {
        this.playing = false;
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    disturbLine(x) {
        let amplitude = 5;
        let radius = 10.0;
        this.wasmModule.instance.exports.disturbLine(Math.round(x), radius, amplitude);
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    disturbBall(x, y) {
        let amplitude = 5;
        let radius = 10.0;
        this.wasmModule.instance.exports.disturbBall(Math.round(x), Math.round(y), radius, amplitude);
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    setPointOscillator(x, y) {
        this.wasmModule.instance.exports.setPointOscillator(Math.round(x), Math.round(y));
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    setLineOscillator(x) {
        this.wasmModule.instance.exports.setLineOscillator(x);
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    setLineAbsorber(x, y1, y2) {
        this.wasmModule.instance.exports.setLineAbsorber(Math.round(x), Math.round(y1), Math.round(y2));
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    setNrectangle(x, y, width, height, angle, nsquared) {
        this.wasmModule.instance.exports.setNrectangle(Math.round(x), Math.round(y), width, height, angle, nsquared);
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    setConvexLens(x, y, width, height, nsquared) {
        this.wasmModule.instance.exports.setConvexLens(Math.round(x), Math.round(y), width, height, nsquared);
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    setLineReflector(x, y, angle) {
        this.wasmModule.instance.exports.setLineReflector(Math.round(x), Math.round(y), angle);
        if (RippleTank.DEBUG)
            this.copyMemoryToCanvas();
    }
    resetAbsorbers() { this.wasmModule.instance.exports.resetAbsorbers(); }
    resetNSquared() { this.wasmModule.instance.exports.resetNSquared(); }
    reset() {
        Scene1.instance.absorbers.filter(r => r.firstDragEndHasFired).forEach(e => e.destroy());
        Scene1.instance.refractors.filter(r => r.firstDragEndHasFired).forEach(e => e.destroy());
        if (CountUpTimer.instance)
            CountUpTimer.instance.reset();
    }
    setFrequency(value) {
        if (value > 10) {
            value = 10;
        }
        this.wasmModule.instance.exports.setFrequency(value);
    }
    setSpeed(value) { this.wasmModule.instance.exports.setSpeed(value); }
    setFriction(value) { this.wasmModule.instance.exports.setFriction(value); }
    setHardBoundary(value) { this.wasmModule.instance.exports.setHardBoundary(value); }
    setHighContrast(value) { this.wasmModule.instance.exports.setHighContrast(value); }
    setMaxAmplitude(value) { this.wasmModule.instance.exports.setMaxAmplitude(value); }
    setColour(value) { this.wasmModule.instance.exports.setColour(value); }
    getSpeed() { return this.wasmModule.instance.exports.SPEED.valueOf(); }
    getFrequency() { return this.wasmModule.instance.exports.FREQUENCY.valueOf(); }
    getFriction() { return this.wasmModule.instance.exports.FRICTION.valueOf(); }
    getHardBoundary() { return this.wasmModule.instance.exports.HARD_BOUNDARY.valueOf(); }
    getHighContrast() { return this.wasmModule.instance.exports.HIGH_CONTRAST.valueOf(); }
    getMaxAmplitude() { return this.wasmModule.instance.exports.MAX_AMPLITUDE.valueOf(); }
    getColour() { return this.wasmModule.instance.exports.COLOUR.valueOf(); }
}
RippleTank.scaleFactor = 5;
RippleTank.DEBUG = false;
RippleTank.GRID_WIDTH = 80;
RippleTank.GRID_HEIGHT = 100;
RippleTank.LEFT_PADDING = 100;
RippleTank.RIGHT_PADDING = 110;
RippleTank.FRAMES_PER_SECOND = 25;
class Ruler extends Phaser.GameObjects.Container {
    constructor(scene, x, y, isHorizontal) {
        let image = new Phaser.GameObjects.Image(scene, 0, 0, isHorizontal ? "rulerH90" : "rulerV90");
        let borderRect = new Phaser.GameObjects.Rectangle(scene, 0, 0, 0, 0).setVisible(false).setStrokeStyle(1, 0xff0000);
        super(scene, x, y, [image, borderRect]);
        this.scene.add.existing(this);
        this.setInteractive(borderRect, Phaser.Geom.Rectangle.Contains);
        this.scene.input.setDraggable(this);
        this.isHorizontal = isHorizontal;
        this.on('drag', this.onDrag);
        this.on('dragend', this.dragEnd);
        this.on("pointerover", this.pointerOver);
        this.on("pointerout", this.pointerOut);
        this.borderRect = borderRect;
        this.image = image;
        this.borderRect.x = -1 * this.image.width / 2;
        this.borderRect.y = -1 * this.image.height / 2;
        this.borderRect.width = this.image.width;
        this.borderRect.height = this.image.height;
    }
    onDrag(pointer, dragX, dragY) {
        if (!this.onDragHasFired) {
            this.clone();
            let prevHeight = this.image.height;
            this.image.setTexture(this.isHorizontal ? "rulerH1000" : "rulerV1000");
            this.borderRect.width = this.image.width;
            this.borderRect.height = this.image.height;
            this.borderRect.x = -this.image.width / 2;
            this.borderRect.y = -this.image.height / 2;
            this.onDragHasFired = true;
        }
        if (this.firstDragEndHasFired) {
            this.x = dragX;
            this.y = dragY;
        }
        else {
            this.x = dragX + this.image.width / 2;
            this.y = dragY + this.image.height / 2;
        }
    }
    dragEnd(pointer, dragX, dragY) {
        this.firstDragEndHasFired = true;
        if (this.x - this.image.width / 2 < RippleTank.LEFT_PADDING ||
            this.x - this.image.width / 2 > RippleTank.LEFT_PADDING + RippleTank.instance.canvasElement.width) {
            console.log("destroy");
            this.destroy();
        }
    }
    pointerOut(pointer) {
        this.borderRect.setVisible(false);
    }
    pointerOver(pointer) {
        this.borderRect.setVisible(true);
    }
    clone() {
        return new Ruler(this.scene, this.x, this.y, this.isHorizontal);
    }
    ;
}
const SPAWN_X = 25;
var SPAWN_Y = 25;
const SPAWN_VERTICAL_SPACING = 50;
class Scene1 extends Phaser.Scene {
    constructor() {
        super({
            key: 'sceneA',
            active: true,
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                }
            },
        });
        this.refractors = [];
        this.absorbers = [];
        this.updateFunctions = [];
        Scene1.instance = this;
    }
    preload() {
        this.load.image("rulerH90", "assets/rulerHorizontal90.resized.png");
        this.load.image("rulerH1000", "assets/rulerHorizontal1000.png");
        this.load.image("rulerV90", "assets/rulerVertical90.resized.png");
        this.load.image("rulerV1000", "assets/rulerVertical1000.png");
    }
    create() {
        this.tankRectangle = new Phaser.GameObjects.Rectangle(this, RippleTank.LEFT_PADDING + RippleTank.instance.imageWidth / 2, RippleTank.instance.imageHeight / 2, RippleTank.instance.imageWidth, RippleTank.instance.imageHeight).setStrokeStyle(1, 0x0);
        this.add.existing(this.tankRectangle);
        new Glass(this, 15, 24);
        new ConvexLens(this, 65, 24);
        new PointOscillator(this, 27, 130);
        new LineOscillator(this, 70, 100);
        new Slit(this, 22, 180);
        new DoubleSlit(this, 70, 180);
        new Grating(this, 22, 260);
        new LineReflector(this, 70, 260);
        new Ruler(this, 27, 375, false);
        new Ruler(this, 70, 375, true);
    }
    update() {
        this.updateFunctions.forEach(f => f());
    }
    updateRefractors() {
        RippleTank.instance.resetNSquared();
        this.refractors.forEach(r => r.setPixels());
    }
    updateAbsorbers() {
        RippleTank.instance.resetAbsorbers();
        this.absorbers.forEach(r => r.setPixels());
    }
}
class CountUpTimer {
    constructor(span) {
        CountUpTimer.instance = this;
        this.span = span;
        this.msElapsed = 0;
        this.span.innerHTML = this.timerText;
    }
    timestep() {
        this.msElapsed += 1000 / RippleTank.FRAMES_PER_SECOND;
        this.span.innerHTML = this.timerText;
    }
    get timerText() {
        let ms = this.msElapsed;
        var hours = Math.floor(ms / 3600000);
        var hoursString = hours.toString();
        ms -= hours * 3600000;
        var minutes = Math.floor(ms / 60000) % 60;
        var minutesString = minutes.toString();
        ms -= minutes * 60000;
        var seconds = Math.floor(ms / 1000) % 60;
        var secondsString = seconds.toString();
        ms -= seconds * 1000;
        ms = Math.floor(ms);
        var msString = ms.toString();
        return (hours ? this.padLeftZeroes(hoursString, 1) + "h" : "") +
            this.padLeftZeroes(minutesString, 2) + "m" +
            this.padLeftZeroes(secondsString, 2) + "s" +
            this.padLeftZeroes(msString, 3) + "ms";
    }
    padLeftZeroes(str, num) {
        while (str.length < num) {
            str = "0" + str;
        }
        return str;
    }
    reset() {
        this.msElapsed = 0;
        this.span.innerHTML = this.timerText;
    }
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function wasmBrowserInstantiate(wasmModuleUrl, importObject) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = undefined;
        if (!importObject) {
            importObject = {
                env: {
                    abort: () => console.log("Abort!")
                }
            };
        }
        const fetchAndInstantiateTask = () => __awaiter(this, void 0, void 0, function* () {
            const wasmArrayBuffer = yield fetch(wasmModuleUrl).then(response => response.arrayBuffer());
            return WebAssembly.instantiate(wasmArrayBuffer, importObject);
        });
        response = yield fetchAndInstantiateTask();
        return response;
    });
}
;
//# sourceMappingURL=ripple.js.map