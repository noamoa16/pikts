export class Random {
    /**
     * [min, max)
     */
    static uniform(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * [min, max]
     */
    static uniformInt(min: number, max: number): number {
        if (min > max) {
            throw new Error(`Random.uniformInt: min (${min}) は max (${max}) 以下でなければなりません。`);
        }
        return Math.floor(Random.uniform(min, max + 1));
    }
}
