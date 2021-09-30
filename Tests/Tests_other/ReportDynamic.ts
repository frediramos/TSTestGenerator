class MyMap {
    private contents: { [key: string]: number };

    public constructor() {
        this.contents = {};
    }

    public get(k: string): number | undefined {
        if (this.contents.hasOwnProperty(k)) {
            return this.contents[k];
        }
    }

    public put(k: string, v: number): void {
        this.contents[k] = v;
    }
}