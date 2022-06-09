const RootLicense = artifacts.require("./RootLicense.sol");
const LicenseToken = artifacts.require("./LicenseToken.sol");
const {
    appDescription,
    appImageUrl,
    name,
    periodPerToken,
    price,
    unit,
    createDefaulAppLicense,
    macAddr,
} = require("./TestUtils");

require("dotenv").config({ path: "../.env" });
const getNewAppAddressAdded = async (instance) => {
    const apps = await instance.getApps();
    return apps[apps.length - 1];
};

let rootInstance;
let deployApp;
let appAddress;

const sleep = (timeInMillis) => {
    return new Promise((resolve, rej) => {
        setTimeout(() => {
            resolve();
        }, timeInMillis);
    });
};

const convertUnitToMilis = (unit) => {
    switch (unit) {
        case 0:
            return 1000;
        case 1:
            return 24 * 60 * 60 * 1000;
        case 2:
            return 30 * 24 * 60 * 60 * 1000;
        case 3:
            return 365 * 24 * 60 * 60 * 1000;
        default:
            return 0;
    }
};

contract("LicenseToken", (accounts) => {
    beforeEach(async () => {
        rootInstance = await RootLicense.deployed();
        await createDefaulAppLicense(rootInstance, accounts[0], price);
        appAddress = await getNewAppAddressAdded(rootInstance);
        deployApp = await LicenseToken.at(appAddress);
    });

    it("check deployed app info conrrectness", async () => {
        const [_price, _appDescription, _appImageUrl, _name, _owner, _durationPerToken, _unit, _active] = await Promise.all([
            deployApp.price({ from: accounts[0] }),
            deployApp.appDescription({ from: accounts[0] }),
            deployApp.symbol({ from: accounts[0] }),
            deployApp.name({ from: accounts[0] }),
            deployApp.owner({ from: accounts[0] }),
            deployApp.durationPerToken({ from: accounts[0] }),
            deployApp.unit({ from: accounts[0] }),
            deployApp.active({ from: accounts[0] }),
        ]);
        assert.equal(_price, price, "Price is not correct");
        assert.equal(_appDescription, appDescription, "Description is not correct");
        assert.equal(_appImageUrl, appImageUrl, "Image url is not correct");
        assert.equal(_name, name, "Name is not correct");
        assert.equal(_owner, accounts[0], "Owner is not correct");
        assert.equal(_durationPerToken, periodPerToken, "Duration per token is not correct");
        assert.equal(_unit, unit, "Unit is not correct");
        assert.equal(_active, false, "Active of newly deployed app cannot be true");
    });

    it("It shouldn't interact with app when it is not activate", async () => {
        try {
            await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
            assert.ok(false);
        } catch (e) {
            assert.ok(e);
        }
    });

    it("should buy a new license when the contract was activated", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const numberOfTokenHolded = await deployApp.balanceOf(accounts[1], { from: accounts[1] });
        assert.equal(numberOfTokenHolded, 1, "Number of token holded is not correct");
    });

    it("Balance of license token should increase when someone purchase a token license", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        const balanceBefore = await deployApp.balance({ from: accounts[1] });
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const balanceAfter = await deployApp.balance({ from: accounts[1] });
        assert.ok(+balanceBefore < +balanceAfter);
    });

    it("Owner can set set licensePrice", async () => {
        const newPrice = 10000;
        await deployApp.setLicensePrice(newPrice, { from: accounts[0] });
        const _newPrice = await deployApp.price({ from: accounts[0] });
        assert.equal(newPrice, _newPrice, "License price is not correct");
    });

    it("Test timestamp when purchase new app", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        const currentTimeStamp = +new Date();
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const purchaseTimestamp = +(await deployApp.timeStampFirstBuy(accounts[1], { from: accounts[1] }));

        assert.ok(
            Math.abs(parseInt(purchaseTimestamp / 1000) - parseInt(currentTimeStamp / 1000)) <= process.env.TIME_DIFF_IN_SECOND,
            "Invalid time stamp on purchase"
        );
    });

    it("Buy a license an and then it will is still valid", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const expiredTimeInMillis = +(await deployApp.getExpiredTimestamp({ from: accounts[1] }));
        assert.ok(typeof expiredTimeInMillis === "number", "Expired time is not correct");
        const secondInvalidMillis =
            periodPerToken * +(await deployApp.balanceOf(accounts[1], { from: accounts[1] })) * convertUnitToMilis(unit);
        assert.ok(typeof secondInvalidMillis === "number", "secondInvalidMillis  is not correct");
        await sleep(Math.round(secondInvalidMillis / 3));
        const now = +new Date();

        const isStillValid = Math.round(expiredTimeInMillis / 1000) > Math.round(now / 1000);
        assert.ok(isStillValid);
    });

    it("Buy a license an and then it will be invalid after duration specified in contract", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const expiredTimeInMillis = +(await deployApp.getExpiredTimestamp({ from: accounts[1] }));
        assert.ok(typeof expiredTimeInMillis === "number", "Expired time is not correct");
        const secondInvalidMillis =
            periodPerToken * +(await deployApp.balanceOf(accounts[1], { from: accounts[1] })) * convertUnitToMilis(unit);
        assert.ok(typeof secondInvalidMillis === "number", "secondInvalidMillis  is not correct");
        await sleep(secondInvalidMillis + 1000);
        const now = +new Date();
        const isNotValid = Math.round(expiredTimeInMillis / 1000) < Math.round(now / 1000);
        assert.ok(isNotValid);
    });

    it("Should TimeStamp for license account buy update when purchase new license", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const expiredTimeInMillis = +(await deployApp.getExpiredTimestamp({ from: accounts[1] }));
        const purchaseTimestamp = +(await deployApp.timeStampFirstBuy(accounts[1], { from: accounts[1] }));
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const purchaseTimestamp2 = +(await deployApp.timeStampFirstBuy(accounts[1], { from: accounts[1] }));
        const expiredTimeInMillisAfterPurchase = +(await deployApp.getExpiredTimestamp({ from: accounts[1] }));
        assert.ok(expiredTimeInMillis < expiredTimeInMillisAfterPurchase);
        assert.ok(purchaseTimestamp === purchaseTimestamp2);
        const tokenCount = +(await deployApp.balanceOf(accounts[1], { from: accounts[1] }));
        assert.equal(tokenCount, 2);
    });

    it("Burn all token when client trigger buy new token and set new start timeStamp", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const oldPurchaseTimestamp = +(await deployApp.timeStampFirstBuy(accounts[1], { from: accounts[1] }));
        const expiredTimeInMillis = +(await deployApp.getExpiredTimestamp({ from: accounts[1] }));
        const oldTokens = +(await deployApp.balanceOf(accounts[1], { from: accounts[1] }));
        assert.equal(oldTokens, 1);
        const secondInvalidMillis =
            periodPerToken * +(await deployApp.balanceOf(accounts[1], { from: accounts[1] })) * convertUnitToMilis(unit);
        assert.ok(typeof secondInvalidMillis === "number", "secondInvalidMillis  is not correct");
        await sleep(secondInvalidMillis + 1000);
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const newPurchaseTimestamp = +(await deployApp.timeStampFirstBuy(accounts[1], { from: accounts[1] }));
        assert.ok(oldPurchaseTimestamp < newPurchaseTimestamp, "New purchased timestamp must set when old token is invalid");
        const newTokens = +(await deployApp.balanceOf(accounts[1], { from: accounts[1] }));
        assert.equal(newTokens, 1, "All previous tokens should be burn out and then a new token should be created");
    });

    it("Should get mac address from the license purchased", async () => {
        await rootInstance.activate(appAddress, { from: accounts[0] });
        await deployApp.purchaseLicense(accounts[1], macAddr, { from: accounts[1], value: price });
        const _macAddr = await deployApp.addressToMacAddress(accounts[1], { from: accounts[1] });
        assert.equal(macAddr, _macAddr);
    });
});
