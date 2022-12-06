import axios from "axios";

const fileLinks = new Map();
export async function AddId(id) {
    if (!fileLinks.get(id)) {
        const res = await axios.get(`https://tartan-general-scion.glitch.me/api/file/?id=${id}`);
        fileLinks.set(id, res.data.data);
        if (fileLinks.size > 50) {
            fileLinks.delete(fileLinks.keys().next().value);
        }
    }
    return fileLinks.get(id)[0].size;
}

const buffLimit = 2;
const buffs = new Map();
const linkStart = "https://cdn.discordapp.com/attachments/1025526944776867952";
const fileLimit = 8 * 1024 ** 2;

export async function getBuffer(id, start) {
    let foundBuff = buffs.get(id);
    const currIndex = Math.floor(start / fileLimit);
    const fileLink = fileLinks.get(id);
    if (!fileLink) throw Error("File link was not found..");

    if (foundBuff) {
        const buffObj = foundBuff.find(w => w.ind === currIndex);
        if (buffObj) {
            return buffObj.buffer;
        } else {
            const buffer = Buffer.from((await axios.get(`${linkStart}/${fileLink[0].chunks[currIndex]}/blob`, { responseType: 'arraybuffer' })).data)
            foundBuff.unshift({ ind: currIndex, buffer });
            if (foundBuff.length > 5) {
                foundBuff.pop();
            }
            return buffer;
        }
    } else {
        const buffer = Buffer.from((await axios.get(`${linkStart}/${fileLink[0].chunks[currIndex]}/blob`, { responseType: 'arraybuffer' })).data)
        const obj = [{ ind: currIndex, buffer }];
        buffs.set(id, obj);
        if (buffs.size > buffLimit) {
            buffs.delete(buffs.keys().next().value);
        }
        return buffer;
    }
}