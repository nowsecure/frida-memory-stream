# frida-memory-stream

Create a stream from one or more memory regions.

## Example

```js
import memoryStream from 'frida-memory-stream';

const m = Process.enumerateModules()[0];
memoryStream(m.base, m.size).pipe(networkStream);
```
