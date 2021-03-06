const RootLicense = artifacts.require("./RootLicense.sol");
const LicenseToken = artifacts.require("./LicenseToken.sol");
const {
    appDescription,
    appImageUrl,
    name,
    periodPerToken,
    price,
    unit,
    macAddr,
    getNewAppAddressAdded,
    createNewAppLicense,
    createDefaulAppLicense,
} = require("./TestUtils");
let instance;

contract("RootLicense", (accounts, ...other) => {
    beforeEach(async () => {
        instance = await RootLicense.deployed();
    });

    it("should be able to create a RootLicense", async () => {
        await createDefaulAppLicense(instance, accounts[0], price);
        assert.ok(true);
    });

    it("Should not able to create New app if not have enough license fee", async () => {
        try {
            await createDefaulAppLicense(instance, accounts[0], price - 1);
            assert.ok(false);
        } catch (e) {
            assert.ok(e);
        }
    });

    it("should able to withdraw by the owner", async () => {
        const balanceBefore = await web3.eth.getBalance(accounts[0]);
        await createDefaulAppLicense(instance, accounts[1], web3.utils.toWei("0.5", "ether"));
        const result = await instance.withdraw({ from: accounts[0] });
        assert.ok(result.receipt.status);

        const balanceAfter = await web3.eth.getBalance(accounts[0]);
        assert.ok(+balanceAfter > +balanceBefore);
    });

    it("shouldn't able to withdraw by another account", async () => {
        try {
            await instance.withdraw({ from: accounts[1] });
            assert.fail();
        } catch (e) {
            assert.ok(e);
        }
    });

    it("should be able to set new license fee", async () => {
        const result = await instance.setLicenseFee(100, { from: accounts[0] });
        assert.ok(result.receipt.status);
    });

    it("shouldn't be able to set new license fee by another account", async () => {
        try {
            await instance.setLicenseFee(100, { from: accounts[1] });
            assert.fail();
        } catch (e) {
            assert.ok(e);
        }
    });

    it("should able to activate an app by app address", async () => {
        await createDefaulAppLicense(instance, accounts[0], price);
        const lastAddress = await getNewAppAddressAdded(instance);
        await instance.activate(lastAddress, { from: accounts[0] });
        const newApp = await LicenseToken.at(lastAddress);
        const active = await newApp.active();
        assert.ok(active);
    });

    it("shouldn't able to activate an app by another account", async () => {
        await createDefaulAppLicense(instance, accounts[0], price);
        try {
            const addr = await getNewAppAddressAdded(instance);
            await instance.activate(addr, { from: accounts[1] });
            assert.fail();
        } catch (e) {
            assert.ok(e);
        }
    });

    it("should owner of new app will  own that app after send transaction by invoking function createNewLicenseToken", async () => {
        await createDefaulAppLicense(instance, accounts[0], web3.utils.toWei("0.1", "ether"));
        const lastAddress = await getNewAppAddressAdded(instance);
        const newApp = await LicenseToken.at(lastAddress);
        const owner = await newApp.owner();

        assert.equal(owner, accounts[0]);
    });

    it("should able to get my apps deployed", async () => {
        await createDefaulAppLicense(instance, accounts[0], price);
        const myApps = await instance.getMyApps({ from: accounts[0] });
        assert.ok(myApps.length > 0);
    });
});
