var RootLicense = artifacts.require("./RootLicense.sol");
var StringUtil = artifacts.require("./StringUtil.sol");
module.exports = async function (deployer) {
    await deployer.deploy(StringUtil);
    const stringUtilAddress = (await StringUtil.deployed()).address;
    await RootLicense.link('StringUtil', stringUtilAddress);
    await deployer.deploy(RootLicense, 100);
};
