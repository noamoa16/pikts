import { describe, expect, it } from "vitest";

import { Vector3 } from "../../src/vendor/babylon";
import { Cube, Sphere } from "../../src/physics/figure";

describe("Figure.intersects", () => {
    it("returns true when spheres overlap", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Sphere(new Vector3(3, 0, 0), 2);

        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });

    it("returns false when spheres only touch", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Sphere(new Vector3(4, 0, 0), 2);

        expect(left.intersects(right)).toBe(false);
    });

    it("returns true when a sphere overlaps a cube", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 2);
        const cube = new Cube(new Vector3(2, 0, 0), 2);

        expect(sphere.intersects(cube)).toBe(true);
        expect(cube.intersects(sphere)).toBe(true);
    });

    it("returns false when a sphere only touches a cube", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 1);
        const cube = new Cube(new Vector3(2, 0, 0), 2);

        expect(sphere.intersects(cube)).toBe(false);
    });

    it("returns true when cubes overlap and false when they only touch", () => {
        const overlappingLeft = new Cube(new Vector3(0, 0, 0), 2);
        const overlappingRight = new Cube(new Vector3(1, 0, 0), 2);
        const touchingRight = new Cube(new Vector3(2, 0, 0), 2);

        expect(overlappingLeft.intersects(overlappingRight)).toBe(true);
        expect(overlappingLeft.intersects(touchingRight)).toBe(false);
    });
});

describe("Figure.space", () => {
    it("returns Infinity when the movement direction is zero", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 1);
        const cube = new Cube(new Vector3(5, 0, 0), 2);

        expect(sphere.space(cube, Vector3.Zero())).toBe(Infinity);
    });

    it("returns the first contact distance for sphere-sphere movement", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Sphere(new Vector3(5, 0, 0), 2);

        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBeCloseTo(2);
    });

    it("returns Infinity when spheres move away from each other", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Sphere(new Vector3(5, 0, 0), 2);

        expect(moving.space(stationary, new Vector3(-1, 0, 0))).toBe(Infinity);
    });

    it("returns the first contact distance for sphere-cube movement", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Cube(new Vector3(5, 0, 0), 2);

        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBeCloseTo(3);
    });

    it("returns the first contact distance for cube-cube movement", () => {
        const moving = new Cube(new Vector3(0, 0, 0), 2);
        const stationary = new Cube(new Vector3(5, 0, 0), 2);

        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBeCloseTo(3);
    });
});
