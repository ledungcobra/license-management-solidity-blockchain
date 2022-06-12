pragma solidity >=0.6.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import './LicenseToken.sol';
enum DurationUnit {SECOND, DAY, MONTH , YEAR, FOREVER}



contract RootLicense  is Ownable {

    event OnAddedNewApp(address appAddress);
    event OnAppActivated(address appAddress);
    event OnAppDeactivated(address appAddress);
    event OnLicenseFeeChanged(uint amount);
    event OnBalanceChanged(address contractAddress, uint amount);
    
    /**
        All apps registered in that contract
     */
    LicenseToken[] public  apps;

    /**
        The license fee the issuer will charge for register the app license on that contract
     */
    uint public licenseFee;

    constructor(uint _licenseFee) public {
        require(_licenseFee > 0, "The license fee must be greater than 0");
        licenseFee = _licenseFee;
    }

    /** 
        Create a brand new app license on that contract
        @param appName: The name of the app
        @param description: The description of the app
        @param durationPerToken: The duration of the license
        @param unit: The unit of the duration
        @param priceInWei: The price of the license the user will pay for each token
        @param appImageUrl: The url of the app image
    */
    function createNewLicenseToken(string memory appName,
                                    string memory appImageUrl, 
                                    string memory description,
                                    uint priceInWei, 
                                    uint durationPerToken, 
                                    DurationUnit unit, 
                                    string memory secret) public payable returns(address addressApp) {
        
        require(msg.value >= licenseFee * 1 wei,"You have not enough funds");
        require(priceInWei >= 0 , "Price must be greater than 0 or equal to zero");
        require(durationPerToken > 0, "Duration must be greater than 0");
        require(unit == DurationUnit.SECOND || 
                unit == DurationUnit.DAY || 
                unit == DurationUnit.MONTH ||
                unit == DurationUnit.YEAR, "Invalid duration unit");
        require(bytes(secret).length > 0, "The secret must be not empty");

        LicenseToken  token = new LicenseToken(appName, 
                                        appImageUrl, 
                                        description, 
                                        address(this),
                                        msg.sender,
                                        priceInWei, 
                                        durationPerToken, 
                                        unit,
                                        secret);
        apps.push(token);
        emit OnAddedNewApp(address(token));
        emit OnBalanceChanged(address(this), balance());
        return address(token);
    }

    /**
        Withdraw all the balance by the owner of the contract
     */
    function withdraw() public payable onlyOwner {
        payable(owner()).transfer(address(this).balance);
        emit OnBalanceChanged(address(this), address(this).balance);
    }

    /**
        Activate the app license
        @param licenseToken: the address of the app
     */
    function activate(address licenseToken) public onlyOwner{
        LicenseToken(licenseToken).setActive(true);
        emit OnAppActivated(licenseToken);
    }

    /**
        Deactive the app license
     */
    function deactivate(address licenseToken) public onlyOwner {
        LicenseToken(licenseToken).setActive(false);
        emit OnAppDeactivated(licenseToken);
    }

    /**
        Set the license app fee creation for the issuer will pay for when create a new app license
     */
    function setLicenseFee(uint amount) public onlyOwner{
        require(amount >= 0, "License fee must be greater than 0 or equal to zero");
        licenseFee = amount;
        emit OnLicenseFeeChanged(amount);
    }

    /**
        Get all apps owned by the the sender
     */
    function getMyApps() public view returns(address[] memory) {
        uint count = 0;
        for(uint i = 0; i < apps.length; i++) {
            if(apps[i].owner() == msg.sender) {
                count++;
            }
        }
        address[] memory  myApps = new address[](count);
        uint j = 0;
        for(uint i = 0; i < apps.length; i++) {
            if(apps[i].owner() == msg.sender) {
                myApps[j] = address(apps[i]);
                j++;
            }
        }

        return myApps;
    }

    /**
        Get the balance the contract hold
     */
    function balance() public view returns(uint){
        return address(this).balance;
    }

    /**
        Get all apps the exist on the contract
     */
    function getApps() public view returns(LicenseToken[] memory) {
        return apps;
    }
}