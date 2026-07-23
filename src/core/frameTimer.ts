export class FrameTimer {
    private times: number[] = [];
    constructor(public readonly num: number){}
    public add(time: number){
        this.times.push(time);
        if(this.times.length > this.num){
            this.times.shift();
        }
    }
    public measure(func: () => void){
        const startTime = performance.now();
        func();
        const endTime = performance.now();
        this.times.push(endTime - startTime);
        if(this.times.length > this.num){
            this.times.shift();
        }
    }
    public get averageTime(){
        return this.times.reduce((sum, value) => sum + value, 0) / this.times.length;
    }
}