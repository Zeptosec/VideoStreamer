import express from 'express';
const app = express();
import stream from 'stream';
import { AddId, clearBuffer, clearQueue, getBuffer } from './cacheManager.js';
import * as dotenv from 'dotenv'
dotenv.config()

const fileLimit = 8 * 1024 ** 2;

app.get("/video/:id", async function (req, res) {
    const range = req.headers.range;
    const id = req.params.id;
    if (!id) {
        return res.status(400).send("No id was specified");
    }
    if (!range) {
        return res.status(400).send("Requires Range header");
    }
    let videoSize;
    try {
        videoSize = await AddId(id);
    } catch (err) {
        return res.status(400).send(err.message);
    }
    //const videoSize = size;
    const start = Number(range.replace(/\D/g, ""));
    const CHUNK_SIZE = Math.min(1024 ** 2, fileLimit - start % fileLimit - 1);

    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    //console.log(start, end, CHUNK_SIZE, currIndex);
    const contentLength = end - start + 1;
    let buffer;
    let canceled = false;
    req.on('close', () => {
        canceled = true;
    })
    try {
        await new Promise(r => setTimeout(r, 300));
        if(canceled)
            return;
        buffer = await getBuffer(id, start);
    } catch (err) {
        console.trace(err);
        return res.status(400).send(err.message);
    }
    //console.table(getDiff());
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);

    const fend = end % fileLimit == 0 ? start % fileLimit + CHUNK_SIZE : end % fileLimit + 1;
    const sliced = buffer.slice(start % fileLimit, fend);

    var bufferStream = new stream.PassThrough();
    bufferStream.end(sliced);
    bufferStream.pipe(res)
});

app.listen(8000, function () {
    console.log("Listening on port 8000!");
    setInterval(() => {
        clearBuffer();
        clearQueue();
    }, 1000 * 60 * 2);
});