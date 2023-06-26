import { Readable } from 'stream';

export default make;
export type RangeSpec = [base: NativePointer, size: number];

function make(base: NativePointer, size: number): MemoryStream;
function make(ranges: RangeSpec[]): MemoryStream;
function make(baseOrRanges: NativePointer | RangeSpec[], size?: number) {
    if (baseOrRanges instanceof NativePointer)
        return new MemoryStream([[baseOrRanges, size as number]]);
    else
        return new MemoryStream(baseOrRanges);
}

class MemoryStream extends Readable {
    #ranges: RangeSpec[];

    constructor(ranges: RangeSpec[]) {
        super({
            highWaterMark: 4 * 1024 * 1024
        });

        this.#ranges = ranges;
        if (ranges.length === 0)
            this.push(null);
    }

    _read(size: number) {
        let wantMoreData = true;

        do {
            const range = this.#ranges[0];

            const address = range[0];
            const remaining = range[1];
            if (remaining === 0) {
                this.#ranges.shift();
                if (this.#ranges.length > 0) {
                    continue;
                } else {
                    this.push(null);
                    return;
                }
            }

            const n = Math.min(remaining, size);

            range[0] = address.add(n);
            range[1] -= n;

            let chunk: ArrayBuffer;
            try {
                chunk = address.readByteArray(n) as ArrayBuffer;
            } catch (e) {
                this.emit('error', e);
                this.push(null);
                return;
            }

            wantMoreData = this.push(Buffer.from(chunk));
        } while (wantMoreData);
    }
}
