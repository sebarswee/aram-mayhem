// Phaser.Geom mock for tests
import Phaser from 'phaser';

// Ensure Phaser.Geom exists
if (!(Phaser as any).Geom) {
  (Phaser as any).Geom = {};
}

// Mock Phaser.Geom.Circle
if (!(Phaser.Geom as any).Circle) {
  (Phaser.Geom as any).Circle = class Circle {
    x: number;
    y: number;
    radius: number;

    constructor(x: number, y: number, radius: number) {
      this.x = x;
      this.y = y;
      this.radius = radius;
    }
  };
}

// Mock Phaser.Geom.Rectangle
if (!(Phaser.Geom as any).Rectangle) {
  (Phaser.Geom as any).Rectangle = class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  };
}

// Ensure Phaser.GameObjects.Particles.Zones exists
if (!(Phaser.GameObjects.Particles as any).Zones) {
  (Phaser.GameObjects.Particles as any).Zones = {};
}

// Mock Phaser.GameObjects.Particles.Zones.RandomZone
if (!(Phaser.GameObjects.Particles.Zones as any).RandomZone) {
  (Phaser.GameObjects.Particles.Zones as any).RandomZone = class RandomZone {
    source: any;

    constructor(source: any) {
      this.source = source;
    }
  };
}
