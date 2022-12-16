import axios from "axios";

const fileLinks = new Map();
export async function AddId(id) {
    if (!fileLinks.get(id)) {
        const res = await axios.get(`https://tartan-general-scion.glitch.me/api/file/?id=${id}`);
        fileLinks.set(id, res.data.data[0]);
        if (fileLinks.size > 50) {
            fileLinks.delete(fileLinks.keys().next().value);
        }
    }
    return fileLinks.get(id).size;
}

const buffLimit = 2;
const buffs = new Map();
const linkStart = "https://cdn.discordapp.com/attachments/1025526944776867952";
const fileLimit = 8 * 1024 ** 2;
const maxQueue = 5;
const Queue = [];

export async function getBuffer(id, start) {
    let vidBuff = buffs.get(id);
    const currIndex = Math.floor(start / fileLimit);
    const fileLink = fileLinks.get(id);
    if (!fileLink) throw Error("File link was not found..");
    const amount = fileLink.chunks.length;
    if (vidBuff) {
        vidBuff.time = new Date();
        let foundBuff = vidBuff.buffers;
        const buffObj = foundBuff.find(w => w.ind === currIndex);
        if (buffObj) {
            return buffObj.buffer;
        } else {
            let buffer;
            const cnk = getFromQueue(id, currIndex);
            if (cnk) {
                buffer = Buffer.from((await cnk).data);
            } else {
                buffer = Buffer.from((await axios.get(`${linkStart}/${fileLink.chunks[currIndex]}/blob`, { responseType: 'arraybuffer' })).data)
            }
            if (amount > currIndex + 1) {
                putOnQueue(id, fileLink, currIndex + 1);
            }
            foundBuff.unshift({ ind: currIndex, buffer, time: new Date() });
            if (foundBuff.length > 2) {
                foundBuff.pop();
            }
            return buffer;
        }
    } else {
        const buffer = Buffer.from((await axios.get(`${linkStart}/${fileLink.chunks[currIndex]}/blob`, { responseType: 'arraybuffer' })).data)
        const obj = { buffers: [{ ind: currIndex, buffer }], time: new Date() };
        buffs.set(id, obj);
        if (currIndex + 1 < amount) {
            putOnQueue(id, fileLink, currIndex + 1);
        }
        if (buffs.size > buffLimit) {
            buffs.delete(buffs.keys().next().value);
        }
        return buffer;
    }
}

function putOnQueue(id, fileLink, index) {
    const rez = Queue.find(w => w.id == id && w.index == index);
    if (rez) {
        return;
    }
    const chunk = axios.get(`${linkStart}/${fileLink.chunks[index]}/blob`, { responseType: 'arraybuffer' });

    Queue.push({ id, index, chunk, time: new Date() })

    const cnt = Queue.filter(w => w.id == id).length;
    if (cnt > maxQueue) {
        // would be a good idea to abort the download but gives an uncatchable error... no clue how to fix it
        Queue.shift();
    }
}

function getFromQueue(id, index) {
    const ind = Queue.findIndex(w => w.id == id && w.index == index);
    if (ind != -1) {
        return Queue.splice(ind, 1)[0].chunk;
    }
    return null;
}

const lifeOnQueue = 5 * 60 * 1000;
export function clearQueue(){
    for(let i = 0; i < Queue.length; i++){
        const diff = new Date().getTime() - new Date(Queue[i].time).getTime();
        if(diff > lifeOnQueue){
            Queue.splice(i, 1);
        }
    }
}

export function clearBuffer(){
    for(let [key, value] of buffs){
        const diff = new Date().getTime() - new Date(value.time).getTime();
        if(diff > lifeOnQueue){
            buffs.delete(key);
        }
    }
}