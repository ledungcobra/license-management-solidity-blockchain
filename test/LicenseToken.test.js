const RootLicense = artifacts.require("./RootLicense.sol");
const LicenseToken = artifacts.require("./LicenseToken.sol");

const getNewAppAddressAdded = async (instance) => {
    const apps = await instance.getApps();
    return apps[apps.length - 1];
};

let rootInstance;
let deployApp;
let appAddress;

const name = "AppName";
const appImageUrl = "AppImageUrl";
const appDescription = "Description";
const price = 1000;
const periodPerToken = 10;
const unit = 0;

contract("LicenseToken", (accounts) => {
    beforeEach(async () => {
        rootInstance = await RootLicense.deployed();
        await rootInstance.createNewLicenseToken(name, appImageUrl, appDescription, price, periodPerToken, unit, {
            from: accounts[0],
            value: 300,
        });
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
            await deployApp.purchaseLicense({ from: accounts[1], value: price });
            assert.ok(false);
        } catch (e) {
            assert.ok(e);
        }
    });

    // it("should bye a new license when the contract is activated", async () => {
    //     await rootInstance.activate(appAddress, { from: accounts[0] });
    //     await deployApp.purchaseLicense({ from: accounts[1], value: price });
    //     const [_totalSupply, _totalPurchased, _totalPurchasedBy, _totalPurchasedByCount, _numberOfToken] = await Promise.all([
    //         deployApp.totalSupply({ from: accounts[0] }),
    //         deployApp.totalPurchased({ from: accounts[0] }),
    //         deployApp.totalPurchasedBy({ from: accounts[0] }),
    //         deployApp.totalPurchasedByCount({ from: accounts[0] }),
    //         deployApp.balanceOf(accounts[0], { from: accounts[1] }),
    //     ]);

    //     // One for newly purchased license one for the owner of contract;
    //     assert.equal(_totalSupply, 2, "Total supply is not correct");
    //     assert.equal(_totalPurchased, price, "Total purchased is not correct");
    //     assert.equal(_totalPurchasedBy, accounts[1], "Total purchased by is not correct");
    //     assert.equal(_totalPurchasedByCount, 1, "Total purchased by count is not correct");
    //     assert.equal(_numberOfToken, 2, "Number of token is not correct");
    // });
});
