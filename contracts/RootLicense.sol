pragma solidity >=0.6.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import './LicenseToken.sol';
enum DurationUnit {SECOND, DAY, MONTH , YEAR}


contract RootLicense  is Ownable {

    event OnAddedNewApp(address appAddress);
    event OnAppActivated(address appAddress);
    event OnLicenseFeeChanged(uint amount);

    LicenseToken[] public  apps;
    uint public licenseFee;
    address public ownerAddr;

    constructor(uint _licenseFee) public {
        licenseFee = _licenseFee;
        ownerAddr = msg.sender;
    }


// New update client code
    function createNewLicenseToken(string memory appName,
                                    string memory appImageUrl, 
                                    string memory description,
                                    uint priceInWei, 
                                    uint durationPerToken, 
                                    DurationUnit unit) public payable returns(address addressApp) {
        
        require(msg.value >= licenseFee * 1 wei,"You have not enough funds");
        require(priceInWei >= 0 , "Price must be greater than 0 or equal to zero");
        require(durationPerToken > 0, "Duration must be greater than 0");
        require(unit == DurationUnit.SECOND || unit == DurationUnit.DAY || unit == DurationUnit.MONTH || unit == DurationUnit.YEAR, "Invalid duration unit");
        
        LicenseToken  token = new LicenseToken(appName, 
                                        appImageUrl, 
                                        description, 
                                        address(this),
                                        msg.sender,
                                        priceInWei, 
                                        durationPerToken, 
                                        unit);

        apps.push(token);
        emit OnAddedNewApp(address(token));
        return address(token);
    }

    function withdraw() public payable onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function activate(address licenseToken) public onlyOwner{
        LicenseToken(licenseToken).setActive(true);
        emit OnAppActivated(licenseToken);
    }

    function setLicenseFee(uint amount) public onlyOwner{
        require(amount >= 0, "License fee must be greater than 0 or equal to zero");
        licenseFee = amount;
        emit OnLicenseFeeChanged(amount);
    }

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

    function balance() public view returns(uint){
        return address(this).balance;
    }

    function getApps() public view returns(LicenseToken[] memory) {
        return apps;
    }
}