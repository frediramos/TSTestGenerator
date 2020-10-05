class IdGen {
    private count: number;
    private prefix: string;

    public constructor(prefix: string) {
        this.count = 0;
        this.prefix = prefix;
    }

    public getId(): string {
        var id: string = this.prefix + "_id_" + this.count;
        this.count = this.count + 1;
        return id;
    }

    public reset(): void {
        this.count = 0;
    }
}