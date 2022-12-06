import express from 'express';
const app = express();
import stream from 'stream';
import { AddId, getBuffer } from './cacheManager.js';
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
    } catch(err){
        return res.status(400).send("Invalid id");
    }
    //const videoSize = size;
    const start = Number(range.replace(/\D/g, ""));
    const CHUNK_SIZE = Math.min(10 ** 6, fileLimit - start % fileLimit - 1);

    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    //console.log(start, end, CHUNK_SIZE, currIndex);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);


    const buffer = await getBuffer(id, start);
    const fend = end % fileLimit == 0 ? start % fileLimit + CHUNK_SIZE : end % fileLimit + 1;
    const sliced = buffer.slice(start % fileLimit, fend);

    var bufferStream = new stream.PassThrough();
    bufferStream.end(sliced);
    bufferStream.pipe(res)
});

app.listen(8000, function () {
    console.log("Listening on port 8000!");
});