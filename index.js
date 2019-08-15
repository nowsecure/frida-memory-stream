const stream = require('stream');

class Source extends stream.Readable {
  constructor(ranges) {
    super({
      highWaterMark: 4 * 1024 * 1024
    });

    this._ranges = ranges;
    if (ranges.length === 0)
      this.push(null);
  }

  _read(size) {
    let wantMoreData = true;

    do {
      const range = this._ranges[0];

      const address = range[0];
      const remaining = range[1];
      if (remaining === 0) {
        this._ranges.shift();
        if (this._ranges.length > 0) {
          continue;
        } else {
          this.push(null);
          return;
        }
      }

      const n = Math.min(remaining, size);

      range[0] = address.add(n);
      range[1] -= n;

      let chunk;
      try {
        chunk = Memory.readByteArray(address, n);
      } catch (e) {
        this.emit('error', e);
        this.push(null);
        return;
      }

      wantMoreData = this.push(Buffer.from(chunk));
    } while (wantMoreData);
  }
}

module.exports = (value, size) => {
  if (value instanceof NativePointer)
    return new Source([[value, size]]);
  else
    return new Source(value);
};
