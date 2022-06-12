const name = "AppName";
const appImageUrl = "AppImageUrl";
const appDescription = "Description";
const price = 1000;
const periodPerToken = 4;
const unit = 0;
const macAddr = "1234567";
const secret = "12345";

const getNewAppAddressAdded = async (instance) => {
    const apps = await instance.getApps();
    return apps[apps.length - 1];
};

const createDefaulAppLicense = async (instance, account, value) => {
    return await instance.createNewLicenseToken(name, appImageUrl, appDescription, price, periodPerToken, unit,secret, {
        from: account,
        value,
    });
};

module.exports = {
    name,
    appImageUrl,
    appDescription,
    price,
    periodPerToken,
    unit,
    macAddr,
    getNewAppAddressAdded,
    createDefaulAppLicense,
};
