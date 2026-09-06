import { Vector3 } from "#vendor/babylon";
import { Figure, RectangularPrism, Slope, Sphere } from "../figure";
import { RectPrism2RectPrism } from "./rectPrism2RectPrism";
import { Sphere2RectPrism } from "./sphere2RectPrism";
import { Sphere2Slope } from "./sphere2Slope";
import { Sphere2Sphere } from "./sphere2Sphere";

export interface IFigureImpl {
    intersects(): boolean;
    space(_dir: Vector3): number;
}

export function getFigureImpl(figure1: Figure, figure2: Figure): IFigureImpl{
    if(figure1 instanceof Sphere && figure2 instanceof Sphere){
        return new Sphere2Sphere(figure1, figure2);
    }
    else if(figure1 instanceof Sphere && figure2 instanceof RectangularPrism){
        return new Sphere2RectPrism(figure1, figure2);
    }
    else if(figure1 instanceof RectangularPrism && figure2 instanceof RectangularPrism){
        return new RectPrism2RectPrism(figure1, figure2);
    }
    else if(figure1 instanceof Sphere && figure2 instanceof Slope){
        return new Sphere2Slope(figure1, figure2);
    }
    throw new Error(`intersects() and space() not implemented for ${figure1.shape} vs ${figure2.shape}`);
}