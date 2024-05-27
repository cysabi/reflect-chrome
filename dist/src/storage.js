// storage.ts provides a thin wrapper around the chrome storage api to make it easier to read/write from it
// you can also find helper functions that read/write to chrome storage
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addMinutes } from './util';
// helper function to retrive chrome storage object
// usage:
//
// getStorage(null).then(storage => {
//     ...
// })
export function getStorage() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(null, (storage) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve(storage);
                }
            });
        });
    });
}
// helper function to set fields in chrome storage
// usage:
//
// getStorage({enableBlobs: false}).then(storage => {
//     ...
// })
export function setStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(key, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve();
            }
        });
    });
}
// Add a single url to blocklist (does nothing if url is already in list)
export function addToBlocked(url, callback) {
    getStorage().then((storage) => {
        // url = cleanDomain([url]) === '' ? url : cleanDomain([url])
        if (!storage.blockedSites.includes(url)) {
            storage.blockedSites.push(url);
            setStorage({ blockedSites: storage.blockedSites }).then(() => {
                console.log(`${url} added to blocked sites`);
                callback ? callback() : () => { };
            });
        }
    });
}
// Remove single url from blocklist (does nothing if url is not in list)
export function removeFromBlocked(url) {
    getStorage().then((storage) => {
        let blockedSites = storage.blockedSites;
        blockedSites = blockedSites.filter((e) => e !== url);
        setStorage({ blockedSites: blockedSites }).then(() => {
            console.log(`removed ${url} from blocked sites`);
        });
    });
}
// Add a single url to whitelist with associated whitelist duration
// (replaces any existing entries)
export function addToWhitelist(url, minutes) {
    getStorage().then((storage) => {
        let whitelistedSites = storage.whitelistedSites;
        let expiry = addMinutes(new Date(), minutes);
        whitelistedSites[url] = expiry.toJSON();
        setStorage({ whitelistedSites: whitelistedSites }).then(() => {
            console.log(`${url} added to whitelisted sites`);
        });
    });
}
export function logIntentToStorage(intentString, intentDate, url, accepted) {
    getStorage().then((storage) => {
        let intentList = storage.intentList;
        // getting oldest date value from intent list map
        let oldest_date = new Date();
        for (const rawDate in intentList) {
            const date = new Date(rawDate);
            if (date < oldest_date) {
                oldest_date = date;
            }
        }
        // deleting oldest intent to keep intent count under limit
        if (Object.keys(intentList).length > storage.numIntentEntries) {
            console.log(`list full, popping ${oldest_date.toJSON()}`);
            delete intentList[oldest_date.toJSON()];
        }
        // adding new intent and date to intent list
        intentList[intentDate.toJSON()] = {
            intent: intentString,
            url: url,
            accepted: accepted,
        };
        // saving intentList to chrome storage
        setStorage({ intentList: intentList }).then(() => {
            console.log(`logged intent "${intentString}"`);
        });
    });
}
