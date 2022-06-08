var RootLicense = artifacts.require("./RootLicense.sol");

module.exports = function (deployer) {
    deployer.deploy(RootLicense, 100);
};
