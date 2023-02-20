exports.fetch = async function (url, init) {
    const {default: fetch} = await import("node-fetch");
    return await fetch(url, init);
};